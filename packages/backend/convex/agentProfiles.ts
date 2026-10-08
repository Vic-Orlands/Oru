import { v } from "convex/values";

import { internalMutation, internalQuery } from "./_generated/server";
import { leadAgentValidator } from "./leadAgents";

export const get = internalQuery({
  args: { userId: v.string(), leadAgent: leadAgentValidator },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("agentProfiles")
      .withIndex("by_user_agent", (q) =>
        q.eq("userId", args.userId).eq("leadAgent", args.leadAgent),
      )
      .unique();
    return profile
      ? { configured: true as const, profileText: profile.profileText, sourceLinks: profile.sourceLinks, updatedAt: profile.updatedAt }
      : { configured: false as const };
  },
});

export const save = internalMutation({
  args: {
    userId: v.string(),
    leadAgent: leadAgentValidator,
    profileText: v.string(),
    sourceLinks: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentProfiles")
      .withIndex("by_user_agent", (q) =>
        q.eq("userId", args.userId).eq("leadAgent", args.leadAgent),
      )
      .unique();
    const value = {
      profileText: args.profileText.trim(),
      sourceLinks: args.sourceLinks,
      updatedAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, value);
      return existing._id;
    }
    return ctx.db.insert("agentProfiles", { userId: args.userId, leadAgent: args.leadAgent, ...value });
  },
});

export const clear = internalMutation({
  args: { userId: v.string(), leadAgent: leadAgentValidator },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentProfiles")
      .withIndex("by_user_agent", (q) => q.eq("userId", args.userId).eq("leadAgent", args.leadAgent))
      .unique();
    if (existing) await ctx.db.delete("agentProfiles", existing._id);
    return null;
  },
});
