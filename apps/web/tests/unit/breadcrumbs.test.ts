import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

describe("breadcrumbsJsonLd", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://vozilla.hr";
  });
  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    }
  });

  it("emits a Schema.org BreadcrumbList with positional ListItems", () => {
    const ld = breadcrumbsJsonLd([
      { name: "Početna", href: "/" },
      { name: "Nova vozila", href: "/nova-vozila" },
      { name: "Audi" },
    ]);

    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("BreadcrumbList");
    const items = ld.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(3);
    expect(items[0].position).toBe(1);
    expect(items[1].position).toBe(2);
    expect(items[2].position).toBe(3);
  });

  it("joins relative paths with siteUrl()", () => {
    const ld = breadcrumbsJsonLd([{ name: "Audi", href: "/nova-vozila/marke/audi" }]);
    const items = ld.itemListElement as Array<Record<string, unknown>>;
    expect(items[0].item).toBe("https://vozilla.hr/nova-vozila/marke/audi");
  });

  it("preserves absolute URLs as-is", () => {
    const ld = breadcrumbsJsonLd([{ name: "External", href: "https://example.com/a" }]);
    const items = ld.itemListElement as Array<Record<string, unknown>>;
    expect(items[0].item).toBe("https://example.com/a");
  });

  it("omits the item URL when href is missing (current page)", () => {
    const ld = breadcrumbsJsonLd([{ name: "Audi" }]);
    const items = ld.itemListElement as Array<Record<string, unknown>>;
    expect(items[0].item).toBeUndefined();
    expect(items[0].name).toBe("Audi");
  });

  it("returns an empty list when given no items", () => {
    const ld = breadcrumbsJsonLd([]);
    expect(ld.itemListElement).toEqual([]);
  });

  it("strips trailing slashes from siteUrl when joining (no double slash)", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://vozilla.hr/";
    const ld = breadcrumbsJsonLd([{ name: "Audi", href: "/audi" }]);
    const items = ld.itemListElement as Array<Record<string, unknown>>;
    expect(items[0].item).toBe("https://vozilla.hr/audi");
  });
});
