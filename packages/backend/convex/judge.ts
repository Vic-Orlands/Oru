import { v } from "convex/values";

import { internalAction } from "./_generated/server";

const JUDGE_MODEL = process.env.OPENROUTER_JUDGE_MODEL || "typesafe/jev-1.13";
const FALLBACK_MODEL =
  process.env.OPENROUTER_JUDGE_FALLBACK_MODEL || "openai/gpt-4.1-nano";

function heuristic(question: string, state: string): "yes" | "no" {
  const blob = `${question} ${state}`.toLowerCase();
  if (/(weak|duplicate|unsubscribe|not a fit|no\b)/.test(blob) && !/strong/.test(blob)) {
    return "no";
  }
  return "yes";
}

function readAnswer(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const buckets = [record.answers, record.decisions, record.results];
  for (const bucket of buckets) {
    if (!Array.isArray(bucket) || bucket.length === 0) continue;
    const first = bucket[0];
    if (!first || typeof first !== "object") continue;
    const row = first as Record<string, unknown>;
    const value = row.answer ?? row.choice ?? row.value ?? row.label;
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

async function jevDecision(
  key: string,
  question: string,
  state: string,
): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/alpha/decisions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: JUDGE_MODEL,
      state,
      questions: [
        {
          id: "q",
          type: "choice",
          prompt: question,
          options: ["yes", "no"],
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`Jev ${response.status}`);
  }
  const payload: unknown = await response.json();
  const answer = readAnswer(payload);
  if (!answer) throw new Error("Jev returned no answer");
  return answer;
}

async function fallbackDecision(
  key: string,
  question: string,
  state: string,
): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: FALLBACK_MODEL,
      messages: [
        {
          role: "user",
          content: `Answer the question with JSON {"answer":"yes"} or {"answer":"no"} only.\nQuestion: ${question}\nState: ${state}`,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!response.ok) throw new Error(`Fallback ${response.status}`);
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object") throw new Error("Empty fallback");
  const choices = (payload as { choices?: { message?: { content?: string } }[] })
    .choices;
  const content = choices?.[0]?.message?.content ?? "";
  const parsed: unknown = JSON.parse(content);
  if (
    parsed &&
    typeof parsed === "object" &&
    "answer" in parsed &&
    typeof (parsed as { answer: unknown }).answer === "string"
  ) {
    return (parsed as { answer: string }).answer;
  }
  throw new Error("Fallback JSON missing answer");
}

export const decide = internalAction({
  args: {
    question: v.string(),
    state: v.string(),
  },
  returns: v.object({
    answer: v.string(),
    model: v.string(),
    source: v.union(v.literal("jev"), v.literal("fallback")),
  }),
  handler: async (_ctx, args) => {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      return {
        answer: heuristic(args.question, args.state),
        model: "heuristic",
        source: "fallback" as const,
      };
    }
    try {
      const answer = await jevDecision(key, args.question, args.state);
      return { answer, model: JUDGE_MODEL, source: "jev" as const };
    } catch (error) {
      console.error(
        "Jev decision failed",
        error instanceof Error ? error.message : error,
      );
    }
    try {
      const answer = await fallbackDecision(key, args.question, args.state);
      return { answer, model: FALLBACK_MODEL, source: "fallback" as const };
    } catch (error) {
      console.error(
        "Judge fallback failed",
        error instanceof Error ? error.message : error,
      );
      return {
        answer: heuristic(args.question, args.state),
        model: "heuristic",
        source: "fallback" as const,
      };
    }
  },
});
