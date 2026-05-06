import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/dileri", "/upit"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
