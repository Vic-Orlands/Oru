import { v } from "convex/values";

import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";

const fit = v.union(v.literal("Strong"), v.literal("Possible"), v.literal("Weak"));
const status = v.union(
  v.literal("New"),
  v.literal("Qualified"),
  v.literal("Sequenced"),
  v.literal("Replied"),
);

const prospectValidator = v.object({
  id: v.id("prospects"),
  name: v.string(),
  title: v.string(),
  company: v.string(),
  email: v.string(),
  emailVerification: v.optional(
    v.union(
      v.literal("verified"),
      v.literal("risky"),
      v.literal("invalid"),
      v.literal("unknown"),
    ),
  ),
  location: v.string(),
  sourceUrl: v.optional(v.string()),
  sourceProvider: v.optional(v.string()),
  profileUrl: v.optional(v.string()),
  companyUrl: v.optional(v.string()),
  evidence: v.optional(v.array(v.string())),
  scoreReason: v.optional(v.string()),
  enrichedAt: v.optional(v.number()),
  score: v.number(),
  fit,
  list: v.string(),
  status,
});

export const snapshotValidator = v.object({
  prospects: v.array(prospectValidator),
  lists: v.array(
    v.object({
      id: v.id("prospectLists"),
      name: v.string(),
      count: v.number(),
      updated: v.string(),
    }),
  ),
  approvals: v.array(
    v.object({
      id: v.id("approvals"),
      to: v.string(),
      company: v.string(),
      subject: v.string(),
      preview: v.string(),
      step: v.string(),
      sequence: v.string(),
    }),
  ),
  tasks: v.array(
    v.object({
      id: v.id("deskTasks"),
      title: v.string(),
      when: v.string(),
      kind: v.string(),
    }),
  ),
  campaigns: v.array(
    v.object({
      name: v.string(),
      sent: v.number(),
      replies: v.number(),
      meetings: v.number(),
      status: v.string(),
    }),
  ),
  pipeline: v.array(
    v.object({
      stage: v.string(),
      count: v.number(),
      rate: v.string(),
    }),
  ),
  bars: v.array(v.number()),
});

const EMPTY = {
  prospects: [],
  lists: [],
  approvals: [],
  tasks: [],
  campaigns: [],
  pipeline: [],
  bars: [],
};

async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity.subject;
}

export const snapshot = query({
  args: {},
  returns: snapshotValidator,
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return EMPTY;
    const userId = identity.subject;
    const prospects = await ctx.db
      .query("prospects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(50);
    const lists = await ctx.db
      .query("prospectLists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(20);
    const approvals = await ctx.db
      .query("approvals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(20);
    const tasks = await ctx.db
      .query("deskTasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(20);
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(20);
    const pipeline = await ctx.db
      .query("pipelineStages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(12);
    const bars = await ctx.db
      .query("performanceBars")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(14);
    return {
      prospects: prospects.map((row) => ({
        id: row._id,
        name: row.name,
        title: row.title,
        company: row.company,
        email: row.email,
        emailVerification: row.emailVerification,
        location: row.location,
        sourceUrl: row.sourceUrl,
        sourceProvider: row.sourceProvider,
        profileUrl: row.profileUrl,
        companyUrl: row.companyUrl,
        evidence: row.evidence,
        scoreReason: row.scoreReason,
        enrichedAt: row.enrichedAt,
        score: row.score,
        fit: row.fit,
        list: row.list,
        status: row.status,
      })),
      lists: lists.map((row) => ({
        id: row._id,
        name: row.name,
        count: row.count,
        updated: row.updated,
      })),
      approvals: approvals
        .filter((row) => row.status === "pending")
        .map((row) => ({
          id: row._id,
          to: row.to,
          company: row.company,
          subject: row.subject,
          preview: row.preview,
          step: row.step,
          sequence: row.sequence,
        })),
      tasks: tasks
        .filter((row) => !row.done)
        .map((row) => ({
          id: row._id,
          title: row.title,
          when: row.when,
          kind: row.kind,
        })),
      campaigns: campaigns.map((row) => ({
        name: row.name,
        sent: row.sent,
        replies: row.replies,
        meetings: row.meetings,
        status: row.status,
      })),
      pipeline: pipeline
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((row) => ({ stage: row.stage, count: row.count, rate: row.rate })),
      bars: bars
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((row) => row.value),
    };
  },
});

export const decideApproval = mutation({
  args: {
    approvalId: v.id("approvals"),
    decision: v.union(v.literal("approved"), v.literal("held")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const row = await ctx.db.get(args.approvalId);
    if (!row || row.userId !== userId) throw new Error("Approval not found");
    await ctx.db.patch(args.approvalId, { status: args.decision });
    return null;
  },
});

const prospectInput = v.object({
  name: v.string(),
  title: v.string(),
  company: v.string(),
  email: v.string(),
  emailVerification: v.optional(
    v.union(
      v.literal("verified"),
      v.literal("risky"),
      v.literal("invalid"),
      v.literal("unknown"),
    ),
  ),
  location: v.string(),
  sourceUrl: v.optional(v.string()),
  sourceProvider: v.optional(v.string()),
  profileUrl: v.optional(v.string()),
  companyUrl: v.optional(v.string()),
  evidence: v.optional(v.array(v.string())),
  scoreReason: v.optional(v.string()),
  enrichedAt: v.optional(v.number()),
  score: v.number(),
  fit,
  list: v.string(),
  status,
});

export const recordProspects = internalMutation({
  args: { userId: v.string(), rows: v.array(prospectInput) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("prospects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(80);
    const keyOf = (item: {
      email: string;
      sourceUrl?: string;
      name: string;
      company: string;
    }) =>
      item.email.trim().toLowerCase() ||
      item.sourceUrl?.trim().toLowerCase() ||
      `${item.name}|${item.company}`.toLowerCase();
    const seen = new Set(existing.map(keyOf));
    for (const row of args.rows) {
      const key = keyOf(row);
      if (seen.has(key)) continue;
      seen.add(key);
      await ctx.db.insert("prospects", { userId: args.userId, ...row });
    }
    return null;
  },
});

export const recordList = internalMutation({
  args: {
    userId: v.string(),
    name: v.string(),
    count: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("prospectLists", {
      userId: args.userId,
      name: args.name,
      count: args.count,
      updated: "Today",
    });
    return null;
  },
});

export const recordApproval = internalMutation({
  args: {
    userId: v.string(),
    to: v.string(),
    company: v.string(),
    subject: v.string(),
    preview: v.string(),
    step: v.string(),
    sequence: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("approvals", { ...args, status: "pending" });
    return null;
  },
});

export const recordTask = internalMutation({
  args: {
    userId: v.string(),
    title: v.string(),
    when: v.string(),
    kind: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("deskTasks", { ...args, done: false });
    return null;
  },
});
