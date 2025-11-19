import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UPSTREAM_OUTREACH =
  process.env.UPSTREAM_OUTREACH ??
  "https://7a4d4f14fd68.ngrok-free.app/webhook/97ee6a11-ebe3-4f87-a8d1-3487101ee1bd";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const upstreamRes = await fetch(UPSTREAM_OUTREACH, {
      method: "POST",
      headers: {
        "Content-Type": req.headers.get("content-type") ?? "application/json",
      },
      body: bodyText,
    });

    const upstreamBody = await upstreamRes.text();
    const contentType =
      upstreamRes.headers.get("content-type") ?? "application/json";

    return new NextResponse(upstreamBody, {
      status: upstreamRes.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": contentType,
      },
    });
  } catch (err) {
    console.error("Outreach proxy error", err);
    return NextResponse.json(
      { error: "Outreach upstream request failed" },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}


