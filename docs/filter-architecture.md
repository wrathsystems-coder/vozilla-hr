# Vehicle filter architecture — vozilla.hr

> Sprint 8 catalog faza. Authoritative design dokument za multi-select
> filter sustav koji se proteže preko `/nova-vozila/` i `/rabljena-vozila/`.
> CLAUDE.md rule #11 je pravilima sažeti TL;DR — ovaj dokument je
> izvedbeni detalj.

---

## Ciljevi

1. **Multi-select** — gotovo svi filteri primaju više vrijednosti
   istovremeno (OR within group), kombinacije filtera primjenjuju se
   AND-om između grupa.
2. **Range filteri** za sve smisleno numeričke atribute (cijena, godina,
   km, snaga, max brzina, prtljažnik, težina, ubrzanje).
3. **Shareable / bookmarkable URL** — cijelo filter stanje u query
   params, ne u localStorage ili cookies.
4. **Faceted counts** uz svaku filter opciju (npr. "Audi (1243)").
5. **0-result kombinacije** vidljive ali disabled — ne crashaju UX, ne
   zezaju "rebuild from scratch" flow.
6. **Skalira na 20k+ vozila** s P95 query time < 250ms.
7. **SEO friendly** — filtered URL-ovi `noindex+follow`, canonical na
   filter-free landing; brand/category landing pages ostaju indexabilne.

---

## Filter dimensions (izvedeno iz CSV importer-a)

Definitivni popis zavisi od stupaca u CSV-u koji vlasnik isporučuje.
Niže je naša pretpostavka — sve što je u CSV-u kao samostalan stupac,
postaje filter; sve što nije, ne troši filter UI slot.

### Multi-select dimenzije (OR within group)

| Dimenzija    | Column type         | Param key    | Index               |
| ------------ | ------------------- | ------------ | ------------------- |
| Marka        | enum (FK na brands) | `marka`      | B-tree FK           |
| Model        | enum (FK na models) | `model`      | B-tree FK           |
| Kategorija   | enum (FK body_type) | `kategorija` | B-tree FK           |
| Gorivo       | enum (single)       | `gorivo`     | B-tree              |
| Mjenjač      | enum (single)       | `mjenjac`    | B-tree              |
| Pogon        | enum (single)       | `pogon`      | B-tree (drivetrain) |
| Boje         | enum (single)       | `boja`       | B-tree              |
| Stanje       | enum (single)       | `stanje`     | B-tree              |
| Broj sjedala | numeric (int)       | `sjedala`    | B-tree              |
| Broj vrata   | numeric (int)       | `vrata`      | B-tree              |
| Oprema       | `text[]`            | `oprema`     | **GIN**             |
| Segment      | enum (A/B/.../S)    | `segment`    | B-tree              |

### Range dimenzije (single `_od` / `_do` pair, oba opcionalna)

| Dimenzija          | Param keys                        | Column                                       | Index  |
| ------------------ | --------------------------------- | -------------------------------------------- | ------ |
| Cijena (EUR)       | `cijena_od` / `cijena_do`         | `model_versions.price_eur`                   | B-tree |
| Godina             | `godina_od` / `godina_do`         | `model_versions.year`                        | B-tree |
| Kilometri          | `km_od` / `km_do`                 | `used_car_listings.mileage_km`               | B-tree |
| Snaga (HP)         | `snaga_od` / `snaga_do`           | `model_versions.power_hp`                    | B-tree |
| Max brzina (km/h)  | `brzina_od` / `brzina_do`         | `model_versions.max_speed_kmh`               | B-tree |
| Prtljažnik (L)     | `prtljaznik_od` / `prtljaznik_do` | `model_versions.boot_capacity_l`             | B-tree |
| Težina (kg)        | `tezina_od` / `tezina_do`         | `model_versions.weight_kg`                   | B-tree |
| Ubrzanje 0-100 (s) | `ubrzanje_od` / `ubrzanje_do`     | `model_versions.acceleration_0_100_s`        | B-tree |
| Potrošnja (L/100)  | `potrosnja_od` / `potrosnja_do`   | `model_versions.fuel_consumption_combined_l` | B-tree |
| CO₂ (g/km)         | `co2_od` / `co2_do`               | `model_versions.co2_emission_g_km`           | B-tree |

Range filter UX: dvostruko-ručka slider + preset bucket chip-ovi ispod
(npr. cijena: 'do 20k', '20-30k', '30-40k', '40-60k', '60k+'). Bucket-i
auto-deriviraju iz dataset min/max u 5 percentile-bucket-a; corner case
manje od 5 distinct vrijednosti → samo slider, no buckets.

### Sort + paging

| Param  | Vrijednosti                                                        |
| ------ | ------------------------------------------------------------------ |
| `sort` | `newest` (default), `cheapest`, `priciest`, `leastKm`, `mostPower` |
| `p`    | broj stranice, default `1`, page size 25                           |

---

## URL spec

**Format:** comma-separated values per multi-select param, `_od`/`_do`
pair za range. Single-select param-i koriste isti comma-separated format
ali UI prikazuje radio umjesto checkbox.

**Primjer:**

```
/nova-vozila/?marka=audi,bmw&gorivo=diesel,hybrid&mjenjac=automatic&cijena_od=20000&cijena_do=40000&oprema=panorama,hud&sort=cheapest&p=2
```

Semantika ekvivalentna SQL-u:

```sql
WHERE brand_slug IN ('audi','bmw')
  AND fuel_type IN ('diesel','hybrid')
  AND transmission = 'automatic'
  AND price_eur BETWEEN 20000 AND 40000
  AND equipment @> ARRAY['panorama']
  AND equipment @> ARRAY['hud']
```

Bilješka: equipment ima 2 zasebne `@>` provjere (multi-value oprema je
AND between values — user koji odabire 'panorama' i 'hud' traži _oba_).
Ovo je iznimka od OR-within rule jer "imati AND opremu" je tipičan
korisnički intent, dok "biti AND boju" nema smisla.

**Parser:**

- `URLSearchParams.getAll(key)` → split na `,` → `string[]`
- Empty strings filtered out
- Range pair: `parseInt(get(`${k}\_od`))` → undefined ako ne-broj
- Sort: enum allowlist, fallback `newest`
- Page: `parseInt`, min 1
- **Stable serialization**: filterToQueryString sortira keys, default
  vrijednosti (sort=newest, p=1) izostavljene iz output-a — bookmarkable
  URL-ovi ostaju canonical.

**Round-trip parity** se garantira unit testovima
(`tests/unit/used-cars-filter.test.ts` već postoji za single-select; će
biti proširen za multi).

---

## DB schema extensions

Tipirane filterable kolone idu na `model_versions` (single source of
truth za new-car catalog filtere). `used_car_listings` JOIN-a versions
za inheritance spec sheet-a; listing-specific override-i (km, godina,
condition, listing price) ostaju na listing rowu.

### Migracija — `model_versions` proširenje

```sql
ALTER TABLE model_versions
  ADD COLUMN max_speed_kmh integer,
  ADD COLUMN acceleration_0_100_s numeric(4,2),
  ADD COLUMN boot_capacity_l integer,
  ADD COLUMN weight_kg integer,
  ADD COLUMN length_mm integer,
  ADD COLUMN width_mm integer,
  ADD COLUMN height_mm integer,
  ADD COLUMN wheelbase_mm integer,
  ADD COLUMN doors_count smallint,
  ADD COLUMN seats_count smallint,
  ADD COLUMN drivetrain text,                  -- FWD / RWD / AWD
  ADD COLUMN equipment text[] DEFAULT '{}',    -- ['panorama','hud','heated_seats']
  ADD COLUMN colors_available text[] DEFAULT '{}';

-- Single-column B-tree indexes na range columnima:
CREATE INDEX IF NOT EXISTS idx_mv_price ON model_versions (price_eur);
CREATE INDEX IF NOT EXISTS idx_mv_year ON model_versions (year);
CREATE INDEX IF NOT EXISTS idx_mv_power_hp ON model_versions (power_hp);
CREATE INDEX IF NOT EXISTS idx_mv_max_speed ON model_versions (max_speed_kmh);
CREATE INDEX IF NOT EXISTS idx_mv_boot ON model_versions (boot_capacity_l);
CREATE INDEX IF NOT EXISTS idx_mv_weight ON model_versions (weight_kg);
CREATE INDEX IF NOT EXISTS idx_mv_acceleration ON model_versions (acceleration_0_100_s);

-- Composite indexi za česte combo filtere:
CREATE INDEX IF NOT EXISTS idx_mv_fuel_trans
  ON model_versions (engine_type, transmission);
CREATE INDEX IF NOT EXISTS idx_mv_model_active
  ON model_versions (model_id, is_current) WHERE is_current = true;

-- GIN za multi-value array kolone:
CREATE INDEX IF NOT EXISTS idx_mv_equipment_gin
  ON model_versions USING gin (equipment);
CREATE INDEX IF NOT EXISTS idx_mv_colors_gin
  ON model_versions USING gin (colors_available);
```

### `used_car_listings` što ostaje listing-specific

| Column                 | Reason                                      |
| ---------------------- | ------------------------------------------- |
| `mileage_km`           | Specific to instance, not version           |
| `condition`            | "excellent/good/fair/poor" — listing-level  |
| `price_eur` (override) | Listing may differ from version base price  |
| `year` (override)      | Listing year ≠ version year (production yr) |
| `color` (single)       | Konkretno vozilo, ne array opcija           |
| `location_id`          | County FK                                   |

Filter na `/rabljena-vozila/` koristi UNION: spec filteri (gorivo,
mjenjač, prtljažnik, brzina) JOIN-aju model_versions; listing-specific
(km, condition, location) hit-aju used_car_listings direktno.

---

## Facet count query strategija

Faceted search zahtjeva da se uz svaki filter prikazuje broj rezultata
za svaku opciju. **Standard approach:** za svaki facet dim, run query
sa svim filterima APLICIRANIM **osim** tog jednog, GROUP BY ta dim.

**Primjer:** korisnik je odabrao `marka=audi,bmw` + `gorivo=diesel`. Za
facet "marka" prikazuje:

- Audi (37) — count where gorivo=diesel
- BMW (52) — count where gorivo=diesel
- Mercedes (89) — count where gorivo=diesel
- (sve ostale marke, 0 mogu biti)

Za facet "gorivo" prikazuje:

- Diesel (89) — count where marka IN (audi,bmw)
- Benzin (15) — count where marka IN (audi,bmw)
- Hybrid (3) — count where marka IN (audi,bmw)

**Implementacija** (`lib/catalog/facets.ts`, novi file):

```ts
type FacetResult = {
  brands: Array<{ value: string; label: string; count: number }>;
  models: Array<{ value: string; label: string; count: number }>;
  bodyTypes: Array<{ value: string; label: string; count: number }>;
  fuels: Array<{ value: string; label: string; count: number }>;
  transmissions: Array<{ value: string; label: string; count: number }>;
  drivetrains: Array<{ value: string; label: string; count: number }>;
  equipment: Array<{ value: string; label: string; count: number }>;
  // ... ostali enumi
  rangeStats: {
    price: { min: number; max: number };
    year: { min: number; max: number };
    km: { min: number; max: number };
    power: { min: number; max: number };
    // ... ostali range-ovi
  };
};

async function fetchFacets(filter: VehicleFilter): Promise<FacetResult>;
```

Optimizacija:

1. **Single CTE base** — query the filtered set once, materialize CTE,
   pa run N count queries against it minus one filter each. Postgres
   optimizator agresivno re-uses CTE scan rows.
2. **Cache** kroz `unstable_cache` taggan `model_versions` + dedicated
   `facets` tag — facets se rebuilduju kad se mijenja katalog (već
   imamo afterChange revalidate hook).
3. **Stale-while-revalidate** — first page load gets fresh facets,
   subsequent paginations koriste stale + revalidate na pozadini.

**Budget**: 20k rows + 12 facet dims = ~12 lightweight count queries.
S indexima i `count_estimate` pristupom (Postgres `EXPLAIN` extract za
velike datasete) ostaje pod 100ms u 95th percentile.

---

## Disabled / 0-result UX

UI rendering pravila:

1. Facet opcija s `count === 0` u trenutnom kontekstu → prikazana ali
   `disabled` + `aria-disabled="true"`, klik no-op. Stable layout, user
   vidi što postoji ali ne može odabrati nedostupno.
2. Range slider min/max **NE** auto-shrinkaju na trenutni filter result
   — ostaju katalog-wide stats. Drugi pristup bi crashao "expand the
   range" intent. (Carwow ima ovo isto.)
3. Filter group bez vidljivih opcija (npr. "Boja" na set-u gdje
   nijedna boja nije match) → cijeli group hidden, ne empty box.
4. **"Resetiraj filter"** dugme uvijek vidljiv kad je `isFilterEmpty
=== false`, jedan klik = clear sve filtere → canonical
   `/nova-vozila/` URL.

---

## SEO / canonical strategija

| URL pattern                           | Indexabilan? | Canonical points at |
| ------------------------------------- | ------------ | ------------------- |
| `/nova-vozila/`                       | ✅ index     | self                |
| `/nova-vozila/marke/{brand}/`         | ✅ index     | self                |
| `/nova-vozila/marke/{brand}/{model}/` | ✅ index     | self                |
| `/nova-vozila/kategorije/{cat}/`      | ✅ index     | self                |
| `/nova-vozila/?marka=audi,bmw&...`    | ❌ noindex   | `/nova-vozila/`     |
| `/rabljena-vozila/`                   | ✅ index     | self                |
| `/rabljena-vozila/?marka=...`         | ❌ noindex   | `/rabljena-vozila/` |

`/nova-vozila/?marka=audi` (single brand filter) — granični slučaj.
Mogli bismo redirectati na canonical `/nova-vozila/marke/audi/`, ali to
breakeira filter combinations s drugim params-ima. Stoga: query-filtered
URL stays canonical-different-from-self → noindex.

`<link rel="canonical">` u Page metadata server-side rendered. Filtered
pages dobivaju `<meta name="robots" content="noindex, follow">`.

---

## Implementation plan (post-CSV-arrival)

1. **DB migracija** — extensions opisane gore. Migration timestamp +
   reverse DOWN. Drizzle schema regen (ako `model_versions` ima
   Drizzle row spec) inače čisto Payload migracija jer model_versions
   je Payload-owned table.
2. **Payload collection update** — dodati nove field-ove u
   `payload/collections/ModelVersions.ts`. Regen `payload-types.ts`.
3. **`lib/catalog/filter.ts`** — generic filter parser + serializer.
   Replace existing `lib/used-cars/filter.ts` ili dijeli code.
4. **`lib/catalog/facets.ts`** — facet count helper s CTE optimizacijom.
5. **`lib/catalog/fetch.ts`** — extension za `fetchModelVersions(filter)`
   i `fetchFacets(filter)`. Reuses `unstable_cache` s collection tags.
6. **UI komponente**:
   - `components/catalog/FilterSidebar.tsx` (multi-select pill list +
     range slider + bucket chips, server-rendered, client form GET)
   - `components/catalog/ActiveFilterChips.tsx` (current filters s X
     removed individually)
   - `components/catalog/RangeSlider.tsx` (Radix or naked HTML5 range
     pair — TBD nakon UX preview)
7. **Tests**:
   - Unit: filter parser round-trip parity s multi-value
   - Unit: facet count math (no-DB shape)
   - Integration: facet endpoint vs known seed set
8. **Sitemap proširenje** — brand/category landing pages ostaju u
   sitemap-u (canonical), query-filtered URLs are NOT in sitemap.

---

## Open questions (resolved as catalog arrives)

- **Bucket presets per range** — bind to dataset quantiles ili
  hardcoded "okrugli brojevi" (npr. cijena: 10k/20k/30k…)? Default
  predlagam quantile-based; user-override per filter možda treba.
- **Equipment normalisation** — CSV vjerojatno ima slobodne string
  liste ("panorama, HUD, grijana sjedala"). Importer mora normalizirati
  na enum-y kanonske slug-ove (`panorama`, `hud`, `heated_seats`).
  Mapping table u importer config-u.
- **Brand → models cascading filter** — kad user odabere "Audi", model
  facet treba prikazati samo Audi modele. To je generalizirano kroz
  facet count strategiju (model facet computed s brand filter applied);
  zero extra logic needed.
- **Mobile UX za multi-select s 50+ opcija** — search box inside filter
  panel + scroll. Implementacija u FilterSidebar polish pass.
