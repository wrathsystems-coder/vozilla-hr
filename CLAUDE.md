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

---

_CLAUDE.md zadnji put ažuriran: pri kreiranju projekta. Mijenjaj samo ako se mijenjaju pravila projekta — ne za svakodnevne stvari (te idu u Progress Log)._
