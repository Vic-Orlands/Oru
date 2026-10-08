import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { mcpCallTool, mcpListTools, type McpToolDef } from "./inference/mcp";
import { resolveMcpServerConfigs } from "./inference/mcpResolve";

function emailServerScore(name: string): number {
  const normalized = name.toLowerCase();
  if (normalized.includes("gmail")) return 3;
  if (normalized.includes("outlook")) return 2;
  if (normalized.includes("mail") || normalized.includes("email")) return 1;
  return 0;
}

function sendToolScore(tool: McpToolDef): number {
  const text = `${tool.name} ${tool.description ?? ""}`.toLowerCase();
  if (!text.includes("send")) return 0;
  if (!text.includes("email") && !text.includes("mail")) return 0;
  if (text.includes("draft") && !text.includes("send draft")) return 0;
  return 2;
}

function firstProperty(
  properties: Record<string, unknown>,
  aliases: string[],
): string | undefined {
  return aliases.find((alias) => alias in properties);
}

function sendArguments(
  tool: McpToolDef,
  draft: { to: string; subject: string; preview: string },
): Record<string, unknown> {
  const schema = tool.inputSchema ?? {};
  const properties =
    schema.properties && typeof schema.properties === "object"
      ? (schema.properties as Record<string, unknown>)
      : {};
  const required = Array.isArray(schema.required)
    ? schema.required.filter((item): item is string => typeof item === "string")
    : [];
  const recipientKey = firstProperty(properties, [
    "recipient_email",
    "to",
    "recipient",
    "to_email",
    "email",
  ]);
  const subjectKey = firstProperty(properties, ["subject", "title"]);
  const bodyKey = firstProperty(properties, [
    "body",
    "message",
    "content",
    "text",
    "body_text",
  ]);
  if (!recipientKey || !subjectKey || !bodyKey) {
    throw new Error(
      "The connected email provider exposes a send tool, but its required fields are not supported yet.",
    );
  }
  const recipientSchema = properties[recipientKey] as
    | { type?: string }
    | undefined;
  const args: Record<string, unknown> = {
    [recipientKey]: recipientSchema?.type === "array" ? [draft.to] : draft.to,
    [subjectKey]: draft.subject,
    [bodyKey]: draft.preview,
  };
  for (const key of ["is_html", "html"]) {
    if (key in properties) args[key] = false;
  }
  const unsupported = required.filter((key) => !(key in args));
  if (unsupported.length > 0) {
    throw new Error(
      `The email provider requires unsupported fields: ${unsupported.join(", ")}.`,
    );
  }
  return args;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export const approveAndSend = action({
  args: { approvalId: v.id("approvals") },
  returns: v.object({ provider: v.string(), tool: v.string() }),
  handler: async (ctx, { approvalId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in before approving a send.");
    const userId = identity.subject;
    const context = await ctx.runQuery(internal.leads.getApprovalDispatchContext, {
      approvalId,
      userId,
    });
    if (!context) throw new Error("Approval not found.");
    if (context.approval.status !== "pending") {
      throw new Error("This draft is no longer waiting for approval.");
    }

    const configs = await resolveMcpServerConfigs(context.servers, {
      persistRefreshedTokens: async (tokens) => {
        await ctx.runMutation(internal.mcpOAuthFlow.updateOAuthTokens, {
          serverId: tokens.serverId as Id<"mcpServers">,
          accessTokenCipher: tokens.accessTokenCipher,
          refreshTokenCipher: tokens.refreshTokenCipher,
          expiresAt: tokens.expiresAt,
        });
      },
      onAuthExpired: async ({ serverId, reason }) => {
        await ctx.runMutation(internal.mcpServers.markAuthExpired, {
          id: serverId as Id<"mcpServers">,
          reason,
          at: Date.now(),
        });
      },
    });
    const server = configs
      .filter((candidate) => emailServerScore(candidate.name) > 0)
      .sort((a, b) => emailServerScore(b.name) - emailServerScore(a.name))[0];
    if (!server) {
      throw new Error("Connect Gmail or Outlook before approving this email.");
    }
    const tools = await mcpListTools(server.url, server.headers);
    const emailTool = tools
      .filter((tool) => sendToolScore(tool) > 0)
      .sort((a, b) => sendToolScore(b) - sendToolScore(a))[0];
    if (!emailTool) {
      throw new Error(`${server.name} does not expose an email sending tool.`);
    }

    await ctx.runMutation(internal.leads.beginApprovalDispatch, {
      approvalId,
      userId,
    });
    try {
      const result = await mcpCallTool(
        server.url,
        server.headers,
        emailTool.name,
        sendArguments(emailTool, context.approval),
      );
      if (result.isError) throw new Error(result.text);
      const responseHash = await sha256(result.text);
      await ctx.runMutation(internal.leads.finalizeApprovalDispatch, {
        approvalId,
        userId,
        ok: true,
        provider: server.name,
        providerTool: emailTool.name,
        providerResponseHash: responseHash,
      });
      return { provider: server.name, tool: emailTool.name };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The provider rejected the send.";
      await ctx.runMutation(internal.leads.finalizeApprovalDispatch, {
        approvalId,
        userId,
        ok: false,
        provider: server.name,
        providerTool: emailTool.name,
        error: message,
      });
      throw new Error(`Email was not sent: ${message}`);
    }
  },
});
