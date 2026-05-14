import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildUnsubscribeUrl, verifyUnsubscribeSignature } from "@/lib/newsletter";

// Confines the test to the pure HMAC signing path — no DB, no env mutation
// outside the suite. PAYLOAD_SECRET is stubbed so the test is reproducible
// across machines.

const TEST_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("newsletter unsubscribe signature", () => {
  beforeEach(() => {
    vi.stubEnv("PAYLOAD_SECRET", TEST_SECRET);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("buildUnsubscribeUrl produces /odjava-newslettera?email=…&sig=…", () => {
    const url = buildUnsubscribeUrl("Ana.Anic@Example.HR", "https://vozilla.hr");
    const u = new URL(url);
    expect(u.pathname).toBe("/odjava-newslettera");
    expect(u.searchParams.get("email")).toBe("ana.anic@example.hr");
    expect(u.searchParams.get("sig")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("verifyUnsubscribeSignature accepts a freshly produced signature", () => {
    const url = buildUnsubscribeUrl("ana@example.hr", "https://vozilla.hr");
    const sig = new URL(url).searchParams.get("sig")!;
    expect(verifyUnsubscribeSignature("ana@example.hr", sig)).toBe(true);
  });

  it("normalises email casing when verifying — Ana@Example.HR matches ana@example.hr", () => {
    const url = buildUnsubscribeUrl("ana@example.hr", "https://vozilla.hr");
    const sig = new URL(url).searchParams.get("sig")!;
    expect(verifyUnsubscribeSignature("Ana@Example.HR", sig)).toBe(true);
  });

  it("rejects a signature for a different email", () => {
    const url = buildUnsubscribeUrl("ana@example.hr", "https://vozilla.hr");
    const sig = new URL(url).searchParams.get("sig")!;
    expect(verifyUnsubscribeSignature("bob@example.hr", sig)).toBe(false);
  });

  it("rejects truncated signatures (wrong length)", () => {
    const url = buildUnsubscribeUrl("ana@example.hr", "https://vozilla.hr");
    const sig = new URL(url).searchParams.get("sig")!;
    expect(verifyUnsubscribeSignature("ana@example.hr", sig.slice(0, 10))).toBe(false);
  });

  it("rejects malformed (non-hex) signatures", () => {
    expect(verifyUnsubscribeSignature("ana@example.hr", "G".repeat(64))).toBe(false);
  });

  it("throws when PAYLOAD_SECRET is missing — production must not silently sign with empty key", () => {
    vi.stubEnv("PAYLOAD_SECRET", "");
    expect(() => buildUnsubscribeUrl("ana@example.hr", "https://vozilla.hr")).toThrow(
      /PAYLOAD_SECRET/,
    );
  });

  it("rejects placeholder PAYLOAD_SECRET (XXX_…) — fresh boot guard", () => {
    vi.stubEnv("PAYLOAD_SECRET", "XXX_PAYLOAD_SECRET");
    expect(() => buildUnsubscribeUrl("ana@example.hr", "https://vozilla.hr")).toThrow(
      /PAYLOAD_SECRET/,
    );
  });
});
