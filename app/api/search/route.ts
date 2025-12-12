// app/api/search/route.ts
import { filterByRadius } from "../../../lib/geo/nominatim";

export const dynamic = "force-dynamic"; // no cache

const UPSTREAM =
  process.env.UPSTREAM_SEARCH ??
  "https://impavidly-arguable-cicely.ngrok-free.dev/webhook/a4cfdee8-25f9-4c3f-bda6-c2571f1975c5";

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
    
    // Extract radius filtering params (optional)
    const centerLat = typeof payload.lat === "number" ? payload.lat : null;
    const centerLng = typeof payload.lng === "number" ? payload.lng : null;
    const radiusKm = typeof payload.radius === "number" && payload.radius > 0 ? payload.radius : null;
    
    // Remove radius params from upstream payload (they're for our filtering only)
    const upstreamPayload = { ...payload };
    delete upstreamPayload.lat;
    delete upstreamPayload.lng;
    delete upstreamPayload.radius;
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 20000);

    const upstreamRes = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upstreamPayload),
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

    // If radius filtering is requested, parse and filter the response
    if (centerLat !== null && centerLng !== null && radiusKm !== null) {
      try {
        const data = JSON.parse(text);
        const items = Array.isArray(data) ? data : data.items ?? [];
        
        // Filter items by radius
        const filtered = filterByRadius(items, centerLat, centerLng, radiusKm);
        
        // Return filtered results in the same format as upstream
        const filteredData = Array.isArray(data)
          ? filtered
          : { ...data, items: filtered };
        
        return new Response(JSON.stringify(filteredData), {
          status: upstreamRes.status,
          headers: { "Content-Type": contentType, ...CORS },
        });
      } catch (parseError) {
        // If parsing fails, return original response
        console.error("Failed to parse upstream response for radius filtering:", parseError);
        return new Response(text, {
          status: upstreamRes.status,
          headers: { "Content-Type": contentType, ...CORS },
        });
      }
    }

    // No radius filtering, return original response
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

