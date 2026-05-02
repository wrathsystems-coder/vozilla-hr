# Faza 7 — Tehnička isporuka i deploy

Ovaj dokument definira **kako će se izgrađivati** projekt — strukturu repa, sprint plan, testiranje, deploy proces, pre-launch checklist i post-MVP roadmap.

---

## Filozofija (iz Anthropic best practices)

> **"Explore first, plan, then code"** — agent ne piše prvi commit dok nema plan razrađen.  
> **"Verify your work"** — svaki korak ima jasne uvjete uspjeha (testovi, build success, lighthouse).  
> **"Use checkpoints"** — git commit nakon svakog logičkog koraka, lako rollback.  
> **"CLAUDE.md is the source of truth"** — sva pravila projekta tu, agent čita pri svakoj sesiji.

---

## Struktura repozitorija

Single-repo monolit. `/apps/web/` u korijenu, ostalo na istoj razini.

```
vozilla-hr/
│
├── .claude/
│   ├── commands/                  Custom slash komande za agenta
│   │   ├── checkpoint.md
│   │   ├── new-page.md
│   │   ├── new-block.md
│   │   ├── audit-a11y.md
│   │   ├── audit-perf.md
│   │   ├── seed-from-csv.md
│   │   ├── payload-collection.md
│   │   └── email-template.md
│   └── settings.json              Allowed tools, project config
│
├── apps/
│   └── web/                       Glavna aplikacija (Next.js + Payload)
│       ├── app/                   Next.js App Router
│       │   ├── (public)/          Public stranice (group route)
│       │   │   ├── page.tsx       /
│       │   │   ├── nova-vozila/
│       │   │   ├── rabljena-vozila/
│       │   │   ├── leasing/
│       │   │   ├── usporedi/
│       │   │   ├── recenzije/
│       │   │   ├── savjeti/
│       │   │   ├── pomoc-pri-izboru/
│       │   │   ├── zatrazi-ponudu/
│       │   │   ├── upit/[token]/
│       │   │   ├── za-dilere/
│       │   │   ├── opci-uvjeti/
│       │   │   ├── politika-privatnosti/
│       │   │   ├── politika-kolacica/
│       │   │   ├── impressum/
│       │   │   ├── gdpr-zahtjev/
│       │   │   ├── kontakt/
│       │   │   ├── o-nama/
│       │   │   ├── cesta-pitanja/
│       │   │   ├── kako-funkcionira/
│       │   │   ├── kako-provjeravamo-recenzije/
│       │   │   ├── pretraga/
│       │   │   ├── odjava-newslettera/
│       │   │   └── layout.tsx     Public layout (header, footer)
│       │   ├── (dealer)/          Dealer portal
│       │   │   ├── dileri/
│       │   │   │   ├── login/
│       │   │   │   ├── dashboard/
│       │   │   │   ├── lead/[id]/
│       │   │   │   ├── profil/
│       │   │   │   └── zaboravljena-lozinka/
│       │   │   └── layout.tsx     Dealer layout
│       │   ├── (admin)/           Admin (Payload routes)
│       │   │   └── admin/         Payload generira automatski
│       │   ├── api/               Next.js API routes
│       │   │   ├── leads/
│       │   │   ├── gdpr-request/
│       │   │   ├── newsletter/
│       │   │   ├── lookup/postcode/[code]/
│       │   │   ├── quiz/save/
│       │   │   ├── webhook/resend/
│       │   │   └── cron/dealer-reminders/
│       │   ├── test/branding/     Dev playground
│       │   ├── 404.tsx
│       │   ├── 500.tsx
│       │   ├── sitemap.ts         Auto-generated
│       │   ├── robots.ts          Auto-generated
│       │   └── globals.css        Tailwind base + custom
│       │
│       ├── components/
│       │   ├── ui/                Base komponente (Button, Input, Card, ...)
│       │   ├── forms/             Form komponente (LeadWizard, ContactForm, ...)
│       │   ├── layout/            Header, footer, mobile nav
│       │   ├── widgets/           Sticky widget, cookie banner
│       │   ├── vehicle/           VehicleCard, SpecsTable, ...
│       │   ├── lead/              LeadStatusBadge, DealerSuggestList, ...
│       │   ├── icons/             Custom SVG ikone (ako lucide nije dovoljan)
│       │   └── ...
│       │
│       ├── lib/
│       │   ├── db/                Drizzle config + schemas
│       │   │   ├── schema/
│       │   │   ├── migrations/
│       │   │   └── client.ts
│       │   ├── auth/              Auth helpers (Payload + magic link)
│       │   ├── email/             Email sending logic
│       │   ├── recaptcha/         reCAPTCHA verification
│       │   ├── analytics/         GA4 + PostHog wrappers (cookie-aware)
│       │   ├── feature-flags.ts   Feature flag reader
│       │   ├── rate-limit.ts
│       │   ├── lead-distribution/ Score algorithm
│       │   ├── leasing-calculator/
│       │   ├── quiz-recommender/
│       │   └── utils/
│       │       ├── format.ts
│       │       ├── validate.ts
│       │       ├── slug.ts
│       │       ├── sort.ts
│       │       └── time.ts
│       │
│       ├── payload/
│       │   ├── collections/       Sve kolekcije
│       │   ├── globals/           Settings, MarketingCopy, ...
│       │   ├── blocks/            Lexical custom blocks
│       │   ├── access/            Access control helpers
│       │   ├── hooks/             Payload hooks
│       │   └── payload.config.ts
│       │
│       ├── emails/                React Email template-i
│       ├── public/
│       │   ├── branding/          Placeholder logo, favicon, OG (vlasnik)
│       │   ├── placeholders/      Generic SVG siluete (agent)
│       │   ├── fonts/             (ako self-hosted custom)
│       │   └── manifest.json
│       │
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       │
│       ├── scripts/
│       │   ├── seed.ts
│       │   ├── seed-vehicles.ts
│       │   ├── seed-comparisons.ts
│       │   ├── seed-demo.ts
│       │   ├── seed-cleanup-demo.ts
│       │   └── ...
│       │
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── drizzle.config.ts
│       ├── tsconfig.json
│       ├── playwright.config.ts
│       ├── vitest.config.ts
│       └── package.json
│
├── seeds/                         Seed data (CSV/JSON, vlasnik popunjava)
│   ├── README.md
│   ├── template-vehicles.csv      Template + 2-3 primjera
│   ├── template-comparisons.csv
│   ├── counties-hr.json           Agent generira (fixne vrijednosti)
│   ├── postcodes-counties-hr.json
│   ├── body-types.json
│   ├── sample-dealers.csv         Demo
│   └── sample-leads.json          Demo
│
├── config/
│   ├── company.yml                Podaci o firmi (XXX placeholderi)
│   ├── theme.ts                   Boje, fontovi
│   ├── lead-distribution.yml      Težine algoritma
│   ├── widgets.yml                Sticky widget config
│   └── feature-flags.yml          Sve feature flag-ove
│
├── scripts/                       Build / utility skripte (root level)
│   ├── check-placeholders.ts      Guard skripta
│   ├── generate-docs.ts           Auto-doc generator
│   └── ...
│
├── docs/
│   ├── README.md                  Index docs
│   ├── architecture.md
│   ├── database-schema.md         Auto-generated
│   ├── api-routes.md              Auto-generated
│   ├── deployment.md
│   ├── local-dev.md
│   ├── content-editing.md         GLAVNI netehnički dokument
│   ├── branding.md
│   ├── PLACEHOLDERS.md            Master placeholder index
│   ├── feature-flags.md           Auto-generated
│   ├── backup-recovery.md
│   ├── gdpr-vendors.md
│   ├── pre-launch-checklist.md
│   ├── seo.md
│   ├── accessibility.md
│   ├── security.md
│   ├── how-leads-work.md          Business logika u ljudskom jeziku
│   ├── post-launch-roadmap.md     Phase 2+ plan
│   └── spec/                      Originalni blueprint dokumenti
│       ├── README.md
│       ├── SPEC.md
│       ├── 01-vision-and-scope.md
│       ├── 02-legal-and-compliance.md
│       ├── 03-information-architecture.md
│       ├── 04-features-and-flows.md
│       ├── 05-data-and-systems.md
│       ├── 06-branding-and-assets.md
│       └── 07-delivery-and-deployment.md
│
├── CLAUDE.md                      Agent reads every session
├── README.md                      Glavni vidljivi README na GitHubu
├── LICENSE
├── .env.example                   Svi potrebni env vars (XXX vrijednosti)
├── .gitignore
├── .nvmrc                         Node verzija
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml            (ako monorepo)
```

---

## Sprint plan (8 sprintova)

Svaki sprint ima:
- **Cilj** — što se postiže
- **Deliverables** — konkretne stavke
- **Verify** — kako znamo da je gotov
- **Estimate** — okvirni timeframe (orijentacijski)

### Sprint 0 — Setup (1-2 dana)

**Cilj**: Working dev environment s svim alatima.

**Deliverables**:
- [ ] Inicijaliziraj Next.js 15 + TypeScript + Tailwind
- [ ] Setup Drizzle + Supabase connection (env vars, schema folder)
- [ ] Setup Payload CMS 3 u Next.js-u (basic config, auth)
- [ ] Setup React Email + Resend integration
- [ ] `.env.example` s svim potrebnim varijablama (sve XXX)
- [ ] `config/` folder sa svim YAML/TS file-ovima
- [ ] Base `CLAUDE.md` u korijenu (kopirano iz blueprintа)
- [ ] `docs/` folder sa svim placeholder dokumentima
- [ ] `pnpm placeholders:check` skripta (radi, integrirana u build)
- [ ] `/test/branding` playground (prazan kostur, samo dev mod gate)
- [ ] Vercel projekt kreiran, prvi deployment uspješan
- [ ] Supabase projekt kreiran, connection radi
- [ ] Cloudflare DNS setup (priprema, domena ako je dostupna)
- [ ] CLAUDE.md "Progress Log" prvi unos

**Verify**:
- `pnpm dev` pokreće Next + Payload admin (na različitim portovima ili routes)
- `pnpm build` prolazi (uključuje placeholder check)
- `pnpm test` prolazi (jedan smoke test)
- Vercel preview URL radi
- Supabase connection iz dev environment-a radi
- Payload admin na `/admin` zatraži kreaciju super_admin-a (prvi login)

---

### Sprint 1 — Schema i Seed (2-3 dana)

**Cilj**: Sve baza tablice + Payload kolekcije + osnovni seed.

**Deliverables**:
- [ ] Sve Payload kolekcije: Brands, Models, ModelVersions, BodyTypes, VehicleAttributes, UsedCarListings, Dealers, DealerUsers, Reviews, Articles, Pages, ComparisonPairs, GdprRequests, AdminUsers, LeadRequests, LeadAssignments
- [ ] Sve Payload globals: Settings, MarketingCopy, EmailSettings, LeadDistribution, LeasingDefaults, WidgetSettings
- [ ] Sve Drizzle raw tablice: counties, consent_log, audit_log, magic_link_tokens, rate_limit_buckets, newsletter_subscribers, quiz_results, email_log
- [ ] Drizzle migracije applied
- [ ] Seed: counties (21 zapisa), body_types (10 zapisa), postcodes-counties mapping
- [ ] Format `seeds/template-vehicles.csv` + 2-3 primjera + dokumentacija u `seeds/README.md`
- [ ] Demo seed: sample-dealers.csv (5-10), sample-leads.json (20-30)
- [ ] CSV importer `pnpm seed:vehicles` (idempotent, UPSERT)
- [ ] Cleanup skripta `pnpm seed:cleanup-demo`
- [ ] Auto-generated `docs/database-schema.md`
- [ ] Hrvatski utility funkcije: format, validate, slug, sort, time
- [ ] Unit testovi za utility-je (Vitest)

**Verify**:
- Migracija prolazi clean (`pnpm db:migrate`)
- `pnpm seed` puni demo data, vidljivo u Payload admin
- `pnpm seed:vehicles` import-a vehicles.csv bez grešaka
- Drizzle Studio prikazuje sve tablice
- Unit testovi za OIB, telefon, format, slug — svi prolaze
- `pnpm placeholders:check` prolazi (svi novi XXX dokumentirani)

---

### Sprint 2 — Public site kostur (3-4 dana)

**Cilj**: Layout + statične stranice + sve pravne stranice (placeholder content).

**Deliverables**:
- [ ] Layout (header, footer, mobile nav, hamburger menu)
- [ ] Logo placeholderi (SVG s "PLACEHOLDER" tekstom) u `/public/branding/`
- [ ] Generic SVG siluete u `/public/placeholders/vehicles/`
- [ ] Naslovnica:
  - Hero (placeholder)
  - Value props (3-4 placeholder boxes)
  - How it works (3 koraka, placeholder)
  - Popularne marke grid
  - Recent reviews (4 cards, demo data)
  - Kategorije grid
  - Newsletter signup (UI, disabled)
  - Final CTA
- [ ] Statične stranice (s Payload Pages content):
  - O nama, Kontakt, Kako funkcionira, FAQ (20 pitanja-okvira), Kako provjeravamo recenzije
- [ ] Pravne stranice (Payload Pages s [XXX_*] placeholderima):
  - Opći uvjeti, Politika privatnosti, Politika kolačića
- [ ] Impressum auto-generiran iz `company.yml` + Settings global
- [ ] 404 i 500 stranice (custom dizajn, brand boje)
- [ ] sitemap.xml i robots.txt auto-generated
- [ ] Schema.org markup (Organization, WebSite + SearchAction)
- [ ] OG tags + Twitter Card defaults
- [ ] Cookie banner integracija (Cookiebot ili Iubenda) — granularne kategorije
- [ ] /test/branding playground popunjen (Button, Input, Card, Header, Footer, ...)

**Verify**:
- Lighthouse na home: Performance ≥ 90, A11y ≥ 90, BP ≥ 90, SEO ≥ 95
- Sve stranice load bez greške (lokalno + Vercel preview)
- 404 i 500 stranice testirane
- Cookie banner se prikazuje, granularne privole, ne učitava analytics prije privole
- /test/branding renderira sve komponente
- axe-core: zero serious/critical violations
- Vercel preview: sve stranice dostupne

---

### Sprint 3 — Katalog vozila (3-4 dana)

**Cilj**: Brands, models, kategorije — full SEO + ISR.

**Deliverables**:
- [ ] `/nova-vozila/` hub (popularne marke, kategorije, top recenzije)
- [ ] `/nova-vozila/marke/` — lista svih marki (ABC sortirano hrvatski)
- [ ] `/nova-vozila/marke/{marka}/` — brand stranica (sve modele, info)
- [ ] `/nova-vozila/marke/{marka}/{model}/` — model stranica (specs, slike, recenzije, CTA, related)
- [ ] `/nova-vozila/kategorije/{kategorija}/` — filter po kategoriji
- [ ] ISR (revalidate svake 1h)
- [ ] Schema.org: Vehicle, BreadcrumbList
- [ ] Pretraga po katalogu (basic, full-text)
- [ ] Mega-menu na "Nova vozila" u header-u
- [ ] Pre-fill query params na CTA-ima

**Verify**:
- Sve dinamičke rute rade (test 5+ marki, 10+ modela)
- Schema.org validira na Google Rich Results Test
- Lighthouse na model stranici ≥ 90
- Breadcrumbs vidljivi i klikabilni
- Mega-menu radi na desktop i mobile
- ISR revalidate kontroliran (provjeri u Vercel logs)

---

### Sprint 4 — Lead flow (4-5 dana)

**Cilj**: Glavna funkcionalnost — kupac šalje upit, admin obrađuje, diler dobiva.

**Deliverables**:
- [ ] `/zatrazi-ponudu/` 4-step wizard (full validation, progress bar, back/next, save draft)
- [ ] Sticky widget (kratka forma, trigger logika)
- [ ] reCAPTCHA v3 integracija (server verify)
- [ ] Honeypot + rate limit
- [ ] Email pipeline:
  - lead-confirmation (kupcu)
  - lead-to-dealer (dileru, template ready)
  - magic-link (kupcu, tracker)
  - admin-new-lead-notification (adminu)
  - gdpr-request-received i resolved
  - dealer-password-reset
- [ ] Magic link tracker `/upit/[token]/` (status timeline, akcije za kupca)
- [ ] Admin lead processing UI:
  - Lista upita (filter, sort, search)
  - Detalj upita
  - Auto-suggest 5 dilera (najbliži + top 4 by score)
  - Manual override
  - Akcije (pošalji, spam, zatvori, traži dodatne info)
- [ ] Lead distribution algoritam (`lib/lead-distribution/`)
- [ ] Audit log entries za sve admin akcije
- [ ] Consent log za GDPR privole
- [ ] GDPR zahtjev forma `/gdpr-zahtjev/` + admin obrada

**Verify**:
- E2E test (Playwright): full lead flow od početka do kraja
- Email-i pristižu u Resend test inbox
- Magic link radi, token validation, expiration
- Admin može odabrati 5 dilera i poslati
- Diler dobiva email + vidi u dashboardu (basic)
- Rate limit testiran (6. submit u 15 min odbijen)
- reCAPTCHA score handled correctly (test sa fake niskim score-om)
- GDPR zahtjev radi end-to-end

---

### Sprint 5 — Dealer dashboard (2-3 dana)

**Cilj**: Light dealer portal.

**Deliverables**:
- [ ] `/dileri/login/` (email + password, Argon2id)
- [ ] `/dileri/dashboard/` — lista leadova, statistika basic
- [ ] `/dileri/lead/{id}/` — detalj, akcije (pregledao, kontaktirao, zatvori s ishodom)
- [ ] `/dileri/profil/` — edit vlastitih podataka
- [ ] `/dileri/zaboravljena-lozinka/` — magic link reset (TTL 1h)
- [ ] Auto-podsjetnici cron job (Vercel Cron):
  - 24h: prvi mail dileru
  - 48h: drugi mail + admin notification
  - 72h: marker "expired-no-response", update score
- [ ] Konfiguracija u Payload Settings (sat-osi)
- [ ] Konkurencija sekcija ("Lead poslan još 4 dilerima")
- [ ] Dealer profile public preview (Phase 2 placeholder)

**Verify**:
- Diler login → dashboard → vidi leadove
- Status mijenja u dashboardu → admin vidi update real-time (ili pri refresh-u)
- Cron job triggers correctly (test lokalno + na Vercel preview)
- Reset password mail-om radi
- Suspended diler ne dobiva nove leadove

---

### Sprint 6 — Listings, leasing, usporedba, kviz (4-5 dana)

**Cilj**: Sve preostale public funkcionalnosti.

**Deliverables**:
- [ ] `/rabljena-vozila/` listings + filter sidebar
- [ ] `/rabljena-vozila/oglas/{id}/` — detalj
- [ ] `/leasing/kalkulator/` — informativni kalkulator s HANFA disclamerom
- [ ] `/leasing/vodic/` — info stranica
- [ ] `/usporedi/` — dinamička usporedba (do 3 modela)
- [ ] `/usporedi/{a}-vs-{b}/` — pre-generated SEO stranice (top 50)
- [ ] CSV importer za comparison pairs (`pnpm seed:comparisons`)
- [ ] `/pomoc-pri-izboru/` — kviz 8 pitanja
- [ ] Quiz scoring algoritam (`lib/quiz-recommender/`)
- [ ] `/pomoc-pri-izboru/rezultati/{token}/` — token-based rezultati
- [ ] CTA-i kontekstualni svuda (pre-fill query params)
- [ ] Globalna pretraga `/pretraga/` (full-text Postgres tsvector)
- [ ] Recenzije i savjeti renderiraju iz Payload Lexical content

**Verify**:
- Filter rabljenih radi na sve kombinacije
- Leasing kalkulator točno računa (unit testovi)
- Disclamer vidljiv iznad rezultata
- Usporedba dinamička i pre-generated obje rade
- Schema.org validira (Vehicle, Product na comparison)
- Quiz tok kompletan, rezultati relevantni (manualno provjeri 5 različitih kombinacija)
- Globalna pretraga vraća rezultate iz svih kolekcija

---

### Sprint 7 — Polish, compliance, pre-launch (3-5 dana)

**Cilj**: Production-ready.

**Deliverables**:
- [ ] Sve pravne stranice imaju kostur (vlasnik popunjava sadržaj kroz Payload)
- [ ] Cookiebot/Iubenda fully integriran, sve kategorije, granularna privola, log
- [ ] Newsletter forma (UI gotov, backend pipeline kompletan, **disabled** feature flag)
- [ ] Sentry error tracking aktivan
- [ ] sitemap.xml i robots.txt finalni
- [ ] Schema.org svuda validan
- [ ] Performance audit: sve stranice ≥ 90
- [ ] A11y audit: zero serious/critical, manual screen reader test
- [ ] Security audit: CSP testiran, headers OK, CSRF na formama, rate limit svuda
- [ ] Backup procedure dokumentirana, testiran restore
- [ ] `docs/pre-launch-checklist.md` 100% pass
- [ ] `docs/content-editing.md` finalan (vodič za admin korisnika)
- [ ] `docs/branding.md` finalan
- [ ] `docs/PLACEHOLDERS.md` ažuriran, svi XXX dokumentirani
- [ ] `docs/post-launch-roadmap.md` napisan
- [ ] Demo content cleanup (admin gumb radi, dokumentirano)
- [ ] Resend SPF/DKIM/DMARC verificirani
- [ ] Cloudflare WAF + bot protection postavljeni
- [ ] HSTS preload submit zatraženo
- [ ] Production .env varijable na Vercel-u
- [ ] Admin nalog produkcijski s 2FA
- [ ] Sitemap submit u Google Search Console

**Verify**:
- Pre-launch checklist 100% checked
- Lighthouse production ≥ 90 svuda
- E2E svi prolaze
- Manualni QA cijelog site-a
- Vlasnik projekta pregleda i odobrava
- Final go-live: makni `noindex` iz `robots.txt`, deploy

---

## Testiranje (minimalno ali ciljano)

### Vitest unit testovi

`tests/unit/`:
- `oib.test.ts` — OIB validation s checksum
- `phone.test.ts` — HR phone parsing/normalization
- `format.test.ts` — formatPrice, formatDate, formatPhone, formatPostcode
- `validate.test.ts` — email, postcode, telephone
- `slug.test.ts` — slugify s dijakritikama
- `leasing-calculator.test.ts` — PMT formula, edge cases
- `quiz-recommender.test.ts` — scoring algorithm
- `lead-distribution.test.ts` — quality_score, dealer ranking, throttling
- `recaptcha-handler.test.ts` — score thresholds

### Vitest integration testovi

`tests/integration/`:
- `api/leads.test.ts` — POST /api/leads (validacija, reCAPTCHA, rate limit, DB insert, email trigger)
- `api/gdpr-request.test.ts` — POST /api/gdpr-request
- `api/magic-link.test.ts` — token validation, expiration, single-use
- `payload/lead-actions.test.ts` — admin send to dealers, status transitions
- `cron/dealer-reminders.test.ts` — reminder logic timing

### Playwright e2e

`tests/e2e/`:
- `lead-submission.spec.ts` — full kupac flow: home → model page → wizard → submit → success → tracker
- `admin-lead-processing.spec.ts` — admin login → upit detalj → odaberi dilere → pošalji
- `dealer-dashboard.spec.ts` — diler login → vidi lead → mark contacted → mark outcome

### Komande
```bash
pnpm test                    # all unit + integration
pnpm test:watch              # watch mode
pnpm test:e2e                # Playwright
pnpm test:a11y               # axe-core integration
```

CI: agent obvezan da svi prolaze pre-merge.

---

## CI/CD

### Vercel built-in (jedini CI u MVP-u)
- Lint: `pnpm lint` (ESLint)
- Type-check: `pnpm type-check` (TS bez emit)
- Build: `pnpm build` — uključuje:
  - `pnpm placeholders:check` (fail u produkciji ako XXX postoji)
  - `next build`
  - `payload build`
- Deploy: automatski iz `main` (production) i feature branches (preview)

### Pre-commit hooks (lokalno)
- Husky + lint-staged
- `pre-commit`: ESLint na staged files + TS type-check + format
- `pre-push`: full `pnpm test`

### GitHub Actions (NE u MVP-u)
Ako kasnije trebamo: lint + test + e2e u GitHub-u (paralelno s Vercelom). Za MVP nepotrebno.

---

## Staging / Environment management

### Bez zasebnog projekta
- **Production**: deploy iz `main` branch-a → `vozilla.hr`
- **Preview**: Vercel automatski deploy za svaki PR / branch → `https://vozilla-hr-{branch}.vercel.app`
- **Development**: lokalno (`pnpm dev`)

### Branch strategija
- `main` — production-ready, protected
- `develop` (opcijsko, agent može preskočiti ako jednostavnije bez)
- `feature/*` — feature branches, mergaju u main preko PR-a
- `fix/*` — bugfix branches

### Database environments
- **Production**: dedicated Supabase project, region EU
- **Preview**: shared Supabase project (preview-vozilla) — agent obvezan ne mješati production data
- **Development**: lokalni Supabase (Docker) ili shared dev project

### Env varijable
`.env.example` — sve potrebne varijable s XXX vrijednostima.
`.env.local` — lokalni dev (NE commit-aj, u `.gitignore`).
Vercel project settings — production env vars (encrypted).

---

## Production deployment koraci

Detaljno u `docs/deployment.md`. Sažetak:

1. **Vercel projekt**:
   - Region: FRA1 (Frankfurt)
   - Framework: Next.js
   - Build: `pnpm build`
   - Env vars: sve iz `.env.example` s production vrijednostima
   - Domain: `vozilla.hr` (custom domain)

2. **Supabase production projekt**:
   - Pro plan, EU region
   - Pooler connection string u Vercel env
   - DPA potpisan
   - Daily backup uključen

3. **DNS / Cloudflare**:
   - DNS records → Vercel
   - Proxy enabled
   - SSL/TLS strict, HSTS aktivan
   - WAF basic rules
   - Page Rules za caching static assets

4. **Email (Resend)**:
   - Domain `vozilla.hr` verified
   - SPF, DKIM, DMARC records dodani u Cloudflare DNS
   - Test email u Inbox (ne Spam) na Gmail, Outlook, Yahoo

5. **reCAPTCHA**:
   - Production site key + secret key
   - Domain `vozilla.hr` whitelisted
   - Score thresholds tested

6. **Cookiebot / Iubenda**:
   - Site setup, language: HR
   - Categories: Necessary, Functional, Statistics, Marketing
   - Production ID u env

7. **Payload migrate** na produkciji:
   - `pnpm payload migrate` (one-time)
   - Initial admin kreiran s 2FA

8. **Seed produkcijski podaci**:
   - Real marke/modele iz CSV-a (ne demo)
   - Comparison pairs
   - Counties (već u kodu kao seed)

9. **Test full flow** na produkciji:
   - Test lead submission (s tvojim emailom)
   - Test email pristiže
   - Test cookie banner
   - Test magic link tracker

10. **Go-live**:
    - Makni `noindex` iz `robots.txt`
    - Submit sitemap u Google Search Console
    - Otvori za promet

---

## `docs/pre-launch-checklist.md` (kostur)

Detaljni dokument koji agent generira u Sprintu 7. Ovdje sažetak (~80 stavki, 8 sekcija):

### 1. Brand & sadržaj
- [ ] Logo paket zamijenjen
- [ ] Favicon paket zamijenjen
- [ ] OG images dodane
- [ ] Brand boje finalizirane
- [ ] Sve XXX_ vrijednosti popunjene
- [ ] Marketing tekstovi popunjeni
- [ ] Pravne stranice imaju finalni tekst
- [ ] FAQ popunjen
- [ ] O nama, kontakt, kako funkcionira popunjeni
- [ ] Email template tekstovi popunjeni
- [ ] Demo dileri obrisani
- [ ] Demo leadovi obrisani
- [ ] Demo recenzije obrisane
- [ ] `pnpm placeholders:check` zero hits

### 2. Konfiguracija
- [ ] Production env vars na Vercelu
- [ ] reCAPTCHA produkcijski ključevi
- [ ] Resend produkcijski + verified domain
- [ ] Cookiebot/Iubenda produkcijski ID
- [ ] Supabase production projekt
- [ ] Cloudflare proxy + SSL strict
- [ ] HSTS aktivan
- [ ] CSP testiran

### 3. Pravno
- [ ] Cookies blokirane prije privole
- [ ] Cookie banner radi i loguje
- [ ] GDPR forma radi
- [ ] Privola nije pre-checked
- [ ] OUP, PP, PK dostupni prije privole
- [ ] PDF download verzija radi
- [ ] DPO email u config-u
- [ ] Newsletter feature flag = false
- [ ] HANFA disclamer na leasing kalkulatoru
- [ ] DSA "kako provjeravamo recenzije" stranica

### 4. Tehnički
- [ ] `pnpm build` prolazi
- [ ] `pnpm test` prolazi
- [ ] `pnpm test:e2e` prolazi
- [ ] Lighthouse production: Perf/A11y/BP ≥ 90, SEO ≥ 95
- [ ] Core Web Vitals zelen
- [ ] axe-core: zero serious/critical
- [ ] sitemap.xml validan
- [ ] robots.txt validan
- [ ] Schema.org validan
- [ ] OG tags validan
- [ ] 404 i 500 imaju korisne poruke
- [ ] Sentry hvata errore

### 5. Sigurnost
- [ ] reCAPTCHA + honeypot + rate limit na svim formama
- [ ] Zod validacija na svim API endpointima
- [ ] CSRF na svim POST formama
- [ ] Argon2id hashanje
- [ ] Admin 2FA
- [ ] Magic link tokens secure (UUID + entropy)
- [ ] Audit log radi
- [ ] Backup testiran

### 6. Email
- [ ] SPF, DKIM, DMARC postavljeni
- [ ] Test email u Inbox (Gmail, Outlook, Yahoo)
- [ ] Unsubscribe link funkcionalno
- [ ] Reply-to address radi
- [ ] Lead confirmation izgleda dobro mobile + desktop

### 7. SEO
- [ ] Google Search Console verified
- [ ] Sitemap submitted
- [ ] hreflang="hr" na svim stranicama
- [ ] Canonical URLs ispravni
- [ ] Meta title/description na svim stranicama

### 8. Operativno
- [ ] Admin nalog s jakom lozinkom + 2FA
- [ ] Backup dokumentiran i testiran
- [ ] Sentry alerts postavljeni
- [ ] On-call kontakti dokumentirani
- [ ] Roadmap za prvi mjesec post-launch

---

## Slash komande projekta (`.claude/commands/`)

Definirane u `.md` fileovima u `.claude/commands/`. Agent ih poziva s `/komanda` u sesiji.

### `/checkpoint`
```markdown
# /checkpoint

Spremi trenutni progres:
1. Provjeri da nema uncommitted changes osim ovih namijenjenih commit-u
2. Run `pnpm test` i `pnpm placeholders:check`
3. Ako prolazi, git commit s opisnim message-om
4. Update CLAUDE.md "Progress Log" sekciju s novim entry-jem
5. Push na remote (preview deployment kreira se automatski)
6. Sažeto izvještaj korisniku: što je napravljeno, što slijedi
```

### `/new-page <slug>`
```markdown
# /new-page

Kreiraj novu stranicu po template-u:
1. Kreiraj `app/(public)/{slug}/page.tsx`
2. Kreiraj odgovarajući Payload Page entry s placeholder content-om
3. Dodaj u sitemap (auto-generated, samo provjeri da renderira)
4. Dodaj breadcrumb support
5. SEO meta defaults (h1 → title, content prvih 160 → description)
6. Schema.org BreadcrumbList markup
7. Test render lokalno
```

### `/new-block <name>`
```markdown
# /new-block

Kreiraj novi Lexical custom block za Payload:
1. Definiraj block schema u `payload/blocks/{name}.ts`
2. Kreiraj React komponentu u `components/blocks/{name}.tsx`
3. Registriraj u Lexical config-u
4. Dodaj u dozvoljeni blocks listi za relevantne kolekcije
5. Test u Payload editoru: dodaj instance, render-aj na public stranici
```

### `/audit-a11y <path>`
```markdown
# /audit-a11y

Run accessibility audit na specifičnoj stranici:
1. Pokreni axe-core na danom path-u
2. Output svi violations (severity: serious / critical / moderate / minor)
3. Predloži fixove za najkritičnije
4. Update `docs/accessibility.md` ako su novi obrasci
```

### `/audit-perf <path>`
```markdown
# /audit-perf

Run performance audit:
1. Lighthouse run na danom path-u
2. Output Core Web Vitals + score breakdown
3. Identificiraj bottlenecks (LCP, INP, CLS)
4. Predloži optimizacije
5. Mjeri bundle size (next/bundle-analyzer)
```

### `/seed-from-csv <file>`
```markdown
# /seed-from-csv

Import CSV u bazu:
1. Validiraj CSV format (header match, required fields)
2. Parse + validate svaki red
3. UPSERT u relevantnu tablicu
4. Report: X created, Y updated, Z errors
5. Audit log entry
```

### `/payload-collection <name>`
```markdown
# /payload-collection

Kreiraj novu Payload kolekciju s defaults:
1. Schema u `payload/collections/{name}.ts`
2. Default access control (admin only za sad, korisnik kasnije popunjava)
3. Hooks za audit log
4. Auto-generated TS tipovi
5. Update `payload.config.ts`
6. Migrate baza ako je potrebno
```

### `/email-template <name>`
```markdown
# /email-template

Kreiraj novi React Email template:
1. File `emails/{name}.tsx`
2. Koristi `_layout.tsx` shared layout
3. Default sadržaj s [XXX_*] placeholderima
4. Preview u dev (`/admin/email-preview/{name}`)
5. Feature flag entry u EmailSettings global
6. Update `docs/email-templates.md`
```

---

## `docs/post-launch-roadmap.md` (Phase 2+)

### Phase 2 (3-6 mjeseci nakon launch-a)

#### Pripremljeno u MVP-u (samo aktivacija)
- [ ] **Newsletter** — feature flag flip, aktivacija. Pipeline već postoji.
- [ ] **Dark mode** — uključi `next-themes`. CSS varijable već strukturirane.
- [ ] **Korisnički računi** — magic link tokens evolve u full auth.
- [ ] **GA4 + PostHog** — feature flag flip kad je odluka donesena.

#### Novi development
- [ ] **Reverse-auction full** — real-time bidding od dilera, struktura `lead_assignments` već priprema
- [ ] **Sell My Car** — kupci prodaju vozilo platformi, dileri bid-aju (Carwow Wizzle pattern)
- [ ] **Dealer self-service portal** — full CRM, A/B, statistike, vlastiti upload listings
- [ ] **Subscription billing za dilere** — Stripe integracija
- [ ] **WhatsApp / SMS notifikacije** — feature flagovi već postoje
- [ ] **Public dealer profiles** — sa public reviews i ratings
- [ ] **Live chat** (Intercom, Crisp ili custom)

### Phase 3 (6-12 mjeseci)
- [ ] **Smart Match AI** — ML preporuke modela
- [ ] **Mobilna aplikacija** (React Native ili Native)
- [ ] **Više jezika** — engleski + njemački (i18n struktura priprema)
- [ ] **Video produkcija** — YouTube kanal + recenzijski videi
- [ ] **API integracija s OEM** — direktan feed s proizvođačima
- [ ] **B2B Auto Trader-style** — listings za fleet/business

### Phase 4+ (1+ godina)
- [ ] **Regionalna ekspanzija** — Slovenija, BiH, Srbija
- [ ] **Aftermarket** — servis, dijelovi, osiguranje
- [ ] **Test drive booking** — direktan booking kalendar dilera
- [ ] **Trade-in instant procjena** — AI-based valuation

---

## Dokumentacija (finalan opseg)

Već specificiran u Faza 5 i 6, sažetak:

**Glavni za vlasnika (HR)**:
- `README.md`
- `docs/content-editing.md` ← najvažniji za netehničko korištenje
- `docs/branding.md`
- `docs/PLACEHOLDERS.md`

**Za agenta (mix HR/EN)**:
- `CLAUDE.md`
- `docs/architecture.md`
- `docs/how-leads-work.md`

**Operacijski (EN)**:
- `docs/deployment.md`
- `docs/local-dev.md`
- `docs/pre-launch-checklist.md`
- `docs/security.md`
- `docs/seo.md`
- `docs/accessibility.md`
- `docs/backup-recovery.md`
- `docs/gdpr-vendors.md`

**Forward (HR)**:
- `docs/post-launch-roadmap.md`

**Auto-generated**:
- `docs/database-schema.md`
- `docs/api-routes.md`
- `docs/feature-flags.md`

---

## Definicija uspjeha Faze 7

✅ Repo struktura jasna i dosljedna  
✅ 8-sprint plan s deliverables i verify uvjetima  
✅ Testing strategija (unit + integration + e2e) definirana  
✅ CI/CD plan (Vercel built-in dovoljan u MVP)  
✅ Staging strategija (Vercel preview, bez zasebnog projekta)  
✅ Production deployment koraci  
✅ Pre-launch checklist (~80 stavki, 8 sekcija)  
✅ Slash komande za agenta  
✅ Post-launch roadmap (Phase 2-4+)  
✅ Dokumentacija opseg jasan

---

## Definicija uspjeha cijelog blueprintа

✅ Sve 7 faza su zaključene i konzistentne  
✅ Vlasnik projekta i agent imaju isto razumijevanje "što i zašto"  
✅ Agent ima dovoljno informacija za autonomni rad po sprintovima  
✅ Vlasnik zna što treba pripremiti (logo, tekstovi, podaci) i kada  
✅ Pravna i compliance osnova je solidna za HR tržište  
✅ MVP je realan i deployable u predviđenom timeframe-u  
✅ Phase 2+ je realno planiran i pripremljen u arhitekturi

---

**Blueprint kompletan. Sljedeći korak: postaviti `CLAUDE.md` + `SPEC.md` + `spec/` u novi projekt repo i pokrenuti agenta sa Sprint 0.**
