import Link from "next/link";
import type { CountyOption, FilterOption } from "@/lib/used-cars/options";
import type { UsedCarFilter } from "@/lib/used-cars/filter";

/**
 * Server-rendered, zero-JS filter sidebar. The `<form method="GET">` posts
 * back to /rabljena-vozila/ with the new query string and the page
 * re-renders with the filter applied. Each input's name matches the URL
 * param used by `parseFilter()` in lib/used-cars/filter.ts.
 *
 * Model + colour + Dodatna oprema filters are deferred:
 *   - Model would need a chained brand→model dropdown (requires JS).
 *   - Colour + features have no seed data yet.
 */

type Props = {
  filter: UsedCarFilter;
  brands: FilterOption[];
  bodyTypes: FilterOption[];
  fuels: FilterOption[];
  transmissions: FilterOption[];
  counties: CountyOption[];
};

function SelectField({
  id,
  name,
  label,
  value,
  options,
}: {
  id: string;
  name: string;
  label: string;
  value: string | undefined;
  options: FilterOption[];
}) {
  return (
    <div>
      <label htmlFor={id} className="text-text mb-1 block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={value ?? ""}
        className="border-surface-border bg-surface text-text focus:border-brand-accent focus:ring-brand-accent w-full rounded-md border px-3 py-2 text-sm focus:ring-1"
      >
        <option value="">Sve</option>
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberRangeFields({
  label,
  fromName,
  toName,
  fromValue,
  toValue,
  fromPlaceholder,
  toPlaceholder,
  min = 0,
}: {
  label: string;
  fromName: string;
  toName: string;
  fromValue: number | undefined;
  toValue: number | undefined;
  fromPlaceholder: string;
  toPlaceholder: string;
  min?: number;
}) {
  return (
    <div>
      <fieldset>
        <legend className="text-text mb-1 block text-sm font-medium">{label}</legend>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            name={fromName}
            defaultValue={fromValue ?? ""}
            placeholder={fromPlaceholder}
            min={min}
            aria-label={`${label} od`}
            className="border-surface-border bg-surface text-text focus:border-brand-accent focus:ring-brand-accent w-1/2 rounded-md border px-3 py-2 text-sm focus:ring-1"
          />
          <input
            type="number"
            inputMode="numeric"
            name={toName}
            defaultValue={toValue ?? ""}
            placeholder={toPlaceholder}
            min={min}
            aria-label={`${label} do`}
            className="border-surface-border bg-surface text-text focus:border-brand-accent focus:ring-brand-accent w-1/2 rounded-md border px-3 py-2 text-sm focus:ring-1"
          />
        </div>
      </fieldset>
    </div>
  );
}

export default function FilterSidebar({
  filter,
  brands,
  bodyTypes,
  fuels,
  transmissions,
  counties: countyList,
}: Props) {
  // County dropdown uses ID, not slug — listings store county_id.
  const countyOptions: FilterOption[] = countyList.map((c) => ({
    slug: String(c.id),
    name: c.name,
  }));

  return (
    <aside className="lg:sticky lg:top-24">
      <form
        method="GET"
        action="/rabljena-vozila"
        className="border-surface-border bg-surface space-y-4 rounded-md border p-4"
      >
        <SelectField
          id="filter-marka"
          name="marka"
          label="Marka"
          value={filter.brandSlug}
          options={brands}
        />
        <SelectField
          id="filter-kategorija"
          name="kategorija"
          label="Kategorija"
          value={filter.bodyTypeSlug}
          options={bodyTypes}
        />
        <NumberRangeFields
          label="Cijena (€)"
          fromName="cijena_od"
          toName="cijena_do"
          fromValue={filter.priceMin}
          toValue={filter.priceMax}
          fromPlaceholder="od"
          toPlaceholder="do"
        />
        <NumberRangeFields
          label="Godina"
          fromName="godina_od"
          toName="godina_do"
          fromValue={filter.yearMin}
          toValue={filter.yearMax}
          fromPlaceholder="od"
          toPlaceholder="do"
          min={1990}
        />
        <NumberRangeFields
          label="Kilometraža"
          fromName="km_od"
          toName="km_do"
          fromValue={filter.kmMin}
          toValue={filter.kmMax}
          fromPlaceholder="od"
          toPlaceholder="do"
        />
        <SelectField
          id="filter-pogon"
          name="pogon"
          label="Pogon"
          value={filter.fuel}
          options={fuels}
        />
        <SelectField
          id="filter-mjenjac"
          name="mjenjac"
          label="Mjenjač"
          value={filter.transmission}
          options={transmissions}
        />
        <SelectField
          id="filter-zupanija"
          name="zupanija"
          label="Županija"
          value={filter.countyId != null ? String(filter.countyId) : undefined}
          options={countyOptions}
        />

        {/* Preserve the active sort across filter submissions; reset page. */}
        {filter.sort !== "newest" ? <input type="hidden" name="sort" value={filter.sort} /> : null}

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="submit"
            className="bg-brand-accent text-brand-primary rounded-md px-4 py-2 text-sm font-semibold hover:opacity-90"
          >
            Primijeni filter
          </button>
          <Link
            href="/rabljena-vozila"
            className="text-text-muted hover:text-text text-center text-sm underline"
          >
            Resetiraj filter
          </Link>
        </div>
      </form>
    </aside>
  );
}
