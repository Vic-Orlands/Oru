interface Env {
  MEDIA: R2Bucket;
  SIGNING_SECRET: string;
}

const MAX_CLOCK_SKEW_SECONDS = 30;
const MAX_URL_LIFETIME_SECONDS = 10 * 60;

function cors(request: Request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function bytesToHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function expectedSignature(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return bytesToHex(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)),
  );
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function objectKey(url: URL) {
  if (!url.pathname.startsWith("/objects/")) return null;
  const encoded = url.pathname.slice("/objects/".length);
  if (!encoded || encoded.includes("..")) return null;
  try {
    return encoded
      .split("/")
      .map((segment) => decodeURIComponent(segment))
      .join("/");
  } catch {
    return null;
  }
}

async function isAuthorized(request: Request, env: Env, key: string) {
  const url = new URL(request.url);
  const expires = Number(url.searchParams.get("expires"));
  const signature = url.searchParams.get("signature") || "";
  const now = Math.floor(Date.now() / 1000);
  if (
    !Number.isSafeInteger(expires) ||
    expires < now - MAX_CLOCK_SKEW_SECONDS ||
    expires > now + MAX_URL_LIFETIME_SECONDS
  ) {
    return false;
  }
  const contentType =
    request.method === "PUT"
      ? request.headers.get("Content-Type") || "application/octet-stream"
      : "";
  const expected = await expectedSignature(
    env.SIGNING_SECRET,
    `${request.method}\n${key}\n${expires}\n${contentType}`,
  );
  return safeEqual(signature, expected);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = cors(request);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    const key = objectKey(new URL(request.url));
    if (!key || !(await isAuthorized(request, env, key))) {
      return Response.json(
        { error: "This media link is invalid or has expired." },
        { status: 403, headers },
      );
    }

    if (request.method === "PUT") {
      if (!request.body) {
        return Response.json(
          { error: "The upload body is empty." },
          { status: 400, headers },
        );
      }
      const contentType =
        request.headers.get("Content-Type") || "application/octet-stream";
      await env.MEDIA.put(key, request.body, {
        httpMetadata: { contentType },
      });
      return new Response(null, { status: 204, headers });
    }

    if (request.method === "GET") {
      const object = await env.MEDIA.get(key);
      if (!object) {
        return Response.json(
          { error: "That media file no longer exists." },
          { status: 404, headers },
        );
      }
      const responseHeaders = new Headers(headers);
      object.writeHttpMetadata(responseHeaders);
      responseHeaders.set("Cache-Control", "private, max-age=300");
      responseHeaders.set("ETag", object.httpEtag);
      return new Response(object.body, { headers: responseHeaders });
    }

    if (request.method === "DELETE") {
      await env.MEDIA.delete(key);
      return new Response(null, { status: 204, headers });
    }

    return Response.json(
      { error: "Method not allowed." },
      {
        status: 405,
        headers: { ...headers, Allow: "GET, PUT, DELETE, OPTIONS" },
      },
    );
  },
} satisfies ExportedHandler<Env>;
