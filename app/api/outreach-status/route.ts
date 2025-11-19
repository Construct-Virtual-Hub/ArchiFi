import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UPSTREAM_OUTREACH_STATUS =
  process.env.UPSTREAM_OUTREACH_STATUS ??
  "https://7a4d4f14fd68.ngrok-free.app/webhook/3c3c9a81-6786-4243-9c91-a803fba4da37";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session_id" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  try {
    const upstreamRes = await fetch(
      `${UPSTREAM_OUTREACH_STATUS}?session_id=${encodeURIComponent(sessionId)}`,
      { method: "GET" },
    );

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
    console.error("Outreach-status proxy error", err);
    return NextResponse.json(
      { error: "Outreach status upstream request failed" },
      { status: 502, headers: CORS_HEADERS },
    );
  }
}


