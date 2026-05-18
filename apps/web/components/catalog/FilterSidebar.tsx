import type { FacetResult, FacetBucket } from "@/lib/catalog/facets";
import type { VehicleFilter, NumericRange, CatalogSort } from "@/lib/catalog/filter";
import { filterToQueryString } from "@/lib/catalog/filter";

/**
 * Server-rendered filter sidebar for /nova-vozila/.
 *
 * Renders a GET `<form>` that submits to the listing path with all
 * currently-selected filter state as URL params. Each filter group is
 * a `<fieldset>` with `<legend>` + checkbox list (multi-select) or
 * paired number inputs (range). The form requires zero JS to work —
 * checkbox change submits via the form button, range inputs submit
 * on Apply. A future client-component overlay can intercept changes
 * to auto-submit, but the underlying form remains the source of truth.
 *
 * Primary filters (brand/category/fuel/mjenjac/pogon/cijena/godina/
 * snaga) are always-visible at the top. Secondary filters (everything
 * else) live in a `<details>` accordion for progressive disclosure —
 * the catalog has 30+ filter dims and showing all at once overwhelms.
 *
 * Faceted counts come from `lib/catalog/facets.ts` — each option
 * shows its count under the user's other filters. 0-count options
 * are dropped from server render (would be UI noise on a small
 * catalog); a richer "disabled greyed-out 0" pass can come once the
 * catalog has 1000+ vehicles and "0 available" carries meaning.
 */

type Props = {
  filter: VehicleFilter;
  facets: FacetResult;
  /** Path where the form GETs (e.g. "/nova-vozila"). */
  action: string;
};

export default function FilterSidebar({ filter, facets, action }: Props) {
  return (
    <form
      method="GET"
      action={action}
      className="bg-surface border-surface-border space-y-6 rounded-lg border p-4"
      aria-label="Filteri kataloga"
    >
      {/* Preserve sort + page reset to 1 on filter change */}
      {filter.sort !== "newest" && <input type="hidden" name="sort" value={filter.sort} />}

      <header className="flex items-center justify-between">
        <h2 className="text-text text-base font-semibold">Filteri</h2>
        <a
          href={action}
          className="text-text-muted hover:text-text text-xs underline-offset-2 hover:underline"
        >
          Resetiraj
        </a>
      </header>

      {/* --- Primary filters --- */}
      <CheckboxGroup
        legend="Marka"
        paramKey="marka"
        selected={filter.brands}
        options={facets.brands}
        searchable
      />
      <CheckboxGroup
        legend="Kategorija"
        paramKey="kategorija"
        selected={filter.bodyTypes}
        options={facets.bodyTypes}
      />
      <CheckboxGroup
        legend="Gorivo"
        paramKey="gorivo"
        selected={filter.fuels}
        options={facets.fuels}
      />
      <CheckboxGroup
        legend="Mjenjač"
        paramKey="mjenjac"
        selected={filter.transmissions}
        options={facets.transmissions}
      />
      <CheckboxGroup
        legend="Pogon"
        paramKey="pogon"
        selected={filter.drivetrains}
        options={facets.drivetrains}
      />

      <RangeGroup
        legend="Cijena (€)"
        paramBase="cijena"
        value={filter.price}
        placeholder={["od", "do"]}
        step={500}
      />
      <RangeGroup
        legend="Godina"
        paramBase="godina"
        value={filter.year}
        placeholder={["od", "do"]}
      />
      <RangeGroup
        legend="Snaga (KS)"
        paramBase="snaga"
        value={filter.powerHp}
        placeholder={["od", "do"]}
        step={10}
      />

      {/* --- Secondary filters in accordion --- */}
      <details className="border-surface-border border-t pt-4">
        <summary className="text-text cursor-pointer text-sm font-semibold">Više filtera</summary>
        <div className="mt-4 space-y-6">
          <CheckboxGroup
            legend="Konfiguracija motora"
            paramKey="motor_konfig"
            selected={filter.engineConfigs}
            options={facets.engineConfigs}
          />
          <CheckboxGroup
            legend="Eko norma"
            paramKey="eko_norma"
            selected={filter.ecoNorms}
            options={facets.ecoNorms}
          />
          <CheckboxGroup
            legend="Segment"
            paramKey="segment"
            selected={filter.segments}
            options={facets.segments}
          />
          <CheckboxGroup
            legend="Broj sjedala"
            paramKey="sjedala"
            selected={filter.seatsCounts.map(String)}
            options={facets.seatsCounts.map((b) => ({ ...b, value: String(b.value) }))}
          />
          <CheckboxGroup
            legend="Broj vrata"
            paramKey="vrata"
            selected={filter.doorsCounts.map(String)}
            options={facets.doorsCounts.map((b) => ({ ...b, value: String(b.value) }))}
          />
          <CheckboxGroup
            legend="Klima zone"
            paramKey="klima_zone"
            selected={filter.climateZones.map(String)}
            options={facets.climateZones.map((b) => ({ ...b, value: String(b.value) }))}
          />
          <CheckboxGroup
            legend="Euro NCAP (zvjezdice)"
            paramKey="ncap"
            selected={filter.ncapStars.map(String)}
            options={facets.ncapStars.map((b) => ({ ...b, value: String(b.value) }))}
          />
          <CheckboxGroup
            legend="Oprema"
            paramKey="oprema"
            selected={filter.equipment}
            options={facets.equipment}
            note="AND: vozilo mora imati svu označenu opremu"
            searchable
          />
          <CheckboxGroup
            legend="Materijal sjedala"
            paramKey="sjedala_materijal"
            selected={filter.seatMaterials}
            options={facets.seatMaterials}
          />
          <CheckboxGroup
            legend="Materijal volana"
            paramKey="volan_materijal"
            selected={filter.steeringMaterials}
            options={facets.steeringMaterials}
          />
          <CheckboxGroup
            legend="Boja"
            paramKey="boja"
            selected={filter.colors}
            options={facets.colors}
          />

          <RangeGroup
            legend="Moment (Nm)"
            paramBase="moment"
            value={filter.torqueNm}
            placeholder={["od", "do"]}
            step={10}
          />
          <RangeGroup
            legend="Max brzina (km/h)"
            paramBase="brzina"
            value={filter.maxSpeedKmh}
            placeholder={["od", "do"]}
            step={10}
          />
          <RangeGroup
            legend="Prtljažnik (L)"
            paramBase="prtljaznik"
            value={filter.bootCapacityL}
            placeholder={["od", "do"]}
            step={10}
          />
          <RangeGroup
            legend="Nosivost (kg)"
            paramBase="nosivost"
            value={filter.loadCapacityKg}
            placeholder={["od", "do"]}
            step={50}
          />
          <RangeGroup
            legend="Težina (kg)"
            paramBase="tezina"
            value={filter.weightKg}
            placeholder={["od", "do"]}
            step={50}
          />
          <RangeGroup
            legend="Ubrzanje 0-100 (s)"
            paramBase="ubrzanje"
            value={filter.acceleration}
            placeholder={["od", "do"]}
            step={0.1}
          />
          <RangeGroup
            legend="Potrošnja (L/100km)"
            paramBase="potrosnja"
            value={filter.consumption}
            placeholder={["od", "do"]}
            step={0.1}
          />
          <RangeGroup
            legend="CO₂ (g/km)"
            paramBase="co2"
            value={filter.co2}
            placeholder={["od", "do"]}
            step={5}
          />
          <RangeGroup
            legend="EV doseg (km)"
            paramBase="ev_doseg"
            value={filter.evRange}
            placeholder={["od", "do"]}
            step={10}
          />
          <RangeGroup
            legend="Veličina ekrana (inch)"
            paramBase="ekran"
            value={filter.screenInches}
            placeholder={["od", "do"]}
            step={0.1}
          />
          <RangeGroup
            legend="USB priključaka"
            paramBase="usb"
            value={filter.usbPorts}
            placeholder={["od", "do"]}
          />
          <RangeGroup
            legend="Zračnih jastuka"
            paramBase="jastuci"
            value={filter.airbags}
            placeholder={["od", "do"]}
          />
        </div>
      </details>

      <button
        type="submit"
        className="bg-brand-accent text-brand-primary focus-visible:outline-brand-accent w-full rounded-md px-4 py-2.5 text-sm font-semibold transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Primijeni filtere
      </button>
    </form>
  );
}

// ---------- Inner components ----------

type CheckboxGroupProps = {
  legend: string;
  paramKey: string;
  selected: string[];
  options: FacetBucket<string | number>[];
  searchable?: boolean;
  note?: string;
};

function CheckboxGroup({ legend, paramKey, selected, options, note }: CheckboxGroupProps) {
  if (options.length === 0) return null;
  return (
    <fieldset className="space-y-2">
      <legend className="text-text text-xs font-semibold uppercase tracking-wide">{legend}</legend>
      {note && <p className="text-text-muted text-xs">{note}</p>}
      <ul className="max-h-56 space-y-1 overflow-y-auto pr-1">
        {options.map((opt) => {
          const value = String(opt.value);
          const checked = selected.includes(value);
          return (
            <li key={value}>
              <label className="hover:bg-surface-muted flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm">
                <input
                  type="checkbox"
                  name={paramKey}
                  value={value}
                  defaultChecked={checked}
                  className="border-surface-border accent-brand-accent h-4 w-4 rounded"
                />
                <span className="text-text flex-1">{opt.label}</span>
                <span className="text-text-muted text-xs tabular-nums">{opt.count}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

type RangeGroupProps = {
  legend: string;
  paramBase: string;
  value: NumericRange;
  placeholder: [string, string];
  step?: number;
};

function RangeGroup({ legend, paramBase, value, placeholder, step }: RangeGroupProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-text text-xs font-semibold uppercase tracking-wide">{legend}</legend>
      <div className="flex items-center gap-2">
        <input
          type="number"
          name={`${paramBase}_od`}
          defaultValue={value.min ?? ""}
          placeholder={placeholder[0]}
          step={step}
          min={0}
          aria-label={`${legend} — od`}
          className="border-surface-border bg-surface text-text focus-visible:border-brand-accent w-0 flex-1 rounded-md border px-2 py-1.5 text-sm tabular-nums focus-visible:outline-none"
        />
        <span className="text-text-muted text-xs">—</span>
        <input
          type="number"
          name={`${paramBase}_do`}
          defaultValue={value.max ?? ""}
          placeholder={placeholder[1]}
          step={step}
          min={0}
          aria-label={`${legend} — do`}
          className="border-surface-border bg-surface text-text focus-visible:border-brand-accent w-0 flex-1 rounded-md border px-2 py-1.5 text-sm tabular-nums focus-visible:outline-none"
        />
      </div>
    </fieldset>
  );
}

// Re-exported for completeness — unused in the sidebar itself but useful
// elsewhere if a page wants to link to a clear-filter URL.
export function clearFilterHref(action: string, sort: CatalogSort | undefined): string {
  if (!sort || sort === "newest") return action;
  return `${action}?sort=${sort}`;
}

void filterToQueryString; // Avoid unused-import warning when sidebar grows without using this helper directly.
