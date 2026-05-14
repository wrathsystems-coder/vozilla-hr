import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/partneri", "/upit", "/print"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
