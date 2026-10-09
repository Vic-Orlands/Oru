import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { invokeKernelAction } from "./kernelClient";
import type { Doc, Id } from "./_generated/dataModel";
import type { Infer } from "convex/values";
import { applicationFieldValidator } from "./jobApplicationValidators";

type ScannedField = Infer<typeof applicationFieldValidator>;

type OpenApplicationResult = {
  sessionId: string;
  liveViewUrl: string;
  ats: string;
  currentUrl: string;
  fields: ScannedField[];
};

type FillApplicationResult = {
  currentUrl: string;
  filled: number;
  skipped: Array<{ label: string; reason: string }>;
};

type SubmitApplicationResult = {
  currentUrl: string;
  confirmationText: string;
};

type JobApplicationContext = {
  application: Doc<"jobApplications">;
  opportunity: Doc<"opportunities">;
  pack: Doc<"applicationPacks">;
  run: Doc<"applicationRuns"> | null;
};

async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Sign in to manage job applications.");
  return identity.subject;
}

export const open = action({
  args: { applicationId: v.id("jobApplications") },
  handler: async (ctx, { applicationId }): Promise<OpenApplicationResult & { runId: Id<"applicationRuns"> }> => {
    const userId = await requireUserId(ctx);
    const context: JobApplicationContext = await ctx.runQuery(
      internal.jobApplications.getActionContext,
      { userId, applicationId, requireRun: false },
    );
    const runId: Id<"applicationRuns"> = await ctx.runMutation(
      internal.jobApplications.beginRun,
      { userId, applicationId },
    );
    try {
      const result = await invokeKernelAction<OpenApplicationResult>(
        "open-application",
        {
          applicationId,
          url: context.opportunity.sourceUrl,
          title: context.opportunity.title,
          organization: context.opportunity.organization,
        },
      );
      await ctx.runMutation(internal.jobApplications.recordScan, {
        userId,
        applicationId,
        runId,
        invocationId: result.invocationId,
        sessionId: result.output.sessionId,
        liveViewUrl: result.output.liveViewUrl,
        ats: result.output.ats,
        currentUrl: result.output.currentUrl,
        fields: result.output.fields.slice(0, 150),
      });
      return { runId, ...result.output };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kernel could not open the application.";
      await ctx.runMutation(internal.jobApplications.updateRun, {
        userId,
        applicationId,
        runId,
        status: "failed",
        error: message,
        eventType: "browser_failed",
        summary: message,
      });
      throw new Error(message);
    }
  },
});

export const fill = action({
  args: { applicationId: v.id("jobApplications") },
  handler: async (ctx, { applicationId }): Promise<FillApplicationResult> => {
    const userId = await requireUserId(ctx);
    const context: JobApplicationContext = await ctx.runQuery(
      internal.jobApplications.getActionContext,
      { userId, applicationId, requireRun: true },
    );
    if (!context.run?.sessionId) {
      throw new Error("Open the secure application browser before filling it.");
    }
    if (context.pack.status !== "approved" || !context.pack.payloadHash) {
      throw new Error("Review and approve the application answers before filling the employer form.");
    }
    await ctx.runMutation(internal.jobApplications.updateRun, {
      userId,
      applicationId,
      runId: context.run._id,
      status: "filling",
      eventType: "form_filling",
      summary: "Filling the employer form with the approved answers.",
    });
    try {
      const result = await invokeKernelAction<FillApplicationResult>(
        "fill-application",
        {
          sessionId: context.run.sessionId,
          payloadHash: context.pack.payloadHash,
          fields: context.pack.fields
            .filter((field: ScannedField) => field.value !== undefined)
            .map((field: ScannedField) => ({
              selector: field.selector,
              label: field.label,
              type: field.type,
              value: field.value,
            })),
        },
      );
      const skipped = result.output.skipped;
      await ctx.runMutation(internal.jobApplications.updateRun, {
        userId,
        applicationId,
        runId: context.run._id,
        status: skipped.length > 0 ? "waiting_for_user" : "ready_to_submit",
        applicationStatus: "approved",
        invocationId: result.invocationId,
        currentUrl: result.output.currentUrl,
        eventType: skipped.length > 0 ? "user_action_required" : "form_filled",
        summary:
          skipped.length > 0
            ? `Filled ${result.output.filled} fields. ${skipped.length} field${skipped.length === 1 ? " needs" : "s need"} your attention in the live browser.`
            : `Filled ${result.output.filled} approved fields. The application is ready for final review.`,
      });
      return result.output;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kernel could not fill the application.";
      await ctx.runMutation(internal.jobApplications.updateRun, {
        userId,
        applicationId,
        runId: context.run._id,
        status: "waiting_for_user",
        applicationStatus: "approved",
        error: message,
        eventType: "fill_failed",
        summary: `${message} You can continue in the live browser.`,
      });
      throw new Error(message);
    }
  },
});

export const submit = action({
  args: { applicationId: v.id("jobApplications") },
  handler: async (ctx, { applicationId }): Promise<SubmitApplicationResult> => {
    const userId = await requireUserId(ctx);
    const context: JobApplicationContext = await ctx.runQuery(
      internal.jobApplications.getActionContext,
      { userId, applicationId, requireRun: true },
    );
    if (!context.run?.sessionId) throw new Error("The secure application browser is no longer available.");
    if (context.pack.status !== "approved" || !context.pack.payloadHash) {
      throw new Error("The application pack must be approved before submission.");
    }
    if (![
      "ready_to_submit",
      "waiting_for_user",
    ].includes(context.run.status)) {
      throw new Error("Finish filling and reviewing the employer form before submitting it.");
    }
    await ctx.runMutation(internal.jobApplications.updateRun, {
      userId,
      applicationId,
      runId: context.run._id,
      status: "submitting",
      eventType: "submitting",
      summary: "Submitting after the user's final confirmation.",
    });
    try {
      const result = await invokeKernelAction<SubmitApplicationResult>(
        "submit-application",
        {
          sessionId: context.run.sessionId,
          payloadHash: context.pack.payloadHash,
        },
      );
      await ctx.runMutation(internal.jobApplications.updateRun, {
        userId,
        applicationId,
        runId: context.run._id,
        status: "succeeded",
        applicationStatus: "submitted",
        invocationId: result.invocationId,
        currentUrl: result.output.currentUrl,
        confirmationText: result.output.confirmationText,
        eventType: "application_submitted",
        summary: `Submitted the application to ${context.opportunity.organization}.`,
      });
      return result.output;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kernel could not confirm submission.";
      await ctx.runMutation(internal.jobApplications.updateRun, {
        userId,
        applicationId,
        runId: context.run._id,
        status: "waiting_for_user",
        applicationStatus: "approved",
        error: message,
        eventType: "submission_uncertain",
        summary: `${message} The application was not marked submitted because no confirmation was captured.`,
      });
      throw new Error(message);
    }
  },
});

export const closeBrowser = action({
  args: { applicationId: v.id("jobApplications") },
  handler: async (ctx, { applicationId }): Promise<null> => {
    const userId = await requireUserId(ctx);
    const context: JobApplicationContext = await ctx.runQuery(
      internal.jobApplications.getActionContext,
      { userId, applicationId, requireRun: true },
    );
    if (!context.run?.sessionId) return null;
    await invokeKernelAction<{ closed: boolean }>("close-application", {
      sessionId: context.run.sessionId,
    });
    await ctx.runMutation(internal.jobApplications.updateRun, {
      userId,
      applicationId,
      runId: context.run._id,
      status: "cancelled",
      eventType: "browser_closed",
      summary: "Closed the private application browser.",
    });
    return null;
  },
});
