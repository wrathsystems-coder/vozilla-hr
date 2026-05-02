# SPEC.md — vozilla.hr master specifikacija

Master overview projekta. Detaljni razrad pojedine faze nalazi se u `spec/0X-*.md` datotekama. Ovaj dokument je **brzi pregled** za novog suradnika ili agenta koji se priključuje projektu.

---

## TL;DR

**Projekt**: vozilla.hr — hrvatska verzija Carwowa (marketplace + lead generation + media).

**Što radi**: korisnik istražuje vozila → kontaktira platformu → operater šalje upit na 3-5 dilera → dileri šalju ponude → kupac bira.

**Stack**: Next.js 15 + TypeScript + PostgreSQL (Supabase) + Drizzle + Payload CMS 3 + Tailwind + Resend + Vercel (Frankfurt).

**Boje**: crna + žuta (placeholder HEX-ovi).

**Jezik**: hrvatski.

**MVP plan**: 8 sprintova, deployable verzija nakon svih 8.

---

## Faza 1 — Vizija i opseg

📄 Detalji: [`spec/01-vision-and-scope.md`](./spec/01-vision-and-scope.md)

- Hibridna platforma: media + lead-gen + listings
- 3 tipa korisnika: kupci (bez registracije), dileri (light dashboard), admin
- Vozila: nova + rabljena + leasing
- Glavni tok: "controlled auction" — operater ručno/polu-automatski prosljeđuje upit na 3-5 dilera
- Eksplicitno **NIJE u MVP-u**: korisnički računi, online plaćanje, full reverse-auction, Sell My Car, video produkcija, mobilna aplikacija, više jezika, live chat, ML preporuke

---

## Faza 2 — Pravna i compliance osnova

📄 Detalji: [`spec/02-legal-and-compliance.md`](./spec/02-legal-and-compliance.md)

- **Status**: posrednička platforma, ne trgovac vozilima (jasno u OUP-u)
- **Nositelj**: pravna osoba (d.o.o./j.d.o.o.) — placeholderi u `config/company.yml`
- **Pravne stranice**: Impressum, OUP, Politika privatnosti, Politika kolačića, GDPR zahtjev
  - Korisnik dostavlja gotov tekst, agent pripreme stranice
  - Sve dostupne **prije** cookie privole
  - PDF download verzija obavezna
- **Cookies**: Cookiebot ili Iubenda, granularna opt-in privola (4 kategorije)
- **CAPTCHA**: Google reCAPTCHA v3 + honeypot + rate limit
- **Leasing**: informativni kalkulator s HANFA disclamerom
- **Newsletter**: pripremljen, **disabled u MVP-u** (feature flag)
- **Sigurnosni minimum**: HTTPS, HSTS, CSP, CSRF, Argon2id, Zod validacija svuda

---

## Faza 3 — Informacijska arhitektura

📄 Detalji: [`spec/03-information-architecture.md`](./spec/03-information-architecture.md)

**Glavne sekcije sitemap-a**:
- `/` — naslovnica
- `/nova-vozila/` — hub, marke, modeli, kategorije
- `/rabljena-vozila/` — listings + filteri + detalj oglasa
- `/leasing/` — kalkulator + vodič
- `/usporedi/` — dinamička + pre-generated stranice (top 50 parova)
- `/recenzije/` — uređivačke recenzije
- `/savjeti/` — blog/vodiči
- `/pomoc-pri-izboru/` — kviz "help me choose"
- `/zatrazi-ponudu/` — glavni CTA tok
- `/za-dilere/` + `/dileri/` (login + dashboard)
- `/admin/` (Payload admin)
- Pravne: `/opci-uvjeti/`, `/politika-privatnosti/`, `/politika-kolacica/`, `/impressum/`, `/gdpr-zahtjev/`

**CTA strategija**: hibrid — generic "Zatraži ponudu" u headeru + kontekstualni CTA-i ("Zatraži ponudu za Audi A4") na detail stranicama.

**Sticky widget**: bottom-right "Dobij najbolju cijenu" — kratka forma, trigger nakon 8s + 40% scroll.

**URL konvencija**: hrvatski slug-ovi, ASCII-safe, lowercase, hyphen-separated.

**Schema.org**: Organization, Vehicle, Review, BreadcrumbList, FAQPage, Article, WebSite.

---

## Faza 4 — Funkcionalnosti i tokovi

📄 Detalji: [`spec/04-features-and-flows.md`](./spec/04-features-and-flows.md)

### Glavni tokovi
1. **Lead request** (4-step wizard) — kupac šalje upit
2. **Admin obrada** — auto-suggest 5 dilera (najbliži + top 4 po quality_score), admin potvrđuje
3. **Dealer dashboard** — diler dobiva email + in-app notifikaciju, mijenja status leada
4. **Magic link tracker** — kupac vidi status na `/upit/{token}/` bez registracije
5. **Quiz** — 8 pitanja → preporuka 5-10 modela
6. **Leasing kalkulator** — informativni izračun s disclamerom
7. **Rabljena pretraga** — filteri + detalj
8. **Feedback flow** — emailovi kupcu na dan 3, 14, 30; diler obavezno upisuje ishod

### Lead distribution algoritam (Carwow-style)

`quality_score` dilera računa se iz:
- 1 / avg_response_time_hours × W_response
- conversion_rate × W_conversion
- avg_rating × W_rating
- (1 − current_load_ratio) × W_capacity

Težine `W_*` u `config/lead-distribution.yml`. **Najbliži diler uvijek dobiva ponudu** (Carwow pravilo).

### Edge cases (20 stavki dokumentirano)
Double-click submit, mreža izgubljena, email već postoji, telefon nije HR format, reCAPTCHA score nizak, oglas izbrisan, mobile pre-fill kroz session, GDPR brisanje s retention period itd.

---

## Faza 5 — Podaci i sustavi

📄 Detalji: [`spec/05-data-and-systems.md`](./spec/05-data-and-systems.md)

### Stack (final)
- **Next.js 15** + TypeScript strict
- **PostgreSQL** preko **Supabase** (region: EU, Pro plan)
- **Drizzle ORM** (preferred) ili Prisma
- **Payload CMS 3** (Lexical Notion-style editor)
- **Vercel** (Frankfurt FRA1, Pro plan)
- **Resend** za email
- **Cloudflare** kao CDN/proxy ispred Vercela

### CMS pristup
- Sve content kolekcije u Payload (Brands, Models, Reviews, Articles, Pages, Dealers, ...)
- Operacijske tablice (consent_log, audit_log, magic_link_tokens, rate_limit) u Drizzle van Payloada
- Lexical block editor s custom blocks: Hero image, Specs table, Pros/Cons, CTA, Gallery, FAQ accordion, Disclaimer box

### Schema entiteti (22 tablice)
brands, models, model_versions, body_types, vehicle_attributes, used_car_listings, used_car_images, dealers, dealer_users, lead_requests, lead_assignments, reviews, articles, pages, counties, gdpr_requests, consent_log, newsletter_subscribers, admin_users, admin_settings, audit_log, comparison_pairs

### Slike
- Upload kroz Payload media library
- Auto srcset (320, 640, 1024, 1920 px), WebP + AVIF
- Obavezni ALT text + Source + Credit polja

### Integracije
| Integracija | MVP status |
|---|---|
| Google reCAPTCHA v3 | ON |
| Cookiebot/Iubenda | ON |
| Resend (email) | ON |
| Google Maps | ON (basic, lokacije dilera) |
| Sentry | ON (preporučeno) |
| Google Analytics 4 | OFF (priprema, feature flag) |
| PostHog | OFF (priprema, feature flag) |
| Meta Pixel | OFF |
| WhatsApp Business | OFF |
| SMS gateway | OFF |

### Performance ciljevi
- Lighthouse ≥ 90 svuda (Perf, A11y, BP, SEO)
- Core Web Vitals zelen
- TTFB < 600ms (Vercel Edge)
- Bundle < 200kb initial JS

---

## Faza 6 — Branding i assetovi

📄 Detalji: [`spec/06-branding-and-assets.md`](./spec/06-branding-and-assets.md)

### Filozofija
**Agent ne generira ni jedan brand asset.** Korisnik dodaje logo, fotografije, hero slike, OG slike, slike vozila. Agent pripreme:
1. Točno mjesto (file path ili Payload polje)
2. Placeholder file (vidno označen "PLACEHOLDER — REPLACE")
3. README upute (dimenzije, format, težina, naming)

### Smije generirati
- HEX kodove boja (default crna + žuta)
- Klasične UI ikone (lucide-react)
- Generične SVG siluete vozila po kategoriji
- SVG patterne za pozadine

### Placeholder strategy
- `XXX_*` u config datotekama
- `[XXX_*]` u tekstovima
- "PLACEHOLDER" tekst direktno u SVG fileovima logoa
- `pnpm placeholders:check` — string scan + fail build u produkciji
- `docs/PLACEHOLDERS.md` — master index svih XXX-ova

### Light theme samo (MVP)
Dark mode kasnije, ali `<ThemeProvider>` (next-themes) postavljen i CSS varijable strukturirane tako da kasnije aktiviranje ne traži refactor.

### `/test/branding` mini playground
Stranica dostupna u dev modu — sve glavne komponente (Button, Input, Card, Header), color paleta, tipografija, form examples, cookie banner preview, email template preview.

### Email template-i (svi pripremljeni)
17 template-a u `/emails/` folderu. **Ključni ON, ostali OFF** (feature flag):
- ON: lead-confirmation, lead-to-dealer, magic-link, gdpr-request-received/resolved, dealer-password-reset, admin-new-lead-notification
- OFF: dealer-reminders, customer-feedback (3/14/30), newsletter, dealer-invite, dealer-suspended

---

## Faza 7 — Tehnička isporuka i deploy

📄 Detalji: [`spec/07-delivery-and-deployment.md`](./spec/07-delivery-and-deployment.md)

### Struktura repa
Single-repo monolit, `/apps/web/` u korijenu, ostalo na istoj razini (`/seeds/`, `/config/`, `/docs/`, `/scripts/`).

### Sprintovi (8 ukupno)
| # | Sprint | Glavni deliverable |
|---|---|---|
| 0 | Setup | Next + Payload + Drizzle + Tailwind + CI + placeholder check |
| 1 | Schema + Seed | Sve Payload kolekcije, Drizzle migracije, demo seed |
| 2 | Public site kostur | Layout, naslovnica, statične i pravne stranice |
| 3 | Katalog vozila | Marke, modeli, kategorije, ISR, schema.org |
| 4 | Lead flow | 4-step wizard, sticky widget, reCAPTCHA, email pipeline, magic link, admin upit detalj |
| 5 | Dealer dashboard | Login, lista leadova, akcije, auto-podsjetnici |
| 6 | Listings + leasing + usporedba + kviz | Sve preostale public funkcionalnosti |
| 7 | Polish + compliance + pre-launch | Cookies, GDPR, Sentry, sitemap, audit, checklist 100% |

Svaki sprint ima jasne **verify** uvjete u `07-delivery-and-deployment.md`.

### Testiranje (minimalno ali ciljano)
- Vitest unit: OIB, telefon, format helpers, leasing kalkulator, score algoritam
- Vitest integration: POST /api/leads, POST /api/gdpr-request, magic link validation
- Playwright e2e: 3 toka — kupac upit, admin obrada, diler dashboard

### CI/CD
Vercel built-in (lint, type-check, build) + naša `pnpm placeholders:check` u build script. Bez GitHub Actions u MVP-u.

### Staging
Bez zasebnog projekta. Vercel preview za feature branches, production iz `main`.

### Dokumentacija (11 dokumenata + auto-generated)
- Korisnik (HR): README.md, content-editing.md, branding.md, PLACEHOLDERS.md
- Agent (mix EN/HR): CLAUDE.md, architecture.md, how-leads-work.md
- Operacijski (EN): deployment.md, local-dev.md, pre-launch-checklist.md
- Forward (HR): post-launch-roadmap.md
- Auto-generirano: database-schema.md, api-routes.md, feature-flags.md

### Pre-launch checklist
8 sekcija (Brand, Konfiguracija, Pravno, Tehnički, Sigurnost, Email, SEO, Operativno) — ~80 checkpoint-stavki.

---

## Post-MVP roadmap (Phase 2)

📄 Detalji: [`spec/07-delivery-and-deployment.md`](./spec/07-delivery-and-deployment.md) sekcija "Post-Launch Roadmap"

Prirodne ekstenzije, **pripremljene** u MVP-u (struktura postoji, samo se feature flag-ovi pale):
- Newsletter aktivacija (double opt-in flow je gotov)
- Dark mode (CSS varijable strukturirane)
- Korisnički računi (magic link tokens evolve)
- Dealer self-service portal (više od light dashboarda)
- Reverse-auction full (dealer real-time bidding)

Veće ekstenzije (zahtijevaju novi development):
- Sell My Car (otkup od korisnika)
- Live chat
- Mobilna aplikacija
- Više jezika (i18n strukturа pripremljena)
- Video produkcija (YouTube integracija)
- Smart Match AI (preporuke)
- Autovia/Auto Express partnerstvo (ako se dogovori)

---

## Definicija uspjeha MVP-a

MVP je gotov kad:
- ✅ Kupac može poslati upit za novo ili rabljeno vozilo (4-step wizard) i dobiva potvrdni email
- ✅ Magic link tracker radi (kupac vidi status bez registracije)
- ✅ Admin može odabrati 5 dilera i poslati lead
- ✅ Diler dobiva email + vidi lead u dashboardu + može označiti ishod
- ✅ Quiz, leasing kalkulator, usporedba — sve funkcionira
- ✅ Sve pravne stranice imaju mjesto za content (popunjavamo iz Payloada)
- ✅ Cookie banner radi GDPR-compliant
- ✅ Lighthouse ≥ 90, a11y zero serious violations
- ✅ Pre-launch checklist 100% pass
- ✅ Deployed na vozilla.hr s SSL-om

---

## Kontakt i odgovornosti

**Vlasnik projekta** (popunjava XXX placeholdere, dostavlja sadržaj, finalna odluka o brandu): _(ime)_

**Agent** (Claude Code ili sličan): radi po ovom SPEC + CLAUDE.md

**Pravnik** (preporučeno!): pregled OUP, Politika privatnosti, Politika kolačića prije produkcije

---

*Master spec verzija: 1.0 — kreiran nakon 7-fazne razrade plana.*
