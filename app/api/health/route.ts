// app/api/health/route.ts
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    routes: ["/api/search","/api/scrape","/api/scrape-status"],
    env: {
      UPSTREAM_SCRAPE: !!process.env.UPSTREAM_SCRAPE,
      UPSTREAM_SCRAPE_STATUS_BASE: !!process.env.UPSTREAM_SCRAPE_STATUS_BASE,
    },
  });
}

