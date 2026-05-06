# Katalog vozila — kako radi

Sprint 3 isporučuje cijelu `/nova-vozila/*` familiju ruta. Ovaj dokument
opisuje data flow, ISR strategiju, i kako se invalidacija cache-a planira
povezati s Payload-om u Sprint 4+.

## Rute (Sprint 3)

| URL                                    | Tip       | `revalidate` |
| -------------------------------------- | --------- | ------------ |
| `/nova-vozila`                         | hub       | 1h           |
| `/nova-vozila/marke`                   | listing   | 1h           |
| `/nova-vozila/marke/{brand}`           | dinamička | 1h           |
| `/nova-vozila/marke/{brand}/{model}`   | dinamička | 1h           |
| `/nova-vozila/kategorije`              | listing   | 1h           |
| `/nova-vozila/kategorije/{kategorija}` | dinamička | 1h           |

Sve dinamičke rute imaju `dynamicParams = true` — novo objavljena marka /
model / kategorija će se renderirati on-demand bez rebuilda.

## Data layer

`apps/web/lib/catalog/fetch.ts` je **server-only** (`import "server-only"`)
i koristi Payload local API (`getPayload({ config })` — bez HTTP-a).
Svaka funkcija je zamotana u `unstable_cache` s eksplicitnim
**cache tagovima** i `revalidate: 3600`.

| Funkcija                    | Tagovi                 |
| --------------------------- | ---------------------- |
| `getAllActiveBrands()`      | `brands`               |
| `getTopBrandsForMegaMenu()` | `brands`               |
| `getBrandBySlug()`          | `brands`               |
| `getAllActiveModels()`      | `models`               |
| `getModelsByBrand()`        | `models`, `brands`     |
| `getModelBySlugs()`         | `models`, `brands`     |
| `getRelatedModels()`        | `models`               |
| `getModelsByBodyType()`     | `models`, `body_types` |
| `getAllBodyTypes()`         | `body_types`           |
| `getBodyTypeBySlug()`       | `body_types`           |
| `getModelVersions()`        | `model_versions`       |
| `getReviewsForModel()`      | `reviews`              |

Sve `Models` queries koriste `depth: 1` da se `brand` i `body_type`
populiraju (`Model & { brand: Brand; body_type: BodyType }` — tip
`ModelWithRefs`). `isPopulated` type guard čisti slučajeve kad Payload
vrati ID umjesto objekta (defenzivno; ne događa se s `depth: 1`).

## Cache invalidation (Sprint 4+)

Trenutni TTL je 1h. U Sprint 4 se dodaje Payload `afterChange` /
`afterDelete` hook na svaku content kolekciju koji poziva
`revalidateTag('brands')`, `revalidateTag('models')`, itd. — što daje
**instantnu** invalidaciju kad admin spremi promjenu, bez čekanja TTL-a.

Trenutno: kad admin uredi marku, public katalog vidi promjenu unutar
maksimalno 1h.

## Hrvatska sortiranja

Listing-i marki i modela koriste `hrCollator` (`lib/utils/sort.ts`,
`Intl.Collator('hr', { sensitivity: 'accent' })`). Mega-menu i top-N
liste koriste `sort_order` polje (editorial control).

Slug filter na `/nova-vozila/marke` (BrandsFilteredGrid client komponenta)
koristi `String.prototype.normalize('NFD')` + strip combining marks da
"skoda" matcha "Škoda" (i obrnuto) — tako da search radi neovisno o
dijakritičkom ulazu.

## Fallback render strategija

| Asset koji vlasnik dostavlja | Fallback do tada                                                        |
| ---------------------------- | ----------------------------------------------------------------------- |
| Brand logo SVG               | Text wordmark (NAZIV velikim slovima u brand box-u) u BrandCard         |
| Model hero slika             | Silueta po `body_type.icon_svg_path` iz `public/placeholders/vehicles/` |
| Brand description_md         | Section se ne renderira (no empty paragraph)                            |
| Model versions               | "Detaljne specifikacije po verzijama bit će dostupne uskoro."           |
| Reviews                      | Sekcija se ne renderira ako lista je prazna                             |
| Related models               | Sekcija se ne renderira ako lista je prazna                             |

## SEO

- **`generateMetadata`** na svakoj dinamičkoj ruti — title, description
  (160 znakova iz `description_md` ili fallback), canonical, OG.
- **`BreadcrumbList` JSON-LD** na svim catalog rutama (`<JsonLd>` server
  komponenta + `breadcrumbsJsonLd()` builder).
- **`Vehicle` JSON-LD** na model detail stranici. Renderira samo
  populated polja (brand, model, bodyType, modelDate, fuelType, offers
  s base_price_eur). Fuel type-ovi se prevode na Schema.org engleske
  labele (`benzin → Petrol`, `hibrid → Hybrid`, ...).
- **Sitemap**: `app/sitemap.ts` spaja statične rute s dinamičkim
  catalog URL-ovima. Marke `weekly`/0.7, modeli `monthly`/0.6,
  kategorije `weekly`/0.5.

## CTA pre-fill

`requestQuoteHref({ brand?, model?, bodyType?, source })` u
`lib/catalog/cta.ts` generira `/zatrazi-ponudu?marka=...&model=...&kategorija=...&izvor=...`
URL-ove. `source` enum (`detail | brand | category | hub | header | ...`)
kontrolira `lead_requests.source` polje (Sprint 4 lead pipeline).

Slug-ovi su validirani regex-om — diakritike, uppercase, leading/trailing
hyphens i empty stringovi bacaju grešku da bug u call site-u nikad ne
završi u live URL-u.

## Mega-menu

`Header.tsx` je async server komponenta. Pri svakom render-u poziva
`getTopBrandsForMegaMenu(20)` + `getAllBodyTypes()` (oba cached 1h —
nema per-request load). Try/catch fallback prazne liste ako Payload nije
dostupan (build bez `DATABASE_URL`, transient outage).

`MegaMenu` (client) renderira 3-stupčani panel (marke, kategorije, quiz
CTA) s a11y atributima (`aria-haspopup`, `aria-expanded`,
`role="menu"/menuitem`, Escape close, click-outside close).

`MobileNav` ima accordion sekciju za "Nova vozila" — Sve nova vozila +
Sve marke + Sve kategorije + top 8 marki + sve kategorije.
