import "server-only";

import { getPayload } from "payload";
import config from "@payload-config";
import type { Brand, Model } from "@/payload-types";
import type { ModelForScoring } from "@/lib/quiz-recommender";

/**
 * Loads every published, active model in a shape the recommender accepts.
 * Body type, segment, fuel types and transmissions are all populated so
 * the scoring rules (priority "prostor" → segment J/M, fuel match, …)
 * have the data they need.
 *
 * MVP heuristic for `seats`: derive from body type slug because the
 * Models collection doesn't carry seats directly and model_versions
 * isn't seeded yet. Two-seaters and 7-seaters are the only categories
 * worth differentiating in our scoring — the 4–5 / 5–7 buckets cover
 * the common case.
 */

type ModelLike = Model & { brand?: Brand | number };

const SEATS_BY_BODY_SLUG: Record<string, number> = {
  // 7-passenger families
  karavan: 5,
  mpv: 7,
  // 5-passenger workhorses
  suv: 5,
  hatchback: 5,
  sedan: 5,
  limuzina: 5,
  kupe: 4,
  kabriolet: 4,
  sportski: 2,
};

function bodySlugOf(m: ModelLike): string {
  const bt = m.body_type;
  if (typeof bt === "object" && bt) return bt.slug ?? "";
  return "";
}

export async function fetchModelsForRecommender(): Promise<ModelForScoring[]> {
  const p = await getPayload({ config });
  const r = await p.find({
    collection: "models",
    where: { is_active: { equals: true } },
    limit: 1000,
    depth: 1,
  });
  return (r.docs as ModelLike[]).map((m) => {
    const bodySlug = bodySlugOf(m);
    return {
      id: m.id as number,
      bodyTypeSlug: bodySlug,
      basePriceEur: m.base_price_eur ?? null,
      fuelTypes: m.fuel_types ?? null,
      transmissions: m.transmissions ?? null,
      segment: m.segment ?? null,
      seats: SEATS_BY_BODY_SLUG[bodySlug] ?? null,
    };
  });
}

/**
 * Hydrate a set of model ids into renderable cards. Returns models in
 * input order; missing / inactive ids drop out (they no longer match the
 * customer's needs and excluding them is preferable to rendering broken
 * cards).
 */
export type QuizResultModel = {
  id: number;
  name: string;
  slug: string;
  brandName: string;
  brandSlug: string;
  basePriceEur: number | null;
  bodyTypeSlug: string | null;
  heroImagePath: string | null;
};

export async function hydrateRecommendedModels(ids: number[]): Promise<QuizResultModel[]> {
  if (ids.length === 0) return [];
  const p = await getPayload({ config });
  const r = await p.find({
    collection: "models",
    where: { id: { in: ids }, is_active: { equals: true } },
    limit: ids.length,
    depth: 1,
  });
  const byId = new Map<number, QuizResultModel>();
  for (const m of r.docs as ModelLike[]) {
    const brand = typeof m.brand === "object" && m.brand ? (m.brand as Brand) : null;
    if (!brand) continue;
    byId.set(m.id as number, {
      id: m.id as number,
      name: m.name,
      slug: m.slug,
      brandName: brand.name,
      brandSlug: brand.slug,
      basePriceEur: m.base_price_eur ?? null,
      bodyTypeSlug: bodySlugOf(m) || null,
      heroImagePath: m.hero_image_path ?? null,
    });
  }
  return ids.map((id) => byId.get(id)).filter((m): m is QuizResultModel => Boolean(m));
}
