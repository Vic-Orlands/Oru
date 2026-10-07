import { jsonSchema, tool } from "ai";

import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import { PROSPECT_CATALOG } from "../leads";

export const LEAD_TOOL_NAMES = new Set([
  "findProspects",
  "qualifyLead",
  "saveList",
  "writeSequence",
  "queueEmail",
  "createDeskTask",
  "reportPerformance",
]);

type Card = { name?: string; title: string; text: string };

function matches(icp: string) {
  const words = icp.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 3);
  const ranked = PROSPECT_CATALOG.map((row) => {
    const hay = `${row.title} ${row.company} ${row.location} ${row.list}`.toLowerCase();
    const hits = words.filter((word) => hay.includes(word)).length;
    return { row, hits };
  });
  const picked = ranked.filter((item) => item.hits > 0).map((item) => item.row);
  return (picked.length > 0 ? picked : PROSPECT_CATALOG).slice(0, 4);
}

export function createLeadTools(opts: {
  ctx: ActionCtx;
  userId: string;
  onCard: (card: Card) => Promise<void>;
}) {
  const { ctx, userId, onCard } = opts;
  return {
    findProspects: tool({
      description:
        "Find and score prospects from an ICP description. Returns a prospect table card.",
      inputSchema: jsonSchema<{ icp: string }>({
        type: "object",
        properties: { icp: { type: "string" } },
        required: ["icp"],
        additionalProperties: false,
      }),
      execute: async ({ icp }) => {
        const rows = matches(icp);
        await ctx.runMutation(internal.leads.recordProspects, { userId, rows });
        const text = JSON.stringify({
          title: icp.slice(0, 80),
          rows: rows.map((row) => ({
            name: row.name,
            title: row.title,
            company: row.company,
            score: row.score,
            fit: row.fit,
          })),
        });
        await onCard({ title: "Prospects", text });
        return { count: rows.length, names: rows.map((row) => row.name) };
      },
    }),
    qualifyLead: tool({
      description:
        "Yes/no ICP fit check. Uses the Jev judge, then a cheap structured model if Jev is unavailable.",
      inputSchema: jsonSchema<{ name: string; notes: string }>({
        type: "object",
        properties: {
          name: { type: "string" },
          notes: { type: "string" },
        },
        required: ["name", "notes"],
        additionalProperties: false,
      }),
      execute: async ({ name, notes }) => {
        const decision = await ctx.runAction(internal.judge.decide, {
          question: `Is ${name} a fit to contact?`,
          state: notes,
        });
        return decision;
      },
    }),
    saveList: tool({
      description: "Save a named prospect list.",
      inputSchema: jsonSchema<{ name: string; count: number }>({
        type: "object",
        properties: {
          name: { type: "string" },
          count: { type: "number" },
        },
        required: ["name", "count"],
        additionalProperties: false,
      }),
      execute: async ({ name, count }) => {
        await ctx.runMutation(internal.leads.recordList, { userId, name, count });
        await onCard({
          title: name,
          text: JSON.stringify({ title: name, rows: [] }),
        });
        return { saved: name };
      },
    }),
    writeSequence: tool({
      description: "Write a multi-step outreach sequence. Does not send anything.",
      inputSchema: jsonSchema<{
        name: string;
        steps: { day: number; channel: string; subject: string }[];
      }>({
        type: "object",
        properties: {
          name: { type: "string" },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "number" },
                channel: { type: "string" },
                subject: { type: "string" },
              },
              required: ["day", "channel", "subject"],
              additionalProperties: false,
            },
          },
        },
        required: ["name", "steps"],
        additionalProperties: false,
      }),
      execute: async ({ name, steps }) => {
        await onCard({
          name: "sequence",
          title: name,
          text: JSON.stringify({ name, steps }),
        });
        return { steps: steps.length };
      },
    }),
    queueEmail: tool({
      description: "Queue an email draft for human approval. Never sends.",
      inputSchema: jsonSchema<{
        to: string;
        company: string;
        subject: string;
        preview: string;
        sequence: string;
      }>({
        type: "object",
        properties: {
          to: { type: "string" },
          company: { type: "string" },
          subject: { type: "string" },
          preview: { type: "string" },
          sequence: { type: "string" },
        },
        required: ["to", "company", "subject", "preview", "sequence"],
        additionalProperties: false,
      }),
      execute: async (draft) => {
        await ctx.runMutation(internal.leads.recordApproval, {
          userId,
          ...draft,
          step: "1 of 4",
        });
        await onCard({
          name: "approval",
          title: "Draft for approval",
          text: JSON.stringify({ ...draft, step: "1 of 4" }),
        });
        return { queued: true };
      },
    }),
    createDeskTask: tool({
      description: "Create a manual, scheduled, or recurring desk task.",
      inputSchema: jsonSchema<{ title: string; when: string; kind: string }>({
        type: "object",
        properties: {
          title: { type: "string" },
          when: { type: "string" },
          kind: { type: "string" },
        },
        required: ["title", "when", "kind"],
        additionalProperties: false,
      }),
      execute: async (task) => {
        await ctx.runMutation(internal.leads.recordTask, { userId, ...task });
        return { created: task.title };
      },
    }),
    reportPerformance: tool({
      description: "Summarise campaign performance for the user.",
      inputSchema: jsonSchema<{ campaign: string }>({
        type: "object",
        properties: { campaign: { type: "string" } },
        required: ["campaign"],
        additionalProperties: false,
      }),
      execute: async ({ campaign }) => {
        return {
          campaign,
          sent: 186,
          replies: 24,
          meetings: 7,
          note: "Reply rate is 13%. The Thursday send outperformed Monday.",
        };
      },
    }),
  };
}
