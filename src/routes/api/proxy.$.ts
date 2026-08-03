import { createFileRoute } from "@tanstack/react-router";
import { API_BASE_URL } from "@/lib/api-base";

// Same-origin proxy to the Railway backend so the browser is never subject to
// the backend's CORS configuration. Path after /api/proxy/ is forwarded as-is.
async function forward(request: Request, splat: string) {
  const incoming = new URL(request.url);
  const target = `${API_BASE_URL}/${splat}${incoming.search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", "application/json");

  const init: RequestInit = { method: request.method, headers };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(target, init);
    const body = await response.arrayBuffer();
    return new Response(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "upstream_unreachable" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}

export const Route = createFileRoute("/api/proxy/$")({
  server: {
    handlers: {
      GET: ({ request, params }) => forward(request, params._splat ?? ""),
      POST: ({ request, params }) => forward(request, params._splat ?? ""),
    },
  },
});
