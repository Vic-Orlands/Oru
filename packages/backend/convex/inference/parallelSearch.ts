import { jsonSchema, tool } from "ai";

import type { SearchSource } from "./search";

type ParallelSearchResult = {
  url?: string;
  title?: string;
  publish_date?: string | null;
  excerpts?: string[];
};

type ParallelSearchResponse = {
  results?: ParallelSearchResult[];
  warnings?: unknown;
};

const MAX_RESULTS = 10;
const MAX_EXCERPT_CHARS = 2_500;

function clamp(text: string) {
  if (text.length <= MAX_EXCERPT_CHARS) return text;
  return `${text.slice(0, MAX_EXCERPT_CHARS)}\n\n[Excerpt truncated.]`;
}

export function createParallelSearchTool({
  apiKey,
  onSearch,
}: {
  apiKey: string;
  onSearch: (result: {
    sources: number;
    items: SearchSource[];
    callIdx: number;
  }) => Promise<void>;
}) {
  let callIndex = 0;

  return tool({
    description:
      "Research a broad or complex topic on the live web and return source-grounded excerpts. Prefer this for market research, company discovery, comparisons, and lead research.",
    inputSchema: jsonSchema<{
      objective: string;
      searchQueries?: string[];
    }>({
      type: "object",
      properties: {
        objective: {
          type: "string",
          minLength: 1,
          description: "What the research should establish and prioritize.",
        },
        searchQueries: {
          type: "array",
          maxItems: 5,
          items: { type: "string", minLength: 1 },
          description:
            "Optional focused queries that support the objective. Omit when the objective is already precise.",
        },
      },
      required: ["objective"],
      additionalProperties: false,
    }),
    execute: async ({ objective, searchQueries }) => {
      const callIdx = callIndex++;
      const response = await fetch("https://api.parallel.ai/v1/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          objective,
          mode: "fast",
          ...(searchQueries?.length
            ? { search_queries: searchQueries.slice(0, 5) }
            : {}),
        }),
      });

      if (!response.ok) {
        const detail = (await response.text()).slice(0, 500);
        throw new Error(
          `Parallel web research failed (${response.status}): ${detail}`,
        );
      }

      const data = (await response.json()) as ParallelSearchResponse;
      const results = (data.results ?? [])
        .filter((result): result is ParallelSearchResult & { url: string } =>
          Boolean(result.url),
        )
        .slice(0, MAX_RESULTS);
      const items = results.map((result) => ({
        url: result.url,
        title: result.title || result.url,
        ...(result.publish_date ? { publishedDate: result.publish_date } : {}),
      }));

      await onSearch({ sources: items.length, items, callIdx });

      return {
        objective,
        results: results.map((result) => ({
          url: result.url,
          title: result.title || result.url,
          publishedDate: result.publish_date ?? null,
          excerpts: (result.excerpts ?? []).map(clamp),
        })),
        warnings: data.warnings ?? null,
      };
    },
  });
}
