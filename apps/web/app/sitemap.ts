import type { MetadataRoute } from "next";
import { getAllActiveBrands, getAllActiveModels, getAllBodyTypes } from "@/lib/catalog/fetch";
import { listPublishedComparisons } from "@/lib/comparisons/fetch";
import { siteUrl } from "@/lib/seo/site-url";
import { now } from "@/lib/utils/time";

// Statične rute (Sprint 0–2). Dinamičke marke / modeli / kategorije
// (Sprint 3) dodaju se ispod iz Payload-a; revalidate matches the
// catalog routes (1h ISR).
const STATIC_ROUTES: string[] = [
  "/",
  "/nova-vozila",
  "/nova-vozila/marke",
  "/nova-vozila/kategorije",
  "/rabljena-vozila",
  "/leasing",
  "/usporedi",
  "/recenzije",
  "/savjeti",
  "/pomoc-pri-izboru",
  "/zatrazi-ponudu",
  "/za-dilere",
  "/kontakt",
  "/o-nama",
  "/cesta-pitanja",
  "/kako-funkcionira",
  "/kako-provjeravamo-recenzije",
  "/opci-uvjeti",
  "/politika-privatnosti",
  "/politika-kolacica",
  "/impressum",
  "/gdpr-zahtjev",
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const fallbackTimestamp = now();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified: fallbackTimestamp,
  }));

  // Catalog routes degrade gracefully if Payload is unreachable so the
  // sitemap still serves the static portion.
  try {
    const [brands, models, bodyTypes] = await Promise.all([
      getAllActiveBrands(),
      getAllActiveModels(),
      getAllBodyTypes(),
    ]);

    for (const brand of brands) {
      entries.push({
        url: `${base}/nova-vozila/marke/${brand.slug}`,
        lastModified: brand.updatedAt ? new Date(brand.updatedAt) : fallbackTimestamp,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const model of models) {
      entries.push({
        url: `${base}/nova-vozila/marke/${model.brand.slug}/${model.slug}`,
        lastModified: model.updatedAt ? new Date(model.updatedAt) : fallbackTimestamp,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    for (const bt of bodyTypes) {
      entries.push({
        url: `${base}/nova-vozila/kategorije/${bt.slug}`,
        lastModified: bt.updatedAt ? new Date(bt.updatedAt) : fallbackTimestamp,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch (err) {
    console.warn("sitemap: catalog routes unavailable, serving static portion only.", err);
  }

  // Pre-generated comparison pairs — independent try/catch so a Payload
  // hiccup loading comparisons doesn't drop catalog routes that already
  // succeeded above.
  try {
    const comparisons = await listPublishedComparisons();
    for (const c of comparisons) {
      entries.push({
        url: `${base}/usporedi/${c.slug}`,
        lastModified: c.updatedAt ? new Date(c.updatedAt) : fallbackTimestamp,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  } catch (err) {
    console.warn("sitemap: comparisons unavailable, skipping comparison routes.", err);
  }

  return entries;
}
