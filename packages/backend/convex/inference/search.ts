import { jsonSchema, tool } from "ai";

export type ExaCitation = {
  id?: string;
  url?: string;
  title?: string;
  author?: string;
  publishedDate?: string;
  highlights?: string[];
};

export type ExaAnswerResponse = {
  results?: ExaCitation[];
  costDollars?: {
    total?: number;
  };
};

export type SearchSource = {
  url: string;
  title: string;
  author?: string;
  publishedDate?: string;
};

// Keep results bounded because every later step of the turn re-sends the tool
// result. Exa highlights contain the evidence without hauling full pages into
// the model context.
const MAX_CITATIONS = 8;
const MAX_CITATION_TEXT_CHARS = 2_000;

function clampText(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[Content truncated due to length.]`;
}

export function createExaAnswerTool({
  apiKey,
  onAnswer,
}: {
  apiKey: string;
  onAnswer: (result: {
    sources: number;
    items: SearchSource[];
    costDollars: number;
    callIdx: number;
    responseText: string;
  }) => Promise<void>;
}) {
  let callIndex = 0;
  return tool({
    description: "Answer a precise question using current web sources.",
    inputSchema: jsonSchema<{ query: string }>({
      type: "object",
      properties: {
        query: {
          type: "string",
          minLength: 1,
          description: "The natural-language question.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    }),
    execute: async ({ query }) => {
      const callIdx = callIndex++;

      const response = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          query,
          numResults: MAX_CITATIONS,
          contents: {
            highlights: { maxCharacters: MAX_CITATION_TEXT_CHARS },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Exa web search failed (${response.status}): ${errorText.slice(0, 500)}`,
        );
      }

      const data = (await response.json()) as ExaAnswerResponse;
      const results = (data.results ?? []).slice(0, MAX_CITATIONS);
      const items = results
        .map((citation) => {
          const url = citation.url ?? citation.id ?? "";
          if (!url) return null;
          return {
            url,
            title: citation.title ?? citation.url ?? citation.id ?? "Untitled",
            ...(citation.author ? { author: citation.author } : {}),
            ...(citation.publishedDate
              ? { publishedDate: citation.publishedDate }
              : {}),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      await onAnswer({
        sources: items.length,
        items,
        costDollars: data.costDollars?.total ?? 0,
        callIdx,
        responseText: JSON.stringify(results),
      });

      return {
        query,
        results: results.map((citation) => ({
          url: citation.url ?? citation.id ?? "",
          title: citation.title ?? citation.url ?? citation.id ?? "Untitled",
          author: citation.author ?? null,
          publishedDate: citation.publishedDate ?? null,
          highlights: (citation.highlights ?? []).map((highlight) =>
            clampText(highlight, MAX_CITATION_TEXT_CHARS),
          ),
        })),
      };
    },
  });
}
