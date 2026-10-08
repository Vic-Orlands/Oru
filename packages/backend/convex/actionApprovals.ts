import { v } from "convex/values";

import { internalMutation, mutation } from "./_generated/server";
import { leadAgentValidator } from "./leadAgents";

export const request = internalMutation({
  args: {
    userId: v.string(),
    leadAgent: leadAgentValidator,
    actionType: v.string(),
    title: v.string(),
    summary: v.string(),
    target: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args) => ctx.db.insert("actionApprovals", {
    ...args,
    status: "pending",
    createdAt: Date.now(),
  }),
});

export const decide = mutation({
  args: {
    id: v.id("actionApprovals"),
    decision: v.union(v.literal("approved"), v.literal("declined")),
  },
  handler: async (ctx, { id, decision }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in to review this action.");
    const request = await ctx.db.get(id);
    if (!request || request.userId !== identity.subject) throw new Error("Approval request not found.");
    if (request.status !== "pending") throw new Error("This action has already been reviewed.");
    await ctx.db.patch(id, { status: decision, resolvedAt: Date.now() });
    return null;
  },
});
