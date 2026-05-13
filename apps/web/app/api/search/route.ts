import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/http/client-ip";
import { enforce as rateLimit } from "@/lib/rate-limit";
import { search, MIN_QUERY_LENGTH } from "@/lib/search";

/**
 * GET /api/search?q=...
 *
 * Backs the header SearchOverlay live-search. Rate-limited per IP because
 * the overlay debounces but a misbehaving client could still spam this
 * with every keystroke.
 */

export async function GET(req: Request): Promise<NextResponse> {
  const ip = getClientIp(req);
  const rate = await rateLimit({
    key: `ip:${ip}`,
    endpoint: "search",
    limit: 60,
    windowSec: 60,
  });
  if (!rate.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({
      q,
      byGroup: { brands: [], models: [], reviews: [], articles: [], used_cars: [] },
      total: 0,
    });
  }

  const results = await search(q, 5);
  return NextResponse.json(results, {
    // Short edge cache: identical queries within a minute share a response.
    headers: { "Cache-Control": "public, max-age=60, s-maxage=60" },
  });
}
