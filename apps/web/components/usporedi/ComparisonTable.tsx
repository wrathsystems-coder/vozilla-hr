import Link from "next/link";
import { X } from "lucide-react";
import type { ModelWithBrand } from "@/lib/comparisons/fetch";
import { formatPrice } from "@/lib/utils/format";
import { requestQuoteHref } from "@/lib/catalog/cta";

/**
 * Side-by-side specs table for up to 3 models. Renders a column per
 * provided model. Each row is one attribute (cijena, segment,
 * karoserija, pogon, mjenjač, godine). Missing data shows "—" rather
 * than blank cells so columns stay aligned visually.
 *
 * Each model column has a "Zatraži ponudu" CTA pre-filled with that
 * model's brand + slug + source='usporedba' (from the existing
 * CtaSource enum).
 */

const FUEL_LABEL: Record<string, string> = {
  benzin: "Benzin",
  dizel: "Dizel",
  hibrid: "Hibrid",
  phev: "Plug-in hibrid",
  ev: "Električni",
  lpg: "LPG",
  cng: "CNG",
};

const TRANSMISSION_LABEL: Record<string, string> = {
  manual: "Manualni",
  automatic: "Automatski",
  dct: "DCT",
  cvt: "CVT",
};

type Column = ModelWithBrand;

type Props = {
  columns: (Column | null)[];
  /** When set, each column shows a "Ukloni" link that removes that model from the comparison. */
  removeHrefForIndex?: (idx: number) => string;
};

function joinList(items: string[] | null | undefined, labels: Record<string, string>): string {
  if (!items || items.length === 0) return "—";
  return items.map((v) => labels[v] ?? v).join(", ");
}

function priceCell(price?: number | null): string {
  return typeof price === "number" ? formatPrice(price, { decimals: 0 }) : "—";
}

function yearsCell(from?: number | null, to?: number | null): string {
  if (from && to) return `${from} – ${to}`;
  if (from) return `${from} – `;
  if (to) return `do ${to}`;
  return "—";
}

export default function ComparisonTable({ columns, removeHrefForIndex }: Props) {
  const slots =
    columns.length < 3 ? [...columns, ...Array<null>(3 - columns.length).fill(null)] : columns;
  // Empty trailing slots invite the user to add a third model — for MVP
  // they link to the catalogue hub since chained model selection needs
  // client JS.

  return (
    <div className="overflow-x-auto">
      <table className="border-surface-border bg-surface w-full min-w-[640px] table-fixed border-collapse rounded-md border">
        <thead>
          <tr>
            <th className="bg-surface-muted w-40 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
              Specifikacija
            </th>
            {slots.map((m, i) => (
              <th
                key={i}
                className="border-surface-border min-w-[180px] border-l px-4 py-3 text-left align-top"
              >
                {m ? (
                  <ColumnHeader model={m} removeHref={removeHrefForIndex?.(i)} />
                ) : (
                  <EmptyColumnHeader />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-surface-border divide-y text-sm">
          <Row
            label="Cijena (od)"
            cells={slots.map((m) => (m ? priceCell(m.base_price_eur) : "—"))}
            highlight
          />
          <Row
            label="Karoserija"
            cells={slots.map((m) =>
              m && typeof m.body_type === "object" ? m.body_type.name : "—",
            )}
          />
          <Row label="Segment" cells={slots.map((m) => m?.segment ?? "—")} />
          <Row label="Generacija" cells={slots.map((m) => m?.generation ?? "—")} />
          <Row
            label="Godine"
            cells={slots.map((m) => (m ? yearsCell(m.year_from, m.year_to) : "—"))}
          />
          <Row label="Pogon" cells={slots.map((m) => joinList(m?.fuel_types, FUEL_LABEL))} />
          <Row
            label="Mjenjač"
            cells={slots.map((m) => joinList(m?.transmissions, TRANSMISSION_LABEL))}
          />
        </tbody>
        <tfoot>
          <tr>
            <td className="bg-surface-muted px-4 py-4" />
            {slots.map((m, i) => (
              <td key={i} className="border-surface-border border-l px-4 py-4">
                {m ? (
                  <Link
                    href={requestQuoteHref({
                      brand: m.brand.slug,
                      model: m.slug,
                      source: "usporedba",
                    })}
                    className="bg-brand-accent text-brand-primary block rounded-md px-3 py-2 text-center text-sm font-semibold hover:opacity-90"
                  >
                    Zatraži ponudu
                  </Link>
                ) : null}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ColumnHeader({ model, removeHref }: { model: Column; removeHref?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-text-muted text-xs">{model.brand.name}</p>
      <Link
        href={`/nova-vozila/marke/${model.brand.slug}/${model.slug}`}
        className="text-text hover:text-brand-accent block text-base font-semibold"
      >
        {model.name}
      </Link>
      {removeHref ? (
        <Link
          href={removeHref}
          className="text-text-muted hover:text-text inline-flex items-center gap-1 text-xs"
          aria-label={`Ukloni ${model.brand.name} ${model.name} iz usporedbe`}
        >
          <X className="h-3 w-3" aria-hidden="true" />
          Ukloni
        </Link>
      ) : null}
    </div>
  );
}

function EmptyColumnHeader() {
  return (
    <div className="space-y-1">
      <p className="text-text-muted text-xs">Slobodno mjesto</p>
      <Link
        href="/nova-vozila/marke"
        className="text-brand-accent block text-sm font-medium hover:underline"
      >
        Dodaj model →
      </Link>
    </div>
  );
}

function Row({
  label,
  cells,
  highlight,
}: {
  label: string;
  cells: (string | null | undefined)[];
  highlight?: boolean;
}) {
  return (
    <tr>
      <th
        scope="row"
        className="bg-surface-muted text-text-muted px-4 py-3 text-left text-xs font-medium"
      >
        {label}
      </th>
      {cells.map((c, i) => (
        <td
          key={i}
          className={
            "border-surface-border border-l px-4 py-3 align-top " +
            (highlight ? "text-text text-base font-semibold" : "text-text")
          }
        >
          {c || "—"}
        </td>
      ))}
    </tr>
  );
}
