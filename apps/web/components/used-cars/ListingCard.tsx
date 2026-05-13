import Link from "next/link";
import type { UsedCarListItem } from "@/lib/used-cars/fetch";
import { formatPrice } from "@/lib/utils/format";

/**
 * Card for one used-car listing. Server-rendered. Hero image falls back to
 * the body-type silhouette if the model has no image set; if the body type
 * is also unknown we use the generic placeholder. The whole card is one
 * link to the detail page.
 */

type Props = {
  listing: UsedCarListItem;
};

function heroSrc(listing: UsedCarListItem): string {
  if (listing.heroImagePath) return listing.heroImagePath;
  if (listing.bodyTypeSlug) return `/placeholders/vehicles/${listing.bodyTypeSlug}.svg`;
  return "/placeholders/vehicles/limuzina.svg";
}

function formatKm(km: number): string {
  // Croatian thousands separator (point).
  return new Intl.NumberFormat("hr-HR").format(km) + " km";
}

export default function ListingCard({ listing }: Props) {
  const title = `${listing.brandName} ${listing.modelName}`;
  return (
    <Link
      href={`/rabljena-vozila/oglas/${listing.id}`}
      className="border-surface-border bg-surface hover:border-brand-accent group flex flex-col overflow-hidden rounded-md border transition-colors"
    >
      <div className="bg-surface-muted relative aspect-[16/10] w-full overflow-hidden">
        {/* Generic silhouette is a tinted SVG; the brand wordmark + real
            photo replace it once the catalogue has data. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSrc(listing)}
          alt={`${title} (${listing.year})`}
          className="text-text-muted h-full w-full object-contain p-6 transition-transform group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-text text-base font-semibold">{title}</h3>
        <ul className="text-text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <li>{listing.year}</li>
          <li aria-hidden="true">·</li>
          <li>{formatKm(listing.mileageKm)}</li>
          {listing.color ? (
            <>
              <li aria-hidden="true">·</li>
              <li>{listing.color}</li>
            </>
          ) : null}
        </ul>
        <div className="text-text mt-auto flex items-end justify-between pt-2">
          <span className="text-lg font-bold">
            {formatPrice(listing.priceEur, { decimals: 0 })}
          </span>
          {listing.city ? <span className="text-text-muted text-xs">{listing.city}</span> : null}
        </div>
      </div>
    </Link>
  );
}
