import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

const auth = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud",
  convexSiteUrl:
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL || "https://placeholder.convex.site",
});

export const GET = auth.handler.GET;
export const POST = auth.handler.POST;
