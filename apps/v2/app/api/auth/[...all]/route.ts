import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

function requireEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for authentication.`);
  return value;
}

const auth = convexBetterAuthNextJs({
  convexUrl: requireEnvironmentValue("NEXT_PUBLIC_CONVEX_URL"),
  convexSiteUrl: requireEnvironmentValue("NEXT_PUBLIC_CONVEX_SITE_URL"),
});

export function GET(request: Request) {
  return auth.handler.GET(request);
}

export function POST(request: Request) {
  return auth.handler.POST(request);
}
