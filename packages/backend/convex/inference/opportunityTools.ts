import { jsonSchema, tool } from "ai";

import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import type { LeadAgentKind } from "../leadAgents";
import {
  OPPORTUNITY_PROFILES,
  opportunityStage,
  scoreOpportunity,
  type OpportunitySignal,
} from "../opportunityProfiles";

type ProviderReceipt = {
  id: Id<"leadSourceReceipts">;
  provider: string;
  tool: string;
  responseText: string;
  responseHash: string;
  capturedAt: number;
};

type OpportunityDetails = {
  salary?: string; locationMode?: string; employmentType?: string; deadline?: string;
  skills?: string[]; personName?: string; email?: string; checkSize?: string;
  thesis?: string; stageFocus?: string; portfolioConflict?: string;
  partnershipType?: string; mutualValue?: string; buyerRole?: string; buyingSignal?: string;
};

type OpportunityRow = {
  title: string;
  organization: string;
  subtitle?: string;
  location?: string;
  sourceUrl: string;
  sourceStatus: "live" | "stale" | "unknown";
  evidence: string[];
  details?: OpportunityDetails;
  stage?: string;
  scoreSignals: OpportunitySignal[];
};

function verifiedUrl(value: string, receipt: ProviderReceipt) {
  let normalized: string;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error();
    normalized = parsed.toString();
  } catch {
    throw new Error("Every opportunity needs a valid public source URL.");
  }
  if (!receipt.responseText.includes(value) && !receipt.responseText.includes(normalized)) {
    throw new Error(`The live source response did not contain ${value}.`);
  }
  return normalized;
}

export function createOpportunityTools(opts: {
  ctx: ActionCtx;
  userId: string;
  leadAgent: LeadAgentKind;
  latestProviderReceipt: () => ProviderReceipt | undefined;
  onCard: (card: { name?: string; title: string; text: string }) => Promise<void>;
}) {
  const { ctx, userId, leadAgent, latestProviderReceipt, onCard } = opts;
  const profile = OPPORTUNITY_PROFILES[leadAgent];
  const toolName = profile.toolName;

  return {
    [toolName]: tool({
      description: `File source-backed ${profile.plural} for the active ${leadAgent.replace("_", " ")} agent. Run native Exa/Parallel search or an appropriate connected source immediately before this tool. Required scoring criteria, spelled exactly: ${profile.criteria.join(", ")}. Never invent a URL or claim.`,
      inputSchema: jsonSchema<{ rows: OpportunityRow[] }>({
        type: "object",
        properties: {
          rows: {
            type: "array",
            minItems: 1,
            maxItems: 25,
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                organization: { type: "string" },
                subtitle: { type: "string" },
                location: { type: "string" },
                sourceUrl: { type: "string", format: "uri" },
                sourceStatus: { type: "string", enum: ["live", "stale", "unknown"] },
                evidence: { type: "array", minItems: 1, items: { type: "string" } },
                details: {
                  type: "object",
                  properties: {
                    salary: { type: "string" }, locationMode: { type: "string" }, employmentType: { type: "string" }, deadline: { type: "string" },
                    skills: { type: "array", items: { type: "string" } }, personName: { type: "string" }, email: { type: "string" },
                    checkSize: { type: "string" }, thesis: { type: "string" }, stageFocus: { type: "string" }, portfolioConflict: { type: "string" },
                    partnershipType: { type: "string" }, mutualValue: { type: "string" }, buyerRole: { type: "string" }, buyingSignal: { type: "string" },
                  },
                  additionalProperties: false,
                },
                stage: { type: "string" },
                scoreSignals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      criterion: { type: "string" },
                      level: { type: "string", enum: ["strong", "medium", "weak", "unknown"] },
                      reason: { type: "string" },
                    },
                    required: ["criterion", "level", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["title", "organization", "sourceUrl", "sourceStatus", "evidence", "scoreSignals"],
              additionalProperties: false,
            },
          },
        },
        required: ["rows"],
        additionalProperties: false,
      }),
      execute: async ({ rows }) => {
        const receipt = latestProviderReceipt();
        if (!receipt) throw new Error(`Search a live source before filing ${profile.plural}.`);
        const receiptText = receipt.responseText.toLowerCase();
        const persisted = rows.map((row) => {
          const sourceUrl = verifiedUrl(row.sourceUrl, receipt);
          for (const claim of [row.title, row.organization]) {
            if (!receiptText.includes(claim.trim().toLowerCase())) {
              throw new Error(`The live source response did not contain the claimed identity: ${claim}.`);
            }
          }
          const scored = scoreOpportunity(leadAgent, row.scoreSignals);
          return {
            title: row.title,
            organization: row.organization,
            ...(row.subtitle ? { subtitle: row.subtitle } : {}),
            ...(row.location ? { location: row.location } : {}),
            sourceUrl,
            sourceStatus: row.sourceStatus,
            sourceProvider: receipt.provider,
            sourceTool: receipt.tool,
            sourceReceiptId: receipt.id,
            sourceReceiptHash: receipt.responseHash,
            sourceCapturedAt: receipt.capturedAt,
            evidence: row.evidence,
            details: row.details ?? {},
            score: scored.score,
            scoreLabel: scored.label,
            scoreBreakdown: scored.breakdown,
            stage: opportunityStage(leadAgent, row.stage),
            dedupeKey: sourceUrl.toLowerCase(),
          };
        });
        const result = await ctx.runMutation(internal.opportunities.recordMany, {
          userId,
          leadAgent,
          rows: persisted,
        });
        await onCard({
          name: "opportunities",
          title: profile.plural,
          text: JSON.stringify({
            title: profile.plural,
            rows: persisted.map(({ title, organization, sourceUrl, score, scoreLabel, stage }) => ({
              title,
              organization,
              sourceUrl,
              score,
              scoreLabel,
              stage,
            })),
            changes: result,
          }),
        });
        return { ...result, total: persisted.length };
      },
    }),
  };
}
