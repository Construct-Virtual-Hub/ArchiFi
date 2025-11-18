// app/api/scrape-status/route.ts
export const dynamic = "force-dynamic";

// NEW: full upstream endpoint that expects ?session=...
const UPSTREAM_SCRAPE_STATUS =
  process.env.UPSTREAM_SCRAPE_STATUS ||
  "https://7a4d4f14fd68.ngrok-free.app/webhook/50546cbf-1229-4f96-a8a8-27ed62c0381e";

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
    const session = (url.searchParams.get("session") || "").trim();
    if (!session) {
      return new Response(JSON.stringify({ error: "missing session" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
      });
    }

    const upstreamURL = `${UPSTREAM_SCRAPE_STATUS}?session=${encodeURIComponent(session)}`;
    const upstream = await fetch(upstreamURL, { cache: "no-store", next: { revalidate: 0 } });
    const text = await upstream.text();
    const type = upstream.headers.get("content-type") ?? "application/json; charset=utf-8";
    return new Response(text, { status: upstream.status, headers: { ...CORS, "Content-Type": type } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "status proxy error" }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
    });
  }
}
