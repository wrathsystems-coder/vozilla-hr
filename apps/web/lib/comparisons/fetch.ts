import "server-only";

import { unstable_cache } from "next/cache";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import type { Brand, ComparisonPair, Model } from "@/payload-types";

/**
 * Pre-generated comparison pairs (golf-vs-octavia, ...). Used by:
 *
 *   - /usporedi/ hub                  → list all published pairs
 *   - /usporedi/[slug]/               → static-generated SEO pages
 *   - /nova-vozila/marke/{brand}/{model}/   → "Često se uspoređuje s..." rail
 */

const ONE_HOUR = 3600;
const TAG = "comparison_pairs";

export type ComparisonWithModels = ComparisonPair & {
  model_a: Model & { brand?: Brand };
  model_b: Model & { brand?: Brand };
};

function isPopulated<T extends { id: number }>(v: number | T): v is T {
  return typeof v !== "number";
}

async function payload() {
  return getPayload({ config });
}

export const listPublishedComparisons = unstable_cache(
  async (): Promise<ComparisonWithModels[]> => {
    const p = await payload();
    const result = await p.find({
      collection: "comparison_pairs",
      where: { is_published: { equals: true } },
      sort: "sort_order",
      limit: 500,
      depth: 2,
    });
    return (result.docs as ComparisonPair[]).filter(
      (c): c is ComparisonWithModels => isPopulated(c.model_a) && isPopulated(c.model_b),
    );
  },
  ["comparisons:published"],
  { tags: [TAG], revalidate: ONE_HOUR },
);

export const getComparisonBySlug = unstable_cache(
  async (slug: string): Promise<ComparisonWithModels | null> => {
    const p = await payload();
    const result = await p.find({
      collection: "comparison_pairs",
      where: { slug: { equals: slug }, is_published: { equals: true } },
      limit: 1,
      depth: 2,
    });
    const doc = result.docs[0] as ComparisonPair | undefined;
    if (!doc || !isPopulated(doc.model_a) || !isPopulated(doc.model_b)) return null;
    return doc as ComparisonWithModels;
  },
  ["comparisons:by-slug"],
  { tags: [TAG], revalidate: ONE_HOUR },
);

/**
 * Comparisons that involve the given model — used in the model detail
 * "Često se uspoređuje s..." rail. Matches model_a OR model_b.
 */
export async function listComparisonsForModel(
  modelId: number,
  limit = 4,
): Promise<ComparisonWithModels[]> {
  const cached = unstable_cache(
    async () => {
      const p = await payload();
      const orClause: Where = {
        or: [{ model_a: { equals: modelId } }, { model_b: { equals: modelId } }],
      };
      const result = await p.find({
        collection: "comparison_pairs",
        where: { and: [{ is_published: { equals: true } }, orClause] },
        sort: "sort_order",
        limit,
        depth: 2,
      });
      return (result.docs as ComparisonPair[]).filter(
        (c): c is ComparisonWithModels => isPopulated(c.model_a) && isPopulated(c.model_b),
      );
    },
    ["comparisons:by-model", String(modelId), String(limit)],
    { tags: [TAG], revalidate: ONE_HOUR },
  );
  return cached();
}

export type ModelWithBrand = Model & { brand: Brand };

/**
 * Dynamic comparison: pass 2-3 model ids and return them in the same order,
 * brand populated. Used by /usporedi/?modeli=1,2,3 (commit 9). Missing or
 * unpopulated rows come back as `null` so the renderer can skip them.
 */
export async function fetchModelsForCompare(ids: number[]): Promise<(ModelWithBrand | null)[]> {
  if (ids.length === 0) return [];
  const p = await payload();
  const result = await p.find({
    collection: "models",
    where: { id: { in: ids }, is_active: { equals: true } },
    limit: ids.length,
    depth: 1,
  });
  const byId = new Map<number, ModelWithBrand>();
  for (const m of result.docs as Model[]) {
    if (isPopulated(m.brand)) byId.set(m.id, m as ModelWithBrand);
  }
  return ids.map((id) => byId.get(id) ?? null);
}
