export type BuiltInCatalogModel = {
  slug: string;
  displayName: string;
  company: string;
  modelName: string;
  category: "Budget" | "Heavy";
  capabilities: {
    vision: boolean;
    files: boolean;
    audio: boolean;
    reasoning: boolean;
    tools: boolean;
    imageOutput: boolean;
    contextLength: number;
  };
};

/**
 * A small, opinionated catalog available without database setup.
 *
 * This is intentionally a useful shortlist rather than a mirror of every
 * OpenRouter model. Slugs and capabilities are checked against OpenRouter's
 * live model/endpoints API before they land here.
 */
export const BUILT_IN_CATALOG_MODELS: readonly BuiltInCatalogModel[] = [
  {
    slug: "google/gemini-3-flash-preview",
    displayName: "Gemini Flash",
    company: "Google",
    modelName: "Gemini 3 Flash Preview",
    category: "Budget",
    capabilities: {
      vision: true,
      files: true,
      audio: true,
      reasoning: true,
      tools: true,
      imageOutput: false,
      contextLength: 1_048_576,
    },
  },
  {
    slug: "deepseek/deepseek-v3.2",
    displayName: "DeepSeek",
    company: "DeepSeek",
    modelName: "DeepSeek V3.2",
    category: "Budget",
    capabilities: {
      vision: false,
      files: false,
      audio: false,
      reasoning: true,
      tools: true,
      imageOutput: false,
      contextLength: 163_840,
    },
  },
  {
    slug: "openai/gpt-5.4",
    displayName: "GPT",
    company: "OpenAI",
    modelName: "GPT-5.4",
    category: "Heavy",
    capabilities: {
      vision: true,
      files: true,
      audio: false,
      reasoning: true,
      tools: true,
      imageOutput: false,
      contextLength: 1_050_000,
    },
  },
  {
    slug: "anthropic/claude-sonnet-4.6",
    displayName: "Claude",
    company: "Anthropic",
    modelName: "Claude Sonnet 4.6",
    category: "Heavy",
    capabilities: {
      vision: true,
      files: true,
      audio: false,
      reasoning: true,
      tools: true,
      imageOutput: false,
      contextLength: 1_000_000,
    },
  },
  {
    slug: "google/gemini-3.1-pro-preview",
    displayName: "Gemini Pro",
    company: "Google",
    modelName: "Gemini 3.1 Pro Preview",
    category: "Heavy",
    capabilities: {
      vision: true,
      files: true,
      audio: true,
      reasoning: true,
      tools: true,
      imageOutput: false,
      contextLength: 1_048_576,
    },
  },
];

export function builtInCatalogModel(
  slug: string | undefined,
): BuiltInCatalogModel | null {
  if (!slug) return null;
  return BUILT_IN_CATALOG_MODELS.find((model) => model.slug === slug) ?? null;
}
