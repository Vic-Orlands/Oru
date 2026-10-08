import { v } from "convex/values";

import { internal } from "./_generated/api";

import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import {
  DEFAULT_LEAD_AGENT,
  leadAgentValidator,
  type LeadAgentKind,
} from "./leadAgents";
import { OPPORTUNITY_PROFILES } from "./opportunityProfiles";
import {
  opportunityDetailsValidator,
  opportunityFeedbackValidator,
  opportunityScoreItemValidator,
  opportunitySourceStatusValidator,
} from "./opportunityValidators";

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
  scoreBreakdown: v.optional(
    v.object({
      fit: v.number(),
      timing: v.number(),
      authority: v.number(),
      contactability: v.number(),
    }),
  ),
  sourceReceiptHash: v.optional(v.string()),
  sourceTool: v.optional(v.string()),
  sourceCapturedAt: v.optional(v.number()),
  enrichedAt: v.optional(v.number()),
  score: v.number(),
  fit,
  list: v.string(),
  status,
});

export const snapshotValidator = v.object({
  actionApprovals: v.array(v.object({
    id: v.id("actionApprovals"),
    actionType: v.string(),
    title: v.string(),
    summary: v.string(),
    target: v.string(),
  })),
  opportunities: v.array(v.object({
    id: v.id("opportunities"),
    title: v.string(),
    organization: v.string(),
    subtitle: v.optional(v.string()),
    location: v.optional(v.string()),
    sourceUrl: v.string(),
    sourceStatus: opportunitySourceStatusValidator,
    sourceProvider: v.string(),
    sourceTool: v.string(),
    sourceCapturedAt: v.number(),
    evidence: v.array(v.string()),
    details: opportunityDetailsValidator,
    score: v.number(),
    scoreLabel: fit,
    scoreBreakdown: v.array(opportunityScoreItemValidator),
    stage: v.string(),
    feedback: v.optional(opportunityFeedbackValidator),
    lastVerifiedAt: v.number(),
    changeSummary: v.optional(v.string()),
  })),
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
      status: v.optional(v.string()),
      recurrence: v.optional(v.string()),
      nextRunAt: v.optional(v.number()),
      lastRunAt: v.optional(v.number()),
      lastThreadId: v.optional(v.id("threads")),
      reference: v.string(),
      instructions: v.optional(v.string()),
      timeZone: v.optional(v.string()),
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
  actionApprovals: [],
  opportunities: [],
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
  args: { leadAgent: leadAgentValidator },
  returns: snapshotValidator,
  handler: async (ctx, { leadAgent }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return EMPTY;
    const userId = identity.subject;
    const opportunities = await ctx.db
      .query("opportunities")
      .withIndex("by_user_agent", (q) => q.eq("userId", userId).eq("leadAgent", leadAgent))
      .take(100);
    const actionApprovals = await ctx.db
      .query("actionApprovals")
      .withIndex("by_user_agent", (q) => q.eq("userId", userId).eq("leadAgent", leadAgent))
      .take(50);
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
    const belongsToAgent = (row: { leadAgent?: LeadAgentKind }) =>
      (row.leadAgent ?? DEFAULT_LEAD_AGENT) === leadAgent;
    return {
      actionApprovals: actionApprovals.filter((row) => row.status === "pending").map((row) => ({
        id: row._id,
        actionType: row.actionType,
        title: row.title,
        summary: row.summary,
        target: row.target,
      })),
      opportunities: opportunities.map((row) => ({
        id: row._id,
        title: row.title,
        organization: row.organization,
        subtitle: row.subtitle,
        location: row.location,
        sourceUrl: row.sourceUrl,
        sourceStatus: row.sourceStatus,
        sourceProvider: row.sourceProvider,
        sourceTool: row.sourceTool,
        sourceCapturedAt: row.sourceCapturedAt,
        evidence: row.evidence,
        details: row.details,
        score: row.score,
        scoreLabel: row.scoreLabel,
        scoreBreakdown: row.scoreBreakdown,
        stage: row.stage,
        feedback: row.feedback,
        lastVerifiedAt: row.lastVerifiedAt,
        changeSummary: row.changeSummary,
      })),
      prospects: prospects.filter(belongsToAgent).map((row) => ({
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
        scoreBreakdown: row.scoreBreakdown,
        sourceReceiptHash: row.sourceReceiptHash,
        sourceTool: row.sourceTool,
        sourceCapturedAt: row.sourceCapturedAt,
        enrichedAt: row.enrichedAt,
        score: row.score,
        fit: row.fit,
        list: row.list,
        status: row.status,
      })),
      lists: lists.filter(belongsToAgent).map((row) => ({
        id: row._id,
        name: row.name,
        count: row.count,
        updated: row.updated,
      })),
      approvals: approvals
        .filter(belongsToAgent)
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
        .filter(belongsToAgent)
        .filter((row) => row.deletedAt === undefined)
        .map((row) => ({
          id: row._id,
          title: row.title,
          when: row.when,
          kind: row.kind,
          status: row.status,
          recurrence: row.recurrence,
          nextRunAt: row.nextRunAt,
          lastRunAt: row.lastRunAt,
          lastThreadId: row.lastThreadId,
          reference: `TASK-${String(row._id).slice(-6).toUpperCase()}`,
          instructions: row.instructions,
          timeZone: row.timeZone,
        })),
      campaigns: campaigns.filter(belongsToAgent).map((row) => ({
        name: row.name,
        sent: row.sent,
        replies: row.replies,
        meetings: row.meetings,
        status: row.status,
      })),
      pipeline: opportunities.length > 0
        ? OPPORTUNITY_PROFILES[leadAgent].stages.map((stage, index, stages) => {
            const count = opportunities.filter((row) => row.stage === stage).length;
            const prior = index === 0 ? opportunities.length : opportunities.filter((row) => row.stage === stages[index - 1]).length;
            return { stage, count, rate: index === 0 ? "100%" : prior > 0 ? `${Math.round((count / prior) * 100)}%` : "—" };
          })
        : pipeline
        .filter(belongsToAgent)
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((row) => ({ stage: row.stage, count: row.count, rate: row.rate })),
      bars: bars
        .filter(belongsToAgent)
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((row) => row.value),
    };
  },
});

export const holdApproval = mutation({
  args: { approvalId: v.id("approvals") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const row = await ctx.db.get(args.approvalId);
    if (!row || row.userId !== userId) throw new Error("Approval not found");
    if (row.status !== "pending") {
      throw new Error("This draft is no longer waiting for approval.");
    }
    await ctx.db.patch(args.approvalId, { status: "held" });
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
  scoreBreakdown: v.optional(
    v.object({
      fit: v.number(),
      timing: v.number(),
      authority: v.number(),
      contactability: v.number(),
    }),
  ),
  sourceReceiptId: v.optional(v.id("leadSourceReceipts")),
  sourceReceiptHash: v.optional(v.string()),
  sourceTool: v.optional(v.string()),
  sourceCapturedAt: v.optional(v.number()),
  enrichedAt: v.optional(v.number()),
  score: v.number(),
  fit,
  list: v.string(),
  status,
});

export const recordProspects = internalMutation({
  args: {
    userId: v.string(),
    leadAgent: leadAgentValidator,
    rows: v.array(prospectInput),
  },
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
    const seen = new Set(
      existing
        .filter(
          (row) =>
            (row.leadAgent ?? DEFAULT_LEAD_AGENT) === args.leadAgent,
        )
        .map(keyOf),
    );
    for (const row of args.rows) {
      const key = keyOf(row);
      if (seen.has(key)) continue;
      seen.add(key);
      await ctx.db.insert("prospects", {
        userId: args.userId,
        leadAgent: args.leadAgent,
        ...row,
      });
    }
    return null;
  },
});

export const recordList = internalMutation({
  args: {
    userId: v.string(),
    leadAgent: leadAgentValidator,
    name: v.string(),
    count: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("prospectLists", {
      userId: args.userId,
      leadAgent: args.leadAgent,
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
    leadAgent: leadAgentValidator,
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
    leadAgent: leadAgentValidator,
    title: v.string(),
    when: v.string(),
    kind: v.string(),
    instructions: v.string(),
    recurrence: v.union(
      v.literal("none"),
      v.literal("daily"),
      v.literal("weekly"),
    ),
    runAt: v.number(),
    timeZone: v.optional(v.string()),
  },
  returns: v.id("deskTasks"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const { runAt, ...task } = args;
    const taskId = await ctx.db.insert("deskTasks", {
      ...task,
      done: false,
      status: "active",
      nextRunAt: runAt,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.scheduler.runAt(runAt, internal.scheduledTasks.run, { taskId });
    return taskId;
  },
});

export const recordSourceReceipt = internalMutation({
  args: {
    userId: v.string(),
    threadId: v.id("threads"),
    assistantId: v.id("messages"),
    provider: v.string(),
    tool: v.string(),
    responseText: v.string(),
    responseHash: v.string(),
    capturedAt: v.number(),
  },
  returns: v.id("leadSourceReceipts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("leadSourceReceipts", args);
  },
});

export const getApprovalDispatchContext = internalQuery({
  args: { approvalId: v.id("approvals"), userId: v.string() },
  handler: async (ctx, { approvalId, userId }) => {
    const approval = await ctx.db.get(approvalId);
    if (!approval || approval.userId !== userId) return null;
    const servers = await ctx.db
      .query("mcpServers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(100);
    return {
      approval,
      servers: servers
        .filter((row) => row.enabled && (!row.composio || row.composio.connected))
        .map((row) => ({
          id: row._id,
          name: row.name,
          url: row.url,
          authMode: row.authMode,
          headers: row.headers ?? [],
          oauth: row.oauth,
        })),
    };
  },
});

export const beginApprovalDispatch = internalMutation({
  args: { approvalId: v.id("approvals"), userId: v.string() },
  returns: v.null(),
  handler: async (ctx, { approvalId, userId }) => {
    const row = await ctx.db.get(approvalId);
    if (!row || row.userId !== userId) throw new Error("Approval not found");
    if (row.status !== "pending") {
      throw new Error("This draft is no longer waiting for approval.");
    }
    await ctx.db.patch(approvalId, {
      status: "approved",
      error: undefined,
    });
    return null;
  },
});

export const finalizeApprovalDispatch = internalMutation({
  args: {
    approvalId: v.id("approvals"),
    userId: v.string(),
    ok: v.boolean(),
    provider: v.string(),
    providerTool: v.string(),
    providerResponseHash: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.approvalId);
    if (!row || row.userId !== args.userId) throw new Error("Approval not found");
    await ctx.db.patch(args.approvalId, {
      status: args.ok ? "sent" : "pending",
      provider: args.provider,
      providerTool: args.providerTool,
      providerResponseHash: args.providerResponseHash,
      sentAt: args.ok ? Date.now() : undefined,
      error: args.error,
    });
    if (args.ok) {
      const campaigns = await ctx.db
        .query("campaigns")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .take(100);
      const existing = campaigns.find(
        (campaign) =>
          (campaign.leadAgent ?? DEFAULT_LEAD_AGENT) ===
            (row.leadAgent ?? DEFAULT_LEAD_AGENT) &&
          campaign.name === row.sequence,
      );
      if (existing) {
        await ctx.db.patch(existing._id, {
          sent: existing.sent + 1,
          status: "Active",
        });
      } else {
        await ctx.db.insert("campaigns", {
          userId: args.userId,
          leadAgent: row.leadAgent ?? DEFAULT_LEAD_AGENT,
          name: row.sequence,
          sent: 1,
          replies: 0,
          meetings: 0,
          status: "Active",
        });
      }
    }
    return null;
  },
});

export const recordProviderMetrics = internalMutation({
  args: {
    userId: v.string(),
    leadAgent: leadAgentValidator,
    sourceReceiptId: v.id("leadSourceReceipts"),
    campaign: v.object({
      name: v.string(),
      sent: v.number(),
      replies: v.number(),
      meetings: v.number(),
      status: v.string(),
    }),
    pipeline: v.array(
      v.object({ stage: v.string(), count: v.number(), rate: v.string() }),
    ),
    bars: v.array(v.object({ day: v.string(), value: v.number() })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const receipt = await ctx.db.get(args.sourceReceiptId);
    if (!receipt || receipt.userId !== args.userId) {
      throw new Error("Provider receipt not found");
    }
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(100);
    const existingCampaign = campaigns.find(
      (row) =>
        (row.leadAgent ?? DEFAULT_LEAD_AGENT) === args.leadAgent &&
        row.name === args.campaign.name,
    );
    const campaignPatch = {
      ...args.campaign,
      leadAgent: args.leadAgent,
      sourceReceiptId: args.sourceReceiptId,
    };
    if (existingCampaign) {
      await ctx.db.patch(existingCampaign._id, campaignPatch);
    } else {
      await ctx.db.insert("campaigns", {
        userId: args.userId,
        ...campaignPatch,
      });
    }

    const [pipelineRows, barRows] = await Promise.all([
      ctx.db
        .query("pipelineStages")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .take(100),
      ctx.db
        .query("performanceBars")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .take(100),
    ]);
    for (const row of pipelineRows) {
      if ((row.leadAgent ?? DEFAULT_LEAD_AGENT) === args.leadAgent) {
        await ctx.db.delete(row._id);
      }
    }
    for (const row of barRows) {
      if ((row.leadAgent ?? DEFAULT_LEAD_AGENT) === args.leadAgent) {
        await ctx.db.delete(row._id);
      }
    }
    for (const [order, row] of args.pipeline.entries()) {
      await ctx.db.insert("pipelineStages", {
        userId: args.userId,
        leadAgent: args.leadAgent,
        sourceReceiptId: args.sourceReceiptId,
        order,
        ...row,
      });
    }
    for (const [order, row] of args.bars.entries()) {
      await ctx.db.insert("performanceBars", {
        userId: args.userId,
        leadAgent: args.leadAgent,
        sourceReceiptId: args.sourceReceiptId,
        order,
        ...row,
      });
    }
    return null;
  },
});
