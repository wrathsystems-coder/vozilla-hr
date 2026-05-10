# CLAUDE.md — vozilla.hr

Ovaj dokument je **trajna memorija projekta** za AI agenta koji radi na vozilla.hr. Čitaj ga pri svakoj sesiji — sadrži pravila koja se ne diskutiraju.

---

## Tko si ti

Senior fullstack developer koji radi na **vozilla.hr** — hrvatskoj verziji Carwowa (marketplace + lead generation + media za istraživanje, usporedbu i kupnju vozila u Hrvatskoj).

Tvoj stack:

- **Next.js 15** (App Router) + **TypeScript** (strict mode)
- **PostgreSQL** (preko Supabase)
- **Drizzle ORM** (preporučeno; Prisma kao alternativa ako procijeniš bolje)
- **Payload CMS 3** (self-hosted u istom Next.js kodu)
- **Tailwind CSS** za stilove
- **React Email** + **Resend** za emailove
- **Vercel** za hosting (region: Frankfurt FRA1)

---

## Glavni dokumenti za referencu (čitaj prije rada)

| Dokument                                   | Kad gledaš                                         |
| ------------------------------------------ | -------------------------------------------------- |
| `docs/spec/SPEC.md`                        | Master overview svih 7 faza                        |
| `docs/spec/01-vision-and-scope.md`         | Tko su korisnici, što je MVP                       |
| `docs/spec/02-legal-and-compliance.md`     | GDPR, OUP, cookies, captcha                        |
| `docs/spec/03-information-architecture.md` | Sitemap, sve URL-ove                               |
| `docs/spec/04-features-and-flows.md`       | Lead distribution, korisnički tokovi               |
| `docs/spec/05-data-and-systems.md`         | Schema, stack detalji                              |
| `docs/spec/06-branding-and-assets.md`      | Placeholderi, gdje ide što                         |
| `docs/spec/07-delivery-and-deployment.md`  | Sprint plan, deploy proces                         |
| `docs/PLACEHOLDERS.md`                     | Master index svih XXX vrijednosti (ti ga ažuriraš) |
| `docs/how-leads-work.md`                   | Business logika (ti je pišeš tijekom rada)         |

Ako neki spec dokument govori jedno a CLAUDE.md drugo — **CLAUDE.md je nadređen**. Spec je "što napraviti", CLAUDE.md je "kako se ponašati radeći to".

---

## 10 nepromjenjivih pravila

### 1. NIKAD ne generiraj brand assete

Logo, fotografije, hero slike, slike vozila, ikone marki, OG slike, screenshoteі — **sve ovo dodaje korisnik**. Tvoj posao je:

- Pripremi točan file path / Payload polje gdje asset ide
- Stavi placeholder file (vidno označen tekstom "PLACEHOLDER — REPLACE")
- Napiši README upute s točnim specifikacijama (dimenzije, format, težina)

**Iznimke (smiješ generirati)**: HEX kodove boja, klasične UI ikone (chevron, search, hamburger — koristi `lucide-react`), generične SVG siluete kao placeholdere po kategoriji vozila.

### 2. Sve što nije UI label je placeholder s prefiksom `XXX_` ili `[XXX_`

Marketing tekstovi, email tekstovi, "O nama" sadržaj, FAQ odgovori, hero naslovi, value propositions — **NIJEDAN takav tekst ne pišeš sam**. Stavljaš `[XXX_HERO_HEADLINE: 5-8 riječi]` ili sličnu jasnu marker. Korisnik popunjava kroz Payload admin.

UI labels su iznimka: gumb "Pošalji upit", placeholder forme "Tvoj email", error poruka "Polje je obavezno" — to pišeš na hrvatskom, ne placeholder.

### 3. Konfigurabilno > hardcoded

Sve što se može mijenjati naknadno mora biti u **`config/*.yml`** ili **Payload Settings global**:

- Boje, fontovi, radius
- Kontaktni podaci firme
- API ključevi (u `.env`)
- Težine algoritma (lead distribution)
- Default kamatne stope leasinga
- Threshold-ovi (reCAPTCHA score, rate limit, dealer reminder hours)
- Feature flag-ovi

Ako ja vidim hardcoded vrijednost koja izgleda kao da bi mogla biti config — **ja ti vraćam refactor**. Bolje provjeri prije commit-a.

### 4. Hrvatski jezik svuda gdje korisnik vidi

UI, error poruke, validacije, email tekstovi (osim XXX placeholdera koje korisnik popunjava), placeholder tekstovi forme, success poruke, breadcrumbs — sve na hrvatskom s **obaveznim hrvatskim znakovima** (č, ć, š, đ, ž).

Komentari u kodu mogu biti na engleskom (TS standard), commit message-i isto, dokumentacija u `docs/` može biti na engleskom ako je tehnički, ali **netehnički dokumenti (`content-editing.md`, `branding.md`, `PLACEHOLDERS.md`) na hrvatskom**.

### 5. GDPR by default, ne kao naknadna razmišljanja

- **Privola prije obrade** — checkbox NIJE pre-checked
- **Audit log** za sve promjene koje diraju osobne podatke
- **Soft delete + retention period** — ne hard delete odmah
- **Logiranje privola** — timestamp, IP, user-agent, koji obrazac
- **Pravo na zaborav** — implementirano end-to-end (ne samo "obriši row")
- **Cookies** — nikakav non-essential JS prije privole (ni GA, ni Pixel, ni Hotjar, ništa)
- **Magic link tokens** — secure (UUID v4 + entropy, kratki TTL, single-purpose)

### 6. Pristupačnost (a11y) WCAG 2.1 AA — minimum, ne aspiration

- Sve forme: labelirane (`<label for>` ili `aria-label`), error poruke `aria-describedby`, fieldset/legend gdje treba
- Sve slike: ALT text obavezan (i u Payloadu obavezno polje)
- Tipkovnička navigacija full (Tab, Enter, Esc rade na svakom interaktivnom elementu)
- Focus styles vidljivi (ne ukloni outline bez zamjene)
- Color contrast ≥ 4.5:1 za body, ≥ 3:1 za UI
- Skip-to-content link na vrhu svake stranice
- ARIA roles gdje native HTML ne pokriva (modals, tabs, dropdowns)

CI ima axe-core check — fail = ne deploy.

### 7. Atomični commit-i s opisnim porukama

Format: `<type>(<scope>): <opis>` (Conventional Commits)

- `feat(leads): add 4-step lead request wizard`
- `fix(forms): handle disconnected network on step 3`
- `chore(deps): update Drizzle to 0.30`
- `docs(branding): document logo replacement steps`
- `refactor(payload): extract Vehicle block to shared component`

Jedan commit = jedna logička promjena. **Ne miješaj** feature + bugfix + refactor u isti commit.

### 8. Testiraj prije commit-a

Lokalno mora proći:

```bash
pnpm lint && pnpm type-check && pnpm test && pnpm placeholders:check && pnpm build
```

Ako bilo što fail-a, fix prije commit-a. Ako se ne može fix u razumnom vremenu, otvori jasan TODO komentar + napomena u commit message.

### 9. Pravne stranice ne diraj — pripremaj kostur

Stranice `opci-uvjeti`, `politika-privatnosti`, `politika-kolacica`, `impressum` imaju **prazan kostur s placeholder tekstom**. Korisnik popunjava sadržaj kroz Payload. Tvoj posao:

- Stranica radi i renderira Payload sadržaj
- Sadržaj defaulta je `[XXX_OUP_TEKST: pravnik dostavlja]`
- Datum zadnje izmjene se automatski ažurira
- PDF download iz iste sadržajnice radi
- Stranica je dostupna **prije** cookie privole (ne traži JS / cookie da se otvori)

Impressum je iznimka: agent **automatski generira** content iz `config/company.yml` + Payload Settings. Korisnik samo popunjava `XXX_` vrijednosti, ne piše tekst impressuma.

### 10. Pitaj prije velikih promjena

Ako planiraš:

- Zamijeniti library (npr. Drizzle za Prisma, ili obrnuto)
- Mijenjati Payload schema na način koji traži migraciju + data transform
- Refaktorirati komponentu kojom se koristi >5 mjesta
- Dodati eksternu integraciju koja nije u SPEC.md
- Mijenjati URL strukturu nakon Sprint 2

→ napiši **kratki plan** (3-5 rečenica), ostavi pull request u "draft" stanju, pričekaj odobrenje.

Ako je promjena lokalna (jedna komponenta, jedan endpoint, jedan utility) — samo radi.

---

## Workflow po zadatku

1. **Pročitaj relevantnu spec sekciju** prije početka
2. **Razradi plan** (extended thinking ako je task složen)
3. **Postavi pitanja** ako nešto nije jasno — bolje pitati nego nagađati
4. **Implementiraj malim koracima** — commit nakon svakog logičkog kroka
5. **Testiraj lokalno** — i sam, i tražiš user-testing ako je end-to-end tok
6. **Update dokumentacije** ako si promijenio API, schema ili config
7. **Update `docs/PLACEHOLDERS.md`** ako si dodao nove XXX vrijednosti
8. **Update `CLAUDE.md` "Progress Log"** sekciju (vidi dnu) na kraju značajnog rada

---

## Hrvatski specifikum (provjeri uvijek)

| Stavka             | Format / pravilo                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------- |
| **OIB**            | 11 znamenki, validacija checksumom — utility u `lib/utils/oib.ts`                         |
| **MBS**            | Matični broj subjekta, max 9 znamenki                                                     |
| **Telefon**        | Prihvati `+385 XX XXX XXXX`, `0XX XXX XXXX` — normaliziraj u E.164 (`+385...`) u bazi     |
| **Datum**          | `DD.MM.YYYY.` (s točkama) — ne `YYYY-MM-DD` u UI-ju                                       |
| **Vrijeme**        | `HH:mm` (24h)                                                                             |
| **Cijena**         | `12.345,67 €` (točka tisućice, zarez decimala, € na kraju s razmakom)                     |
| **Poštanski broj** | 5 znamenki, prvi 1-5                                                                      |
| **Županije**       | 21 ukupno (20 + Grad Zagreb), seed u `seeds/counties-hr.json`                             |
| **Sortiranje**     | Hrvatski abecedni red: a, b, c, č, ć, d, dž, đ, e, f, ... — koristi `Intl.Collator('hr')` |
| **URL slug**       | Bez dijakritika (`skoda-octavia`, ne `škoda-octavia`) — ASCII-safe                        |
| **Marka, model**   | Capitalized u UI (`Audi A4`), lowercase u slug-u (`audi-a4`)                              |

Utility funkcije (agent obvezan napraviti rano u Sprintu 1):

- `lib/utils/format.ts` — `formatPrice()`, `formatDate()`, `formatPhone()`, `formatPostcode()`
- `lib/utils/validate.ts` — `validateOIB()`, `validatePhoneHR()`, `validatePostcodeHR()`, `validateEmail()`
- `lib/utils/slug.ts` — `slugify()` koja briše dijakritike

---

## Komande koje često koristiš

```bash
# Razvoj
pnpm dev                          # dev server (Next + Payload)
pnpm build                        # production build (uključuje placeholder check)
pnpm start                        # production server lokalno

# Baza
pnpm db:migrate                   # apply Drizzle migracije
pnpm db:studio                    # Drizzle Studio (DB GUI)
pnpm db:push                      # push schema bez migracije (samo dev!)

# Seed
pnpm seed                         # pokreni sve seed skripte
pnpm seed:vehicles                # CSV importer marki/modela
pnpm seed:demo                    # demo dileri + leadovi
pnpm seed:cleanup-demo            # obriši sve is_demo=true zapise

# Testovi
pnpm test                         # Vitest unit + integration
pnpm test:watch                   # watch mode
pnpm test:e2e                     # Playwright e2e
pnpm test:a11y                    # axe-core a11y test

# Quality
pnpm lint                         # ESLint
pnpm type-check                   # TS bez emit
pnpm placeholders:check           # XXX guard skripta

# Payload
pnpm payload generate:types       # regeneriraj TS tipove iz Payload schema
pnpm payload migrate              # Payload migrations
pnpm payload seed                 # Payload seed (initial admin etc)
```

---

## Slash komande projekta (`.claude/commands/`)

Custom workflow-i za uobičajene zadatke:

| Komanda                      | Što radi                                         |
| ---------------------------- | ------------------------------------------------ |
| `/checkpoint`                | Spremi progres (commit + summary u Progress Log) |
| `/new-page <slug>`           | Kreiraj novu stranicu po template-u              |
| `/new-block <name>`          | Kreiraj novi Lexical block za Payload editor     |
| `/audit-a11y <path>`         | Accessibility audit jedne stranice               |
| `/audit-perf <path>`         | Performance audit jedne stranice                 |
| `/seed-from-csv <file>`      | Import seed CSV u bazu                           |
| `/payload-collection <name>` | Generiraj novu Payload kolekciju s defaults      |
| `/email-template <name>`     | Kreiraj novi React Email template                |

Definicije ovih komandi su u `.claude/commands/*.md` — čitaj ih prije korištenja.

---

## Što NE radiš

❌ Ne mijenjaš stack (Next/Postgres/Drizzle/Payload) bez razgovora  
❌ Ne dodaješ npm pakete bez razloga — provjeri može li se rješenje napisati u <50 linija  
❌ Ne pišeš inline komentare tipa `// this saves the user` — kod govori za sebe; komentiraj samo **zašto** (non-obvious decisions, gotchas), ne **što**  
❌ Ne pišeš generic boilerplate / "future-proofing" — pišemo to što treba sada  
❌ Ne refaktoriraš tuđi kod usput — fokus na zadatak  
❌ Ne deploy-aš ako placeholder-check fail-a u produkcijskom buildu  
❌ Ne piši testove za getter-e, type definicije ili druge trivijalnosti — testiraj logiku  
❌ Ne koristi `any` u TypeScriptu osim ako je apsolutno nužno + komentar zašto  
❌ Ne koristi browser localStorage / sessionStorage za sensitive data — ide u httpOnly cookies  
❌ Ne piši CSS u `<style>` tagove ili inline `style={{}}` — sve preko Tailwind-a (jedinе iznimke: dinamički computed style koji ne ide u theme tokens)  
❌ Ne koristi `Date.now()` ili `new Date()` direktno za business logiku — koristi `lib/utils/time.ts` da možemo mock-ati u testovima

---

## Sigurnosne i operacijske obveze (samostalno provjeravaš)

- **CSP header** definiran u `next.config.ts`, ažuriran kad dodaješ novi external script
- **CSRF token** na svim POST forme (Next.js 15 ima built-in helper)
- **Rate limit** na svim public API endpointima (Upstash Redis ili Supabase RPC)
- **Zod schema** validacija na svim API endpoint inputima (server-side)
- **Audit log** entry pri svakoj admin akciji koja mijenja stanje
- **`noindex, nofollow`** meta tag na: `/admin/*`, `/dileri/*`, `/upit/[token]/*`
- **Resend SPF/DKIM/DMARC** verificirani — ne šalji emailove bez ovoga (admin postavlja)
- **Sentry** captures errors automatski (ti samo dodaješ context kad treba)

---

## Definicija "gotov" za sprint

Sprint je **gotov** kad:

- ✅ Svi deliverables iz `07-delivery-and-deployment.md` za taj sprint su implementirani
- ✅ `pnpm build` prolazi
- ✅ `pnpm test` prolazi (uključujući e2e za sprintove 4+)
- ✅ `pnpm placeholders:check` prolazi (ili novi XXX-ovi su dokumentirani)
- ✅ Lokalni demo radi end-to-end za novi feature
- ✅ Vercel preview deployment uspješan
- ✅ "Verify" uvjeti iz spec sekcije su zadovoljeni
- ✅ Progress Log ažuriran (vidi dno ovog dokumenta)
- ✅ User je verificirao demo (ako tok ima user-facing dio)

---

## Progress Log

Ažuriraj na kraju svakog značajnog rada. Format:

```
## YYYY-MM-DD — Sprint X — kratki naslov
- Što je napravljeno (3-5 bullet pointa, max)
- Otvorena pitanja / TODO za sljedeću sesiju
- Ključne odluke (samo ako je nešto netrivijalno odlučeno)
```

### 2026-05-02 — Sprint 0 — Initial Setup

- Scaffolded: pnpm workspace (Node 22.x, pnpm 9.15.0), Next.js 15 + TS strict + Tailwind 4 (CSS-first), Drizzle + docker-compose Postgres 16 + lazy `getDb()`, Payload CMS 3 (admin route, REST/GraphQL, withPayload), React Email + Resend stub with dev console fallback, all 5 config files (`company.yml`, `theme.ts`, `lead-distribution.yml`, `widgets.yml`, `feature-flags.yml`), placeholder-check script + Husky pre-commit/pre-push + Vitest (slug util + 4 tests), all 15 docs (PLACEHOLDERS.md is the master XXX index), `.env.example` at root, 8 slash commands. 11 commits.
- Verify pipeline: `pnpm test` (4 ✓), `pnpm lint`, `pnpm type-check`, `pnpm placeholders:check` (111 hits in dev mode, expected), `pnpm build` (with stub env vars) all pass. Build now runs `placeholders:check` first — fails strict in CI (`NODE_ENV=production`), reports-only locally.
- Otvorena za Sprint 1: rename `admins` collection slug → `admin_users` per spec section 5; commit `apps/web/payload-types.ts` after first `payload generate:types`; finalize brand HEX before Sprint 7; provision external services (Supabase, Vercel, Resend, reCAPTCHA, Cookiebot) — owner action.
- Ključne odluke: Drizzle final (Prisma alternativa otklonjena), Cookiebot final (Iubenda otklonjena), Tailwind 4 (CSS-first @theme, no `tailwind.config.ts`), lazy `getDb()` umjesto module-level throw, Husky 9 sa minimal pre-commit (lint-staged + placeholders) i pre-push (type-check + test). Auth collection inline u `payload.config.ts` za Sprint 0 — extract u Sprint 1.

### 2026-05-02 — Sprint 1 — Schema + Seed

- Built: AdminUsers extracted (slug renamed to `admin_users`, role enum, 2FA placeholder); HR utility funkcije (format, validate, oib s ISO 7064 checksum, sort sa hrCollator, time mockable wrappers) + 37 unit testova; 8 Drizzle raw tablica (counties, consent_log, audit_log, magic_link_tokens, rate_limit_buckets, newsletter_subscribers, quiz_results, email_log) + prva migracija; 18 Payload kolekcija (BodyTypes, VehicleAttributes, Brands, Models, ModelVersions, Reviews, Articles, Pages, ComparisonPairs, Media, Dealers, DealerUsers, UsedCarListings, UsedCarImages, LeadRequests s 6 admin tabova, LeadAssignments, GdprRequests); 5 core Lexical blocks (HeroImage, SpecsTable, ProsCons, CtaButton, DisclaimerBox) + javni renderer-i; 6 Payload globals (Settings, MarketingCopy, EmailSettings, LeadDistribution, LeasingDefaults, WidgetSettings); seedovi (counties-hr.json, postcodes-counties-hr.json, body-types.json, template-vehicles.csv, sample-dealers.csv, sample-leads.json) + importeri (`pnpm seed`, `seed:vehicles`, `seed:demo`, `seed:cleanup-demo`) sa explicit step logging; auto-doc generator (`pnpm generate:docs` → `docs/database-schema.md` + `docs/feature-flags.md`).
- Verify: `pnpm test` (37/37 ✓), `pnpm lint`, `pnpm type-check`, `pnpm build` (svi route-i kompiliraju), `pnpm seed` end-to-end (counties 21, body_types 10, brands 2, models 3, dealers 6, leads 10).
- Otvorena za Sprint 2: payload-types.ts će se regenerirati pri svakom collection change (commit-aj refresh u commit-u koji mijenja schema); Payload "no email adapter" + "sharp not installed" warninzi (hoisting issue, fix Sprint 7); 5 odgođenih Lexical blokova (Gallery, ComparisonEmbed, YouTubeEmbed, Quote, FAQ, Stats, ImageWithText) — dodaju se kad prvi consumer Sprint zatraži.
- Ključne odluke: Counties stays Drizzle raw (no SQL FK to Payload tables — app-level Zod validation); VehicleAttributes je flexible key-value; Lexical blokovi 5 core u Sprintu 1, ostali deferred; Payload `push: false` u postgresAdapter (default `true` je pokušao obrisati Drizzle-managed tablice — koristimo eksplicitne migracije via `pnpm payload migrate`); seed orchestrator zove funkcije u istom procesu (no subprocess — silent hangs zbog stdout buffering-a).

### 2026-05-06 — Sprint 2 — Public site kostur

- Built: multi-root layout split (`(public)` i `(payload)` svaki vlastiti `<html>`/`<body>`); Header sticky z-50 sa desktop nav-om i CTA-om + MobileNav drawer (ESC, backdrop click, lucide ikone); Footer (3 link kolone, disabled newsletter UI, dynamic copyright via `time.now()`); Theme tokens 1:1 mirror `config/theme.ts` → `globals.css` `@theme`; 7 UI primitiva (Button, Container, Heading, Input, Textarea, Select, Card); `/test/branding` playground; naslovnica s 10 sekcija (Hero, ValueProps, HowItWorks, CategoriesGrid, PopularBrands empty state, RecentReviews empty state, TrustSignals, QuizCta, NewsletterCta, FinalCta); 404 + 500 + catch-all router; SEO infra (sitemap.ts s 20 ruta, robots.ts s disallow `/admin /api /dileri /upit`, OG/Twitter, Organization + WebSite + SearchAction + FAQPage JSON-LD); siteUrl validation s 8 testova (45/45 ukupno); 5 statičnih stranica (O nama, Kontakt, Kako funkcionira, FAQ s 20-question akordionom, Kako provjeravamo recenzije); 5 pravnih stranica (OUP/PP/PK preko LegalPageShell-a, Impressum auto-gen iz `XXX_COMPANY_*`, GDPR zahtjev shell); Cookiebot loader gated on `NEXT_PUBLIC_COOKIEBOT_ID`. 17 commita.
- Verify: `pnpm test` (45/45 ✓ — 8 novih site-url testova), `pnpm lint`, `pnpm type-check`, `pnpm build` (23 rute kompiliraju), `pnpm placeholders:check` (235 hits — sve dokumentirano u PLACEHOLDERS.md, sweep pri Sprint 7 launch checklistu). Smoke test svih nove ruta + multi-root + 404 + Cookiebot oba slučaja.
- Otvorena za Sprint 3: SVG siluete vozila po kategoriji u `/public/placeholders/vehicles/` (deferirano — dodaje se kad katalog stigne i bude trebao ikone); Payload Pages render po slugu zamijeniti inline `[XXX_*_TEKST]` placeholdere u statičnim/pravnim stranicama (Sprint 3+ svaki kako consumer treba); PDF download wire iz Lexical content-a (Sprint 7 polish); kad analytics (GA4 / PostHog / Meta Pixel) stignu u kasnijim sprintovima, **eksplicitno provjeriti da idu kroz Cookiebot consent layer** (auto-blocking ne pokriva inline / non-standardne skripte — flag-ano u memory/cookiebot_consent_layer.md).
- Ključne odluke: multi-root layout pattern — admin chrome i public chrome odvojeni, Cookiebot ide samo na public; raw Tailwind boje sweep-ane na brand tokene u jednom commitu nakon dodavanja primitiva (ne incrementally); `cn` helper namjerno preskočen — plain template literali za className composition, no clsx/tailwind-merge; Button je button-only (link CTA-i ostaju kao styled `<Link>` + brand tokeni); empty state pattern za PopularBrands/RecentReviews umjesto fake demo data; legal pages share LegalPageShell jer struktura je 95% ista; Impressum auto-gen iz inline `XXX_COMPANY_*` markera (no YAML fetch — Settings loader dolazi Sprint 4); `siteUrl()` throw-a na missing/non-http(s) scheme umjesto auto-prefix-a (fail loud na env config bug, Vercel UI mistake je real risk); catch-all route `(public)/[...catchAll]` jer Next.js multi-root ne dopušta `app/not-found.tsx` bez root layout-a; Cookiebot u dev no-op kad `XXX_` ili unset (env presence = on/off toggle, no separate feature flag).

### 2026-05-06 — Sprint 3 — Katalog vozila

- Built: cijela `/nova-vozila/*` familija — hub, `/marke` (A–Z + client-side NFD-normalised search filter), `/marke/[brand]` (generateStaticParams + dynamicParams), `/marke/[brand]/[model]` (Vehicle JSON-LD, ModelSpecsTable za model_versions, related models same-body_type, recenzije s graceful empty), `/kategorije`, `/kategorije/[kategorija]` (filter by brand). Svi `revalidate=3600`. Reusable presentational layer u `components/catalog/`: BrandCard (text wordmark fallback), CategoryCard (silueta), ModelCard, ModelsByBodyTypeFilter (client, dropdown by body_type ili by brand), BrandsFilteredGrid, ModelSpecsTable. Server-only data layer (`lib/catalog/fetch.ts`) preko Payload local API + `unstable_cache` s eksplicitnim cache tagovima (`brands`, `models`, `body_types`, `model_versions`, `reviews`) i `depth=1` populacijom za `Model & { brand, body_type }` (`ModelWithRefs` + `isPopulated` type guard). 11 generic vehicle siluete u `public/placeholders/vehicles/{slug}.svg` (currentColor stroke, viewBox 0 0 200 80) + brand-wordmark fallback + javni README HR. SEO: `<JsonLd>` server komponenta + `breadcrumbsJsonLd()` builder + `vehicleJsonLd()` (renderira samo populated polja, fuel type-ovi se prevode u Schema.org engleski); `BreadcrumbList` na svim catalog rutama, `Vehicle` na model detail; sitemap proširen dynamic-ima (marke/modeli/kategorije s `lastModified=updatedAt`). Header postaje async server komponenta — desktop `<MegaMenu>` (3-stupčani panel: top 20 brands + sve kategorije + quiz CTA, full a11y, click-outside + Esc) + mobile accordion za "Nova vozila"; try/catch fallback prazne liste ako Payload nije dostupan (build bez DB). `requestQuoteHref({ brand?, model?, bodyType?, source })` validira slug-ove (no diakritike/uppercase/leading-hyphens) i emit-a `/zatrazi-ponudu?marka=...&model=...&kategorija=...&izvor=...` URL-ove. 12 commita.
- Verify: `pnpm test` (68/68 ✓ — 6 breadcrumbs, 11 cta, 6 vehicle-jsonld), `pnpm lint`, `pnpm type-check`. Trenutno samo 3 modela u CSV-u — empty/sparse states gracefully degrade-aju u UI-ju. Demo seed proširenje (commit 13) dolazi sljedeće.
- Otvorena za Sprint 4: Payload `afterChange`/`afterDelete` hook-ovi → `revalidateTag('brands' | 'models' | ...)` za instantnu invalidaciju cache-a (trenutno čeka 1h TTL); pravi brand logoi u `public/branding/brands/{slug}.svg` (text wordmark je trenutni fallback); CSP nonce za `<script type="application/ld+json">` (Sprint 7 polish kad CSP stigne); Vehicle JSON-LD validate na Google Rich Results Test kad katalog dobije slike i version pricing; `lib/catalog/fetch.ts` može dobiti integration testove kad imamo DB-aware test setup (Sprint 4+ vitest s docker-compose Postgres).
- Ključne odluke: server-only fetcheri preko Payload local API (no HTTP, isti proces), wrapped u `unstable_cache` s tagovima da Sprint 4 hook-ovi mogu instant-invalidirati; `dynamicParams=true` na svim dinamičkim rutama (novi modeli ne traže rebuild); `ModelWithRefs` tip + `isPopulated` type guard umjesto `as any` casta jer Payload `number | Brand` union je legitimno; Header je sad async i čita Payload — fail-safe try/catch jer build bez `DATABASE_URL` ne smije rušiti site (degraded mega-menu još uvijek ima link na `/nova-vozila/marke`); brand logo fallback je text wordmark (ne SVG generated) — agent NE generira brand assete; vehicle siluete OK (generične, no brand element); search na `/marke` je client-side filter s NFD normalizacijom umjesto API endpoint-a (mali skup, no debounce treba) — pravi globalni `tsvector` search ide Sprint 6; `Vehicle` JSON-LD render-a samo populated polja umjesto null defaults da Schema.org markup ostane validan dok katalog ne popunjen; sitemap je sada async + cached 1h, ima graceful fallback na statične rute ako Payload nedostupan.

### 2026-05-10 — Sprint 4 — Lead flow

- Built: cijeli kupac-do-dilera lifecycle. Schema (commit 1) — proširen `LeadRequests.source` enum na 11 CtaSource vrijednosti (1:1 frontend↔DB), `whatsapp` u preferred_contact_method, conditional `leasing_type`, `quality_score_at_dispatch` snapshot na LeadAssignments, nova Drizzle `idempotency_keys` tablica. Lib temelji (commits 2-7): typed `feature-flags.ts` reader + Payload-override hook, magic-link tokens (issue/validate/markUsed/consume/revoke), DB-backed rate-limit (atomic upsert s CASE WHEN reset-or-increment), consent + audit + email logging helpers (sendEmail sad uvijek logs queued/sent/failed), reCAPTCHA v3 verify (block/review/dev_bypass + math fallback Sprint 7), haversine distance + postcode→county lookup. API + UI (commits 8-15): GET /api/lookup/postcode/[code] (rate-limited, day-cached), 6 React Email templates + dispatch wrapper (discriminated union za type-safe call sites), lead-distribution scoring + suggest (Carwow rule: closest always in top-N), POST /api/leads (Zod + reCAPTCHA + rate-limit + honeypot + idempotency + Payload create + magic-link + 2 emaila + consent/audit logs), 4-step wizard `/zatrazi-ponudu/` s draft autosave + beforeunload guard + postcode autofill + reCAPTCHA invisible + idempotency-key per mount + uspjeh stranica, sticky widget (8s/40% scroll trigger, 24h dismiss, sessionStorage prefill handoff), `/upit/[token]/` tracker s soft-delete cancel + `/provjeri-upit/` resend (generic 200, no enumeration), `/api/gdpr-request` + funkcionalna GDPR forma. Admin (commit 16): custom Next.js route `/admin-tools/lead-dispatch/[id]` u svom (admin-tools) route grupi, gated by `requireAdmin()` Payload-session helper, auto-suggest 5 dilera s score breakdown + Carwow badge, server action `dispatchToDealers` koji idempotentno kreira lead_assignments + bumpa monthly counters + transition lead status='sent' + dispatch N lead-to-dealer email-ova s competitorCount=N-1 + audit row. Test infra: setup.ts loada `.env.local`, `fileParallelism: false` za DB-touching test files, `server-only` + `@payload-config` aliases u vitest.config, `jsx: "automatic"` esbuild override za React Email render-anje. Playwright e2e (commit 17): chromium-only golden path test koji walka cijeli wizard i verificira VZ-... display id na uspjeh stranici. 18 commita.
- Verify: `pnpm test` (211/211 ✓ — 9 magic-link, 8 rate-limit, 7 logging, 10 recaptcha, 6 postcode lookup, 10 email dispatch, 8 + 10 lead-distribution, 12 + 14 api-leads + validate, 12 lead-wizard, 9 sticky-widget, 8 tracker, 9 gdpr-request, 5 dispatch-to-dealers, 12 geo, 6 feature-flags + others). `pnpm test:e2e` (1/1 ✓ chromium golden path 15s). `pnpm lint`, `pnpm type-check`, `pnpm build` clean. `pnpm placeholders:check` (240 hits — 5 nova XXX\_ za email signature placeholders dokumentirana u PLACEHOLDERS.md, neto -2 jer je `/gdpr-zahtjev` mailto stub zamijenjen funkcionalnom formom).
- Otvorena za Sprint 5: dealer login + dashboard + status mutations (viewed/contacted/closed); Vercel cron jobs — dealer reminders 24h/48h/72h, monthly counter reset (`dealer.scoring.current_month_leads = 0`), 30-day hard delete za soft-deleted lead rows, expired idempotency_keys + rate_limit_buckets + magic_link_tokens cleanup; customer-side dealer interest marking (zainteresiran / nezainteresiran / kupio sam vozilo); konkurencija ranking badge u dealer dashboardu. Sprint 6: postcode→lat/lng geocoding (trenutno county-centroid lookup za 6 major cities); customer feedback flow (dani 3, 14, 30). Sprint 7 polish: EmailSettings runtime override za dispatch (sad direct passthrough), Payload override za feature-flags + recaptcha thresholds + lead-distribution weights, math fallback za blokirani reCAPTCHA, dedicated `admin-new-gdpr-notification` template, monthly counter reset cron + idempotency_keys cleanup cron, real `payload migrate:create` ALTER TYPE ADD VALUE u zasebnom tx-u (vec radi ali fragile pattern), Schema.org Vehicle/Lead JSON-LD validation na production data.
- Ključne odluke: separate `idempotency_keys` tablica umjesto reuse `rate_limit_buckets` (cleaner debugging + audit + distinct retention TTL); custom Next.js `/admin-tools/*` route u svom route group umjesto Payload custom view (manje friction, čistiji TS, ne sukobljuje s Payload-ov `admin/[[...segments]]` catch-all); reCAPTCHA classified essential (anti-fraud legitimate interest, ne treba consent); GDPR cancel = soft delete u Sprintu 4 + 30-day cron Sprint 5 — anonimizira PII s deterministic SHA-256 hash, phone postaje `+385000000000` placeholder (satisfies HR regex za required field), audit row drži samo email_hash; `dispatchToDealers` idempotentno na (lead, dealer) UNIQUE — re-dispatch skipa postojeće parove + ne double-bumpa counter; React Email render umetne `<!-- -->` separator između susjednih JSX expressions — testirati substring asercije s template literali (`{`${value} unit`}`) ne `{value} unit`; vitest config: `jsx: "automatic"` (ne classic, da React Email templati rade), `server-only` aliased na no-op stub (Next virtual modul), `fileParallelism: false` (DB tests share tables); soft delete leaves customer_phone="+385000000000" + customer_email="deleted-<hash>@vozilla.invalid" — Payload required-check pass + visible-anonymized; Carwow Closest-Always-In-Top-N rule: če closest dealer nije u top-N po score-u, drop-aj lowest top-scorer i insert-aj closest, sortiraj closest na poziciju 1 za "Najbliži" badge UX; `e2e` recaptcha helper vraća `"dev-bypass-token"` placeholder umjesto `""` jer Zod traži min(1) — server SECRET key env je primary check za dev_bypass.

---

_CLAUDE.md zadnji put ažuriran: pri kreiranju projekta. Mijenjaj samo ako se mijenjaju pravila projekta — ne za svakodnevne stvari (te idu u Progress Log)._
