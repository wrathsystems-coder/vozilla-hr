# Seeds — vozilla.hr

Inicijalni podaci za bazu i demo data za testing.

## Pokretanje

Iz root-a:

```bash
pnpm seed                  # counties (Drizzle) + body_types (Payload), idempotentno
pnpm seed:vehicles         # marke + modeli iz template-vehicles.csv (UPSERT brand+slug)
pnpm seed:demo             # demo dealers + leads (skip ako već postoje)
pnpm seed:cleanup-demo     # briše sve is_demo=true zapise + leadovi @example.com
```

`pnpm seed` mora se pokrenuti prvi (counties i body_types su FK target za sve ostalo).

## Datoteke

| File                         | Tip          | Opis                                                                        |
| ---------------------------- | ------------ | --------------------------------------------------------------------------- |
| `counties-hr.json`           | seed         | 21 hrvatskih županija (Drizzle `counties` tablica)                          |
| `postcodes-counties-hr.json` | runtime data | Top 10 prefiksa za `/api/lookup/postcode/{code}` (Sprint 4)                 |
| `body-types.json`            | seed         | 10 tipova karoserija (Payload `body_types`)                                 |
| `template-vehicles.csv`      | template     | Header + 20 demo redova (10 marki). Vlasnik nadopunjuje, importer UPSERT-a. |
| `sample-dealers.csv`         | demo         | 6 demo dilera s valjanim OIB-evima i `@example.com` emailovima              |
| `sample-leads.json`          | demo         | 10 demo leadova s `@example.com` emailovima, raznolik request_type/status   |

## Format `template-vehicles.csv`

UTF-8, comma-separated. Pipe-separated (`|`) za `fuel_types` i `transmissions`.

| Polje                  | Tip                                         | Primjer                             |
| ---------------------- | ------------------------------------------- | ----------------------------------- |
| `brand_slug`           | ASCII string                                | `audi`                              |
| `brand_name`           | HR display                                  | `Audi`                              |
| `model_slug`           | ASCII per-brand jedinstven                  | `a4`                                |
| `model_name`           | HR display                                  | `A4`                                |
| `body_type_slug`       | mora postojati u body-types.json            | `limuzina`                          |
| `segment`              | A/B/C/D/E/F/J/M/S                           | `D`                                 |
| `year_from`, `year_to` | godine                                      | `2015`, `2026`                      |
| `base_price_eur`       | početna cijena                              | `40000`                             |
| `fuel_types`           | `benzin\|dizel\|hibrid\|phev\|ev\|lpg\|cng` | `benzin\|dizel\|hibrid`             |
| `transmissions`        | `manual\|automatic\|dct\|cvt`               | `manual\|automatic`                 |
| `hero_image_filename`  | file u `apps/web/public/branding/vehicles/` | `audi-a4.jpg`                       |
| `description_short`    | 1-2 rečenice                                | `"Premium..."` (escape zarez s `"`) |
| `is_active`            | `true`/`false`                              | `true`                              |

Importer UPSERT-a po `(brand_slug, model_slug)` paru — ponovni import ažurira postojeće zapise.

## Demo cleanup

`pnpm seed:cleanup-demo` briše:

- Dealers s `is_demo: true` (sve iz `sample-dealers.csv`)
- UsedCarListings s `is_demo: true`
- LeadRequests gdje `customer_email` sadrži `@example.com`

**OBAVEZNO** prije produkcijskog deploya. Provjeri u `docs/pre-launch-checklist.md`.

## Postcode mapping limitations

`postcodes-counties-hr.json` koristi 2-znamenkasti prefix mapping za top 10 gradova.
Za rubne slučajeve (npr. 10310 Sveti Ivan Zelina je u Zagrebačkoj županiji, ne Gradu
Zagreb) prefix može vratiti netočnu županiju.

Sprint 4 API (`/api/lookup/postcode/{code}`) tretira nepronađen kod kao `null`;
korisnik tada ručno odabire županiju iz dropdowna.
