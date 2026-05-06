import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { siteUrl } from "@/lib/seo/site-url";

describe("siteUrl", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    }
  });

  it("falls back to localhost when env unset", () => {
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("falls back to localhost when env empty string", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "";
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("returns https URL as-is", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://vozilla.hr";
    expect(siteUrl()).toBe("https://vozilla.hr");
  });

  it("strips trailing slashes", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://vozilla.hr/";
    expect(siteUrl()).toBe("https://vozilla.hr");

    process.env.NEXT_PUBLIC_SITE_URL = "https://vozilla.hr///";
    expect(siteUrl()).toBe("https://vozilla.hr");
  });

  it("accepts http for local / preview environments", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://staging.vozilla.hr";
    expect(siteUrl()).toBe("http://staging.vozilla.hr");
  });

  it("throws when scheme is missing", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "vozilla.hr";
    expect(() => siteUrl()).toThrow(/mora počinjati s http:\/\/ ili https:\/\//);
  });

  it("throws on protocol-relative URLs", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "//vozilla.hr";
    expect(() => siteUrl()).toThrow(/mora počinjati s http:\/\/ ili https:\/\//);
  });

  it("throws on non-http(s) schemes", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "ftp://vozilla.hr";
    expect(() => siteUrl()).toThrow(/mora počinjati s http:\/\/ ili https:\/\//);
  });
});
