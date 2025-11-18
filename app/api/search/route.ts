// app/api/search/route.ts
export const dynamic = "force-dynamic"; // no cache

const UPSTREAM =
  process.env.UPSTREAM_SEARCH ??
  "https://7a4d4f14fd68.ngrok-free.app/webhook/a4cfdee8-25f9-4c3f-bda6-c2571f1975c5";

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
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 20000);

    const upstreamRes = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      // Avoid Next caching
      cache: "no-store",
      next: { revalidate: 0 },
    }).catch((e) => {
      throw new Error(`Upstream fetch failed: ${e?.message || e}`);
    });

    clearTimeout(id);
    const text = await upstreamRes.text();
    const contentType =
      upstreamRes.headers.get("content-type") ?? "application/json; charset=utf-8";

    return new Response(text, {
      status: upstreamRes.status,
      headers: { "Content-Type": contentType, ...CORS },
    });
  } catch (err: any) {
    const msg = err?.message || "Proxy error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8", ...CORS },
    });
  }
}

