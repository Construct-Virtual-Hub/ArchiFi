// app/api/scrape-status/route.ts
export const dynamic = "force-dynamic";

const UPSTREAM_STATUS_BASE =
  process.env.UPSTREAM_SCRAPE_STATUS_BASE ??
  "https://tumultuously-starchlike-leta.ngrok-free.dev/webhook-test/ff8fce62-6ea3-4344-99bc-0c0075dbc2ae";

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
  try {
    const url = new URL(req.url);
    const session = url.searchParams.get("session");
    if (!session) {
      return new Response(JSON.stringify({ error: "missing session" }), {
        status: 400,
        headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
      });
    }

    const upstreamURL = `${UPSTREAM_STATUS_BASE}?session=${encodeURIComponent(session)}`;
    const upstream = await fetch(upstreamURL, { cache: "no-store", next: { revalidate: 0 } });

    const text = await upstream.text();
    const type = upstream.headers.get("content-type") ?? "application/json; charset=utf-8";
    return new Response(text, { status: upstream.status, headers: { "Content-Type": type, ...CORS } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "status proxy error" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
    });
  }
}
