// Schema.org Vehicle JSON-LD for /rabljena-vozila/oglas/{id}. Sibling of
// vehicle-jsonld.ts which targets new-model pages; this one adds the
// fields specific to a single used listing: mileage, condition, the
// specific price for THIS car rather than the model's base price.

import type { UsedCarDetail } from "@/lib/used-cars/fetch";
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

const CONDITION_TO_SCHEMA: Record<string, string> = {
  excellent: "https://schema.org/UsedCondition",
  good: "https://schema.org/UsedCondition",
  fair: "https://schema.org/UsedCondition",
  poor: "https://schema.org/UsedCondition",
};

export function usedCarJsonLd(listing: UsedCarDetail): Record<string, unknown> {
  const url = `${siteUrl()}/rabljena-vozila/oglas/${listing.id}`;
  const model = listing.model;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${model.brand.name} ${model.name} (${listing.year})`,
    url,
    brand: { "@type": "Brand", name: model.brand.name },
    model: model.name,
    bodyType: model.body_type.name,
    vehicleModelDate: String(listing.year),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: listing.mileage_km,
      unitCode: "KMT",
    },
    itemCondition: CONDITION_TO_SCHEMA[listing.condition] ?? "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      price: listing.price_eur,
      priceCurrency: "EUR",
      availability:
        listing.status === "active"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url,
    },
  };

  if (listing.color) data.color = listing.color;

  if (model.fuel_types && model.fuel_types.length > 0) {
    data.fuelType = model.fuel_types.map((f) => FUEL_HR_TO_SCHEMA[f] ?? f).join(", ");
  }

  return data;
}
