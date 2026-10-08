import { v } from "convex/values";

import { action, query } from "./_generated/server";
import { requireAdmin } from "./admin";
import {
  isSupermemoryConfigured,
  supermemoryRequest,
} from "./supermemory";

const MESSAGE_SAMPLE_SIZE = 1_000;
const RECENT_TOOL_CALL_LIMIT = 100;
const BILLING_ALERT_LIMIT = 200;

const TOOL_PHASE_KINDS = new Set([
  "search",
  "calculation",
  "weather",
  "mcp",
  "skill",
  "history",
  "integrationSuggestion",
  "document",
  "html",
  "chart",
  "image",
  "question",
  "lead",
]);

type ToolCall = {
  messageId: string;
  threadId: string;
  userId: string;
  model: string;
  kind: string;
  label: string;
  status: "pending" | "succeeded" | "failed";
  error: string | null;
  createdAt: number;
};

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function phaseRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function phaseLabel(phase: Record<string, unknown>, kind: string): string {
  const values =
    kind === "mcp"
      ? [phase.server, phase.tool]
      : [phase.name, phase.title, phase.action, phase.query, phase.place];
  const details = values.filter(
    (value): value is string => typeof value === "string" && value.trim() !== "",
  );
  return details.length > 0 ? details.join(" · ") : kind;
}

function toolCallFromPhase(args: {
  phase: unknown;
  messageId: string;
  threadId: string;
  userId: string;
  model: string;
  createdAt: number;
}): ToolCall | null {
  const phase = phaseRecord(args.phase);
  const kind = typeof phase?.kind === "string" ? phase.kind : null;
  if (!phase || !kind || !TOOL_PHASE_KINDS.has(kind)) return null;

  const error = typeof phase.error === "string" ? phase.error : null;
  const status =
    phase.pending === true
      ? "pending"
      : error || phase.ok === false
        ? "failed"
        : "succeeded";
  return {
    messageId: args.messageId,
    threadId: args.threadId,
    userId: args.userId,
    model: args.model,
    kind,
    label: phaseLabel(phase, kind),
    status,
    error,
    createdAt: args.createdAt,
  };
}

type UsageBucket = {
  replies: number;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  toolCalls: number;
  lastActiveAt: number;
};

function emptyBucket(): UsageBucket {
  return {
    replies: 0,
    costUsd: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    toolCalls: 0,
    lastActiveAt: 0,
  };
}

function addUsage(
  bucket: UsageBucket,
  usage: Omit<UsageBucket, "replies">,
): void {
  bucket.replies += 1;
  bucket.costUsd += usage.costUsd;
  bucket.inputTokens += usage.inputTokens;
  bucket.outputTokens += usage.outputTokens;
  bucket.totalTokens += usage.totalTokens;
  bucket.toolCalls += usage.toolCalls;
  bucket.lastActiveAt = Math.max(bucket.lastActiveAt, usage.lastActiveAt);
}

function bucketFor(map: Map<string, UsageBucket>, key: string): UsageBucket {
  const current = map.get(key);
  if (current) return current;
  const created = emptyBucket();
  map.set(key, created);
  return created;
}

/**
 * Admin observability over the latest assistant-message sample. The bounded
 * read keeps the console safe on large deployments while still making live
 * operations, model spend, token volume, and per-user usage visible.
 */
export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [messages, pendingCharges, failedCharges] = await Promise.all([
      ctx.db.query("messages").order("desc").take(MESSAGE_SAMPLE_SIZE),
      ctx.db
        .query("usageCharges")
        .withIndex("by_status_and_next_attempt", (q) => q.eq("status", "pending"))
        .take(BILLING_ALERT_LIMIT),
      ctx.db
        .query("usageCharges")
        .withIndex("by_status_and_next_attempt", (q) => q.eq("status", "failed"))
        .take(BILLING_ALERT_LIMIT),
    ]);

    const assistants = messages.filter((message) => message.role === "assistant");
    const byUser = new Map<string, UsageBucket>();
    const byModel = new Map<string, UsageBucket>();
    const toolCalls: ToolCall[] = [];
    const totals = emptyBucket();

    for (const message of assistants) {
      const model = message.model ?? "Auto";
      const phases = message.phases ?? [];
      const calls = phases
        .map((phase) =>
          toolCallFromPhase({
            phase,
            messageId: message._id,
            threadId: message.threadId,
            userId: message.userId,
            model,
            createdAt: message.createdAt,
          }),
        )
        .filter((call): call is ToolCall => call !== null);
      toolCalls.push(...calls);

      const costUsd = numberOrZero(message.usageCost);
      const inputTokens = numberOrZero(message.inputTokens);
      const outputTokens = numberOrZero(message.outputTokens);
      const totalTokens = numberOrZero(message.totalTokens) || inputTokens + outputTokens;
      const usage = {
        costUsd,
        inputTokens,
        outputTokens,
        totalTokens,
        toolCalls: calls.length,
        lastActiveAt: message.createdAt,
      };
      addUsage(totals, usage);
      addUsage(bucketFor(byUser, message.userId), usage);
      addUsage(bucketFor(byModel, model), usage);
    }

    const rows = <T>(map: Map<string, T>) =>
      [...map.entries()].map(([key, value]) => ({ key, ...value }));
    const chargeSummary = (charges: typeof pendingCharges) => ({
      count: charges.length,
      amount: charges.reduce((sum, charge) => sum + charge.amount, 0),
      capped: charges.length === BILLING_ALERT_LIMIT,
    });

    return {
      sampledMessages: messages.length,
      sampleCapped: messages.length === MESSAGE_SAMPLE_SIZE,
      sampleStartedAt: messages.at(-1)?.createdAt ?? null,
      totals,
      users: rows(byUser).sort((a, b) => b.costUsd - a.costUsd),
      models: rows(byModel).sort((a, b) => b.costUsd - a.costUsd),
      recentToolCalls: toolCalls.slice(0, RECENT_TOOL_CALL_LIMIT),
      billing: {
        pending: chargeSummary(pendingCharges),
        failed: chargeSummary(failedCharges),
      },
    };
  },
});

/** Verify that the configured Supermemory key reaches the current v5 API. */
export const supermemoryHealth = action({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    if (!isSupermemoryConfigured()) {
      return {
        status: "missing" as const,
        message: "SUPERMEMORY_API_KEY is not set on this Convex deployment.",
      };
    }
    try {
      await supermemoryRequest<unknown>({ path: "/organization", method: "GET" });
      return {
        status: "connected" as const,
        message: "Supermemory accepted the configured API key.",
      };
    } catch (cause) {
      return {
        status: "error" as const,
        message:
          cause instanceof Error
            ? cause.message
            : "Supermemory could not verify the configured key.",
      };
    }
  },
});
