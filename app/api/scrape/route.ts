// app/api/scrape/route.ts
export const dynamic = "force-dynamic";

const UPSTREAM_SCRAPE =
  process.env.UPSTREAM_SCRAPE ??
  "https://tumultuously-starchlike-leta.ngrok-free.dev/webhook/50546cbf-1229-4f96-a8a8-27ed62c0381e";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new Response(null, { headers: CORS });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 20000);

    const upstream = await fetch(UPSTREAM_SCRAPE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
      cache: "no-store",
      next: { revalidate: 0 },
    });

    clearTimeout(to);
    const text = await upstream.text();
    const type = upstream.headers.get("content-type") ?? "application/json; charset=utf-8";
    return new Response(text, { status: upstream.status, headers: { "Content-Type": type, ...CORS } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "scrape proxy error" }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
    });
  }
}

