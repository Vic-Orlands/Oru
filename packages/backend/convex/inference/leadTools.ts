import { jsonSchema, tool } from "ai";

import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";

export const LEAD_TOOL_NAMES = new Set([
  "findProspects",
  "qualifyLead",
  "saveList",
  "writeSequence",
  "queueEmail",
  "createDeskTask",
]);

type Card = { name?: string; title: string; text: string };

function webUrl(value: string, field: string): string {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return parsed.toString();
    }
  } catch {
    // The provider returned something that is not a URL.
  }
  throw new Error(`${field} must be a public http(s) URL from the lead provider.`);
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
        "Save real prospects returned by a connected prospecting integration such as FuseAI. Call the live integration first. Every row must include a source URL; never invent people, links, or emails.",
      inputSchema: jsonSchema<{
        icp: string;
        rows: Array<{
          name: string;
          title: string;
          company: string;
          email?: string;
          emailVerification: "verified" | "risky" | "invalid" | "unknown";
          location: string;
          score: number;
          fit: "Strong" | "Possible" | "Weak";
          scoreReason: string;
          sourceUrl: string;
          sourceProvider: string;
          profileUrl?: string;
          companyUrl?: string;
          evidence: string[];
        }>;
      }>({
        type: "object",
        properties: {
          icp: { type: "string" },
          rows: {
            type: "array",
            minItems: 1,
            maxItems: 25,
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                title: { type: "string" },
                company: { type: "string" },
                email: { type: "string" },
                emailVerification: {
                  type: "string",
                  enum: ["verified", "risky", "invalid", "unknown"],
                },
                location: { type: "string" },
                score: { type: "number", minimum: 0, maximum: 100 },
                fit: { type: "string", enum: ["Strong", "Possible", "Weak"] },
                scoreReason: { type: "string" },
                sourceUrl: { type: "string", format: "uri" },
                sourceProvider: { type: "string" },
                profileUrl: { type: "string", format: "uri" },
                companyUrl: { type: "string", format: "uri" },
                evidence: { type: "array", items: { type: "string" } },
              },
              required: [
                "name", "title", "company", "emailVerification", "location",
                "score", "fit", "scoreReason", "sourceUrl", "sourceProvider", "evidence",
              ],
              additionalProperties: false,
            },
          },
        },
        required: ["icp", "rows"],
        additionalProperties: false,
      }),
      execute: async ({ icp, rows }) => {
        const enrichedAt = Date.now();
        const persisted = rows.map((row) => ({
          ...row,
          email: row.email ?? "",
          sourceUrl: webUrl(row.sourceUrl, "sourceUrl"),
          ...(row.profileUrl
            ? { profileUrl: webUrl(row.profileUrl, "profileUrl") }
            : {}),
          ...(row.companyUrl
            ? { companyUrl: webUrl(row.companyUrl, "companyUrl") }
            : {}),
          list: icp.slice(0, 80),
          status: "New" as const,
          enrichedAt,
        }));
        await ctx.runMutation(internal.leads.recordProspects, {
          userId,
          rows: persisted,
        });
        const text = JSON.stringify({
          title: icp.slice(0, 80),
          rows: persisted.map((row) => ({
            name: row.name,
            title: row.title,
            company: row.company,
            score: row.score,
            fit: row.fit,
            sourceUrl: row.sourceUrl,
            profileUrl: row.profileUrl,
            emailVerification: row.emailVerification,
          })),
        });
        await onCard({ title: "Prospects", text });
        return { count: persisted.length, names: persisted.map((row) => row.name) };
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
  };
}
