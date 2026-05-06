import { describe, expect, it } from "vitest";
import { requestQuoteHref } from "@/lib/catalog/cta";

describe("requestQuoteHref", () => {
  it("emits izvor only when no slugs are provided", () => {
    expect(requestQuoteHref({ source: "header" })).toBe("/zatrazi-ponudu?izvor=header");
  });

  it("includes brand and model with HR query keys", () => {
    expect(requestQuoteHref({ brand: "audi", model: "a4", source: "detail" })).toBe(
      "/zatrazi-ponudu?marka=audi&model=a4&izvor=detail",
    );
  });

  it("supports bodyType (kategorija) without brand/model", () => {
    expect(requestQuoteHref({ bodyType: "suv", source: "category" })).toBe(
      "/zatrazi-ponudu?kategorija=suv&izvor=category",
    );
  });

  it("preserves all three when given", () => {
    const url = requestQuoteHref({
      brand: "skoda",
      model: "octavia",
      bodyType: "karavan",
      source: "brand",
    });
    expect(url).toBe("/zatrazi-ponudu?marka=skoda&model=octavia&kategorija=karavan&izvor=brand");
  });

  it("rejects slugs containing diacritics", () => {
    expect(() => requestQuoteHref({ brand: "škoda", source: "detail" })).toThrow(
      /invalid brand slug/i,
    );
  });

  it("rejects slugs with uppercase characters", () => {
    expect(() => requestQuoteHref({ brand: "Audi", source: "detail" })).toThrow(
      /invalid brand slug/i,
    );
  });

  it("rejects slugs with spaces", () => {
    expect(() => requestQuoteHref({ model: "a 4", source: "detail" })).toThrow(
      /invalid model slug/i,
    );
  });

  it("rejects slugs with leading or trailing hyphens", () => {
    expect(() => requestQuoteHref({ brand: "-audi", source: "detail" })).toThrow();
    expect(() => requestQuoteHref({ brand: "audi-", source: "detail" })).toThrow();
  });

  it("rejects empty slugs explicitly when passed", () => {
    expect(() => requestQuoteHref({ brand: "", source: "detail" })).toThrow();
  });

  it("rejects bodyType with invalid characters", () => {
    expect(() => requestQuoteHref({ bodyType: "suv/", source: "category" })).toThrow(
      /invalid bodyType slug/i,
    );
  });

  it("accepts hyphen-internal slugs (audi-a4-avant)", () => {
    expect(requestQuoteHref({ brand: "audi", model: "a4-avant", source: "detail" })).toBe(
      "/zatrazi-ponudu?marka=audi&model=a4-avant&izvor=detail",
    );
  });
});
