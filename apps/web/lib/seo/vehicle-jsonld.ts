// Schema.org Vehicle JSON-LD builder. Renders only populated fields so we
// never emit invalid/empty markup. Sprint 7 polish will validate against
// Google Rich Results Test once we have hero images and version pricing.

import type { ModelWithRefs } from "@/lib/catalog/fetch";
import { siteUrl } from "./site-url";

const FUEL_HR_TO_SCHEMA: Record<string, string> = {
  benzin: "Petrol",
  dizel: "Diesel",
  hibrid: "Hybrid",
  phev: "Plug-in hybrid",
  ev: "Electric",
  lpg: "LPG",
  cng: "CNG",
};

export function vehicleJsonLd(model: ModelWithRefs): Record<string, unknown> {
  const url = `${siteUrl()}/nova-vozila/marke/${model.brand.slug}/${model.slug}`;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${model.brand.name} ${model.name}`,
    url,
    brand: {
      "@type": "Brand",
      name: model.brand.name,
    },
    model: model.name,
    bodyType: model.body_type.name,
  };

  if (model.year_from) {
    data.modelDate = String(model.year_from);
  }
  if (model.fuel_types && model.fuel_types.length > 0) {
    data.fuelType = model.fuel_types.map((f) => FUEL_HR_TO_SCHEMA[f] ?? f).join(", ");
  }
  if (typeof model.base_price_eur === "number") {
    data.offers = {
      "@type": "Offer",
      price: model.base_price_eur,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url,
    };
  }

  return data;
}
