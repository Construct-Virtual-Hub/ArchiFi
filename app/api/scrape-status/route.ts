// app/api/scrape-status/route.ts
export const dynamic = "force-dynamic";

// Upstream scrape-status endpoint (GET, session via query string).
const UPSTREAM_SCRAPE_STATUS =
  process.env.UPSTREAM_SCRAPE_STATUS ||
  "https://7a4d4f14fd68.ngrok-free.app/webhook/ff8fce62-6ea3-4344-99bc-0c0075dbc2ae";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session = searchParams.get("session");

  if (!session) {
    return new Response(JSON.stringify({ error: "Missing required 'session' query param" }), {
      status: 400,
      headers: {
        ...CORS,
        "Content-Type": "application/json",
      },
    });
  }

  // Build the upstream URL in the form:
  // https://7a4d4f14fd68.ngrok-free.app/webhook/ff8fce62-... ?session=SESSION_ID
  const upstreamUrl = `${UPSTREAM_SCRAPE_STATUS}?session=${encodeURIComponent(session)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await res.text();

    return new Response(text, {
      status: res.status,
      headers: {
        ...CORS,
        "Content-Type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return new Response(JSON.stringify({ error: "Upstream scrape-status timeout" }), {
        status: 504,
        headers: {
          ...CORS,
          "Content-Type": "application/json",
        },
      });
    }

    console.error("Error proxying scrape-status", err);

    return new Response(JSON.stringify({ error: "Error proxying scrape-status" }), {
      status: 502,
      headers: {
        ...CORS,
        "Content-Type": "application/json",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}
