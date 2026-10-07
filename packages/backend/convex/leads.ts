import { v } from "convex/values";

import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";

const fit = v.union(v.literal("Strong"), v.literal("Possible"), v.literal("Weak"));
const status = v.union(
  v.literal("New"),
  v.literal("Qualified"),
  v.literal("Sequenced"),
  v.literal("Replied"),
);

const prospectValidator = v.object({
  id: v.string(),
  name: v.string(),
  title: v.string(),
  company: v.string(),
  email: v.string(),
  location: v.string(),
  score: v.number(),
  fit,
  list: v.string(),
  status,
});

export const snapshotValidator = v.object({
  prospects: v.array(prospectValidator),
  lists: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      count: v.number(),
      updated: v.string(),
    }),
  ),
  approvals: v.array(
    v.object({
      id: v.string(),
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
      id: v.string(),
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

type Fit = "Strong" | "Possible" | "Weak";
type ProspectStatus = "New" | "Qualified" | "Sequenced" | "Replied";

type CatalogProspect = {
  name: string;
  title: string;
  company: string;
  email: string;
  location: string;
  score: number;
  fit: Fit;
  list: string;
  status: ProspectStatus;
};

export const PROSPECT_CATALOG: CatalogProspect[] = [
  {
    name: "Amaka Nwosu",
    title: "VP Revenue",
    company: "Halcyon Clinics",
    email: "amaka@halcyonclinics.example",
    location: "Lagos",
    score: 92,
    fit: "Strong",
    list: "Clinic groups, West Africa",
    status: "Qualified",
  },
  {
    name: "Jonah Adler",
    title: "Head of Growth",
    company: "Brightline Payments",
    email: "jonah@brightlinepay.example",
    location: "London",
    score: 88,
    fit: "Strong",
    list: "Series B fintech",
    status: "Sequenced",
  },
  {
    name: "Priya Raman",
    title: "Director of Sales",
    company: "Northwind Logistics",
    email: "priya@northwind.example",
    location: "Nairobi",
    score: 81,
    fit: "Strong",
    list: "Clinic groups, West Africa",
    status: "New",
  },
  {
    name: "Elena Voss",
    title: "CRO",
    company: "Fieldnote",
    email: "elena@fieldnote.example",
    location: "Berlin",
    score: 74,
    fit: "Possible",
    list: "Series B fintech",
    status: "Replied",
  },
  {
    name: "Mateo Ruiz",
    title: "Founder",
    company: "Cinder Supply",
    email: "mateo@cindersupply.example",
    location: "Mexico City",
    score: 63,
    fit: "Possible",
    list: "Operators, 20–80 people",
    status: "New",
  },
  {
    name: "Hannah Cho",
    title: "Sales Manager",
    company: "Lumen Freight",
    email: "hannah@lumenfreight.example",
    location: "Singapore",
    score: 41,
    fit: "Weak",
    list: "Operators, 20–80 people",
    status: "New",
  },
];

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
        location: row.location,
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

export const seed = mutation({
  args: {},
  returns: v.object({ seeded: v.boolean() }),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("prospects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) return { seeded: false };
    await writeWorkspace(ctx, userId);
    return { seeded: true };
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
  location: v.string(),
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
    const seen = new Set(existing.map((item) => item.email));
    for (const row of args.rows) {
      if (seen.has(row.email)) continue;
      seen.add(row.email);
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

async function writeWorkspace(ctx: MutationCtx, userId: string) {
  for (const row of PROSPECT_CATALOG) {
    await ctx.db.insert("prospects", { userId, ...row });
  }
  const lists = [
    { name: "Clinic groups, West Africa", count: 48, updated: "Today" },
    { name: "Series B fintech", count: 36, updated: "Yesterday" },
    { name: "Operators, 20–80 people", count: 22, updated: "Mon" },
  ];
  for (const list of lists) {
    await ctx.db.insert("prospectLists", { userId, ...list });
  }
  const approvals = [
    {
      to: "Amaka Nwosu",
      company: "Halcyon Clinics",
      subject: "A quieter way to fill Thursday’s clinics",
      preview:
        "Amaka — Halcyon’s Ikeja site still shows an 11-day wait for new patients. We book the first consult before your coordinators open the spreadsheet.",
      step: "1 of 4",
      sequence: "Clinic revival",
    },
    {
      to: "Jonah Adler",
      company: "Brightline Payments",
      subject: "Your EU expansion, without another SDR",
      preview:
        "Jonah — Brightline’s careers page has been hiring two SDRs since March. This sequence talks to the finance leads they would have dialed.",
      step: "2 of 4",
      sequence: "Fintech outbound",
    },
  ];
  for (const row of approvals) {
    await ctx.db.insert("approvals", { userId, ...row, status: "pending" });
  }
  const tasks = [
    { title: "Approve Halcyon step 1", when: "Today · 9:30", kind: "Approval" },
    { title: "Review replies from Fieldnote", when: "Today · 11:00", kind: "Reply" },
    { title: "Rebuild the fintech ICP", when: "Tomorrow", kind: "Research" },
    { title: "Weekly pipeline note", when: "Fri · recurring", kind: "Report" },
  ];
  for (const task of tasks) {
    await ctx.db.insert("deskTasks", { userId, ...task, done: false });
  }
  const campaigns = [
    { name: "Clinic revival", sent: 186, replies: 24, meetings: 7, status: "Running" },
    { name: "Fintech outbound", sent: 94, replies: 11, meetings: 3, status: "Running" },
    { name: "Operator warm-up", sent: 40, replies: 2, meetings: 0, status: "Draft" },
  ];
  for (const campaign of campaigns) {
    await ctx.db.insert("campaigns", { userId, ...campaign });
  }
  const pipeline = [
    { stage: "Found", count: 106, rate: "100%", order: 0 },
    { stage: "Qualified", count: 41, rate: "39%", order: 1 },
    { stage: "Sequenced", count: 27, rate: "66%", order: 2 },
    { stage: "Replied", count: 9, rate: "33%", order: 3 },
    { stage: "Meeting", count: 4, rate: "44%", order: 4 },
  ];
  for (const stage of pipeline) {
    await ctx.db.insert("pipelineStages", { userId, ...stage });
  }
  const bars = [18, 24, 16, 32, 28, 12, 20];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  for (let index = 0; index < bars.length; index += 1) {
    const value = bars[index] ?? 0;
    await ctx.db.insert("performanceBars", {
      userId,
      day: days[index] ?? "?",
      value,
      order: index,
    });
  }
}
