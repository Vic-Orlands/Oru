import { v } from "convex/values";

import { internalMutation, mutation } from "./_generated/server";
import { leadAgentValidator } from "./leadAgents";
import { OPPORTUNITY_PROFILES, opportunityStage } from "./opportunityProfiles";
import {
  opportunityDetailsValidator,
  opportunityFeedbackValidator,
  opportunityScoreItemValidator,
  opportunitySourceStatusValidator,
} from "./opportunityValidators";

const opportunityInput = v.object({
  title: v.string(),
  organization: v.string(),
  subtitle: v.optional(v.string()),
  location: v.optional(v.string()),
  sourceUrl: v.string(),
  sourceStatus: opportunitySourceStatusValidator,
  sourceProvider: v.string(),
  sourceTool: v.string(),
  sourceReceiptId: v.id("leadSourceReceipts"),
  sourceReceiptHash: v.string(),
  sourceCapturedAt: v.number(),
  evidence: v.array(v.string()),
  details: opportunityDetailsValidator,
  score: v.number(),
  scoreLabel: v.union(
    v.literal("Strong"),
    v.literal("Possible"),
    v.literal("Weak"),
  ),
  scoreBreakdown: v.array(opportunityScoreItemValidator),
  stage: v.string(),
  dedupeKey: v.string(),
});

function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  return ctx.auth.getUserIdentity().then((identity) => {
    if (!identity) throw new Error("Sign in to manage opportunities.");
    return identity.subject;
  });
}

export const recordMany = internalMutation({
  args: {
    userId: v.string(),
    leadAgent: leadAgentValidator,
    rows: v.array(opportunityInput),
  },
  handler: async (ctx, { userId, leadAgent, rows }) => {
    let inserted = 0;
    let refreshed = 0;
    let changed = 0;
    const now = Date.now();

    for (const row of rows) {
      const existing = await ctx.db
        .query("opportunities")
        .withIndex("by_user_agent_dedupe", (q) =>
          q
            .eq("userId", userId)
            .eq("leadAgent", leadAgent)
            .eq("dedupeKey", row.dedupeKey),
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("opportunities", {
          userId,
          leadAgent,
          ...row,
          discoveredAt: now,
          lastSeenAt: now,
          lastVerifiedAt: now,
        });
        inserted += 1;
        continue;
      }

      const differences = [
        existing.stage !== row.stage ? `stage: ${existing.stage} → ${row.stage}` : null,
        existing.sourceStatus !== row.sourceStatus
          ? `source: ${existing.sourceStatus} → ${row.sourceStatus}`
          : null,
        existing.score !== row.score ? `score: ${existing.score} → ${row.score}` : null,
      ].filter((item): item is string => item !== null);
      await ctx.db.patch(existing._id, {
        ...row,
        lastSeenAt: now,
        lastVerifiedAt: now,
        ...(differences.length > 0
          ? { changedAt: now, changeSummary: differences.join("; ") }
          : {}),
      });
      refreshed += 1;
      if (differences.length > 0) changed += 1;
    }
    return { inserted, refreshed, changed };
  },
});

export const setFeedback = mutation({
  args: {
    id: v.id("opportunities"),
    feedback: opportunityFeedbackValidator,
  },
  handler: async (ctx, { id, feedback }) => {
    const userId = await requireUserId(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.userId !== userId) throw new Error("Opportunity not found.");
    await ctx.db.patch(id, { feedback });
    return null;
  },
});

export const setStage = mutation({
  args: { id: v.id("opportunities"), stage: v.string() },
  handler: async (ctx, { id, stage }) => {
    const userId = await requireUserId(ctx);
    const row = await ctx.db.get(id);
    if (!row || row.userId !== userId) throw new Error("Opportunity not found.");
    const valid = OPPORTUNITY_PROFILES[row.leadAgent].stages.some(
      (candidate) => candidate.toLowerCase() === stage.toLowerCase(),
    );
    if (!valid) throw new Error("That stage does not belong to this agent.");
    await ctx.db.patch(id, { stage: opportunityStage(row.leadAgent, stage) });
    return null;
  },
});
