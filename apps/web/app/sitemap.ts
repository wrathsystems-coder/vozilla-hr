import type { MetadataRoute } from "next";
import { getAllActiveBrands, getAllActiveModels, getAllBodyTypes } from "@/lib/catalog/fetch";
import { listArticles } from "@/lib/articles/fetch";
import { listPublishedComparisons } from "@/lib/comparisons/fetch";
import { listReviews } from "@/lib/reviews/fetch";
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
  "/za-partnere",
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

  // Editorial — reviews + articles. First page only; pagination URLs
  // aren't worth indexing. 500-row ceiling keeps a runaway catalog from
  // ballooning the sitemap.
  try {
    const reviews = await listReviews(1);
    for (const r of reviews.reviews) {
      entries.push({
        url: `${base}/recenzije/${r.slug}`,
        lastModified: r.updatedAt ? new Date(r.updatedAt) : fallbackTimestamp,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch (err) {
    console.warn("sitemap: reviews unavailable, skipping review routes.", err);
  }

  try {
    const articles = await listArticles(1);
    for (const a of articles.articles) {
      entries.push({
        url: `${base}/savjeti/${a.slug}`,
        lastModified: a.updatedAt ? new Date(a.updatedAt) : fallbackTimestamp,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  } catch (err) {
    console.warn("sitemap: articles unavailable, skipping article routes.", err);
  }

  // Article-category index pages (static enum — always emit).
  for (const cat of ["vodici", "savjeti", "vijesti", "tehnologija"] as const) {
    entries.push({
      url: `${base}/savjeti/kategorija/${cat}`,
      lastModified: fallbackTimestamp,
      changeFrequency: "weekly",
      priority: 0.4,
    });
  }

  return entries;
}
