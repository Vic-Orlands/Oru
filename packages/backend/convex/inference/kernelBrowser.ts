import { jsonSchema, tool } from "ai";

import { invokeKernelAction } from "../kernelClient";

type InspectionFocus =
  | "overview"
  | "fonts"
  | "links"
  | "metadata"
  | "accessibility";

type PageInspection = {
  url: string;
  title: string;
  language: string | null;
  description: string | null;
  focus: InspectionFocus;
  text: string;
  metadata?: Record<string, string>;
  headings?: Array<{ level: string; text: string }>;
  links?: Array<{ text: string; url: string }>;
  computedFonts?: Array<{ family: string; count: number; examples: string[] }>;
  loadedFonts?: Array<{
    family: string;
    style: string;
    weight: string;
    status: string;
  }>;
  accessibility?: Array<{
    tag: string;
    role: string | null;
    name: string;
  }>;
};

export function createKernelPageInspectionTool() {
  return tool({
    description:
      "Open an exact public webpage in a real rendered browser and inspect its DOM, computed fonts, links, metadata, or accessibility surface. Use this when ordinary web search or text fetching cannot answer what the live page actually renders. Never use it for private/internal URLs.",
    inputSchema: jsonSchema<{ url: string; focus: InspectionFocus }>({
      type: "object",
      properties: {
        url: {
          type: "string",
          format: "uri",
          description: "A full public HTTPS URL.",
        },
        focus: {
          type: "string",
          enum: ["overview", "fonts", "links", "metadata", "accessibility"],
        },
      },
      required: ["url", "focus"],
      additionalProperties: false,
    }),
    execute: async ({ url, focus }) => {
      const result = await invokeKernelAction<PageInspection>("inspect-page", {
        url,
        focus,
      });
      return result.output;
    },
  });
}
