"use node";

import { createHmac, createHash, randomUUID } from "node:crypto";

import { ConvexError, v } from "convex/values";

import { action, internalAction } from "./_generated/server";

const MAX_ASSET_BYTES = 20 * 1024 * 1024;
const URL_TTL_SECONDS = 5 * 60;

function requiredEnvironment(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function configuration() {
  return {
    gatewayUrl: requiredEnvironment("R2_GATEWAY_URL").replace(/\/$/, ""),
    secret: requiredEnvironment("R2_GATEWAY_SECRET"),
  };
}

function safeExtension(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]{1,10})$/);
  return match?.[1] ? `.${match[1]}` : "";
}

function encodedKey(key: string) {
  return key.split("/").map(encodeURIComponent).join("/");
}

function signedUrl({
  method,
  key,
  type = "",
}: {
  method: "GET" | "PUT" | "DELETE";
  key: string;
  type?: string;
}) {
  const config = configuration();
  const expires = Math.floor(Date.now() / 1000) + URL_TTL_SECONDS;
  const signature = createHmac("sha256", config.secret)
    .update(`${method}\n${key}\n${expires}\n${method === "PUT" ? type : ""}`)
    .digest("hex");
  return `${config.gatewayUrl}/objects/${encodedKey(key)}?expires=${expires}&signature=${signature}`;
}

function createObjectKey(ownerId: string, name: string) {
  const owner = ownerSegment(ownerId);
  return `uploads/${owner}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${safeExtension(name)}`;
}

function ownerSegment(ownerId: string) {
  return createHash("sha256").update(ownerId).digest("hex").slice(0, 20);
}

function validateUpload(size: number, type: string) {
  if (!Number.isFinite(size) || size <= 0 || size > MAX_ASSET_BYTES) {
    throw new ConvexError("That file is larger than the 20 MB upload limit.");
  }
  if (!type.trim()) {
    throw new ConvexError("That file does not have a recognizable type.");
  }
}

function createUpload(args: {
  ownerId: string;
  name: string;
  type: string;
  size: number;
}) {
  validateUpload(args.size, args.type);
  const key = createObjectKey(args.ownerId, args.name);
  return {
    key,
    uploadUrl: signedUrl({ method: "PUT", key, type: args.type }),
  };
}

/** Creates a short-lived upload URL into the private R2 bucket. */
export const createMediaUpload = action({
  args: {
    name: v.string(),
    type: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Sign in before uploading a file.");
    return createUpload({ ownerId: identity.tokenIdentifier, ...args });
  },
});

/** Creates a short-lived read URL. The bucket itself remains private. */
export const createMediaDownload = action({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Sign in to view this file.");
    const ownedPrefixes = [identity.tokenIdentifier, identity.subject].map(
      (ownerId) => `uploads/${ownerSegment(ownerId)}/`,
    );
    if (!ownedPrefixes.some((prefix) => key.startsWith(prefix))) {
      throw new ConvexError("You do not have access to this file.");
    }
    return { url: signedUrl({ method: "GET", key }) };
  },
});

/** Signed URLs for trusted backend image-generation and migration actions. */
export const createMediaUploadInternal = internalAction({
  args: {
    ownerId: v.string(),
    name: v.string(),
    type: v.string(),
    size: v.number(),
  },
  handler: async (_ctx, args) => createUpload(args),
});

export const createMediaDownloadInternal = internalAction({
  args: { key: v.string() },
  handler: async (_ctx, { key }) => ({
    url: signedUrl({ method: "GET", key }),
  }),
});

export const deleteMediaInternal = internalAction({
  args: { key: v.string() },
  handler: async (_ctx, { key }) => {
    const response = await fetch(signedUrl({ method: "DELETE", key }), {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Private media deletion failed (${response.status}).`);
    }
  },
});
