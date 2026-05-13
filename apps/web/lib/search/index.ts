import "server-only";

import { getPayload } from "payload";
import config from "@payload-config";
import type { Article, Brand, Model, Review, UsedCarListing } from "@/payload-types";

/**
 * Global search across the public catalogue: brands, models, reviews,
 * articles, used-car listings. Implementation uses Postgres ILIKE %q%
 * backed by pg_trgm GIN indexes (scripts/setup-search-indexes.ts) —
 * good enough for an MVP catalogue under a few thousand rows, and
 * trivially upgradable to tsvector + websearch_to_tsquery later
 * without changing this function's signature.
 *
 * We run every group in parallel and slice each to `perGroup` so a
 * brand match doesn't crowd out an article match in the overlay.
 */

export type SearchGroup = "brands" | "models" | "reviews" | "articles" | "used_cars";

export type SearchItem = {
  group: SearchGroup;
  href: string;
  title: string;
  subtitle: string | null;
};

export type SearchResults = {
  q: string;
  byGroup: Record<SearchGroup, SearchItem[]>;
  total: number;
};

export const MIN_QUERY_LENGTH = 2;

function normalize(q: string): string {
  // Strip leading/trailing whitespace; collapse multi-space; preserve case
  // for display but the search itself is case-insensitive via ILIKE.
  return q.replace(/\s+/g, " ").trim();
}

export async function search(rawQ: string, perGroup = 5): Promise<SearchResults> {
  const q = normalize(rawQ);
  const empty: SearchResults = {
    q,
    byGroup: { brands: [], models: [], reviews: [], articles: [], used_cars: [] },
    total: 0,
  };
  if (q.length < MIN_QUERY_LENGTH) return empty;

  // Payload's `where: { name: { like } }` becomes ILIKE %q% under the
  // postgres adapter — leveraging the pg_trgm GIN indexes we set up.
  const p = await getPayload({ config });

  const [brandRes, modelRes, reviewRes, articleRes, listingRes] = await Promise.all([
    p.find({
      collection: "brands",
      where: { and: [{ is_active: { equals: true } }, { name: { like: q } }] },
      limit: perGroup,
      depth: 0,
    }),
    p.find({
      collection: "models",
      where: { and: [{ is_active: { equals: true } }, { name: { like: q } }] },
      limit: perGroup,
      depth: 1,
    }),
    p.find({
      collection: "reviews",
      where: { and: [{ is_published: { equals: true } }, { title: { like: q } }] },
      limit: perGroup,
      depth: 1,
    }),
    p.find({
      collection: "articles",
      where: { and: [{ is_published: { equals: true } }, { title: { like: q } }] },
      limit: perGroup,
      depth: 0,
    }),
    p.find({
      collection: "used_car_listings",
      where: {
        and: [{ status: { equals: "active" } }, { description_md: { like: q } }],
      },
      limit: perGroup,
      depth: 1,
    }),
  ]);

  const brands: SearchItem[] = (brandRes.docs as Brand[]).map((b) => ({
    group: "brands",
    href: `/nova-vozila/marke/${b.slug}`,
    title: b.name,
    subtitle: b.country_origin ?? null,
  }));

  const models: SearchItem[] = (modelRes.docs as Model[]).map((m) => {
    const brand = typeof m.brand === "object" ? m.brand : null;
    return {
      group: "models",
      href: brand ? `/nova-vozila/marke/${brand.slug}/${m.slug}` : `/nova-vozila/marke`,
      title: brand ? `${brand.name} ${m.name}` : m.name,
      subtitle: typeof m.body_type === "object" ? m.body_type.name : null,
    };
  });

  const reviews: SearchItem[] = (reviewRes.docs as Review[]).map((r) => {
    const model = r.model && typeof r.model === "object" ? r.model : null;
    const brand = model && typeof model.brand === "object" ? model.brand : null;
    return {
      group: "reviews",
      href: `/recenzije/${r.slug}`,
      title: r.title,
      subtitle: brand && model ? `${brand.name} ${model.name}` : null,
    };
  });

  const articles: SearchItem[] = (articleRes.docs as Article[]).map((a) => ({
    group: "articles",
    href: `/savjeti/${a.slug}`,
    title: a.title,
    subtitle: a.category_slug ?? null,
  }));

  const usedCars: SearchItem[] = (listingRes.docs as UsedCarListing[]).map((l) => {
    const model = typeof l.model === "object" ? l.model : null;
    const brand = model && typeof model.brand === "object" ? model.brand : null;
    return {
      group: "used_cars",
      href: `/rabljena-vozila/oglas/${l.id}`,
      title: brand && model ? `${brand.name} ${model.name}` : l.public_id,
      subtitle: `${l.year} · ${l.mileage_km.toLocaleString("hr-HR")} km · ${l.location?.city ?? ""}`,
    };
  });

  return {
    q,
    byGroup: { brands, models, reviews, articles, used_cars: usedCars },
    total: brands.length + models.length + reviews.length + articles.length + usedCars.length,
  };
}
