import { describe, expect, it } from "vitest";
import {
  STICKY_CONFIG,
  dismissUntil,
  isDismissed,
  isExcludedPath,
} from "@/components/widgets/sticky-config";

describe("isExcludedPath", () => {
  it("excludes admin and dileri trees", () => {
    expect(isExcludedPath("/admin")).toBe(true);
    expect(isExcludedPath("/admin/lead-dispatch/17")).toBe(true);
    expect(isExcludedPath("/partneri")).toBe(true);
    expect(isExcludedPath("/partneri/login")).toBe(true);
  });

  it("excludes the wizard, tracker, GDPR form, and legal pages", () => {
    expect(isExcludedPath("/zatrazi-ponudu")).toBe(true);
    expect(isExcludedPath("/zatrazi-ponudu/uspjeh")).toBe(true);
    expect(isExcludedPath("/upit/abc123")).toBe(true);
    expect(isExcludedPath("/gdpr-zahtjev")).toBe(true);
    expect(isExcludedPath("/opci-uvjeti")).toBe(true);
    expect(isExcludedPath("/politika-privatnosti")).toBe(true);
    expect(isExcludedPath("/politika-kolacica")).toBe(true);
    expect(isExcludedPath("/impressum")).toBe(true);
  });

  it("permits typical public pages", () => {
    expect(isExcludedPath("/")).toBe(false);
    expect(isExcludedPath("/nova-vozila")).toBe(false);
    expect(isExcludedPath("/nova-vozila/marke/audi/a4")).toBe(false);
    expect(isExcludedPath("/recenzije")).toBe(false);
  });

  it("does not match a path that just shares a prefix without segment boundary", () => {
    // "/upitnik" must NOT match "/upit"
    expect(isExcludedPath("/upitnik")).toBe(false);
  });
});

describe("isDismissed + dismissUntil", () => {
  const now = 1_700_000_000_000;

  it("returns false when no value stored", () => {
    expect(isDismissed(now, null)).toBe(false);
  });

  it("returns false for non-numeric stored values", () => {
    expect(isDismissed(now, "not-a-number")).toBe(false);
  });

  it("returns true while the dismissal is still in the future", () => {
    const until = dismissUntil(now);
    expect(isDismissed(now + 60_000, String(until))).toBe(true);
  });

  it("returns false once the dismissal expires", () => {
    const until = dismissUntil(now);
    const wellAfter = until + 1_000;
    expect(isDismissed(wellAfter, String(until))).toBe(false);
  });

  it("dismissUntil adds exactly 24h", () => {
    const delta = dismissUntil(now) - now;
    expect(delta).toBe(STICKY_CONFIG.dismissForHours * 60 * 60 * 1000);
  });
});
