import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type NextRequest } from "next/server";
import { GET } from "@/app/api/lookup/postcode/[code]/route";
import { getDb } from "@/lib/db/client";
import { counties, rateLimitBuckets } from "@/lib/db/schema";

function makeRequest(code: string, ip = "10.0.0.1"): NextRequest {
  // NextRequest extends Request — for unit-style invocation we just need the
  // headers (for getClientIp) and a working URL.
  return new Request(`http://localhost/api/lookup/postcode/${code}`, {
    headers: { "x-forwarded-for": ip },
  }) as unknown as NextRequest;
}

function makeContext(code: string) {
  return { params: Promise.resolve({ code }) };
}

describe("GET /api/lookup/postcode/[code] (integration)", () => {
  beforeAll(async () => {
    // Make the test self-sufficient even on a freshly-migrated DB. Upserts
    // on slug — idempotent if Sprint 1 seed already ran.
    await getDb()
      .insert(counties)
      .values([
        { slug: "grad-zagreb", name: "Grad Zagreb", sortOrder: 21 },
        { slug: "splitsko-dalmatinska", name: "Splitsko-dalmatinska županija", sortOrder: 17 },
      ])
      .onConflictDoNothing({ target: counties.slug });
  });

  beforeEach(async () => {
    // Wipe rate-limit buckets so a previous test's "60 hits" doesn't 429 us.
    await getDb().delete(rateLimitBuckets);
  });

  it("returns 200 + county data for a valid Zagreb postcode", async () => {
    const res = await GET(makeRequest("10000"), makeContext("10000"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      postcode: "10000",
      countyName: "Grad Zagreb",
      countySlug: "grad-zagreb",
      city: "Zagreb",
    });
    expect(typeof body.countyId).toBe("number");
  });

  it("returns 200 + Split data for 21000", async () => {
    const res = await GET(makeRequest("21000"), makeContext("21000"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.city).toBe("Split");
    expect(body.countyName).toContain("Split");
  });

  it("returns 404 for unknown 5-digit prefix", async () => {
    const res = await GET(makeRequest("99999"), makeContext("99999"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("not_found");
  });

  it("returns 404 for malformed postcode", async () => {
    const res = await GET(makeRequest("abcde"), makeContext("abcde"));
    expect(res.status).toBe(404);
  });

  it("sets long Cache-Control on success", async () => {
    const res = await GET(makeRequest("10000"), makeContext("10000"));
    const cc = res.headers.get("Cache-Control");
    expect(cc).toMatch(/s-maxage=86400/);
    expect(cc).toMatch(/public/);
  });

  it("rate-limits at 60/min/IP and emits Retry-After", async () => {
    const ip = "10.0.0.99";
    for (let i = 0; i < 60; i++) {
      const ok = await GET(makeRequest("10000", ip), makeContext("10000"));
      expect(ok.status).toBe(200);
    }
    const blocked = await GET(makeRequest("10000", ip), makeContext("10000"));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toMatch(/^\d+$/);
  });
});
