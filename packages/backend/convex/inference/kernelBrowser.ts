import { jsonSchema, tool } from "ai";

import { invokeKernelAction } from "../kernelClient";

export type InspectionFocus =
  "overview" | "fonts" | "links" | "metadata" | "accessibility";

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

export type BrowserInspectionPhasePayload = {
  sessionId: string;
  liveViewUrl: string;
  url: string;
  focus: InspectionFocus;
  title?: string;
  ok: boolean;
  error?: string;
  durationMs: number;
};

export function createKernelPageInspectionTool({
  onOpen,
  onResult,
}: {
  onOpen: (payload: {
    sessionId: string;
    liveViewUrl: string;
    url: string;
    focus: InspectionFocus;
  }) => Promise<void>;
  onResult: (payload: BrowserInspectionPhasePayload) => Promise<void>;
}) {
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
      const startedAt = Date.now();
      let opened:
        | { sessionId: string; liveViewUrl: string; currentUrl: string }
        | undefined;
      try {
        const openResult = await invokeKernelAction<{
          sessionId: string;
          liveViewUrl: string;
          currentUrl: string;
        }>("open-inspection", { url });
        opened = openResult.output;
        await onOpen({
          sessionId: opened.sessionId,
          liveViewUrl: opened.liveViewUrl,
          url: opened.currentUrl || url,
          focus,
        });
        const result = await invokeKernelAction<PageInspection>(
          "inspect-session",
          { sessionId: opened.sessionId, focus },
        );
        await onResult({
          sessionId: opened.sessionId,
          liveViewUrl: opened.liveViewUrl,
          url,
          focus,
          title: result.output.title,
          ok: true,
          durationMs: Date.now() - startedAt,
        });
        return result.output;
      } catch (error) {
        if (opened) {
          await onResult({
            sessionId: opened.sessionId,
            liveViewUrl: opened.liveViewUrl,
            url,
            focus,
            ok: false,
            error: "The remote browser couldn't inspect this page.",
            durationMs: Date.now() - startedAt,
          });
        }
        throw error;
      }
    },
  });
}
