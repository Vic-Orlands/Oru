"use node";

import { randomUUID } from "node:crypto";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v } from "convex/values";

import { action, internalAction } from "./_generated/server";

const MAX_MEDIA_BYTES = 20 * 1024 * 1024;
const UPLOAD_TTL_SECONDS = 5 * 60;

function optionalEnvironment(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function r2Configuration() {
  const accountId = optionalEnvironment("R2_ACCOUNT_ID");
  const accessKeyId = optionalEnvironment("R2_ACCESS_KEY_ID");
  const secretAccessKey = optionalEnvironment("R2_SECRET_ACCESS_KEY");
  const bucket = optionalEnvironment("R2_BUCKET");
  const publicUrl = optionalEnvironment("R2_PUBLIC_URL")?.replace(/\/$/, "");
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    return null;
  }
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

function safeExtension(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]{1,10})$/);
  return match?.[1] ? `.${match[1]}` : "";
}

async function signedMediaUpload(args: {
  ownerId: string;
  name: string;
  type: string;
  size: number;
}) {
  if (!/^(image|audio|video)\//.test(args.type)) {
    throw new Error("Only media files can use the CDN upload path.");
  }
  if (!Number.isFinite(args.size) || args.size <= 0 || args.size > MAX_MEDIA_BYTES) {
    throw new Error("That media file is larger than the 20 MB upload limit.");
  }

  const config = r2Configuration();
  if (!config) return null;

  const userSegment = await crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(args.ownerId))
    .then((bytes) => Buffer.from(bytes).toString("hex").slice(0, 20));
  const key = `uploads/${userSegment}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${safeExtension(args.name)}`;
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: args.type,
    }),
    { expiresIn: UPLOAD_TTL_SECONDS },
  );

  return {
    uploadUrl,
    publicUrl: `${config.publicUrl}/${key
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
  };
}

/**
 * Creates a short-lived, content-type-bound upload URL for Cloudflare R2.
 * The browser sends the bytes straight to R2, so Convex never proxies a
 * multi-megabyte media file. When R2 is not configured the caller falls back
 * to Convex storage, which keeps local development usable.
 */
export const createMediaUpload = action({
  args: {
    name: v.string(),
    type: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in before uploading media.");
    return await signedMediaUpload({ ownerId: identity.subject, ...args });
  },
});

/** Signed upload for trusted backend image-generation actions. */
export const createMediaUploadInternal = internalAction({
  args: {
    ownerId: v.string(),
    name: v.string(),
    type: v.string(),
    size: v.number(),
  },
  handler: async (_ctx, args) => await signedMediaUpload(args),
});
