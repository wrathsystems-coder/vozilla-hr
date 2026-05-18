import Link from "next/link";
import type { ModelVersionListItem } from "@/lib/catalog/filter-fetch";
import { brandPlaceholderColor, brandAbbreviation } from "@/lib/branding/placeholder";
import { formatPrice } from "@/lib/utils/format";
import { FACET_LABELS } from "@/lib/catalog/facets";

/**
 * Single listing card on /nova-vozila/. Shows brand wordmark (placeholder
 * until real logos arrive — see lib/branding/placeholder), name, key
 * specs (year, power, fuel, drivetrain), and price.
 *
 * Card itself is a `<Link>` to the model detail page. CTA to request a
 * quote is rendered alongside (inside-card prevents the link nesting issue).
 */

type Props = {
  item: ModelVersionListItem;
};

export default function ModelVersionListingCard({ item }: Props) {
  const placeholder = brandPlaceholderColor(item.brandSlug);
  const abbr = brandAbbreviation(item.brandName);
  const modelHref = `/nova-vozila/marke/${item.brandSlug}/${item.modelSlug}`;

  return (
    <article className="bg-surface border-surface-border focus-within:ring-brand-accent group flex flex-col overflow-hidden rounded-lg border transition-shadow focus-within:ring-2 hover:shadow-md">
      {/* Brand placeholder top — until real model/brand photography lands */}
      <div
        className="flex h-32 items-center justify-center font-bold tracking-wide"
        style={{ backgroundColor: placeholder.bg, color: placeholder.fg }}
        aria-hidden="true"
      >
        <span className="text-3xl">{abbr}</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link
          href={modelHref}
          className="focus-visible:outline-brand-accent focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <p className="text-text-muted text-xs uppercase tracking-wide">{item.brandName}</p>
          <h3 className="text-text text-lg font-semibold leading-tight">
            {item.modelName}
            <span className="text-text-muted font-normal"> · {item.versionName}</span>
          </h3>
        </Link>

        <ul className="text-text-muted flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {item.year != null && <li className="tabular-nums">{item.year}</li>}
          {item.powerHp != null && <li className="tabular-nums">{item.powerHp} KS</li>}
          {item.fuelType && <li>{FACET_LABELS.fuel[item.fuelType] ?? item.fuelType}</li>}
          {item.transmission && (
            <li>{FACET_LABELS.transmission[item.transmission] ?? item.transmission}</li>
          )}
          {item.drivetrain && (
            <li>{FACET_LABELS.drivetrain[item.drivetrain] ?? item.drivetrain}</li>
          )}
          {item.evRangeKm != null && <li className="tabular-nums">{item.evRangeKm} km doseg</li>}
        </ul>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            {item.priceEur != null ? (
              <>
                <p className="text-text-muted text-xs">od</p>
                <p className="text-text text-lg font-semibold tabular-nums">
                  {formatPrice(item.priceEur)}
                </p>
              </>
            ) : (
              <p className="text-text-muted text-xs">Cijena na upit</p>
            )}
          </div>
          <Link
            href={`/zatrazi-ponudu?marka=${item.brandSlug}&model=${item.modelSlug}&izvor=detail`}
            className="bg-brand-accent text-brand-primary focus-visible:outline-brand-accent rounded-md px-3 py-2 text-xs font-semibold transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
            prefetch={false}
          >
            Zatraži ponudu
          </Link>
        </div>
      </div>
    </article>
  );
}
