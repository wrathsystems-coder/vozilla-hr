import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  consumeToken,
  issueToken,
  markUsed,
  revokeTokensFor,
  validateToken,
} from "@/lib/magic-link";
import { getDb } from "@/lib/db/client";
import { magicLinkTokens } from "@/lib/db/schema";
import * as time from "@/lib/utils/time";

// Hits the dev Postgres in docker-compose. CI / local dev both rely on
// `pnpm dev:db` (or `docker compose up -d`) being up before `pnpm test`.

describe("magic-link tokens (integration)", () => {
  beforeAll(() => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set for integration tests (load via tests/setup.ts).");
    }
  });

  beforeEach(async () => {
    await getDb().delete(magicLinkTokens);
    vi.useRealTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("issueToken returns a 64-char hex token and stores the row", async () => {
    const result = await issueToken({
      purpose: "lead_tracker",
      entityType: "lead_request",
      entityId: 42,
      ttlHours: 24 * 30,
    });

    expect(result.token).toMatch(/^[0-9a-f]{64}$/);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());

    const validated = await validateToken(result.token, "lead_tracker");
    expect(validated.valid).toBe(true);
    if (validated.valid) {
      expect(validated.entityType).toBe("lead_request");
      expect(validated.entityId).toBe("42");
      expect(validated.usedAt).toBeNull();
    }
  });

  it("issueToken rejects non-positive ttlHours", async () => {
    await expect(
      issueToken({
        purpose: "lead_tracker",
        entityType: "lead_request",
        entityId: 1,
        ttlHours: 0,
      }),
    ).rejects.toThrow(/ttlHours must be > 0/);
  });

  it("validateToken returns reason='not_found' for unknown token", async () => {
    const result = await validateToken("a".repeat(64), "lead_tracker");
    expect(result).toEqual({ valid: false, reason: "not_found" });
  });

  it("validateToken returns reason='wrong_purpose' for purpose mismatch", async () => {
    const { token } = await issueToken({
      purpose: "lead_tracker",
      entityType: "lead_request",
      entityId: 7,
      ttlHours: 24,
    });
    const result = await validateToken(token, "password_reset");
    expect(result).toEqual({ valid: false, reason: "wrong_purpose" });
  });

  it("validateToken returns reason='expired' once past expiresAt", async () => {
    // Issue with 1h TTL at t=0, then advance JS clock past expiry.
    const baseTime = new Date("2026-05-08T12:00:00Z");
    vi.spyOn(time, "now").mockReturnValue(baseTime);

    const { token } = await issueToken({
      purpose: "lead_tracker",
      entityType: "lead_request",
      entityId: 9,
      ttlHours: 1,
    });

    // Jump to 2 hours later — token is now expired.
    vi.spyOn(time, "now").mockReturnValue(new Date(baseTime.getTime() + 2 * 60 * 60 * 1000));

    const result = await validateToken(token, "lead_tracker");
    expect(result).toEqual({ valid: false, reason: "expired" });
  });

  it("markUsed sets usedAt; validateToken still passes (multi-use semantics)", async () => {
    const { token } = await issueToken({
      purpose: "lead_tracker",
      entityType: "lead_request",
      entityId: 11,
      ttlHours: 24,
    });

    await markUsed(token);

    const result = await validateToken(token, "lead_tracker");
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.usedAt).toBeInstanceOf(Date);
    }
  });

  it("consumeToken atomically marks used and rejects replay", async () => {
    const { token } = await issueToken({
      purpose: "password_reset",
      entityType: "dealer",
      entityId: 3,
      ttlHours: 1,
    });

    const first = await consumeToken(token, "password_reset");
    expect(first.valid).toBe(true);
    if (first.valid) {
      expect(first.entityId).toBe("3");
    }

    const replay = await consumeToken(token, "password_reset");
    expect(replay).toEqual({ valid: false, reason: "already_used" });
  });

  it("consumeToken rejects expired tokens without leaving usedAt set", async () => {
    const baseTime = new Date("2026-05-08T12:00:00Z");
    vi.spyOn(time, "now").mockReturnValue(baseTime);

    const { token } = await issueToken({
      purpose: "password_reset",
      entityType: "dealer",
      entityId: 5,
      ttlHours: 1,
    });

    vi.spyOn(time, "now").mockReturnValue(new Date(baseTime.getTime() + 2 * 60 * 60 * 1000));

    const result = await consumeToken(token, "password_reset");
    expect(result).toEqual({ valid: false, reason: "expired" });

    // The expired-rollback should leave usedAt null so a re-issued window
    // (e.g. clock skew correction) doesn't appear "already used".
    const validated = await validateToken(token, "password_reset");
    expect(validated.valid).toBe(false);
    if (!validated.valid) {
      expect(validated.reason).toBe("expired");
    }
  });

  it("revokeTokensFor invalidates every fresh token tied to (type, id)", async () => {
    await issueToken({
      purpose: "lead_tracker",
      entityType: "lead_request",
      entityId: 99,
      ttlHours: 24 * 30,
    });
    await issueToken({
      purpose: "draft_resume",
      entityType: "lead_request",
      entityId: 99,
      ttlHours: 24 * 7,
    });
    // Sibling token for a different lead — must NOT be revoked.
    const survivor = await issueToken({
      purpose: "lead_tracker",
      entityType: "lead_request",
      entityId: 100,
      ttlHours: 24 * 30,
    });

    const count = await revokeTokensFor("lead_request", 99);
    expect(count).toBe(2);

    const survivorCheck = await validateToken(survivor.token, "lead_tracker");
    expect(survivorCheck.valid).toBe(true);
    if (survivorCheck.valid) {
      expect(survivorCheck.usedAt).toBeNull();
    }
  });
});
