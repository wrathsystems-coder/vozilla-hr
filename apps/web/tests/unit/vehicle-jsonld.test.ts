import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { vehicleJsonLd } from "@/lib/seo/vehicle-jsonld";
import type { ModelWithRefs } from "@/lib/catalog/fetch";

const baseModel: ModelWithRefs = {
  id: 1,
  slug: "a4",
  name: "A4",
  brand: { id: 10, slug: "audi", name: "Audi", updatedAt: "", createdAt: "" },
  body_type: {
    id: 20,
    slug: "limuzina",
    name: "Limuzina",
    updatedAt: "",
    createdAt: "",
  },
  updatedAt: "",
  createdAt: "",
};

const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

describe("vehicleJsonLd", () => {
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

  it("emits required Vehicle fields with absolute URL", () => {
    const ld = vehicleJsonLd(baseModel);
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("Vehicle");
    expect(ld.name).toBe("Audi A4");
    expect(ld.url).toBe("https://vozilla.hr/nova-vozila/marke/audi/a4");
    expect(ld.brand).toEqual({ "@type": "Brand", name: "Audi" });
    expect(ld.model).toBe("A4");
    expect(ld.bodyType).toBe("Limuzina");
  });

  it("omits optional fields when missing", () => {
    const ld = vehicleJsonLd(baseModel);
    expect(ld.modelDate).toBeUndefined();
    expect(ld.fuelType).toBeUndefined();
    expect(ld.offers).toBeUndefined();
  });

  it("includes modelDate from year_from", () => {
    const ld = vehicleJsonLd({ ...baseModel, year_from: 2023 });
    expect(ld.modelDate).toBe("2023");
  });

  it("translates fuel_types to Schema.org English labels", () => {
    const ld = vehicleJsonLd({
      ...baseModel,
      fuel_types: ["benzin", "hibrid", "ev"],
    });
    expect(ld.fuelType).toBe("Petrol, Hybrid, Electric");
  });

  it("emits an Offer when base_price_eur is set", () => {
    const ld = vehicleJsonLd({ ...baseModel, base_price_eur: 40000 });
    expect(ld.offers).toEqual({
      "@type": "Offer",
      price: 40000,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: "https://vozilla.hr/nova-vozila/marke/audi/a4",
    });
  });

  it("does not emit Offer when base_price_eur is null", () => {
    const ld = vehicleJsonLd({ ...baseModel, base_price_eur: null });
    expect(ld.offers).toBeUndefined();
  });
});
