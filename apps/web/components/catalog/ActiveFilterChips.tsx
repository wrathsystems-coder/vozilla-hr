import Link from "next/link";
import { X } from "lucide-react";
import {
  filterToQueryString,
  removeMultiValue,
  clearRange,
  type VehicleFilter,
} from "@/lib/catalog/filter";
import { FACET_LABELS } from "@/lib/catalog/facets";

/**
 * Renders the currently-applied filter state as removable chips above
 * the listings grid. Each chip is a `<Link>` to the same path with that
 * one filter value removed — pure server-side, no JS required.
 *
 * Brand/model/body type labels can't be looked up cheaply here (we'd
 * need to JOIN through Payload), so we show the slug as-is for those.
 * A polish pass can pass label maps in if the slug-display turns out
 * to be confusing on a real dataset.
 */

type ChipSpec = {
  key: string;
  label: string;
  hrefFilter: VehicleFilter;
};

type Props = {
  filter: VehicleFilter;
  /** Base URL where chips link to (e.g. "/nova-vozila"). */
  action: string;
};

export default function ActiveFilterChips({ filter, action }: Props) {
  const chips = buildChips(filter);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" role="list" aria-label="Aktivni filteri">
      <span className="text-text-muted text-xs font-medium">Aktivni filteri:</span>
      {chips.map((chip) => {
        const qs = filterToQueryString(chip.hrefFilter);
        const href = qs ? `${action}?${qs}` : action;
        return (
          <Link
            key={chip.key}
            href={href}
            role="listitem"
            prefetch={false}
            className="bg-surface-muted text-text border-surface-border hover:bg-surface inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            aria-label={`Ukloni filter: ${chip.label}`}
          >
            <span>{chip.label}</span>
            <X className="h-3 w-3" aria-hidden="true" />
          </Link>
        );
      })}
      <Link
        href={action}
        prefetch={false}
        className="text-text-muted hover:text-text ml-2 text-xs underline-offset-2 hover:underline"
      >
        Resetiraj sve
      </Link>
    </div>
  );
}

function buildChips(filter: VehicleFilter): ChipSpec[] {
  const chips: ChipSpec[] = [];

  // Multi-select string dims with label lookup
  pushStringChips(chips, filter, "brands", "Marka", (v) => capitalize(v));
  pushStringChips(chips, filter, "models", "Model", (v) => capitalize(v));
  pushStringChips(chips, filter, "bodyTypes", "Kategorija", (v) => capitalize(v));
  pushStringChips(chips, filter, "fuels", "Gorivo", (v) => FACET_LABELS.fuel[v] ?? v);
  pushStringChips(
    chips,
    filter,
    "transmissions",
    "Mjenjač",
    (v) => FACET_LABELS.transmission[v] ?? v,
  );
  pushStringChips(chips, filter, "drivetrains", "Pogon", (v) => FACET_LABELS.drivetrain[v] ?? v);
  pushStringChips(
    chips,
    filter,
    "engineConfigs",
    "Motor",
    (v) => FACET_LABELS.engineConfig[v] ?? v,
  );
  pushStringChips(chips, filter, "ecoNorms", "Eko", (v) => FACET_LABELS.ecoNorm[v] ?? v);
  pushStringChips(chips, filter, "segments", "Segment", (v) => FACET_LABELS.segment[v] ?? v);
  pushStringChips(chips, filter, "equipment", "Oprema", (v) => FACET_LABELS.equipment[v] ?? v);
  pushStringChips(
    chips,
    filter,
    "seatMaterials",
    "Sjedala",
    (v) => FACET_LABELS.seatMaterial[v] ?? v,
  );
  pushStringChips(
    chips,
    filter,
    "steeringMaterials",
    "Volan",
    (v) => FACET_LABELS.steeringMaterial[v] ?? v,
  );
  pushStringChips(chips, filter, "colors", "Boja", (v) => FACET_LABELS.color[v] ?? v);

  // Multi-select int dims
  pushNumberChips(chips, filter, "seatsCounts", "Sjedala", (v) => `${v}`);
  pushNumberChips(chips, filter, "doorsCounts", "Vrata", (v) => `${v}`);
  pushNumberChips(chips, filter, "climateZones", "Klima", (v) => `${v} zona`);
  pushNumberChips(chips, filter, "ncapStars", "NCAP", (v) => `${v}★`);

  // Range chips
  pushRangeChip(chips, filter, "price", "Cijena", "€");
  pushRangeChip(chips, filter, "year", "Godina");
  pushRangeChip(chips, filter, "powerHp", "Snaga", "KS");
  pushRangeChip(chips, filter, "torqueNm", "Moment", "Nm");
  pushRangeChip(chips, filter, "maxSpeedKmh", "Brzina", "km/h");
  pushRangeChip(chips, filter, "bootCapacityL", "Prtljažnik", "L");
  pushRangeChip(chips, filter, "loadCapacityKg", "Nosivost", "kg");
  pushRangeChip(chips, filter, "weightKg", "Težina", "kg");
  pushRangeChip(chips, filter, "acceleration", "0-100", "s");
  pushRangeChip(chips, filter, "consumption", "Potrošnja", "L/100");
  pushRangeChip(chips, filter, "co2", "CO₂", "g/km");
  pushRangeChip(chips, filter, "evRange", "EV doseg", "km");
  pushRangeChip(chips, filter, "screenInches", "Ekran", '"');
  pushRangeChip(chips, filter, "usbPorts", "USB");
  pushRangeChip(chips, filter, "airbags", "Jastuka");

  return chips;
}

function pushStringChips(
  out: ChipSpec[],
  filter: VehicleFilter,
  key: keyof VehicleFilter,
  prefix: string,
  format: (v: string) => string,
) {
  const arr = filter[key] as unknown as string[];
  if (!Array.isArray(arr)) return;
  for (const value of arr) {
    out.push({
      key: `${String(key)}:${value}`,
      label: `${prefix}: ${format(value)}`,
      hrefFilter: removeMultiValue(filter, key, value),
    });
  }
}

function pushNumberChips(
  out: ChipSpec[],
  filter: VehicleFilter,
  key: keyof VehicleFilter,
  prefix: string,
  format: (v: number) => string,
) {
  const arr = filter[key] as unknown as number[];
  if (!Array.isArray(arr)) return;
  for (const value of arr) {
    out.push({
      key: `${String(key)}:${value}`,
      label: `${prefix}: ${format(value)}`,
      hrefFilter: removeMultiValue(filter, key, value),
    });
  }
}

function pushRangeChip(
  out: ChipSpec[],
  filter: VehicleFilter,
  key: keyof VehicleFilter,
  prefix: string,
  unit?: string,
) {
  const r = filter[key] as { min?: number; max?: number };
  if (!r || typeof r !== "object" || Array.isArray(r)) return;
  if (r.min == null && r.max == null) return;
  const minLabel = r.min != null ? `${r.min}` : "—";
  const maxLabel = r.max != null ? `${r.max}` : "—";
  const u = unit ? ` ${unit}` : "";
  out.push({
    key: `${String(key)}`,
    label: `${prefix}: ${minLabel}–${maxLabel}${u}`,
    hrefFilter: clearRange(filter, key),
  });
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
