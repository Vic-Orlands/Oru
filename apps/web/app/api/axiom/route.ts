import { createProxyRouteHandler } from "@axiomhq/nextjs";

import { logger } from "@/lib/axiom/server";

const ingest = createProxyRouteHandler(logger);

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ status: "forbidden" }, { status: 403 });
  }

  const body = await request.text();
  if (!body.trim()) return new Response(null, { status: 204 });

  return ingest(
    new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body,
    }),
  );
}
