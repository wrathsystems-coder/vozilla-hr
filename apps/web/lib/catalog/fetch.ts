import "server-only";

import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Brand, BodyType, Model, ModelVersion, Review } from "@/payload-types";
import { sortHr } from "@/lib/utils/sort";

/**
 * All catalog fetchers run on the Payload local API (no HTTP). They are
 * server-only — never bundle to the client. ISR routes wrap call sites with
 * `export const revalidate = 3600`; these helpers add an `unstable_cache`
 * layer with cache tags so a future Payload `afterChange` hook can call
 * `revalidateTag('brands')` / `revalidateTag('models')` for instant
 * invalidation (Sprint 4+).
 */

const ONE_HOUR = 3600;

// `depth` controls how deep Payload populates relationships. depth=1 turns
// `model.brand: number | Brand` into a concrete Brand. We never want depth=0
// for catalog reads — we always render the brand/body_type names.
const DEPTH = 1;

export type ModelWithRefs = Model & {
  brand: Brand;
  body_type: BodyType;
};

function isPopulated<T extends { id: number }>(rel: number | T): rel is T {
  return typeof rel !== "number";
}

async function payload() {
  return getPayload({ config });
}

export const getAllActiveBrands = unstable_cache(
  async (): Promise<Brand[]> => {
    const p = await payload();
    const result = await p.find({
      collection: "brands",
      where: { is_active: { equals: true } },
      limit: 500,
      depth: 0,
    });
    return sortHr(result.docs as Brand[], "name");
  },
  ["catalog:brands:active"],
  { tags: ["brands"], revalidate: ONE_HOUR },
);

export const getTopBrandsForMegaMenu = unstable_cache(
  async (limit = 20): Promise<Brand[]> => {
    const p = await payload();
    // sort_order ASC for editorial control; secondary by HR name handled below.
    const result = await p.find({
      collection: "brands",
      where: { is_active: { equals: true } },
      limit,
      sort: "sort_order",
      depth: 0,
    });
    return result.docs as Brand[];
  },
  ["catalog:brands:mega-menu"],
  { tags: ["brands"], revalidate: ONE_HOUR },
);

export const getBrandBySlug = unstable_cache(
  async (slug: string): Promise<Brand | null> => {
    const p = await payload();
    const result = await p.find({
      collection: "brands",
      where: { slug: { equals: slug }, is_active: { equals: true } },
      limit: 1,
      depth: 0,
    });
    return (result.docs[0] as Brand | undefined) ?? null;
  },
  ["catalog:brand:by-slug"],
  { tags: ["brands"], revalidate: ONE_HOUR },
);

export const getModelsByBrand = unstable_cache(
  async (brandId: number): Promise<ModelWithRefs[]> => {
    const p = await payload();
    const result = await p.find({
      collection: "models",
      where: {
        brand: { equals: brandId },
        is_active: { equals: true },
      },
      limit: 500,
      depth: DEPTH,
    });
    const populated = (result.docs as Model[]).filter(
      (m): m is ModelWithRefs => isPopulated(m.brand) && isPopulated(m.body_type),
    );
    return sortHr(populated, "name");
  },
  ["catalog:models:by-brand"],
  { tags: ["models", "brands"], revalidate: ONE_HOUR },
);

export const getModelBySlugs = unstable_cache(
  async (brandSlug: string, modelSlug: string): Promise<ModelWithRefs | null> => {
    const brand = await getBrandBySlug(brandSlug);
    if (!brand) return null;

    const p = await payload();
    const result = await p.find({
      collection: "models",
      where: {
        brand: { equals: brand.id },
        slug: { equals: modelSlug },
        is_active: { equals: true },
      },
      limit: 1,
      depth: DEPTH,
    });
    const model = result.docs[0] as Model | undefined;
    if (!model) return null;
    if (!isPopulated(model.brand) || !isPopulated(model.body_type)) return null;
    return model as ModelWithRefs;
  },
  ["catalog:model:by-slugs"],
  { tags: ["models", "brands"], revalidate: ONE_HOUR },
);

export const getAllBodyTypes = unstable_cache(
  async (): Promise<BodyType[]> => {
    const p = await payload();
    const result = await p.find({
      collection: "body_types",
      limit: 200,
      sort: "sort_order",
      depth: 0,
    });
    return result.docs as BodyType[];
  },
  ["catalog:body-types:all"],
  { tags: ["body_types"], revalidate: ONE_HOUR },
);

export const getBodyTypeBySlug = unstable_cache(
  async (slug: string): Promise<BodyType | null> => {
    const p = await payload();
    const result = await p.find({
      collection: "body_types",
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    });
    return (result.docs[0] as BodyType | undefined) ?? null;
  },
  ["catalog:body-type:by-slug"],
  { tags: ["body_types"], revalidate: ONE_HOUR },
);

export const getModelsByBodyType = unstable_cache(
  async (bodyTypeId: number): Promise<ModelWithRefs[]> => {
    const p = await payload();
    const result = await p.find({
      collection: "models",
      where: {
        body_type: { equals: bodyTypeId },
        is_active: { equals: true },
      },
      limit: 500,
      depth: DEPTH,
    });
    const populated = (result.docs as Model[]).filter(
      (m): m is ModelWithRefs => isPopulated(m.brand) && isPopulated(m.body_type),
    );
    return sortHr(populated, "name");
  },
  ["catalog:models:by-body-type"],
  { tags: ["models", "body_types"], revalidate: ONE_HOUR },
);

export const getRelatedModels = unstable_cache(
  async (model: ModelWithRefs, limit = 4): Promise<ModelWithRefs[]> => {
    const p = await payload();
    const result = await p.find({
      collection: "models",
      where: {
        body_type: { equals: model.body_type.id },
        is_active: { equals: true },
        id: { not_equals: model.id },
      },
      limit,
      depth: DEPTH,
    });
    return (result.docs as Model[]).filter(
      (m): m is ModelWithRefs => isPopulated(m.brand) && isPopulated(m.body_type),
    );
  },
  ["catalog:models:related"],
  { tags: ["models"], revalidate: ONE_HOUR },
);

export const getModelVersions = unstable_cache(
  async (modelId: number): Promise<ModelVersion[]> => {
    const p = await payload();
    const result = await p.find({
      collection: "model_versions",
      where: { model: { equals: modelId } },
      // is_current first, then newest year first.
      sort: ["-is_current", "-year"],
      limit: 100,
      depth: 0,
    });
    return result.docs as ModelVersion[];
  },
  ["catalog:model-versions"],
  { tags: ["model_versions"], revalidate: ONE_HOUR },
);

export const getAllActiveModels = unstable_cache(
  async (): Promise<ModelWithRefs[]> => {
    const p = await payload();
    const result = await p.find({
      collection: "models",
      where: { is_active: { equals: true } },
      limit: 5000,
      depth: DEPTH,
    });
    return (result.docs as Model[]).filter(
      (m): m is ModelWithRefs => isPopulated(m.brand) && isPopulated(m.body_type),
    );
  },
  ["catalog:models:all-active"],
  { tags: ["models"], revalidate: ONE_HOUR },
);

export const getReviewsForModel = unstable_cache(
  async (modelId: number, limit = 3): Promise<Review[]> => {
    const p = await payload();
    const result = await p.find({
      collection: "reviews",
      where: {
        model: { equals: modelId },
        is_published: { equals: true },
      },
      limit,
      sort: "-published_at",
      depth: 0,
    });
    return result.docs as Review[];
  },
  ["catalog:reviews:by-model"],
  { tags: ["reviews"], revalidate: ONE_HOUR },
);
