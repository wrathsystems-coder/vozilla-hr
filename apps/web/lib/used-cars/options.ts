import "server-only";

import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import config from "@payload-config";
import type { BodyType, Brand } from "@/payload-types";
import { getDb } from "@/lib/db/client";
import { counties } from "@/lib/db/schema/counties";
import { asc } from "drizzle-orm";
import { sortHr } from "@/lib/utils/sort";

/**
 * Option lists for the /rabljena-vozila/ filter sidebar. Cached for an hour
 * — brand and body-type catalogues change rarely. County list is fixed by
 * the seed but we load it lazily anyway so a missing DB at build time
 * doesn't crash sitemap generation.
 */

const ONE_HOUR = 3600;

export type FilterOption = { slug: string; name: string };
export type CountyOption = { id: number; slug: string; name: string };

export const getBrandOptions = unstable_cache(
  async (): Promise<FilterOption[]> => {
    const p = await getPayload({ config });
    const r = await p.find({
      collection: "brands",
      where: { is_active: { equals: true } },
      limit: 500,
      depth: 0,
    });
    return sortHr(
      (r.docs as Brand[]).map((b) => ({ slug: b.slug, name: b.name })),
      "name",
    );
  },
  ["used-cars:options:brands"],
  { tags: ["brands"], revalidate: ONE_HOUR },
);

export const getBodyTypeOptions = unstable_cache(
  async (): Promise<FilterOption[]> => {
    const p = await getPayload({ config });
    const r = await p.find({
      collection: "body_types",
      limit: 100,
      sort: "sort_order",
      depth: 0,
    });
    return (r.docs as BodyType[]).map((b) => ({ slug: b.slug, name: b.name }));
  },
  ["used-cars:options:body-types"],
  { tags: ["body_types"], revalidate: ONE_HOUR },
);

export const getCountyOptions = unstable_cache(
  async (): Promise<CountyOption[]> => {
    const db = getDb();
    const rows = await db.select().from(counties).orderBy(asc(counties.sortOrder));
    return rows.map((c) => ({ id: c.id, slug: c.slug, name: c.name }));
  },
  ["used-cars:options:counties"],
  { tags: ["counties"], revalidate: 24 * ONE_HOUR },
);

export const FUEL_OPTIONS: FilterOption[] = [
  { slug: "benzin", name: "Benzin" },
  { slug: "dizel", name: "Dizel" },
  { slug: "hibrid", name: "Hibrid" },
  { slug: "phev", name: "Plug-in hibrid" },
  { slug: "ev", name: "Električni" },
  { slug: "lpg", name: "LPG" },
  { slug: "cng", name: "CNG" },
];

export const TRANSMISSION_OPTIONS: FilterOption[] = [
  { slug: "manual", name: "Manualni" },
  { slug: "automatic", name: "Automatski" },
  { slug: "dct", name: "DCT" },
  { slug: "cvt", name: "CVT" },
];
