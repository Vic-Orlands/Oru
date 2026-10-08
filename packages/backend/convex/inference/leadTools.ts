import { jsonSchema, tool } from "ai";

import { internal } from "../_generated/api";
import type { ActionCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import type { LeadAgentKind } from "../leadAgents";
import { scoreLead, type LeadScoringSignals } from "./leadScoring";

export const LEAD_TOOL_NAMES = new Set([
  "findProspects",
  "qualifyLead",
  "saveList",
  "writeSequence",
  "queueEmail",
  "createDeskTask",
  "recordCampaignActivity",
]);

type Card = { name?: string; title: string; text: string };
type ProviderReceipt = {
  id: Id<"leadSourceReceipts">;
  provider: string;
  tool: string;
  responseText: string;
  responseHash: string;
  capturedAt: number;
};

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
  leadAgent: LeadAgentKind;
  latestProviderReceipt: () => ProviderReceipt | undefined;
  onCard: (card: Card) => Promise<void>;
}) {
  const { ctx, userId, leadAgent, latestProviderReceipt, onCard } = opts;
  const leadKind =
    leadAgent === "job_hunt"
      ? "job opportunities"
      : leadAgent === "recruiting"
        ? "candidate leads"
        : leadAgent === "partnerships"
          ? "partner opportunities"
          : leadAgent === "fundraising"
            ? "investor leads"
            : "sales prospects";
  return {
    findProspects: tool({
      description:
        `Save real ${leadKind} returned by live web research or a connected data provider. Call the appropriate live source first. Every row must include a source URL; never invent people, roles, organizations, links, or emails. For Job Hunt, use the role title as name, the team or employment type as title, and the employer as company.`,
      inputSchema: jsonSchema<{
        icp: string;
        rows: Array<{
          name: string;
          title: string;
          company: string;
          email?: string;
          emailVerification: "verified" | "risky" | "invalid" | "unknown";
          location: string;
          scoreReason: string;
          scoringSignals: LeadScoringSignals;
          sourceUrl: string;
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
                scoreReason: { type: "string" },
                scoringSignals: {
                  type: "object",
                  properties: {
                    fit: { type: "string", enum: ["exact", "partial", "weak", "none"] },
                    timing: { type: "string", enum: ["active", "recent", "possible", "none"] },
                    authority: { type: "string", enum: ["decision_maker", "influencer", "user", "unknown"] },
                    contactability: { type: "string", enum: ["verified_email", "risky_email", "profile_only", "none"] },
                  },
                  required: ["fit", "timing", "authority", "contactability"],
                  additionalProperties: false,
                },
                sourceUrl: { type: "string", format: "uri" },
                profileUrl: { type: "string", format: "uri" },
                companyUrl: { type: "string", format: "uri" },
                evidence: { type: "array", items: { type: "string" } },
              },
              required: [
                "name", "title", "company", "emailVerification", "location",
                "scoreReason", "scoringSignals", "sourceUrl", "evidence",
              ],
              additionalProperties: false,
            },
          },
        },
        required: ["icp", "rows"],
        additionalProperties: false,
      }),
      execute: async ({ icp, rows }) => {
        const receipt = latestProviderReceipt();
        if (!receipt) {
          throw new Error(
            "Run live web research or a connected data provider before saving leads.",
          );
        }
        const enrichedAt = Date.now();
        const persisted = rows.map((row) => {
          const sourceUrl = webUrl(row.sourceUrl, "sourceUrl");
          const profileUrl = row.profileUrl
            ? webUrl(row.profileUrl, "profileUrl")
            : undefined;
          const companyUrl = row.companyUrl
            ? webUrl(row.companyUrl, "companyUrl")
            : undefined;
          const claimedUrls = [
            { raw: row.sourceUrl, normalized: sourceUrl },
            ...(row.profileUrl && profileUrl
              ? [{ raw: row.profileUrl, normalized: profileUrl }]
              : []),
            ...(row.companyUrl && companyUrl
              ? [{ raw: row.companyUrl, normalized: companyUrl }]
              : []),
          ];
          for (const url of claimedUrls) {
            if (
              !receipt.responseText.includes(url.raw) &&
              !receipt.responseText.includes(url.normalized)
            ) {
              throw new Error(
                `The provider response did not contain the claimed source URL: ${url.raw}`,
              );
            }
          }
          const identityClaims = [row.name, row.title, row.company, row.email]
            .filter((claim): claim is string => Boolean(claim?.trim()));
          const missingClaim = identityClaims.find(
            (claim) => !receipt.responseText.toLowerCase().includes(claim.toLowerCase()),
          );
          if (missingClaim) {
            throw new Error(
              `The provider response did not contain the claimed lead identity: ${missingClaim}`,
            );
          }
          const scored = scoreLead(row.scoringSignals);
          const { scoringSignals: _scoringSignals, ...persistedRow } = row;
          return {
            ...persistedRow,
            score: scored.score,
            fit: scored.fit,
            scoreBreakdown: scored.breakdown,
            email: row.email ?? "",
            sourceUrl,
            ...(profileUrl ? { profileUrl } : {}),
            ...(companyUrl ? { companyUrl } : {}),
            sourceProvider: receipt.provider,
            sourceReceiptId: receipt.id,
            sourceReceiptHash: receipt.responseHash,
            sourceTool: receipt.tool,
            sourceCapturedAt: receipt.capturedAt,
            list: icp.slice(0, 80),
            status: "New" as const,
            enrichedAt,
          };
        });
        await ctx.runMutation(internal.leads.recordProspects, {
          userId,
          leadAgent,
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
        `Yes/no fit check for ${leadKind}. Uses the Jev judge, then a cheap structured model if Jev is unavailable.`,
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
          question: `Is ${name} a strong fit for this ${leadKind} workflow?`,
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
        await ctx.runMutation(internal.leads.recordList, {
          userId,
          leadAgent,
          name,
          count,
        });
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
          leadAgent,
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
      description:
        "Schedule real future agent work. At the due time Oso-Ahia opens a dedicated thread, runs these instructions with live web search enabled, and repeats when requested.",
      inputSchema: jsonSchema<{
        title: string;
        instructions: string;
        firstRunAt: string;
        recurrence: "none" | "daily" | "weekly";
        kind: string;
      }>({
        type: "object",
        properties: {
          title: { type: "string" },
          instructions: {
            type: "string",
            description:
              "Complete, self-contained instructions for the future run, including desired output and filters.",
          },
          firstRunAt: {
            type: "string",
            description:
              "ISO-8601 date-time with an explicit UTC offset for the first run.",
          },
          recurrence: {
            type: "string",
            enum: ["none", "daily", "weekly"],
          },
          kind: { type: "string" },
        },
        required: [
          "title",
          "instructions",
          "firstRunAt",
          "recurrence",
          "kind",
        ],
        additionalProperties: false,
      }),
      execute: async ({ firstRunAt, ...task }) => {
        const runAt = Date.parse(firstRunAt);
        if (!Number.isFinite(runAt)) {
          throw new Error(
            "The scheduled time must be a valid ISO-8601 date-time with a UTC offset.",
          );
        }
        if (runAt < Date.now() - 60_000) {
          throw new Error("The scheduled time is already in the past.");
        }
        const taskId = await ctx.runMutation(internal.leads.recordTask, {
          userId,
          leadAgent,
          ...task,
          when: firstRunAt,
          runAt,
        });
        return {
          created: task.title,
          taskId,
          firstRunAt,
          recurrence: task.recurrence,
        };
      },
    }),
    recordCampaignActivity: tool({
      description:
        "Store campaign, pipeline, and daily activity returned by a connected provider. Call the live campaign or CRM integration immediately before this tool. Never estimate metrics.",
      inputSchema: jsonSchema<{
        campaign: {
          name: string;
          sent: number;
          replies: number;
          meetings: number;
          status: string;
        };
        pipeline: { stage: string; count: number; rate: string }[];
        bars: { day: string; value: number }[];
      }>({
        type: "object",
        properties: {
          campaign: {
            type: "object",
            properties: {
              name: { type: "string" },
              sent: { type: "number", minimum: 0 },
              replies: { type: "number", minimum: 0 },
              meetings: { type: "number", minimum: 0 },
              status: { type: "string" },
            },
            required: ["name", "sent", "replies", "meetings", "status"],
            additionalProperties: false,
          },
          pipeline: {
            type: "array",
            maxItems: 12,
            items: {
              type: "object",
              properties: {
                stage: { type: "string" },
                count: { type: "number", minimum: 0 },
                rate: { type: "string" },
              },
              required: ["stage", "count", "rate"],
              additionalProperties: false,
            },
          },
          bars: {
            type: "array",
            maxItems: 31,
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                value: { type: "number", minimum: 0 },
              },
              required: ["day", "value"],
              additionalProperties: false,
            },
          },
        },
        required: ["campaign", "pipeline", "bars"],
        additionalProperties: false,
      }),
      execute: async ({ campaign, pipeline, bars }) => {
        const receipt = latestProviderReceipt();
        if (!receipt) {
          throw new Error(
            "Read campaign activity from a connected provider before saving metrics.",
          );
        }
        const claimedNumbers = [
          campaign.sent,
          campaign.replies,
          campaign.meetings,
          ...pipeline.map((row) => row.count),
          ...bars.map((row) => row.value),
        ];
        const unsupported = claimedNumbers.find(
          (value) => !receipt.responseText.includes(String(value)),
        );
        if (unsupported !== undefined) {
          throw new Error(
            `The provider response did not contain the claimed metric: ${unsupported}`,
          );
        }
        await ctx.runMutation(internal.leads.recordProviderMetrics, {
          userId,
          leadAgent,
          sourceReceiptId: receipt.id,
          campaign,
          pipeline,
          bars,
        });
        return {
          stored: true,
          provider: receipt.provider,
          receipt: receipt.responseHash,
        };
      },
    }),
  };
}
