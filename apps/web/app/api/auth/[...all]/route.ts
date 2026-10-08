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

const consoleOrigin =
  process.env.CONSOLE_URL?.trim().replace(/\/+$/, "") ||
  (process.env.NODE_ENV === "production" ? undefined : "http://localhost:3001");

function withCors(request: Request, response: Response): Response {
  const origin = request.headers.get("origin");
  if (!origin || origin !== consoleOrigin) return response;

  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.append("Vary", "Origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function GET(request: Request) {
  return withCors(request, await auth.handler.GET(request));
}

export async function POST(request: Request) {
  return withCors(request, await auth.handler.POST(request));
}

export function OPTIONS(request: Request) {
  const response = new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        request.headers.get("access-control-request-headers") ?? "content-type",
      "Access-Control-Max-Age": "600",
    },
  });
  return withCors(request, response);
}
