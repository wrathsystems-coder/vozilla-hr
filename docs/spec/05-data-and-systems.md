# Faza 5 — Podaci i sustavi

## Tehnološki stack (final)

| Sloj | Izbor | Razlog |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Modern, SSR/ISR/SSG, Vercel-native, ekosustav |
| **Jezik** | TypeScript (strict mode) | Type safety, manje bugs, bolji DX |
| **Baza** | PostgreSQL preko Supabase | Managed, EU regije, GDPR DPA, real-time, auth utilities |
| **ORM** | Drizzle ORM (preferred) | Lightweight, edge-runtime friendly, TS-native |
| **CMS** | Payload CMS 3 | Self-hosted u Next.js-u, Lexical block editor, TS-native, dijeli istu bazu |
| **Stilovi** | Tailwind CSS | Utility-first, dosljedno, bez CSS bloat |
| **Email engine** | React Email | TS-native, lokalno renderira, dev-friendly preview |
| **Email provider** | Resend | Dev-friendly API, EU regija, dobre stope dostave |
| **Captcha** | Google reCAPTCHA v3 | Nevidljiva, score-based |
| **Cookies** | Cookiebot ili Iubenda | Profesionalno, GDPR-compliant |
| **Hosting frontend** | Vercel (Frankfurt FRA1) | Next.js-native, edge, najjednostavniji |
| **Hosting baza** | Supabase Pro (EU region) | Managed Postgres + auto backups + realtime |
| **CDN/proxy** | Cloudflare | DDoS, WAF, brza DNS |
| **Error tracking** | Sentry | Industry standard |
| **Analytics MVP** | OFF (priprema za GA4 + PostHog) | Aktivira se Phase 2 |

> **Agent može zamijeniti Drizzle s Prismom** ako prosudi da je za naš slučaj bolji. Trebajте dokumentirati razlog u `docs/architecture.md`. Sve ostalo u tablici je fixed.

---

## Filozofija dataе

- **Relacijska baza** — strukturni podaci (vozila, dileri, leadovi) zahtijevaju to
- **Bez NoSQL miksa u MVP-u** — sve u Postgresu, jednostavno (Phase 2 možda Redis za cache/sessions)
- **Migracije versionirane** (Drizzle migrations folder), nikad ručno SQL na produkciji
- **Seed sustav** za inicijalne podatke i demo
- **Backup** automatski (Supabase Pro) + dokumentirano kako restore-ati

---

## Što ide gdje (Payload vs Drizzle raw)

### Payload kolekcije (sve content + ključne entity)
- **Brands** (marke vozila)
- **Models** (modeli)
- **ModelVersions** (trim-ovi)
- **BodyTypes** (kategorije: SUV, hatchback...)
- **VehicleAttributes** (atribut-vrijednost katalog)
- **UsedCarListings** (rabljeni oglasi)
- **UsedCarImages** (slike oglasa, joined)
- **Dealers** (dileri)
- **DealerUsers** (sales agenti unutar dilera)
- **LeadRequests** (read-only listing + akcije, ne CRUD klasično)
- **LeadAssignments** (read-only)
- **Reviews** (uređivačke recenzije)
- **Articles** (savjeti/blog)
- **Pages** (statične stranice — O nama, FAQ, ...)
- **ComparisonPairs** (pre-generated usporedbe)
- **GdprRequests** (read-only listing + akcije)
- **AdminUsers** (admin nalozi)

### Payload globals (singletons)
- **Settings** (brand info, kontakti, social)
- **MarketingCopy** (hero, value props, testimoniи placeholderi)
- **EmailSettings** (per-template enabled/disabled, default subject)
- **LeadDistribution** (weights, thresholds)
- **LeasingDefaults** (kamatne stope, default values)
- **WidgetSettings** (sticky widget config)

### Drizzle raw tablice (operacijske, izvan Payloada)
- **counties** (seed, fixed)
- **consent_log** (audit privola)
- **audit_log** (admin akcije)
- **magic_link_tokens** (kupci tracker, password reset)
- **rate_limit_buckets** (rate limit po IP/email)
- **newsletter_subscribers** (priprema, OFF u MVP)
- **quiz_results** (TTL 30 dana)
- **email_log** (svi poslani emailovi za debugging)

Razlog razdvajanja: ove tablice nemaju content management value (admin ne želi CRUD-ati pojedine consent log entries), pa Payload UI samo zatrpa. Pristupaju se kroz Drizzle direktno + custom Payload admin views ako treba.

---

## Schema entiteti — pregled

Detaljna shema je u `docs/database-schema.md` (auto-generirano iz Drizzle/Payload schema). Ovdje samo glavni entiteti i ključne relacije.

### `brands`
```
id, slug (unique), name, logo_path, country_origin, founded_year, 
description_md, hero_image_path, is_active, sort_order, created_at, updated_at
```

### `models`
```
id, brand_id (FK), slug, name, body_type_id (FK), segment, 
generation, year_from, year_to, base_price_eur, fuel_types[], 
transmissions[], description_md, hero_image_path, is_active, 
sort_order, created_at, updated_at

UNIQUE (brand_id, slug)
```

### `model_versions`
```
id, model_id (FK), name (e.g., "2.0 TDI"), engine_type, 
engine_displacement_cc, power_kw, power_hp, transmission, 
fuel_consumption_combined_l, co2_emission_g_km, price_eur, 
year, is_current, created_at, updated_at
```

### `body_types`
```
id, slug, name (HR), description, icon_svg_path, sort_order
```

### `dealers`
```
id, slug, legal_name, oib (validiran), email (verified), 
phone, address_street, address_city, address_postcode, 
county_id (FK), lat, lng, brands_jsonb, is_active, is_verified,
monthly_lead_cap, current_month_leads, avg_rating, 
avg_response_time_hours, conversion_rate, throttle_factor,
suspended_reason, password_hash, last_login_at, created_at, updated_at
```

### `lead_requests`
```
id (auto), public_token (UUID, unique), display_id (VZ-YYYY-MM-DD-XXXX),
customer_name, customer_email, customer_phone (E.164),
customer_county_id (FK), customer_postcode,
preferred_contact_method, best_contact_time,
request_type (new/used/leasing/unsure),
brand_id (FK nullable), model_id (FK nullable), version_text,
year_from, year_to, color_preferences[], comments,
price_min, price_max, financing_type, deposit, period_months,
has_trade_in, trade_in_data_jsonb, time_frame,
gdpr_consent_at, marketing_consent, source,
recaptcha_score, recaptcha_action,
status (new/under_review/in_progress/sent/closed/spam),
internal_notes, ip_address, user_agent,
created_at, updated_at
```

### `lead_assignments`
```
id, lead_id (FK), dealer_id (FK), 
status (sent/viewed/contacted/closed),
sent_at, viewed_at, contacted_at, closed_at,
outcome (sold/not_sold/customer_unresponsive/other),
outcome_reason, dealer_notes,
customer_marked_interested, customer_marked_not_interested,
customer_rating_for_dealer (1-5), customer_feedback_text,
first_reminder_sent_at, second_reminder_sent_at,
expired_no_response, created_at, updated_at

UNIQUE (lead_id, dealer_id)
```

### `used_car_listings`
```
id, public_id (slug-friendly), model_id (FK), dealer_id (FK nullable),
private_seller_data_jsonb (ako privatni),
year, mileage_km, price_eur, color, vin (optional, encrypted),
condition (excellent/good/fair/poor),
description_md, location_county_id (FK), location_city,
status (draft/active/sold/expired), sold_at, expires_at,
created_at, updated_at, view_count
```

### `used_car_images`
```
id, listing_id (FK), media_id (FK Payload media),
sort_order, is_hero
```

### `reviews`
```
id, slug, title, model_id (FK nullable), 
author_id (FK admin_users), content_md, content_lexical_jsonb,
score_overall (1-10), score_design, score_comfort, score_drive, 
score_economy, score_value,
pros_jsonb, cons_jsonb, hero_image_path, gallery_jsonb,
seo_title, seo_description, og_image_path,
published_at, updated_at, is_published, view_count
```

### `articles`
```
id, slug, title, category_slug, author_id (FK),
content_md, content_lexical_jsonb, excerpt,
hero_image_path, seo_title, seo_description, og_image_path,
published_at, is_published, view_count, created_at, updated_at
```

### `pages`
```
id, slug (unique), title, content_lexical_jsonb,
seo_title, seo_description, og_image_path,
last_updated_at, is_published
```

### `counties` (seed, ne mijenja se)
```
id, name (HR), slug, sort_order
-- 21 zapisa: 20 županija + Grad Zagreb
```

### `gdpr_requests`
```
id, display_id (GDPR-YYYY-XXXX), customer_email, customer_name, 
customer_oib (optional), request_type, lead_request_id (FK nullable),
description, status (pending/in_progress/resolved/rejected),
admin_notes, resolved_at, resolved_by_id, ip_address, recaptcha_score,
created_at, updated_at
```

### `consent_log`
```
id, customer_email, consent_type (oup/marketing/cookies_functional/cookies_analytics/cookies_marketing),
granted (bool), source_form, ip_address, user_agent, 
timestamp
```

### `audit_log`
```
id, actor_type (admin/system/dealer/customer), actor_id, 
action (e.g., 'lead.send_to_dealers', 'dealer.suspend'),
entity_type, entity_id, before_jsonb, after_jsonb,
ip_address, timestamp
```

### `magic_link_tokens`
```
id, token (unique, secure), purpose (lead_tracker/password_reset/quiz_save/draft_resume),
related_entity_type, related_entity_id,
expires_at, used_at, created_at
```

### `rate_limit_buckets`
```
key (IP / email / IP+email composite), 
endpoint, count, window_start_at, expires_at
```

### `comparison_pairs` (Payload kolekcija)
```
id, slug (e.g., 'golf-vs-octavia'), title,
model_a_id (FK), model_b_id (FK),
content_lexical_jsonb (rich content), 
seo_title, seo_description, og_image_path,
is_published, sort_order, created_at, updated_at
```

### `quiz_results`
```
id, token (UUID, unique), answers_jsonb,
recommended_models_jsonb, customer_email (optional),
expires_at, created_at
-- TTL 30 dana, cron job briše
```

### `email_log`
```
id, template_name, recipient_email, subject, 
payload_jsonb, sent_at, provider_message_id, 
status (pending/sent/failed/bounced), error_message
```

### `admin_users` (Payload built-in auth)
```
id, email, password_hash (Argon2id), name, 
role (super_admin/admin/operator/viewer),
two_factor_enabled, two_factor_secret_encrypted,
last_login_at, last_login_ip, is_active,
created_at, updated_at
```

---

## CSV format za seed marki/modela

Datoteka: `seeds/template-vehicles.csv`

```
brand_slug,brand_name,model_slug,model_name,body_type_slug,segment,year_from,year_to,base_price_eur,fuel_types,transmissions,hero_image_filename,description_short,is_active
audi,Audi,a4,A4,sedan,D,2015,2026,40000,benzin|dizel|hibrid,manual|automatic,audi-a4.jpg,"Premium D-segment sedan...",true
audi,Audi,q3,Q3,suv,C,2018,2026,38000,benzin|dizel,automatic,audi-q3.jpg,"Compact premium SUV...",true
...
```

**Pravila**:
- UTF-8 encoded
- Comma-separated, double-quote za polja s zarezom
- `fuel_types` i `transmissions` pipe-separated (`|`)
- `hero_image_filename` — file mora postojati u `/public/branding/vehicles/` (vlasnik upload-a paralelno)
- `description_short` — kratak opis 1-2 rečenice
- Boolean: `true`/`false` (lowercase)

Vlasnik popunjava ovaj CSV (top 20-30 modela). Agent radi importer:
```bash
pnpm seed:vehicles
```

Importer je **idempotentan** — pokrene li se ponovno, update-a postojeće zapise (UPSERT na `brand_slug + model_slug`).

### CSV za pre-generated comparisons
Datoteka: `seeds/template-comparisons.csv`

```
slug,title,model_a_brand_slug,model_a_model_slug,model_b_brand_slug,model_b_model_slug,sort_order
golf-vs-octavia,"Volkswagen Golf vs Škoda Octavia",vw,golf,skoda,octavia,1
sandero-vs-aygo-x,"Dacia Sandero vs Toyota Aygo X",dacia,sandero,toyota,aygo-x,2
...
```

Sadržaj svake comparison stranice (rich content) admin pisuje kroz Payload nakon import-a. CSV samo strukturira parove.

### Demo seed (samo dev/testing)
- `seeds/sample-dealers.csv` — 5-10 fake dilera s `is_demo: true`, prefiks `DEMO_DEALER_*`
- `seeds/sample-leads.json` — 20-30 demo leadova s `@example.com` emailovima

`pnpm seed:demo` puni demo data. `pnpm seed:cleanup-demo` briše sve `is_demo: true`. **Pre-launch checklist** stavlja "demo cleanup" kao obavezni korak.

---

## CMS pristup — Payload kolekcije konfiguracija

### Lexical block editor (custom blocks za naš slučaj)

Agent gradi sljedeće custom blocks za korištenje u `Reviews`, `Articles`, `Pages`, `ComparisonPairs`:

| Block | Opis |
|---|---|
| **Hero Image** | Slika + caption + credit + alt |
| **Specs Table** | Linkana na ModelVersion, auto-pulla podatke |
| **Pros / Cons** | Dva stupca (zelene + crvene ikone) |
| **CTA Button** | Tekst + link + variant (primary/secondary) |
| **Image Gallery** | Multi-image, lightbox |
| **Quote / Pull-quote** | Citat + autor |
| **FAQ Accordion** | Pitanja-odgovori, Schema.org markup |
| **Comparison Embed** | Link na ComparisonPair, prikazuje preview card |
| **YouTube Embed** | Cookie-aware (ne učitava prije privole) |
| **Disclaimer Box** | Ikona upozorenja + tekst (za HANFA disclamer-e) |
| **Stats Row** | 3-4 broja s labelima (např. trust signali na naslovnici) |
| **Image with Text** | Slika lijevo, tekst desno (alternira) |

Svaki blok ima **anchor ID** (auto-generated iz heading sadržaja) za deep-linking i auto-generated table of contents.

### Pristupi i autorizacija (Payload roles)
- **super_admin**: sve
- **admin**: sve osim brisanja super_admina i mijenjanja sigurnosnih postavki
- **operator**: lead processing, dealer management, GDPR; ne dira content (recenzije, savjeti)
- **editor** (Phase 2): samo content (recenzije, savjeti, pages); ne vidi leadove
- **viewer**: read-only, za audit

---

## Slike i media — strategija

### Upload kroz Payload media library
- Format: jpg, png, webp, svg
- Max upload: 10MB (konfigurabilno `XXX_MAX_UPLOAD_MB`)
- Antivirus scan (ClamAV — opcijsko za MVP, agent dokumentira aktivaciju)

### Auto-generated varijante (na upload)
- Width 320, 640, 1024, 1920
- Format konverzija: WebP + AVIF (s JPG/PNG fallback)
- Storage struktura: `/media/{year}/{month}/{filename-slug}-{width}.{format}`

### Obavezna polja za sve slike (Payload form)
- **alt** (string, HR) — accessibility + SEO
- **source** (enum: vlastite / press_kit / dealer_uploaded / stock_photo)
- **credit_text** (string) — npr. "Foto: Audi AG"
- **license_url** (string, optional) — link na licencu
- **uploaded_by** (auto, FK)

### Storage backend
- **Default**: Supabase Storage (EU region)
- **Alternativa**: Vercel Blob (agent procjenjuje cost/perf, dokumentira)
- **Kasnije**: S3-kompatibilni (Wasabi / Backblaze B2 EU) — placeholder env

### Lazy loading + responsive
- `<picture>` tag s srcset
- `loading="lazy"` na sve osim hero (eager za above-the-fold)
- `decoding="async"`
- Width + height atributи **uvijek** definirani (CLS prevention)

---

## Hrvatske specifikacije i utility

### Županije (seed datoteka)
`seeds/counties-hr.json`:
```json
[
  {"id": 1, "slug": "zagrebacka", "name": "Zagrebačka županija", "sort_order": 1},
  {"id": 2, "slug": "krapinsko-zagorska", "name": "Krapinsko-zagorska županija", "sort_order": 2},
  ...
  {"id": 21, "slug": "grad-zagreb", "name": "Grad Zagreb", "sort_order": 21}
]
```

### Poštanski brojevi → županija mapping
`seeds/postcodes-counties-hr.json`:
```json
[
  {"postcode_prefix": "10", "county_id": 21},   // Zagreb (10000-10999 → Grad Zagreb)
  {"postcode_prefix": "21", "county_id": 17},   // Split (21000-...)
  ...
]
```

API endpoint: `GET /api/lookup/postcode/{code}` → vraća županiju.

### Utility funkcije (agent obvezan kreirati u Sprintu 1)

`lib/utils/format.ts`:
```typescript
formatPrice(amount: number, options?: { currency?: 'EUR'; decimals?: number }): string
// 12345.67 → "12.345,67 €"

formatDate(date: Date | string, format?: 'short' | 'long'): string
// 2026-04-29 → "29.04.2026."

formatPhone(phone: string): string
// "+385911234567" → "+385 91 123 4567"

formatPostcode(postcode: string): string
// "10000" → "10000" (validacija + normalizacija)
```

`lib/utils/validate.ts`:
```typescript
validateOIB(oib: string): boolean       // checksum algorithm
validatePhoneHR(phone: string): boolean
validatePostcodeHR(postcode: string): boolean
validateEmail(email: string): { valid: boolean; reason?: string }
// reason može biti 'disposable', 'invalid_format', 'no_mx_record'
```

`lib/utils/slug.ts`:
```typescript
slugify(text: string): string
// "Škoda Octavia 2024" → "skoda-octavia-2024"
```

`lib/utils/sort.ts`:
```typescript
hrCollator: Intl.Collator  // pre-configured za hrvatsku abecedu
sortHr(items: T[], key: keyof T): T[]
```

`lib/utils/time.ts` (mockable za testove):
```typescript
now(): Date    // wrapper za Date.now() — koristi se umjesto Date.now() direktno
```

---

## Integracije — popis i status

| Integracija | Svrha | MVP status | Placeholder env |
|---|---|---|---|
| Google reCAPTCHA v3 | Antispam | **ON** | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` |
| Cookiebot ili Iubenda | Cookie consent | **ON** | `NEXT_PUBLIC_COOKIEBOT_ID` ili `NEXT_PUBLIC_IUBENDA_ID` |
| Resend | Transakcijski email | **ON** | `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO` |
| Sentry | Error tracking | **ON** (preporučeno) | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` |
| Google Maps Static API | Lokacije dilera | **ON** (basic) | `GOOGLE_MAPS_API_KEY` |
| Supabase Storage | Slike | **ON** (default) | `SUPABASE_STORAGE_BUCKET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` |
| Vercel Blob | Slike (alternative) | priprema | `BLOB_READ_WRITE_TOKEN` |
| Upstash Redis | Rate limit (alternative na DB) | priprema | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| Google Analytics 4 | Analitika | **OFF** (priprema) | `NEXT_PUBLIC_GA4_MEASUREMENT_ID` |
| PostHog | Analitika + session replay | **OFF** | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` |
| Meta Pixel | Marketing tracking | **OFF** | `NEXT_PUBLIC_META_PIXEL_ID` |
| Google Ads | Remarketing | **OFF** | `NEXT_PUBLIC_GOOGLE_ADS_ID` |
| WhatsApp Business API | Notifikacije dileru | **OFF** | `WHATSAPP_API_KEY`, `WHATSAPP_PHONE_NUMBER_ID` |
| SMS gateway (HR provider) | SMS notifikacije | **OFF** | `SMS_API_KEY`, `SMS_PROVIDER` |
| Algolia ili Meilisearch | Brza pretraga | **OFF** (Phase 2) | `ALGOLIA_APP_ID`, `ALGOLIA_API_KEY` |

### Feature flag struktura
`config/feature-flags.yml`:
```yaml
flags:
  newsletter_enabled: false
  ga4_enabled: false
  posthog_enabled: false
  meta_pixel_enabled: false
  whatsapp_notifications: false
  sms_notifications: false
  dealer_reminder_emails: true   # ON u MVP-u
  customer_feedback_emails: true # ON u MVP-u
  dark_mode: false
  reverse_auction: false          # Phase 2
  user_accounts: false            # Phase 2
```

Agent obvezan napraviti `lib/feature-flags.ts` koji čita ovaj YAML + Payload override (admin može override-ati).

---

## Hosting setup — konkretno

### Vercel (Frankfurt FRA1)
- **Framework Preset**: Next.js
- **Region**: FRA1 (Frankfurt) — najbliže HR
- **Environment**: Production / Preview / Development razdvojeno
- **Build command**: `pnpm build` (uključuje `pnpm placeholders:check`)
- **Output**: `.next/`
- **Pro plan** za:
  - Bolji bandwidth
  - Edge functions
  - Cron jobs (za podsjetnike, cleanup, retention)
  - Vercel Analytics (free tier dovoljan u MVP-u)

### Supabase (EU region)
- **Region**: `eu-central-1` ili `eu-west-1` (agent provjerava trenutno najbliže HR pri setup-u)
- **Plan**: Pro
- **Connection pooling**: Supavisor enabled (Vercel serverless treba pooling)
- **Point-in-time recovery**: 7 dana (Pro plan default)
- **DPA potpisан** — agent dokumentira u `docs/gdpr-vendors.md`
- **Auth**: Payload koristi vlastiti auth (nije Supabase Auth) — Supabase je čisto baza + storage

### Cloudflare (DNS + proxy)
- DNS records → Vercel
- Proxy enabled (orange cloud)
- SSL/TLS strict mode
- HSTS preload (nakon stabilnosti)
- WAF basic rules: block bad bots, common exploits
- Rate limiting na Cloudflare razini (kao dodatni sloj iznad app rate limit-a)
- Page Rules: cache static assets aggressively (30 dana)

### DNS structure
```
A    @      → Vercel IP
A    www    → Vercel IP (redirect na non-www u Next config-u)
TXT  @      → Resend SPF, DKIM, DMARC
MX   @      → email provider (ako primamo email — Phase 2)
```

---

## Sigurnosne konfiguracije

### Headers (`next.config.ts`)
```typescript
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Content-Security-Policy', value: '...' },  // agent definira
]
```

CSP — striktan, dokumentiran u `docs/security.md`. Agent objašnjava što je dozvoljeno (Cookiebot/Iubenda script, reCAPTCHA, Resend tracking pixels — sve eksplicitno whitelistano).

### CSRF
- Next.js 15 ima built-in helper za form actions
- Sve POST endpoints obavezno koriste CSRF protection
- Tokeni rotiraju per session

### Rate limiting
- Per-IP po endpointu (default 60/min za GET, 10/min za POST)
- Per-email za sensitive endpoints (lead submission, GDPR, password reset)
- Implementacija: Upstash Redis (preporučeno) ili Drizzle `rate_limit_buckets` tablica
- Headers `X-RateLimit-*` u response

### Auth implementacije
- **Admin** (Payload): email + password (Argon2id) + 2FA opcija
- **Dealer** (Payload ili custom): email + password (Argon2id), 2FA opcija
- **Customer**: NEMA login u MVP-u, magic link tokens su jedini "auth" za tracker
- Sessions: secure + httpOnly + sameSite=lax cookies, 30 min idle timeout, 24h absolute timeout

### Environment validation
Pri startup-u, validacija svih `.env` varijabli (Zod ili `envalid`). Ako nedostaju ključne, baci grešku **prije** dignja servera. Lista u `.env.example`.

---

## Performance ciljevi (agent obvezan zadovoljiti)

- **Lighthouse score** ≥ 90 na sve kategorije (Perf, A11y, BP, SEO)
- **Core Web Vitals zelen** (LCP < 2.5s, INP < 200ms, CLS < 0.1) na simuliranom 4G
- **TTFB** < 600ms s Vercel Edge
- **Initial JS bundle** < 200kb (s tree-shaking)

### Strategija
- Stranice marki/modela: **statički generirane** (ISR s revalidate intervalом 1h)
- Listings rabljenih: server-rendered s pagination (ne SSG zbog dinamike)
- Recenzije, savjeti: ISR
- Slike: WebP + AVIF, srcset, lazy loading
- Fonts: self-hosted (next/font), preload key fonts, font-display: swap
- Code splitting: agent koristi `next/dynamic` za heavy komponente (lightbox, charts u admin-u)
- Cache strategija dokumentirana u `docs/architecture.md`

---

## Accessibility (a11y) — obavezno WCAG 2.1 AA

- Sve forme: labelirane (`<label for>` ili `aria-label`), error poruke `aria-describedby`
- Sve slike: ALT text obavezan (Payload form requires it)
- Tipkovnička navigacija full (Tab, Enter, Esc)
- Focus styles vidljivi (no `outline: none` bez zamjene)
- Color contrast ≥ 4.5:1 (body), ≥ 3:1 (UI)
- Skip-to-content link na vrhu svake stranice
- ARIA roles gdje native HTML ne pokriva
- Headings hierarhija (h1 → h2 → h3, no skipping)
- Form errors: announce s `role="alert"` ili live region
- Modal: focus trap, Esc zatvara, vraća focus na trigger element

### Test alati (CI)
- **axe-core** integriran u Playwright e2e (`pnpm test:a11y`)
- **Lighthouse CI** u Vercel preview deploy-u
- **Manual screen reader test** (NVDA na Windows, VoiceOver na Mac) — checklist u `docs/accessibility.md`

---

## SEO obvezno

- **Sitemap.xml** auto-generiran (Next.js app router metadata API)
- **robots.txt**: dozvoli sve public, blokiraj `/admin/*`, `/dileri/*`, `/upit/*`
- **Schema.org markup** (vidi `03-information-architecture.md`)
- **OG tags + Twitter Card** na svim stranicama (auto iz Payload SEO polja)
- **Canonical URLs**
- **301 redirecti** za stare URL-ove (kasnije, kad budemo migrirali)
- **hreflang="hr"** tag-ovi (priprema za multi-language)
- **Internal linking** smart (related modeli, related savjeti, breadcrumbs)
- **Strukturirani podaci** validni na Google Rich Results Test

---

## Backup i recovery

### MVP strategija
- **Supabase Pro** daily auto backup (7 dana retencija) — uključeno u plan
- **Point-in-time recovery** 7 dana — built-in
- **Manual snapshot** pre-deploy svake major migracije (komanda u `docs/backup-recovery.md`)

### Phase 2 (priprema, OFF u MVP)
- **Weekly off-site export**: GitHub Action ili cron na zasebnom serveru
- `pg_dump` + upload na S3-compatible (Wasabi EU)
- Šifrirano u tranzitu i mirovanju
- Retencija 30 dana
- Test recovery checklist (jednom kvartalno)

### Recovery procedure (dokumentirano)
- Supabase dashboard → Backups → odaberi datum → restore
- Manual restore iz pg_dump-a (komanda u README)
- Test environment recovery prije produkcije

---

## Dokumentacija (auto-generated)

Agent obvezan kreirati skripte koje generiraju ove dokumente pri build-u:

- `docs/database-schema.md` — iz Drizzle schema + Payload collections (TS reflection)
- `docs/api-routes.md` — scan svih `app/api/**/route.ts` + Payload REST endpoints
- `docs/feature-flags.md` — iz `config/feature-flags.yml`

Tako se dokumentacija ne razlikuje od koda. Pokreće se u CI svake promjene.

---

## Definicija uspjeha Faze 5

✅ Stack potvrđen i dokumentiran  
✅ Schema entiteti svi popisani s ključnim poljima i relacijama  
✅ Payload kolekcije + globals + Drizzle raw tablice razdvojeni i opravdano  
✅ Custom Lexical blocks popisani  
✅ Slike strategy (upload, varijante, obavezna polja)  
✅ Hrvatski utility i seed (counties, postcodes, formats)  
✅ Integracije popis s feature flag statusom  
✅ Hosting setup (Vercel + Supabase + Cloudflare) konkretiziran  
✅ Sigurnosne konfiguracije (headers, CSRF, rate limit, auth, env validation)  
✅ Performance ciljevi i strategija  
✅ Backup i recovery dokumentirano

Sljedeća faza: [`06-branding-and-assets.md`](./06-branding-and-assets.md)
