import Link from "next/link";
import type { Brand } from "@/payload-types";

type Props = {
  brand: Brand;
  className?: string;
};

/**
 * Brand listing card. Renders a text wordmark fallback when the brand has no
 * logo_path yet — the user uploads the SVG to /public/branding/brands/{slug}.svg
 * later and BrandLogo (Sprint 4+) will swap to <Image>. Sprint 3 keeps it as
 * pure text so the build never depends on a missing asset.
 */
export default function BrandCard({ brand, className }: Props) {
  return (
    <Link
      href={`/nova-vozila/marke/${brand.slug}`}
      className={`border-surface-border bg-surface focus-visible:outline-brand-accent group flex aspect-[5/3] flex-col items-center justify-center gap-2 rounded-md border p-4 transition-colors hover:border-current focus-visible:outline-2 focus-visible:outline-offset-2 ${className ?? ""}`}
      aria-label={`Pregledaj ${brand.name}`}
    >
      <span className="text-text text-xl font-bold uppercase tracking-wide">{brand.name}</span>
      {brand.country_origin && (
        <span className="text-text-muted text-xs">{brand.country_origin}</span>
      )}
    </Link>
  );
}
