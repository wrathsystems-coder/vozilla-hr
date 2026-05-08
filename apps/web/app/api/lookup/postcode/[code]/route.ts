import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { counties } from "@/lib/db/schema";
import { postcodeToCounty } from "@/lib/geo/postcode-to-county";
import { getClientIp } from "@/lib/http/client-ip";
import { enforce } from "@/lib/rate-limit";

// Public lookup used by the lead wizard step 3 to auto-fill the county
// dropdown. Static-ish data (HR doesn't redraw postcodes often) so we
// cache aggressively at the CDN.

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;

  const ip = getClientIp(request);
  const rl = await enforce({
    key: `ip:${ip}`,
    endpoint: "lookup.postcode",
    limit: 60,
    windowSec: 60,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSec) },
      },
    );
  }

  const mapping = postcodeToCounty(code);
  if (!mapping) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const [county] = await getDb()
    .select({ id: counties.id, name: counties.name, slug: counties.slug })
    .from(counties)
    .where(eq(counties.id, mapping.countyId))
    .limit(1);

  if (!county) {
    // Mapping points at a county that isn't seeded — surface to logs so
    // someone fixes the seed, but don't 500 the user (graceful degrade).
    console.error(
      `lookup.postcode: postcode ${code} maps to county ${mapping.countyId} which is not in the counties table`,
    );
    return NextResponse.json({ error: "county_not_seeded" }, { status: 404 });
  }

  return NextResponse.json(
    {
      postcode: code,
      countyId: county.id,
      countyName: county.name,
      countySlug: county.slug,
      city: mapping.city,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      },
    },
  );
}
