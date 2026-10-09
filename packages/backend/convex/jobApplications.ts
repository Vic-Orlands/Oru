import { v } from "convex/values";

import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  applicationFieldValidator,
  applicationRunStatusValidator,
  jobApplicationStatusValidator,
} from "./jobApplicationValidators";

async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Sign in to manage job applications.");
  return identity.subject;
}

async function packHash(fields: Array<{ key: string; value?: string }>) {
  const canonical = JSON.stringify(
    fields.map(({ key, value }) => ({ key, value: value ?? "" })),
  );
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function event(
  ctx: MutationCtx,
  args: {
    userId: string;
    applicationId: Id<"jobApplications">;
    runId?: Id<"applicationRuns">;
    type: string;
    summary: string;
    source: string;
    evidence?: string;
  },
) {
  await ctx.db.insert("applicationEvents", { ...args, createdAt: Date.now() });
}

export const ensureDraft = mutation({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, { opportunityId }) => {
    const userId = await requireUserId(ctx);
    const opportunity = await ctx.db.get(opportunityId);
    if (
      !opportunity ||
      opportunity.userId !== userId ||
      opportunity.leadAgent !== "job_hunt"
    ) {
      throw new Error("Job opportunity not found.");
    }
    const existing = await ctx.db
      .query("jobApplications")
      .withIndex("by_user_opportunity", (q) =>
        q.eq("userId", userId).eq("opportunityId", opportunityId),
      )
      .unique();
    if (existing) return existing._id;

    const now = Date.now();
    const applicationId = await ctx.db.insert("jobApplications", {
      userId,
      opportunityId,
      status: "preparing",
      createdAt: now,
      updatedAt: now,
    });
    const packId = await ctx.db.insert("applicationPacks", {
      userId,
      applicationId,
      version: 1,
      status: "draft",
      fields: [],
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(applicationId, { currentPackId: packId });
    await event(ctx, {
      userId,
      applicationId,
      type: "draft_created",
      summary: `Started an application for ${opportunity.title} at ${opportunity.organization}.`,
      source: "user",
    });
    return applicationId;
  },
});

export const getByOpportunity = query({
  args: { opportunityId: v.id("opportunities") },
  handler: async (ctx, { opportunityId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const application = await ctx.db
      .query("jobApplications")
      .withIndex("by_user_opportunity", (q) =>
        q.eq("userId", identity.subject).eq("opportunityId", opportunityId),
      )
      .unique();
    if (!application) return null;
    const pack = application.currentPackId
      ? await ctx.db.get(application.currentPackId)
      : null;
    const run = application.latestRunId
      ? await ctx.db.get(application.latestRunId)
      : null;
    const events = await ctx.db
      .query("applicationEvents")
      .withIndex("by_application_created_at", (q) =>
        q.eq("applicationId", application._id),
      )
      .order("desc")
      .take(12);
    return {
      id: application._id,
      status: application.status,
      ats: application.ats,
      submittedAt: application.submittedAt,
      confirmationText: application.confirmationText,
      pack: pack
        ? {
            id: pack._id,
            status: pack.status,
            version: pack.version,
            fields: pack.fields,
            approvedAt: pack.approvedAt,
          }
        : null,
      run: run
        ? {
            id: run._id,
            status: run.status,
            liveViewUrl: run.liveViewUrl,
            ats: run.ats,
            error: run.error,
          }
        : null,
      events: events.map((item) => ({
        id: item._id,
        type: item.type,
        summary: item.summary,
        source: item.source,
        createdAt: item.createdAt,
      })),
    };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const rows = await ctx.db
      .query("jobApplications")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(100);
    return rows.map((row) => ({
      id: row._id,
      opportunityId: row.opportunityId,
      status: row.status,
      ats: row.ats,
      updatedAt: row.updatedAt,
      submittedAt: row.submittedAt,
    }));
  },
});

export const listForAgent = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const applications = await ctx.db
      .query("jobApplications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
    return await Promise.all(
      applications.map(async (application) => {
        const opportunity = await ctx.db.get(application.opportunityId);
        return {
          applicationId: application._id,
          status: application.status,
          ats: application.ats,
          submittedAt: application.submittedAt,
          title: opportunity?.title ?? "Unknown role",
          organization: opportunity?.organization ?? "Unknown employer",
          sourceUrl: opportunity?.sourceUrl,
        };
      }),
    );
  },
});

export const prepareForAgent = internalMutation({
  args: { userId: v.string(), sourceUrl: v.string() },
  handler: async (ctx, { userId, sourceUrl }) => {
    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_user_agent", (q) =>
        q.eq("userId", userId).eq("leadAgent", "job_hunt"),
      )
      .take(200);
    const opportunity = opportunities.find((row) => row.sourceUrl === sourceUrl);
    if (!opportunity) {
      throw new Error("Save this live job as a Job Hunt opportunity before preparing its application.");
    }
    const existing = await ctx.db
      .query("jobApplications")
      .withIndex("by_user_opportunity", (q) =>
        q.eq("userId", userId).eq("opportunityId", opportunity._id),
      )
      .unique();
    if (existing) return existing._id;

    const now = Date.now();
    const applicationId = await ctx.db.insert("jobApplications", {
      userId,
      opportunityId: opportunity._id,
      status: "preparing",
      createdAt: now,
      updatedAt: now,
    });
    const packId = await ctx.db.insert("applicationPacks", {
      userId,
      applicationId,
      version: 1,
      status: "draft",
      fields: [],
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(applicationId, { currentPackId: packId });
    await event(ctx, {
      userId,
      applicationId,
      type: "draft_created",
      summary: `The Job Hunt agent prepared an application for ${opportunity.title} at ${opportunity.organization}.`,
      source: "agent",
    });
    return applicationId;
  },
});

export const saveAnswers = mutation({
  args: {
    applicationId: v.id("jobApplications"),
    answers: v.array(v.object({ key: v.string(), value: v.string() })),
  },
  handler: async (ctx, { applicationId, answers }) => {
    const userId = await requireUserId(ctx);
    const application = await ctx.db.get(applicationId);
    if (!application || application.userId !== userId || !application.currentPackId) {
      throw new Error("Application not found.");
    }
    const pack = await ctx.db.get(application.currentPackId);
    if (!pack || pack.status === "used" || pack.status === "superseded") {
      throw new Error("This application pack can no longer be edited.");
    }
    const values = new Map(answers.map((answer) => [answer.key, answer.value]));
    const fields = pack.fields.map((field) =>
      values.has(field.key)
        ? { ...field, value: values.get(field.key), source: "user" as const }
        : field,
    );
    const incomplete = fields.some(
      (field) =>
        field.required && field.type !== "file" && !field.value?.trim(),
    );
    const status = incomplete ? "draft" : "ready_for_review";
    const now = Date.now();
    await ctx.db.patch(pack._id, {
      fields,
      status,
      updatedAt: now,
    });
    await ctx.db.patch(applicationId, {
      status: status === "ready_for_review" ? "ready_for_review" : "preparing",
      updatedAt: now,
    });
    return null;
  },
});

export const approvePack = mutation({
  args: { applicationId: v.id("jobApplications") },
  handler: async (ctx, { applicationId }) => {
    const userId = await requireUserId(ctx);
    const application = await ctx.db.get(applicationId);
    if (!application || application.userId !== userId || !application.currentPackId) {
      throw new Error("Application not found.");
    }
    const pack = await ctx.db.get(application.currentPackId);
    if (!pack) throw new Error("Application pack not found.");
    const missing = pack.fields.filter(
      (field) =>
        field.required && field.type !== "file" && !field.value?.trim(),
    );
    if (missing.length > 0) {
      throw new Error(`Complete ${missing[0].label} before approving this application.`);
    }
    const now = Date.now();
    const payloadHash = await packHash(pack.fields);
    await ctx.db.patch(pack._id, {
      status: "approved",
      payloadHash,
      approvedAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(applicationId, { status: "approved", updatedAt: now });
    await event(ctx, {
      userId,
      applicationId,
      type: "pack_approved",
      summary: "Approved the reviewed answers for this application.",
      source: "user",
      evidence: payloadHash,
    });
    return null;
  },
});

export const updateStatus = mutation({
  args: {
    applicationId: v.id("jobApplications"),
    status: jobApplicationStatusValidator,
  },
  handler: async (ctx, { applicationId, status }) => {
    const userId = await requireUserId(ctx);
    const application = await ctx.db.get(applicationId);
    if (!application || application.userId !== userId) {
      throw new Error("Application not found.");
    }
    const trackable = new Set([
      "confirmed",
      "recruiter_screen",
      "interview",
      "offer",
      "rejected",
      "withdrawn",
      "closed",
    ]);
    if (!application.submittedAt || !trackable.has(status)) {
      throw new Error("Only submitted applications can move through hiring stages.");
    }
    const now = Date.now();
    await ctx.db.patch(applicationId, {
      status,
      lastStatusSource: "user",
      lastStatusConfidence: "high",
      updatedAt: now,
      ...(status === "confirmed" ? { confirmedAt: now } : {}),
    });
    await event(ctx, {
      userId,
      applicationId,
      type: "status_updated",
      summary: `Updated the application status to ${status.replaceAll("_", " ")}.`,
      source: "user",
    });
    return null;
  },
});

export const getActionContext = internalQuery({
  args: {
    userId: v.string(),
    applicationId: v.id("jobApplications"),
    requireRun: v.boolean(),
  },
  handler: async (ctx, { userId, applicationId, requireRun }) => {
    const application = await ctx.db.get(applicationId);
    if (!application || application.userId !== userId || !application.currentPackId) {
      throw new Error("Application not found.");
    }
    const opportunity = await ctx.db.get(application.opportunityId);
    const pack = await ctx.db.get(application.currentPackId);
    const run = application.latestRunId
      ? await ctx.db.get(application.latestRunId)
      : null;
    if (!opportunity || !pack || (requireRun && !run)) {
      throw new Error("The application is missing required context.");
    }
    return { application, opportunity, pack, run };
  },
});

export const beginRun = internalMutation({
  args: {
    userId: v.string(),
    applicationId: v.id("jobApplications"),
  },
  handler: async (ctx, { userId, applicationId }) => {
    const application = await ctx.db.get(applicationId);
    if (!application || application.userId !== userId || !application.currentPackId) {
      throw new Error("Application not found.");
    }
    const now = Date.now();
    const runId = await ctx.db.insert("applicationRuns", {
      userId,
      applicationId,
      packId: application.currentPackId,
      provider: "kernel",
      status: "launching",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(applicationId, { latestRunId: runId, updatedAt: now });
    await event(ctx, {
      userId,
      applicationId,
      runId,
      type: "browser_launching",
      summary: "Opening a private Kernel browser for the application.",
      source: "kernel",
    });
    return runId;
  },
});

export const recordScan = internalMutation({
  args: {
    userId: v.string(),
    applicationId: v.id("jobApplications"),
    runId: v.id("applicationRuns"),
    invocationId: v.string(),
    sessionId: v.string(),
    liveViewUrl: v.string(),
    ats: v.string(),
    currentUrl: v.string(),
    fields: v.array(applicationFieldValidator),
  },
  handler: async (ctx, args) => {
    const application = await ctx.db.get(args.applicationId);
    const run = await ctx.db.get(args.runId);
    if (
      !application ||
      application.userId !== args.userId ||
      !application.currentPackId ||
      !run ||
      run.userId !== args.userId
    ) {
      throw new Error("Application run not found.");
    }
    const pack = await ctx.db.get(application.currentPackId);
    if (!pack) throw new Error("Application pack not found.");
    const prior = new Map(pack.fields.map((field) => [field.key, field]));
    const fields = args.fields.map((field) => {
      const existing = prior.get(field.key);
      return existing?.value
        ? { ...field, value: existing.value, source: existing.source }
        : field;
    });
    const now = Date.now();
    await ctx.db.patch(pack._id, {
      fields,
      status: "draft",
      updatedAt: now,
    });
    await ctx.db.patch(run._id, {
      status: "awaiting_review",
      invocationId: args.invocationId,
      sessionId: args.sessionId,
      liveViewUrl: args.liveViewUrl,
      ats: args.ats,
      currentUrl: args.currentUrl,
      updatedAt: now,
    });
    await ctx.db.patch(application._id, {
      status: "preparing",
      ats: args.ats,
      updatedAt: now,
    });
    await event(ctx, {
      userId: args.userId,
      applicationId: application._id,
      runId: run._id,
      type: "form_scanned",
      summary: `Found ${fields.length} application fields on ${args.ats}.`,
      source: "kernel",
    });
    return null;
  },
});

export const updateRun = internalMutation({
  args: {
    userId: v.string(),
    applicationId: v.id("jobApplications"),
    runId: v.id("applicationRuns"),
    status: applicationRunStatusValidator,
    applicationStatus: v.optional(jobApplicationStatusValidator),
    invocationId: v.optional(v.string()),
    currentUrl: v.optional(v.string()),
    confirmationText: v.optional(v.string()),
    error: v.optional(v.string()),
    eventType: v.string(),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    const application = await ctx.db.get(args.applicationId);
    const run = await ctx.db.get(args.runId);
    if (
      !application ||
      application.userId !== args.userId ||
      !run ||
      run.userId !== args.userId
    ) {
      throw new Error("Application run not found.");
    }
    const now = Date.now();
    const runPatch = {
      status: args.status,
      invocationId: args.invocationId ?? run.invocationId,
      currentUrl: args.currentUrl ?? run.currentUrl,
      updatedAt: now,
      ...(args.confirmationText
        ? { confirmationText: args.confirmationText }
        : {}),
      ...(args.error ? { error: args.error } : {}),
      ...(args.status === "succeeded" || args.status === "cancelled"
        ? { completedAt: now }
        : {}),
    };
    await ctx.db.patch(run._id, runPatch);
    if (args.applicationStatus) {
      await ctx.db.patch(application._id, {
        status: args.applicationStatus,
        ...(args.confirmationText
          ? { confirmationText: args.confirmationText }
          : {}),
        submittedAt:
          args.applicationStatus === "submitted"
            ? now
            : application.submittedAt,
        lastStatusSource: "kernel",
        lastStatusConfidence:
          args.applicationStatus === "submitted" ? "high" : "medium",
        updatedAt: now,
      });
      if (args.applicationStatus === "submitted") {
        const opportunity = await ctx.db.get(application.opportunityId);
        if (opportunity) await ctx.db.patch(opportunity._id, { stage: "Applied" });
        if (application.currentPackId) {
          await ctx.db.patch(application.currentPackId, {
            status: "used",
            updatedAt: now,
          });
        }
      }
    }
    await event(ctx, {
      userId: args.userId,
      applicationId: application._id,
      runId: run._id,
      type: args.eventType,
      summary: args.summary,
      source: "kernel",
      evidence: args.confirmationText,
    });
    return null;
  },
});
