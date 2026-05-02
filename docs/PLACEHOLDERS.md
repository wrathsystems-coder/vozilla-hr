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

## Pravna osoba i kontakt — `config/company.yml`

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

## Marketing tekstovi — Payload Settings (Sprint 1+) i kod

| Placeholder            | Status | Lokacija                         | Opis                              |
| ---------------------- | ------ | -------------------------------- | --------------------------------- |
| `XXX_HERO_HEADLINE`    | ⬜     | `apps/web/app/(public)/page.tsx` | Hero naslov, 5-8 riječi           |
| `XXX_SITE_DESCRIPTION` | ⬜     | `apps/web/app/layout.tsx`        | Meta description, 150-160 znakova |
| `XXX_TAGLINE`          | ⬜     | TBD (Payload Settings, Sprint 2) | Tagline, 8-12 riječi              |

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
| `XXX_RECAPTCHA_SITE_KEY`   | ⬜     | 4      | Google reCAPTCHA v3 site key (NEXT*PUBLIC*)                         |
| `XXX_RECAPTCHA_SECRET_KEY` | ⬜     | 4      | Google reCAPTCHA v3 secret key                                      |
| `XXX_COOKIEBOT_ID`         | ⬜     | 2      | Cookiebot site ID (NEXT*PUBLIC*)                                    |
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
