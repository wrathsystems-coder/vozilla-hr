import "server-only";

import { unstable_cache } from "next/cache";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import type { Brand, BodyType, Model, UsedCarListing } from "@/payload-types";
import { USED_CAR_PAGE_SIZE, type UsedCarFilter, type UsedCarSort } from "./filter";

/**
 * Server-only data layer for /rabljena-vozila/. Built on the Payload local
 * API (no HTTP) and wrapped with `unstable_cache` keyed by the serialised
 * filter — a future `revalidateTag('used_car_listings')` Payload hook can
 * blow the whole keyspace at once when a listing is created / updated /
 * deleted (Sprint 7 wiring).
 *
 * Slug-based filters (brand, model, body type) resolve to numeric IDs
 * first because Payload's `where` engine doesn't join through relationship
 * slugs. A miss on any required slug returns zero results rather than
 * silently ignoring the filter — otherwise `?marka=nonexistent` would show
 * every listing instead of "0 results".
 */

const ONE_HOUR = 3600;
const TAG = "used_car_listings";

export type UsedCarListItem = {
  id: number;
  publicId: string;
  brandName: string;
  brandSlug: string;
  modelName: string;
  modelSlug: string;
  bodyTypeSlug: string | null;
  year: number;
  mileageKm: number;
  priceEur: number;
  color: string | null;
  countyId: number | null;
  city: string | null;
  heroImagePath: string | null;
  createdAt: string;
};

export type UsedCarListResult = {
  listings: UsedCarListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const SORT_TO_PAYLOAD: Record<UsedCarSort, string> = {
  newest: "-createdAt",
  cheapest: "price_eur",
  leastKm: "mileage_km",
};

type ModelWithRefs = Model & { brand: Brand; body_type: BodyType };

function isPopulated<T extends { id: number }>(v: number | T | null | undefined): v is T {
  return typeof v === "object" && v !== null;
}

async function payload() {
  return getPayload({ config });
}

async function resolveBrandId(slug: string): Promise<number | null> {
  const p = await payload();
  const r = await p.find({
    collection: "brands",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  });
  return (r.docs[0] as Brand | undefined)?.id ?? null;
}

async function resolveModelId(modelSlug: string, brandId: number | null): Promise<number | null> {
  const p = await payload();
  const where: Where = { slug: { equals: modelSlug } };
  if (brandId != null) where.brand = { equals: brandId };
  const r = await p.find({
    collection: "models",
    where,
    limit: 1,
    depth: 0,
  });
  return (r.docs[0] as Model | undefined)?.id ?? null;
}

async function resolveBodyTypeId(slug: string): Promise<number | null> {
  const p = await payload();
  const r = await p.find({
    collection: "body_types",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  });
  return (r.docs[0] as BodyType | undefined)?.id ?? null;
}

type RangeClause = { greater_than_equal?: number; less_than_equal?: number };

function rangeClause(min: number | undefined, max: number | undefined): RangeClause | undefined {
  const next: RangeClause = {};
  if (min != null) next.greater_than_equal = min;
  if (max != null) next.less_than_equal = max;
  return Object.keys(next).length ? next : undefined;
}

async function fetchUsedCarsUncached(filter: UsedCarFilter): Promise<UsedCarListResult> {
  const p = await payload();

  const brandId = filter.brandSlug ? await resolveBrandId(filter.brandSlug) : null;
  const modelId = filter.modelSlug ? await resolveModelId(filter.modelSlug, brandId) : null;
  const bodyTypeId = filter.bodyTypeSlug ? await resolveBodyTypeId(filter.bodyTypeSlug) : null;

  if (
    (filter.brandSlug && brandId == null) ||
    (filter.modelSlug && modelId == null) ||
    (filter.bodyTypeSlug && bodyTypeId == null)
  ) {
    return {
      listings: [],
      total: 0,
      page: filter.page,
      pageSize: USED_CAR_PAGE_SIZE,
      totalPages: 0,
    };
  }

  const where: Where = {
    status: { equals: "active" },
  };

  // model FK is more specific than brand/body_type — prefer it if set.
  if (modelId != null) {
    where.model = { equals: modelId };
  } else {
    if (brandId != null) where["model.brand"] = { equals: brandId };
    if (bodyTypeId != null) where["model.body_type"] = { equals: bodyTypeId };
  }

  if (filter.fuel) where["model.fuel_types"] = { in: [filter.fuel] };
  if (filter.transmission) where["model.transmissions"] = { in: [filter.transmission] };

  const priceRange = rangeClause(filter.priceMin, filter.priceMax);
  if (priceRange) where.price_eur = priceRange;

  const yearRange = rangeClause(filter.yearMin, filter.yearMax);
  if (yearRange) where.year = yearRange;

  const kmRange = rangeClause(filter.kmMin, filter.kmMax);
  if (kmRange) where.mileage_km = kmRange;

  if (filter.countyId != null) where["location.county_id"] = { equals: filter.countyId };

  const result = await p.find({
    collection: "used_car_listings",
    where,
    sort: SORT_TO_PAYLOAD[filter.sort],
    page: filter.page,
    limit: USED_CAR_PAGE_SIZE,
    depth: 2, // model → brand + body_type
  });

  const listings: UsedCarListItem[] = (result.docs as UsedCarListing[]).map((l) => {
    const model = isPopulated<ModelWithRefs>(l.model as number | ModelWithRefs)
      ? (l.model as ModelWithRefs)
      : null;
    const brand = model && isPopulated<Brand>(model.brand) ? model.brand : null;
    const bodyType = model && isPopulated<BodyType>(model.body_type) ? model.body_type : null;
    return {
      id: l.id,
      publicId: l.public_id,
      brandName: brand?.name ?? "—",
      brandSlug: brand?.slug ?? "",
      modelName: model?.name ?? "—",
      modelSlug: model?.slug ?? "",
      bodyTypeSlug: bodyType?.slug ?? null,
      year: l.year,
      mileageKm: l.mileage_km,
      priceEur: l.price_eur,
      color: l.color ?? null,
      countyId: l.location?.county_id ?? null,
      city: l.location?.city ?? null,
      heroImagePath: model?.hero_image_path ?? null,
      createdAt: l.createdAt,
    };
  });

  return {
    listings,
    total: result.totalDocs,
    page: result.page ?? filter.page,
    pageSize: USED_CAR_PAGE_SIZE,
    totalPages: result.totalPages,
  };
}

export async function fetchUsedCarListings(filter: UsedCarFilter): Promise<UsedCarListResult> {
  // Serialise the filter into the cache key so different filter combinations
  // don't poison each other. The shape is small (≤14 fields, primitive values)
  // so the JSON tail is short and the keyspace bounded.
  const key = JSON.stringify(filter);
  const cached = unstable_cache(() => fetchUsedCarsUncached(filter), ["used-cars:list", key], {
    tags: [TAG],
    revalidate: ONE_HOUR,
  });
  return cached();
}

export type UsedCarDetail = UsedCarListing & {
  model: ModelWithRefs;
};

export async function fetchUsedCarById(id: number): Promise<UsedCarDetail | null> {
  const p = await payload();
  try {
    const doc = (await p.findByID({
      collection: "used_car_listings",
      id,
      depth: 2,
    })) as UsedCarListing;
    if (
      !isPopulated<ModelWithRefs>(doc.model as number | ModelWithRefs) ||
      !isPopulated<Brand>((doc.model as ModelWithRefs).brand) ||
      !isPopulated<BodyType>((doc.model as ModelWithRefs).body_type)
    ) {
      // Detail page can't render without the populated model graph.
      return null;
    }
    return doc as UsedCarDetail;
  } catch {
    return null;
  }
}
