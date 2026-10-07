import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const auth = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud",
  convexSiteUrl:
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL || "https://placeholder.convex.site",
});

function demoSession(request: Request): Response | null {
  if (!demo) return null;
  const path = new URL(request.url).pathname;
  if (!path.endsWith("/get-session")) return null;
  return Response.json(null);
}

export function GET(request: Request) {
  return demoSession(request) ?? auth.handler.GET(request);
}

export function POST(request: Request) {
  return demoSession(request) ?? auth.handler.POST(request);
}
