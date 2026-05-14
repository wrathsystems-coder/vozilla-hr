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

### 2026-05-12 — Sprint 5 — Dealer dashboard + cron + customer feedback

- Built: dealer portal end-to-end u svom `(dealer)/` route grupi s vlastitim `<html>/<body>` (mirrors `(admin-tools)/` pattern — no public chrome, no Payload shell). `lib/dealer/auth.ts` paralelan `lib/admin/auth.ts`: `getDealerSession()` gate-a na `user.collection === 'dealers'` (admin browse-anje /dileri/_ tretiran kao logged out i obrnuto). Pages: `/dileri/login` (React 19 `useActionState` + honeypot + IP rate-limit 10/15min + Payload `login({collection:'dealers'})` koji nasljeđuje loginAttempts/lockUntil; cookie set via `generatePayloadCookie` + `parseSetCookie()` bridge u Next cookies; generic "wrong email or password" + dedicated suspended/inactive copy; `last_login_at` best-effort; audit za login_success/failed/blocked_inactive; logoutAction clear-a cookie via `generateExpiredPayloadCookie`), `/dileri/dashboard` u nested `(authed)/` route grupi (layout poziva `requireDealer()` jednom za sve nested pages, shell = logo + dealer name + LogoutButton) — stats row iz `dealer.scoring` + leads table s `payload.find depth=2` (dealer rows + lead + brand + model) + drugi find s `lead in:` za sibling count → Carwow "+ N konkurencija" ili "samo ti" badge; status filter via `?status=` search param (no client JS); default sort `-sent_at`; empty state, `/dileri/lead/[id]` (`loadLeadDetailForDealer` 404 ako (lead, dealer) ne match-a — authorization implicit u assignment existence; competitorCount + responseRank = rank by contacted_at asc za "Tvoj odgovor je bio 2. od 5 po brzini" copy nakon close; STATUS_ORDER guard sprječava regression past states (closing→contacted OK, closed→reviewing block); ActionsPanel s tri subforme: status buttons / close + outcome dropdown + reason textarea / dealer notes), `/dileri/profil` (server-side allowlist samo phone + address fields — legal_name/OIB/email/brands/scoring/is_active su admin-only privilege-escalation surfaces; Zod validacija + field-keyed error map; ReadOnlySummary za locked fields; County dropdown iz Drizzle counties tablice sorted by sort_order), `/dileri/zaboravljena-lozinka` + `/dileri/reset/[token]` (forgot uvijek vraća isti generic success copy — no enumeration; dual rate-limit IP 10/h + email 3/24h s identical copy; magic-link template reuse + EmailSettings `dealer-password-reset` key dokumentiran ali unused do Sprint 7 dedicated template-a; GET reset validira non-destruktivno → friendly "request new" page ako stale; POST `consumeToken` atomic + `revokeTokensFor()` invalidira ostale fresh tokene za istog dilera; login picks up `?reset=ok` banner). Cron infra: `lib/cron/auth.ts` (Bearer `<CRON_SECRET>` ili `?secret=` fallback za curl, missing fails closed s 503), `/api/cron/dealer-reminders` (hourly `00 _ \* \* _`) s pure `pickAction()`decision function (sentAt, currentTime, firstSentAt, secondSentAt, alreadyExpired, status) →`send_first | send_second | expire | none`, unit-testable bez DB; runDealerRemindersTick() load-a do 500 open ('sent'|'viewed') assignments po ticku, 72h `expire`flips`reminders.expired_no_response`+ backfill missing reminder timestamps + bumps`dealer.avg_response_time_hours`to at least 72 (never down — fresh evidence outweighs prior fast leads); stops chasing kad dealer ide na contacted/closed. 3 daily crons:`/api/cron/monthly-counter-reset` (`5 0 1 _ _`1. u mjesecu 00:05 UTC, zero-a`dealer.scoring.current_month_leads`, skipa already-0 dealere, paginates 200 page-size, 50-page safety net), `/api/cron/gdpr-hard-delete` (`45 3 _ \* _`daily, finds lead.cancel audit rows >30 dana + hard-deletes lead_request + cascade lead_assignments, defensive`status==='closed'`re-check, finalni lead.hard_delete audit row koji survives 6-year audit-log rotation),`/api/cron/cleanup-expired` (`30 3 _ \* \*`daily, purges expired magic_link_tokens + rate_limit_buckets + idempotency_keys via raw Drizzle deletes — no Payload round-trip jer nisu Payload-managed).`vercel.json`u repo root deklarira sva 4 crona staggered (cleanup 03:30, hard-delete 03:45, monthly 00:05/1st, reminders hourly). 2 nove React Email template-a:`emails/dealer-reminder-1.tsx`(24h gentle nudge s Carwow competitor-count callout + hoursSinceSent),`emails/dealer-reminder-2.tsx`(48h firmer reminder s expiresInHours deadline ≤72h + ranking warning);`dispatch.ts`discriminated union gains 2 keys s default subjektima. Customer feedback flow na`/upit/[token]/`: `markDealerInterestAction(token, assignmentId, interested)`— re-validate token + confirm assignmentId belongs to lead + rate-limit per-token (30/h) + toggles`customer_feedback.marked_interested/marked_not_interested`mutually-exclusive;`markBoughtAction(token, formData)`— closes lead + sve open assignments kad customer prijavi kupnju, captures where (vozilla/elsewhere) + brand/model/notes u`lead.internal_notes`+ structured audit row, halts dealer-reminders cron (no more 24/48/72h nakon konverzije).`DealerInterestButtons`(client) optimistic toggle per assignment, hidden once`status==='closed'`. `BoughtForm`(client) collapses to single CTA until clicked, expands 3-field mini-form.`tracker-data.ts` surfaces feedback flags za pressed state. 10 commita, 41 fileova, ~3,800 dodanih linija.
- Verify: `pnpm lint` ✓, `pnpm type-check` ✓, `pnpm test` (211/211 ✓ — Sprint 5 ne dodaje nove unit testove, sav novi kod je server-action + UI integration koji Sprint 4 test infra ne pokriva), `pnpm build` clean (sve 10 Sprint 5 rute kompiliraju: 4 cron + 6 dealer pages). `pnpm placeholders:check` (242 hits, +2 vs Sprint 4 zbog `XXX_EMAIL_SIGNATURE_DEALER` u 2 nove dealer-reminder template-a — dokumentirano u PLACEHOLDERS.md).
- Otvorena za Sprint 6: postcode→lat/lng geocoding (cron `dealer-reminders` koristi sentAt thresholde, ne geo — to je više za lead-distribution refinement); customer feedback flow dani 3/14/30 (Sprint 5 covers samo on-tracker toggle + bought; scheduled email feedback sweep ostaje Sprint 6); konkurencija ranking badge u dealer dashboard-u već radi (sibling count), ali kvaliteta razlikovanja "rank by score" vs "rank by contacted_at" treba A/B kad ima production data; dealer profile **public** preview je Phase 2 placeholder (Sprint 5 covers samo `/dileri/profil` self-edit). Sprint 7 polish: dedicated `dealer-password-reset` template (sad reuse magic-link.tsx s custom heading/subject), EmailSettings runtime override za sve nove template ključeve, integration testove za cron tick funkcije (pickAction je pure ali runDealerRemindersTick treba DB-aware test setup), Vercel cron secret rotation procedura, `outcome` decomposition (free-text → structured `outcome_sold_date / outcome_vehicle_brand / outcome_vehicle_model` schema migracija), `last_login_at` best-effort koji sad swallowa errore → log-it-but-don't-fail pattern dolazi Sprint 7 kad Sentry context-aware bude.
- Ključne odluke: `(dealer)` route group s vlastitim `<html>` mirror admin-tools (no public chrome leak — dealer ne treba CookieBanner/StickyWidget); `requireDealer()` gate-a na collection mismatch (`admin@vozilla.hr` browse-anje `/dileri` = logged out, ne 500) — symmetric s admin path-om; Payload cookie reuse via `generatePayloadCookie` umjesto custom JWT — dobivamo loginAttempts/lockUntil/lockoutDuration besplatno + same-session compatibility s Payload native `/api/dealers/login`; forgot password rate-limit dual (IP 10/h + email 3/24h, identical copy) sprječava enumeration + lockout abuse iz jedne IP-a; cron auth Bearer + `?secret=` fallback (local curl convenience), fails closed s 503 ako secret missing (loud, ne silent skip); `pickAction()` pure function (sentAt, now, firstSent, secondSent, expired, status) → state-machine output — unit-testable bez DB, runDealerRemindersTick je tanki side-effect adapter; cron order: cleanup (03:30) prije hard-delete (03:45) jer hard-delete čita audit*log koji cleanup ne dira; monthly-counter-reset skipa already-0 dealere (no audit churn za 200 dealera koji nemaju leadova); 72h expire bumps `avg_response_time_hours` to \_at least* 72 (max, never down) — fresh evidence outweighs prior fast leads u monotonic rolling stat; `outcome` ostaje free-text textarea u Sprintu 5 jer schema migracija za `outcome_sold_date/brand/model` strukture je premature kad nemamo production sample distribution — Sprint 7 polish odluku odgodi until evidence; dealer-password-reset reuse magic-link.tsx je voljna kompromis za Sprint 5 (caller controls subject + heading), Sprint 7 dedicated template; customer feedback `marked_interested/not_interested` mutually-exclusive (postavljanjem jednog flag-a clear-a drugi) — modeling intent of "current opinion" ne "history of clicks" (history zapisuje audit_log); `markBoughtAction` closes lead status + sve open assignments + halts reminders cron — single canonical conversion event, ne treba poseban `lead.converted` status jer status=closed s `outcome=sold` per-assignment dovoljno opisuje state.

### 2026-05-13 — Sprint 6 — Listings, leasing, usporedba, kviz, content + search

- Built: cijeli preostali public surface — 16 novih ruta + 2 API endpointa. **Pure-function foundations** (commits 1-2): `lib/leasing-calculator/` (balloon-PMT formula `P = (PV - FV/(1+r)^n) * r / (1 - (1+r)^-n)` — FV=0 financial, FV=residual operating; cents-rounded; validation guards na sve bad inputs) + 13 unit testova (standard PMT match, zero-rate equal-installment, full-deposit zero-financing, monotonicity, operating≡financial parity at residual=0, residual-exceeds-financed throws, 4 validation guards). `lib/quiz-recommender/` (rule-based scoring MAX_SCORE=75: bodyType +20, budget proximity +15 linear-falloff, fuel +10, transmission +5, seats +10, priority +15; sort score desc + id asc tiebreak; "Električni" body answer routes bonus to EV models; "Hibrid" matches phev fallthrough; "Automatski" covers automatic+DCT+CVT; priority "cijena" composes with budget context; "pouzdanost" returns 0 u MVP-u — no reliability data) + 13 unit testova + `matchPercent()` helper za "92% match" UX. **Data layer** (commits 3-4): `lib/used-cars/{filter,fetch,options}.ts` — server fetcher s nested where (model.brand, model.body_type, model.fuel_types, model.transmissions, location.county_id) + slug-to-id resolution s zero-result guard za missing slugs + sort newest/cheapest/leastKm + `unstable_cache` tag `used_car_listings`; `parseFilter()`/`filterToQueryString()` parovi single-valued u V1 s HR-named URL params (marka/model/kategorija/pogon/mjenjac/cijena_od/godina_od/km_od/zupanija/sort/p), default sort+page=1 omitted from URL, `kmMin=0` explicitly serialised, round-trip parity tested (13 testova); `fetchUsedCarById()` + `fetchUsedCarImages()` + `fetchSimilarListings()` (two-tier same-model→same-bodyType). `lib/reviews/`, `lib/articles/`, `lib/comparisons/` server fetchers (list paginated, by-slug, latest-N, by-model/category) — sve wrapped u `unstable_cache` s collection tagovima. `lib/leasing/defaults.ts` flattens LeasingDefaults global s FALLBACK hardcoded values. `lib/pages/fetch.ts` generic getPageBySlug() for Payload pages collection. `lib/quiz/fetch.ts` — fetchModelsForRecommender() (body-type-inferred seats) + hydrateRecommendedModels(). **Lexical renderer** (commit 4): `components/lexical/render.tsx` server komponenta — walks Lexical root.children, handles paragraph/heading h1-h5/list/listitem/quote/horizontalrule/text (bold/italic/underline/strikethrough/code format bitmask)/linebreak/link+autolink (next/Link za internal, plain `<a>` za external + mailto)/block (routes to existing 5 block components via `fields.blockType`); unknown nodes render nothing + console.warn u dev. **Routes — rabljena vozila** (commits 5-6): `/rabljena-vozila/` (dynamic, parallel option-list + listings fetch, zero-JS `<form method="GET">` filter sidebar + sort pill links + ListingCard with body-type silhouette fallback + sliding 5-page pagination with ellipsis + empty state distinguishing "no results matching filter" vs "catalogue empty"); `/rabljena-vozila/oglas/[id]` (galerija s thumbnail-strip swap client komponentom + specs grid + plain-text description_md + seller block branch Salon-vs-Privatni + similar listings rail + sold/expired banner umjesto 404 za direct linkere + `Vehicle` Schema.org JSON-LD s `mileageFromOdometer`/`itemCondition: UsedCondition`/listing-specific price; CTA `?marka&model&oglas={id}&izvor=other` — `oglas` enum migracija defer Sprint 7). **Routes — leasing** (commits 7-8): `/leasing/` hub (intro + 2 cards), `/leasing/kalkulator/` (Calculator client komponenta s useDeferredValue za smooth typing + URL-state-decoupled za zero re-render, HANFA disclaimer u yellow warning box iznad rezultata iz LeasingDefaults global, CTA reads current state at click-time umjesto URL sync, financial/operating radio cards + conditional residual slider); `/leasing/vodic/` (Payload Page render via LexicalRenderer + `XXX_LEASING_VODIC_TEKST` fallback s recommended-sections checklist). **Routes — usporedba** (commits 9-10): `/usporedi/` (dynamic, `?modeli=1,2,3` max 3 deduped, empty-state surfaces ComparisonPairs kao discovery layer); ComparisonTable up-to-3 columns s "—" za missing fields + per-model CTA `source=usporedba` + "Ukloni" rebuilds URL preserving order; `/usporedi/[slug]/` (ISR 1h, `generateStaticParams` + `dynamicParams=true`, self-canonical, Lexical "Naša preporuka" + `Vehicle` JSON-LD po modelu + "Često se uspoređuje s..." cross-rail s OR clause + dedup + max 4); `scripts/seed-comparisons.ts` idempotent UPSERT na slug + `seeds/template-comparisons.csv` s 2 primjera + `pnpm seed:comparisons`. **Routes — kviz** (commits 11-12): `/pomoc-pri-izboru/` 8-step wizard (body type / budget €€ / novo-rabljeno / fuel / mjenjač / seats / usage / priority — last step nema "Preskoči") s localStorage autosave `vozilla:quiz-draft-v1` + beforeunload guard only when dirty + progress bar + Preskoči clears-and-advances; `POST /api/quiz/save` (Zod strict validation, rate-limit 10/h per IP, snapshot top-20 + raw answers, 64-hex token, 30d TTL); `/pomoc-pri-izboru/rezultati/[token]` (re-scores against live catalog — snapshot je za analytics, top-10 cards s rank + match% badge + per-model CTA `source=quiz`, noindex/nofollow + strict-origin referrer, token length 32-128 sanity-check). **Routes — content** (commit 13): 6 ruta — `/recenzije/` paginated + `/recenzije/[slug]/` (Lexical body + scores sidebar koja renders samo populated rows + pros/cons blocks + per-model CTA `source=recenzija` + Schema.org `Review` s `itemReviewed=Vehicle` + `reviewRating` na 1-10 scale + `Vehicle` JSON-LD) + `/recenzije/kategorija/[kat]/` (SSG od getBodyTypeOptions); `/savjeti/` paginated s category pills + `/savjeti/[slug]/` (Lexical + `Article` JSON-LD headline/datePublished/image/description) + `/savjeti/kategorija/[kat]/` (SSG, 4 static slugs vodici/savjeti/vijesti/tehnologija). ReviewCard + ArticleCard shared editorial components. Sitemap proširen: published reviews/articles slugs (page 1) + 4 article category index pages + comparison pairs (independent try/catch po grupi). **Search** (commit 14): `scripts/setup-search-indexes.ts` standalone (`pnpm db:setup-search`) — `CREATE EXTENSION pg_trgm` + 5 GIN trgm indexes (brands.name, models.name, reviews.title, articles.title, used_car_listings.description_md) idempotent, lives outside Drizzle/Payload migration runners; `lib/search/index.ts` parallel Payload `like` queries (ILIKE %q% via pg_trgm GIN) grouped by SearchGroup, MIN_QUERY_LENGTH=2; `GET /api/search` rate-limited 60/min s 60s edge cache; `/pretraga/?q=` server-rendered grouped + empty-state hub shortcuts (noindex); `SearchOverlay` client component fullscreen modal s autofocus + ESC + click-outside-backdrop + body-scroll-lock + AbortController-guarded 300ms debounced fetch koja keeps previous results visible (no flash), wired into Header. 15 commita ukupno, ~5,400 dodanih linija.
- Verify: `pnpm lint` ✓, `pnpm type-check` ✓, `pnpm test` (250/250 ✓ — Sprint 6 dodaje 39 nova unit testova: 13 leasing-calculator + 13 quiz-recommender + 13 used-cars-filter; total 211 → 250), `pnpm build` clean (svih 15 Sprint 6 ruta + `/api/quiz/save` + `/api/search` kompiliraju). `pnpm placeholders:check` 243 hits (+1 vs Sprint 5: `XXX_LEASING_VODIC_TEKST` dokumentirano u PLACEHOLDERS.md). `pnpm db:setup-search` verificiran end-to-end protiv lokalnog Postgres-a (pg_trgm + 5 indexes kreirani).
- Otvorena za Sprint 7 polish: `oglas` Postgres enum migracija (ALTER TYPE ADD VALUE) + reverse `/rabljena-vozila/oglas/[id]` CTA s `izvor=other` na `izvor=oglas`; `outcome_sold_date/brand/model` strukturni decomposition na lead_assignments (sad free-text textarea — odluku odgodi until production sample); Payload `afterChange/afterDelete` hookovi na all Sprint 6 collections za instant `revalidateTag` invalidaciju (sad svi čekaju 1h TTL); tsvector + `websearch_to_tsquery` upgrade preko pg_trgm-only (Sprint 6 MVP — lib/search signature ostaje stable); chained brand→model filter na `/rabljena-vozila/` (sad single-valued no-JS; multi-select fuel kad bude potrebno); colour + dodatna oprema filteri kad bude data; quiz "spremi mailom" akcija + email "share rezultati"; lightbox za /rabljena-vozila/oglas gallery (sad thumbnail-strip swap only); `LeasingDefaults` admin override propagacija (sad `revalidateTag('leasing_defaults')` ide kroz general TTL); mobile search overlay flow (sad samo desktop u header-u; mobile flows through hamburger). Sprint 7 launch checklist: Lighthouse audit svih novih ruta ≥90; CSP nonce za inline JSON-LD; Schema.org Rich Results validation production data; Cookiebot routing za buduće analytics scripts; PDF download iz Lexical content za /leasing/vodic.
- Ključne odluke: pure-function-first arhitektura (leasing-calculator + quiz-recommender testabilni bez DB) — UI ide kroz `useDeferredValue` na client + Zod validation na server; ILIKE %q% s pg_trgm GIN u MVP-u umjesto tsvector — names/titles su short, trigram fuzzy match je primjereniji; tsvector upgrade je non-breaking jer search() signature čisti (lib/search/index.ts can swap internals); search infrastructure script lives outside Drizzle/Payload migration runners — Payload-managed tablice s našim indexima neće biti "fixed away" od either schema diff engine; quiz token length 32-128 sanity-check na URL prije DB query (rejects garbage URLs cheaply); quiz re-scores against current catalog umjesto serving snapshot — model deactivation since quiz shouldn't appear, snapshot je za analytics ne za stable rendering; `/usporedi/[slug]` self-canonical (not at `?modeli=` form) — Google de-duplicates correctly when both forms scraped; `/usporedi/` no-results states surface published ComparisonPairs as discovery layer (editorial vs power-user split); used-cars `?marka=nonexistent` returns 0 results, ne ignores filter — slug-to-id resolution s explicit miss guard; sold/expired listings render with banner umjesto 404 — direct linkers (Google cache, mailing lists) shouldn't dead-end; HANFA disclaimer u yellow warning box iznad rezultata, ne fine print — HR financial advertising regulation; LeasingDefaults global drives all calculator ranges (admin/legal can adjust without code); ComparisonTable "—" placeholders for missing fields keep columns visually aligned (vs blank cells); SearchOverlay keeps previous results visible during in-flight fetch (no flash empty between keystrokes); FilterSidebar zero-JS `<form method="GET">` self-submitting (no chained brand→model dropdown in V1 — requires client JS, payoff < complexity for current catalog size); empty trailing comparison slots invite "Dodaj model →" link to catalogue (vs disabling), preserving the action affordance; LexicalRenderer unknown-node fallback renders nothing + dev console.warn — admin can add future block types without crashing public site; Article/Review Schema.org are separate JSON-LD blocks alongside Vehicle (when applicable) — Google honours linked-data graph composition.

### 2026-05-14 — Sprint 7 — In progress (1/2): polish + revalidation + email + newsletter

- Shipped 8 commita ove sesije (~30 novih unit testova; 176 → 206 unit, integration tests trebaju Docker Postgres koji nije podignut na ovoj mašini): (1) `feat(leads)` — Sprint 6 carryover dovršen: `oglas` enum value + reverse `/rabljena-vozila/oglas/[id]` CTA s `izvor=other` na `izvor=oglas`, nova Payload migracija `20260514_150158` (ALTER TYPE ADD VALUE 'oglas' BEFORE 'other' u zasebnom `db.execute`); (2) `feat(payload)` — `lib/payload/revalidate-hook.ts` factory + `makeCollectionRevalidateHooks` / `makeGlobalRevalidateHook`, wired into Brands (tags: brands, models), Models (models, brands), BodyTypes, ModelVersions, Reviews, Articles, ComparisonPairs, UsedCarListings, Pages + LeasingDefaults global → editor saves flush ISR cache instantly umjesto 1h TTL; revalidateTag throws swallow-and-log za migration-time hook fires; (3) `feat(email)` — `lib/email/settings.ts` cached EmailSettings loader (tagged `email_settings`, hook na global flush-a instant), `dispatch.ts` refactored: pure `renderTemplate()` extract za testability, per-template `enabled`/`subject_override` overrides, top-level `from_email`/`reply_to` propagated kroz sendEmail; `enabled=false` → synthetic `{ id: 'skipped:<key>' }` SendResult + console.info, no Resend cost; `sendEmail` sad podržava `replyTo` opciju (Resend `replyTo` field); (4) `feat(email)` — dedicated `dealer-password-reset.tsx` template (Sprint 5 reuse `magic-link.tsx` zamijenjen typed template-om), DispatchArgs union + renderTemplate ažurirani, dealer `zaboravljena-lozinka/actions.ts` switched na novi key; (5) `chore(email)` — stale dispatch comment refresh nakon dealer-password-reset ship; (6) `feat(email)` — `admin-new-gdpr-notification.tsx` paralelan customer-facing `gdpr-request-received`, nova migracija `20260514_154535` (ALTER TYPE enum_email_settings_templates_key ADD VALUE 'admin-new-gdpr-notification' AFTER 'admin-new-lead-notification'), wired u `/api/gdpr-request` kroz Promise.all paralelno; `lib/email/mask.ts` shared `maskEmail()` helper (first 2 chars + \*\*\* + raw domain) za reduced-PII transit logs; (7) `feat(newsletter)` — kompletan complete-but-disabled server-side pipeline: `POST /api/newsletter/subscribe` (Zod + reCAPTCHA `newsletter_subscribe` action + per-IP 10/h + per-email 3/h + honeypot, UPSERT s pending_confirmation → active state machine, consent ledger `marketing` granted, generic 200 svuda za no-enumeration), `/api/newsletter/confirm` via `/odjava-newslettera?confirm=<uuid>` (token consume), `/api/newsletter/unsubscribe` POST + GET s HMAC-signed `?email=…&sig=…` URLs (PAYLOAD_SECRET-derived per-purpose key + `timingSafeEqual`, fails closed na missing/placeholder PAYLOAD_SECRET); sve 3 endpointa vraćaju 503 kad `feature-flags.yml: newsletter` je false; `/odjava-newslettera` page server-only no-JS handle-a confirm/unsubscribe/feature-disabled outcome branches; `emails/newsletter-confirm.tsx` template; (8) `feat(newsletter)` — `components/widgets/NewsletterForm.tsx` client form (2 variants: footer, hero) wired into Footer i NewsletterCta iza `isEnabled('newsletter')` switch — disabled "Newsletter (uskoro)" copy preserved verbatim za fallback branch, jedna YAML flip aktivira live form bez code changes.
- Verify: `pnpm type-check` ✓, `pnpm lint` ✓, `pnpm test tests/unit` 206/206 ✓ (30 novih: 5 revalidate-hook, 4 email-settings, 6 email-dispatch-render → +3 nova (admin-gdpr, dealer-password-reset, newsletter-confirm), 4 email-mask, 8 newsletter-unsubscribe-sig). Integration tests fail na `Unhandled Rejection: Unknown Error: undefined` jer Docker Postgres nije pokrenut na ovoj mašini — pre-existing environment issue, nije regresija. Placeholder check 246 (+3 vs Sprint 6 close: `XXX_EMAIL_SIGNATURE_GENERIC` ponavljanja u 3 nova template-a; PLACEHOLDERS.md sweep dolazi s docs commit-om).
- Otvorena za nastavak Sprinta 7: (a) customer feedback day 3/14/30 cron + 3 React Email templates + dispatch keys (Sprint 5 carryover); (b) PDF download iz Lexical content za pravne stranice (sad disabled stub); (c) CSP policy u `next.config.ts` + nonce za inline JSON-LD; (d) Sentry SDK install + sentry.{client,server,edge}.config.ts s no-op kad DSN empty; (e) axe-core `pnpm test:a11y` script + page-level rune; (f) docs finalize — `content-editing.md`, `branding.md`, `pre-launch-checklist.md` expansion, `docs/api-routes.md` auto-gen; (g) demo cleanup admin trigger (sad `pnpm seed:cleanup-demo` CLI-only). Production-deployment items (Vercel env, Cloudflare WAF/HSTS, Resend DNS verify, prod Cookiebot/reCAPTCHA, GSC submit, admin 2FA, prod Supabase + DPA, backup dry-run) deferred per user instructions — workflow je local-only (Next dev + Docker Postgres + ngrok) do explicit go-live decision.
- Ključne odluke: EmailSettings `enabled=false` skip ne piše email_log row (samo console.info) — keeps audit-trail clean od "we tried to send but admin said no"; `skipped` kao novi enum value odlučen za later commit ako use-case za audit timeline pojavi; HMAC unsubscribe sig koristi `sha256(`vozilla:newsletter:unsubscribe:${PAYLOAD_SECRET}`)` per-purpose derived key da future PAYLOAD_SECRET re-use u drugom kontekstu ne može biti replay-an protiv unsubscribe endpoint-a; `verifyUnsubscribeSignature` normalizira email casing (lowercase + trim) prije compare-a tako da "Ana@Example.HR" iz email klijenta matcha row-a u DB; newsletter API uvijek vraća generic `{ status: 'ok' }` 200 — ne razlikuje new vs pending-resent vs already-active branch (no email enumeration); `revalidateTag` throws caught + console.warn jer Payload migration-time hooks fire izvan request scope-a (bez ovoga, migration crash-a kad pokušava bumpa Brands); collection revalidation tag sets uključuju cross-deps (Brands → tags: ['brands', 'models'] jer model pages renderiraju brand name) — over-invalidate ali isključivo brži cache miss, nikad stale data; `admin-new-gdpr-notification` paralelan dispatch s customer-facing email (`Promise.all`) — ne sequential jer admin notification je independent of customer email success; mask helper trim local part na 2 chars + raw domain — admin u inboxu može razlikovati `an***@gmail.com` od `ma***@gmail.com` bez full PII; newsletter page server-only no-JS jer flow je dispatch + render (single round-trip iz email klika, no interactivity needed); UI feature-flag switch keeps disabled branch markup verbatim — preserves Lighthouse / a11y scans + no regression risk dok backend ne bude provjereno; client recaptcha helper trenutno živi u `components/forms/LeadWizard/recaptcha.ts` (shared by 3 forms sad: LeadWizard, GdprRequestForm, NewsletterForm) — TODO Sprint 7 polish: move to `lib/recaptcha/client.ts` clean home.

---

_CLAUDE.md zadnji put ažuriran: pri kreiranju projekta. Mijenjaj samo ako se mijenjaju pravila projekta — ne za svakodnevne stvari (te idu u Progress Log)._
