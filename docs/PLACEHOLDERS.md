# Master placeholder index — vozilla.hr

Sve `XXX_` i `[XXX_*]` vrijednosti koje vlasnik projekta mora popuniti
prije produkcije. Agent ažurira ovaj file svaki put kad doda novi XXX.

`pnpm placeholders:check` skenira repo za bilo kakvu XXX vrijednost.
U produkcijskom buildu (`NODE_ENV=production` ili `--strict`) fail-a
build ako ih ima. Lokalno samo prijavljuje hits.

## Status legenda

- ⬜ — nije popunjeno
- ✅ — popunjeno
- 🔧 — agent generirao placeholder vrijednost (npr. HEX boja); korisnik finalizira

---

## Pravna osoba i kontakt — `config/company.yml` + Payload `Settings` global

Build-time defaults u `config/company.yml`. Runtime override u Payload
admin → Settings global (Sprint 4+ logika čita override prvi, fallback
na YAML).

| Placeholder                     | Status | Opis                                        |
| ------------------------------- | ------ | ------------------------------------------- |
| `XXX_COMPANY_LEGAL_NAME`        | ⬜     | Pravni naziv (npr. "Vozilla d.o.o.")        |
| `XXX_COMPANY_OIB`               | ⬜     | OIB, 11 znamenki (validacija checksum-om)   |
| `XXX_COMPANY_MBS`               | ⬜     | Matični broj subjekta, max 9 znamenki       |
| `XXX_COMPANY_STREET`            | ⬜     | Ulica i broj                                |
| `XXX_COMPANY_CITY`              | ⬜     | Grad                                        |
| `XXX_COMPANY_POSTCODE`          | ⬜     | Poštanski broj, 5 znamenki                  |
| `XXX_COURT_REGISTER_NAME`       | ⬜     | Naziv suda (npr. "Trgovački sud u Zagrebu") |
| `XXX_COURT_REGISTRATION_NUMBER` | ⬜     | Registarski broj                            |
| `XXX_SHARE_CAPITAL_AMOUNT`      | ⬜     | Temeljni kapital (npr. "2.500,00")          |
| `XXX_DIRECTOR_NAME`             | ⬜     | Ime direktora                               |
| `XXX_CONTACT_EMAIL_GENERAL`     | ⬜     | Općeniti kontakt email                      |
| `XXX_CONTACT_EMAIL_DPO`         | ⬜     | DPO email (privacy/GDPR)                    |
| `XXX_CONTACT_EMAIL_DEALERS`     | ⬜     | Email za dilere                             |
| `XXX_CONTACT_PHONE`             | ⬜     | Telefon (E.164: +385...)                    |
| `XXX_BANK_NAME`                 | ⬜     | Naziv banke                                 |
| `XXX_BANK_IBAN`                 | ⬜     | IBAN                                        |
| `XXX_BANK_SWIFT`                | ⬜     | SWIFT/BIC                                   |

## Brand — `config/theme.ts`

| Placeholder         | Status | Opis                                         |
| ------------------- | ------ | -------------------------------------------- |
| `XXX_BRAND_PRIMARY` | 🔧     | Primarna brand boja (default `#000000`, HEX) |
| `XXX_BRAND_ACCENT`  | 🔧     | Akcent boja (default `#FFC107`, HEX)         |

## Brand assets — soft placeholders (ne fail-aju build)

Vizualni asseti (logo, favicon, OG slike) koje vlasnik dostavlja prema
specifikaciji. Ne koriste `XXX_*` marker u kodu — fallback je
funkcionalan (npr. tekstualni wordmark) i build prolazi. Ovaj index je
manualni reminder za pre-launch checklist.

| Asset       | Status | Lokacija                                | Trenutni fallback                                                      |
| ----------- | ------ | --------------------------------------- | ---------------------------------------------------------------------- |
| Header logo | ⬜     | `apps/web/components/layout/Header.tsx` | Inline tekstualni wordmark "vozilla.hr". Zamijeniti SVG-om kad stigne. |
| Footer logo | ⬜     | `apps/web/components/layout/Footer.tsx` | Inline tekstualni wordmark "vozilla.hr". Isti tretman kao header.      |

## Marketing tekstovi — Payload `MarketingCopy` global + kod

Hero, value props, how*it_works, testimonials populiraš kroz Payload
admin → MarketingCopy global. Code-side default je `[XXX*\*]` placeholder
dok Payload polje nije popunjeno.

| Placeholder               | Status | Lokacija                                            | Opis                                            |
| ------------------------- | ------ | --------------------------------------------------- | ----------------------------------------------- |
| `XXX_HERO_HEADLINE`       | ⬜     | `components/home/Hero.tsx` + `MarketingCopy.hero`   | Hero naslov, 5-8 riječi                         |
| `XXX_HERO_SUBHEADLINE`    | ⬜     | `components/home/Hero.tsx`                          | Hero podnaslov, 1-2 rečenice                    |
| `XXX_VP_1/2/3_TITLE`      | ⬜     | `components/home/ValueProps.tsx`                    | Value prop naslov, 3-5 riječi (3 stavke)        |
| `XXX_VP_1/2/3_BODY`       | ⬜     | `components/home/ValueProps.tsx`                    | Value prop body, 1-2 rečenice (3 stavke)        |
| `XXX_HIW_1/2/3_TITLE`     | ⬜     | `components/home/HowItWorks.tsx`                    | How-it-works step naslov, 2-4 riječi (3 stavke) |
| `XXX_HIW_1/2/3_BODY`      | ⬜     | `components/home/HowItWorks.tsx`                    | How-it-works step body, 1-2 rečenice (3 stavke) |
| `XXX_TRUST_DEALERS`       | ⬜     | `components/home/TrustSignals.tsx`                  | Broj provjerenih dilera (npr. "120+")           |
| `XXX_TRUST_CUSTOMERS`     | ⬜     | `components/home/TrustSignals.tsx`                  | Broj zadovoljnih kupaca                         |
| `XXX_TRUST_REVIEWS`       | ⬜     | `components/home/TrustSignals.tsx`                  | Broj objavljenih recenzija                      |
| `XXX_QUIZ_CTA_HEADLINE`   | ⬜     | `components/home/QuizCta.tsx`                       | Quiz CTA naslov, 6-10 riječi                    |
| `XXX_QUIZ_CTA_BODY`       | ⬜     | `components/home/QuizCta.tsx`                       | Quiz CTA body, 1-2 rečenice                     |
| `XXX_NEWSLETTER_HEADLINE` | ⬜     | `components/home/NewsletterCta.tsx`                 | Newsletter naslov, 4-7 riječi                   |
| `XXX_NEWSLETTER_BODY`     | ⬜     | `components/home/NewsletterCta.tsx`                 | Newsletter body, 1-2 rečenice                   |
| `XXX_FINAL_CTA_HEADLINE`  | ⬜     | `components/home/FinalCta.tsx`                      | Final CTA naslov, 5-8 riječi                    |
| `XXX_FINAL_CTA_BODY`      | ⬜     | `components/home/FinalCta.tsx`                      | Final CTA body, 1-2 rečenice                    |
| `XXX_SITE_DESCRIPTION`    | ⬜     | `app/(public)/layout.tsx` + Settings `seo_defaults` | Meta description, 150-160 znakova               |
| `XXX_TAGLINE`             | ⬜     | `components/layout/Footer.tsx` + `Settings`         | Tagline, 8-12 riječi                            |

## Statične stranice — content placeholderi

Sadržaj stranica seli se na Payload Pages kolekciju (Sprint 3+ kad
render po slugu prožive). Do tada svaka stranica ima inline `[XXX_*]`
markere da `placeholders:check` blokira produkcijski build dok content
nije finaliziran.

| Placeholder grupa                             | Stavki | Lokacija                                            | Opis                                                                  |
| --------------------------------------------- | ------ | --------------------------------------------------- | --------------------------------------------------------------------- |
| `XXX_ABOUT_*`                                 | 4      | `app/(public)/o-nama/page.tsx`                      | Intro + Misija / Pristup / Tim body                                   |
| `XXX_CONTACT_INTRO`                           | 1      | `app/(public)/kontakt/page.tsx`                     | Uvod stranice (kontaktni podaci recikliraju existing `XXX_CONTACT_*`) |
| `XXX_HIW_FULL_*`                              | 13     | `app/(public)/kako-funkcionira/page.tsx`            | Intro + 6 koraka × (title + body)                                     |
| `XXX_FAQ_INTRO`, `XXX_FAQ_N_Q`, `XXX_FAQ_N_A` | 41     | `app/(public)/cesta-pitanja/page.tsx`               | Intro + 20 pitanja × (Q + A); FAQPage Schema.org renderira se inline  |
| `XXX_REVIEW_VETTING_*`                        | 5      | `app/(public)/kako-provjeravamo-recenzije/page.tsx` | Intro + 4 sekcije body (DSA compliance)                               |

## Email tekstovi — `apps/web/emails/`

| Placeholder              | Status | Opis                                                 |
| ------------------------ | ------ | ---------------------------------------------------- |
| `XXX_COMPANY_LEGAL_NAME` | ⬜     | (vidi gore)                                          |
| `XXX_COMPANY_ADDRESS`    | ⬜     | Composite iz `company.yml`: street + city + postcode |

## Env varijable — `.env.example`

Vrijednosti se popunjavaju izvan repo-a: lokalno u `apps/web/.env.local`,
produkcijski na Vercel project settings (encrypted). Sentry / GA4 / PostHog
varijable su prazne u MVP-u jer su feature-flagged OFF u `config/feature-flags.yml`.

| Placeholder                | Status | Sprint | Opis                                                                |
| -------------------------- | ------ | ------ | ------------------------------------------------------------------- |
| `XXX_DATABASE_URL`         | ⬜     | 0      | Postgres connection string (Docker lokalno, Supabase pooler u prod) |
| `XXX_PAYLOAD_SECRET`       | ⬜     | 0      | Payload CMS secret, 32+ random chars                                |
| `XXX_SITE_URL`             | ⬜     | 0      | Public site URL bez trailing slash-a                                |
| `XXX_RESEND_API_KEY`       | ⬜     | 4      | Resend API key (dev fallback console.warn ako nedostaje)            |
| `XXX_RESEND_FROM_EMAIL`    | ⬜     | 4      | Default "from" email, mora biti na verified Resend domeni           |
| `XXX_RECAPTCHA_SITE_KEY`   | ⬜     | 4      | Google reCAPTCHA v3 site key (browser-exposed)                      |
| `XXX_RECAPTCHA_SECRET_KEY` | ⬜     | 4      | Google reCAPTCHA v3 secret key                                      |
| `XXX_COOKIEBOT_ID`         | ⬜     | 2      | Cookiebot site ID (browser-exposed)                                 |
| `XXX_CRON_SECRET`          | ⬜     | 5      | Vercel Cron auth header secret                                      |

Empty u MVP-u (Sprint 7+ ili Phase 2):

- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

## Pravne stranice (Sprint 2+)

> Sadržaj OUP-a, Politike privatnosti, Politike kolačića isporučuje
> pravnik. Stranice imaju kostur s `[XXX_OUP_TEKST: pravnik dostavlja]`
> placeholderom u Payload Pages kolekciji.

| Placeholder       | Status | Opis                                     |
| ----------------- | ------ | ---------------------------------------- |
| `[XXX_OUP_TEKST]` | ⬜     | Opći uvjeti — pravnik dostavlja          |
| `[XXX_PP_TEKST]`  | ⬜     | Politika privatnosti — pravnik dostavlja |
| `[XXX_PK_TEKST]`  | ⬜     | Politika kolačića — pravnik dostavlja    |
