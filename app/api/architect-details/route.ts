export const dynamic = "force-dynamic";

const DETAILS_BASE =
  process.env.UPSTREAM_ARCHITECT_DETAILS_BASE ||
  "https://tumultuously-starchlike-leta.ngrok-free.dev/webhook/a4cfdee8-25f9-4c3f-bda6-c2571f1975c5?id="; // e.g. https://.../webhook/architect?id=

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() { return new Response(null, { headers: CORS }); }

export async function GET(req: Request) {
  try {
    if (!DETAILS_BASE) {
      return new Response(JSON.stringify({ error: "details endpoint not configured" }), {
        status: 501, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" }
      });
    }
    const url = new URL(req.url);
    const id = (url.searchParams.get("id") || "").trim();
    if (!id) {
      return new Response(JSON.stringify({ error: "missing id" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" }
      });
    }
    const upstream = await fetch(`${DETAILS_BASE}${encodeURIComponent(id)}`, { cache: "no-store", next: { revalidate: 0 } });
    const text = await upstream.text();
    const type = upstream.headers.get("content-type") ?? "application/json; charset=utf-8";
    return new Response(text, { status: upstream.status, headers: { ...CORS, "Content-Type": type } });
  } catch (e:any) {
    return new Response(JSON.stringify({ error: e?.message || "details proxy error" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" }
    });
  }
}

