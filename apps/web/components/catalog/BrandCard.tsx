import Link from "next/link";
import type { Brand } from "@/payload-types";
import { brandAbbreviation, brandPlaceholderColor } from "@/lib/branding/placeholder";

type Props = {
  brand: Brand;
  className?: string;
};

/**
 * Brand listing card. Renders a colored placeholder with brand
 * abbreviation when no logo_path is set; once the user uploads a logo
 * to /public/branding/brands/{slug}.svg, the BrandLogo (Sprint 4+)
 * swap replaces it. Color is deterministic from slug so the same brand
 * renders the same color across requests + devices (Sprint 8,
 * docs/branding.md "Placeholder system").
 */
export default function BrandCard({ brand, className }: Props) {
  const { bg, fg } = brandPlaceholderColor(brand.slug);
  const abbr = brandAbbreviation(brand.name);

  return (
    <Link
      href={`/nova-vozila/marke/${brand.slug}`}
      className={`border-surface-border bg-surface focus-visible:outline-brand-accent group flex aspect-[5/3] flex-col items-stretch justify-stretch overflow-hidden rounded-md border transition-colors hover:border-current focus-visible:outline-2 focus-visible:outline-offset-2 ${className ?? ""}`}
      aria-label={`Pregledaj ${brand.name}`}
    >
      <div
        className="flex flex-1 items-center justify-center"
        style={{ backgroundColor: bg, color: fg }}
      >
        <span className="text-4xl font-extrabold tracking-tight" aria-hidden="true">
          {abbr}
        </span>
      </div>
      <div className="bg-surface flex flex-col items-center gap-0.5 px-3 py-2">
        <span className="text-text text-sm font-semibold">{brand.name}</span>
        {brand.country_origin && (
          <span className="text-text-muted text-xs">{brand.country_origin}</span>
        )}
      </div>
    </Link>
  );
}
