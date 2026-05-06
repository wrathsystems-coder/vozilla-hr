// Schema.org BreadcrumbList JSON-LD builder.
// Spec 03-information-architecture.md mandates BreadcrumbList markup on every
// page deeper than 1 level.

import { siteUrl } from "./site-url";

export type BreadcrumbItem = {
  name: string;
  /**
   * Absolute or path-only URL. Path-only entries are joined with siteUrl().
   * The last item (current page) may omit href; Schema.org allows this.
   */
  href?: string;
};

export function breadcrumbsJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const entry: Record<string, unknown> = {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
      };
      if (item.href) {
        entry.item = item.href.startsWith("http") ? item.href : `${base}${item.href}`;
      }
      return entry;
    }),
  };
}
