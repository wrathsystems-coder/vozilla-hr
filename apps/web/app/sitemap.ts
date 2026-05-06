import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/site-url";
import { now } from "@/lib/utils/time";

const staticRoutes = [
  "/",
  "/nova-vozila",
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

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = now();
  return staticRoutes.map((path) => ({
    url: `${base}${path}`,
    lastModified,
  }));
}
