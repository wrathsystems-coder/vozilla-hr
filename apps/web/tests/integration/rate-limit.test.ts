import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupExpired, enforce } from "@/lib/rate-limit";
import { getDb } from "@/lib/db/client";
import { rateLimitBuckets } from "@/lib/db/schema";
import * as time from "@/lib/utils/time";

describe("rate-limit (integration)", () => {
  beforeEach(async () => {
    await getDb().delete(rateLimitBuckets);
    vi.useRealTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("first request is allowed and reports remaining=limit-1", async () => {
    const result = await enforce({
      key: "ip:1.2.3.4",
      endpoint: "lead.create",
      limit: 5,
      windowSec: 900,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.retryAfterSec).toBe(0);
  });

  it("blocks the (limit+1)-th request and reports retryAfter > 0", async () => {
    const args = { key: "ip:5.6.7.8", endpoint: "lead.create", limit: 3, windowSec: 60 };
    for (let i = 0; i < 3; i++) await enforce(args);
    const blocked = await enforce(args);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(blocked.retryAfterSec).toBeLessThanOrEqual(60);
  });

  it("resets the bucket after window expires", async () => {
    const t0 = new Date("2026-05-08T12:00:00Z");
    vi.spyOn(time, "now").mockReturnValue(t0);

    const args = { key: "ip:9.9.9.9", endpoint: "lead.create", limit: 2, windowSec: 60 };
    await enforce(args);
    await enforce(args);
    const blocked = await enforce(args);
    expect(blocked.allowed).toBe(false);

    // Jump 2 minutes — window expired.
    vi.spyOn(time, "now").mockReturnValue(new Date(t0.getTime() + 120 * 1000));
    const reset = await enforce(args);
    expect(reset.allowed).toBe(true);
    expect(reset.remaining).toBe(1);
  });

  it("different endpoints have independent counters", async () => {
    const key = "ip:11.11.11.11";
    await enforce({ key, endpoint: "lead.create", limit: 1, windowSec: 60 });
    const blockedSame = await enforce({ key, endpoint: "lead.create", limit: 1, windowSec: 60 });
    expect(blockedSame.allowed).toBe(false);

    const otherEndpoint = await enforce({
      key,
      endpoint: "gdpr.create",
      limit: 1,
      windowSec: 60,
    });
    expect(otherEndpoint.allowed).toBe(true);
  });

  it("different keys have independent counters", async () => {
    await enforce({ key: "ip:a", endpoint: "lead.create", limit: 1, windowSec: 60 });
    const blocked = await enforce({
      key: "ip:a",
      endpoint: "lead.create",
      limit: 1,
      windowSec: 60,
    });
    expect(blocked.allowed).toBe(false);

    const other = await enforce({ key: "ip:b", endpoint: "lead.create", limit: 1, windowSec: 60 });
    expect(other.allowed).toBe(true);
  });

  it("rejects non-positive limit and windowSec", async () => {
    await expect(enforce({ key: "k", endpoint: "e", limit: 0, windowSec: 60 })).rejects.toThrow(
      /limit must be > 0/,
    );
    await expect(enforce({ key: "k", endpoint: "e", limit: 5, windowSec: 0 })).rejects.toThrow(
      /windowSec must be > 0/,
    );
  });

  it("counts atomically under concurrent requests", async () => {
    const args = { key: "ip:concurrent", endpoint: "lead.create", limit: 5, windowSec: 60 };
    const results = await Promise.all(Array.from({ length: 10 }, () => enforce(args)));
    const allowed = results.filter((r) => r.allowed).length;
    const blocked = results.filter((r) => !r.allowed).length;
    expect(allowed).toBe(5);
    expect(blocked).toBe(5);
  });

  it("cleanupExpired removes only past-expired rows", async () => {
    const t0 = new Date("2026-05-08T12:00:00Z");
    vi.spyOn(time, "now").mockReturnValue(t0);
    await enforce({ key: "ip:exp1", endpoint: "lead.create", limit: 5, windowSec: 60 });
    await enforce({ key: "ip:exp2", endpoint: "lead.create", limit: 5, windowSec: 3600 });

    // 2 min later — first window expired, second still active.
    vi.spyOn(time, "now").mockReturnValue(new Date(t0.getTime() + 120 * 1000));
    const removed = await cleanupExpired();
    expect(removed).toBe(1);
  });
});
