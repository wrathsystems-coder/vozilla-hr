import "server-only";

import { unstable_cache } from "next/cache";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import type { Brand, BodyType, Model, Review } from "@/payload-types";

/**
 * Reviews are short editorial pieces. Same Payload-local-API + unstable_cache
 * pattern as lib/catalog/fetch.ts. Paginated list (page=25) for /recenzije/,
 * by-slug for the detail route, and by-body-type / by-model filters for the
 * model detail page's "Recenzije" rail.
 */

const ONE_HOUR = 3600;
const TAG = "reviews";
const PAGE_SIZE = 25;

export type ReviewWithModelRefs = Review & {
  model?: (Model & { brand?: Brand; body_type?: BodyType }) | null;
};

async function payload() {
  return getPayload({ config });
}

export type ReviewListResult = {
  reviews: ReviewWithModelRefs[];
  total: number;
  page: number;
  totalPages: number;
};

async function listUncached(page: number, bodyTypeSlug?: string): Promise<ReviewListResult> {
  const p = await payload();
  const where: Where = { is_published: { equals: true } };

  if (bodyTypeSlug) {
    const bodyRes = await p.find({
      collection: "body_types",
      where: { slug: { equals: bodyTypeSlug } },
      limit: 1,
      depth: 0,
    });
    const bodyId = (bodyRes.docs[0] as BodyType | undefined)?.id;
    if (bodyId == null) {
      return { reviews: [], total: 0, page, totalPages: 0 };
    }
    where["model.body_type"] = { equals: bodyId };
  }

  const result = await p.find({
    collection: "reviews",
    where,
    sort: "-published_at",
    page,
    limit: PAGE_SIZE,
    depth: 2,
  });
  return {
    reviews: result.docs as ReviewWithModelRefs[],
    total: result.totalDocs,
    page: result.page ?? page,
    totalPages: result.totalPages,
  };
}

export async function listReviews(page = 1, bodyTypeSlug?: string): Promise<ReviewListResult> {
  const key = `${page}:${bodyTypeSlug ?? ""}`;
  const cached = unstable_cache(() => listUncached(page, bodyTypeSlug), ["reviews:list", key], {
    tags: [TAG],
    revalidate: ONE_HOUR,
  });
  return cached();
}

export const getReviewBySlug = unstable_cache(
  async (slug: string): Promise<ReviewWithModelRefs | null> => {
    const p = await payload();
    const result = await p.find({
      collection: "reviews",
      where: { slug: { equals: slug }, is_published: { equals: true } },
      limit: 1,
      depth: 2,
    });
    return (result.docs[0] as ReviewWithModelRefs | undefined) ?? null;
  },
  ["reviews:by-slug"],
  { tags: [TAG], revalidate: ONE_HOUR },
);

export async function listLatestReviews(limit = 4): Promise<ReviewWithModelRefs[]> {
  const cached = unstable_cache(
    async () => {
      const p = await payload();
      const result = await p.find({
        collection: "reviews",
        where: { is_published: { equals: true } },
        sort: "-published_at",
        limit,
        depth: 1,
      });
      return result.docs as ReviewWithModelRefs[];
    },
    ["reviews:latest", String(limit)],
    { tags: [TAG], revalidate: ONE_HOUR },
  );
  return cached();
}

export async function listReviewsForModel(modelId: number, limit = 3): Promise<Review[]> {
  const cached = unstable_cache(
    async () => {
      const p = await payload();
      const result = await p.find({
        collection: "reviews",
        where: { model: { equals: modelId }, is_published: { equals: true } },
        sort: "-published_at",
        limit,
        depth: 1,
      });
      return result.docs as Review[];
    },
    ["reviews:by-model", String(modelId), String(limit)],
    { tags: [TAG], revalidate: ONE_HOUR },
  );
  return cached();
}
