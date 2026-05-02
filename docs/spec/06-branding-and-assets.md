# Faza 6 — Branding i assetovi (placeholder strategija)

> **Ključno pravilo**: agent NE generira ni jedan brand asset. Sve slike, logoi, fotografije, hero slike, OG slike — **dodaje vlasnik projekta**. Agent priprema mjesto + README upute.

---

## Ključno pravilo (kratki sažetak za agenta)

**Smiješ generirati**:
- HEX kodove boja (default crna + žuta paleta)
- Klasične UI ikone (preko `lucide-react` library)
- Generične SVG siluete vozila po kategoriji (kao placeholderi)
- SVG patterne za pozadine (geometric/abstract)
- Default tipografska skala (preko Tailwind config)

**NE smiješ generirati**:
- Logo (u bilo kojoj varijanti)
- Favicon
- OG slike (Open Graph share images)
- Fotografije bilo čega (vozila, ljudi, tim)
- Hero slike
- Slike modela/marki vozila
- Screenshote
- Video sadržaj
- Custom ilustracije specifične za brand

Za sve što ne smiješ generirati:
1. **Pripremi točno mjesto** (file path ili Payload polje)
2. **Stavi placeholder file** vidno označen tekstom "PLACEHOLDER — REPLACE BEFORE DEPLOY"
3. **Napiši README upute** s točnim specifikacijama

---

## Brand identitet (zaključen)

### Boje
- **Glavne**: crna + žuta
- **Točan HEX**: placeholder (vlasnik finalizira u brand work-u)

### Default paleta u kodu
```typescript
// config/theme.ts
export const theme = {
  colors: {
    // PRIMARY — žuta (akcent, CTA, highlight)
    primary: {
      50:  "#FFFBEA",
      100: "#FFF3C4",
      200: "#FCE588",
      300: "#FADB5F",
      400: "#F7C948",
      500: "#F0B429",  // ← glavna žuta (placeholder, lako se mijenja)
      600: "#DE911D",
      700: "#CB6E17",
      800: "#B44D12",
      900: "#8D2B0B",
    },
    // NEUTRAL — crna + sivilo (tekst, struktura)
    neutral: {
      0:    "#FFFFFF",
      50:   "#F7F7F7",
      100:  "#E1E1E1",
      200:  "#CFCFCF",
      300:  "#B1B1B1",
      400:  "#9E9E9E",
      500:  "#7E7E7E",
      600:  "#626262",
      700:  "#515151",
      800:  "#3B3B3B",
      900:  "#222222",  // ← skoro crna za body tekst
      1000: "#000000",  // ← prava crna za header/footer/hero overlays
    },
    // FUNCTIONAL (agent generira sensible defaults)
    success: { 500: "#10B981", ... },
    warning: { 500: "#F59E0B", ... },
    error:   { 500: "#EF4444", ... },
    info:    { 500: "#3B82F6", ... },
  },
}
```

Točan HEX-ovi vlasnik finalizira nakon brand rada. Default `#F0B429` izgleda dobro i lako se mijenja na jednom mjestu (`config/theme.ts`).

### Tipografija (default placeholder)
- **Sans (body, UI)**: Inter (Google Fonts, self-hosted preko `next/font`)
- **Serif (opcijsko za naslove)**: Source Serif Pro
- **Mono (code/technical)**: JetBrains Mono

Vlasnik može promijeniti odabirom drugog Google Font-а u `config/theme.ts`. Agent dokumentira u `docs/branding.md`.

### Light theme samo (MVP)
- Sve komponente dizajnirane za light mode
- `<ThemeProvider>` (next-themes) **postavljen ali zaključan na `light`**
- CSS varijable strukturirane tako da kasnije aktiviranje dark mode-a ne traži refactor
- Agent obvezan **NE** koristiti hardcoded boje — sve preko CSS varijabli ili Tailwind theme tokens

---

## Placeholder file struktura

### `/public/branding/`

```
/public/branding/
├── README.md                       Glavni dokument za zamjenu
├── logo-light.svg                  PLACEHOLDER (svijetla pozadina)
├── logo-dark.svg                   PLACEHOLDER (tamna pozadina)
├── logo-square.svg                 Za favicon i social
├── logo-monochrome-white.svg       Za hero overlay-e
├── favicon.ico                     16, 32, 48 px multi-resolution
├── favicon-16.png
├── favicon-32.png
├── apple-touch-icon.png            180×180
├── android-chrome-192.png
├── android-chrome-512.png
├── og-default.png                  1200×630, default share image
└── og-default-square.png           1200×1200
```

### `/public/placeholders/`

Generične SVG siluete koje agent **smije** generirati (jer su čisto strukturalne, nemaju brand element):

```
/public/placeholders/
├── README.md                       Upute što su ovi fileovi
├── vehicles/                       Po kategoriji karoserije
│   ├── sedan.svg
│   ├── hatchback.svg
│   ├── suv.svg
│   ├── karavan.svg
│   ├── kupe.svg
│   ├── kabriolet.svg
│   ├── pickup.svg
│   ├── kombi.svg
│   ├── mpv.svg
│   ├── crossover.svg
│   └── default.svg                 generic auto silueta
├── dealer-logo.svg                 Generic auto-shop silueta (korim za dilere bez logo-a)
├── user-avatar.svg                 Generic avatar (Phase 2 user accounts)
└── article-hero.svg                Generic blog post hero (kad nema slike)
```

Sve SVG-ovi:
- Jednobojni (koriste CSS varijable `currentColor`)
- Min/max viewBox aspekti dokumentirani
- Inkscape ili Figma source-ovi opcijski (agent ne mora)

---

## Logo placeholderi — kako izgledaju

Agent kreira **vidno označen** SVG koji izgleda otprilike ovako:

```
┌───────────────────────────────┐
│                                │
│     [PLACEHOLDER]              │
│     logo-light.svg             │
│                                │
│     Replace per                │
│     /public/branding/README.md │
│                                │
└───────────────────────────────┘
```

To je **doslovno** SVG s tim tekstom (žuta pozadina, crni tekst — naša brand paleta). Admin ga vidi na svakoj stranici dok ga ne zamijeni. Nemoguće je zaboraviti.

---

## `/public/branding/README.md` — sadržaj (HR)

```markdown
# Branding assetovi — kako zamijeniti

## Glavni logo

Zamijeni file-ove `logo-light.svg` i `logo-dark.svg`.

### Specifikacije
- **Format**: SVG (vektorski, skalabilan) — preporučeno
- **Aspekt**: 4:1 ili 5:1 (široki layout, pasuje u header)
- **Visina pri prikazu**: 40px desktop / 32px mobile
- **`logo-light.svg`**: koristi se na bijeloj/svijetloj pozadini (header)
- **`logo-dark.svg`**: koristi se na tamnoj pozadini (footer dark, hero overlays)
- **Fallback**: ako nemaš SVG, dodaj `logo-light@2x.png` (Retina, 2× rezolucija, transparent PNG)

### Provjeri nakon zamjene
1. Otvori `/test/branding` u dev modu
2. Provjeri kako logo izgleda u headeru (light bg) i footeru (dark bg)
3. Provjeri responsive ponašanje (resize browser)

---

## Favicon paket

Najjednostavniji način:
1. Idi na **realfavicongenerator.net**
2. Upload `logo-square.svg`
3. Odaberi defaulte (ili customiziraj)
4. Skini paket
5. Raspakiraj u `/public/branding/`
6. Provjeri na svim platformama

### Manifest
Datoteka `public/manifest.json` referencira ove fileove. Ako mijenjaš nazive, ažuriraj manifest.

---

## OG Image (Open Graph)

`og-default.png` — slika koja se prikazuje kad netko share-a vozilla.hr na Facebook, LinkedIn, X (Twitter), Slack itd.

### Specifikacije
- **Dimenzije**: 1200×630 px (najuobičajeniji aspekt)
- **Format**: PNG ili JPG (PNG za transparency, JPG za file size)
- **Veličina**: max 5MB, idealno < 500KB nakon optimizacije
- **Sadržaj**: brand logo + tagline ili glavni vizual

### Test
- **opengraph.xyz** — paste tvoj URL
- **metatags.io** — paste tvoj URL
- Facebook Debugger — share-aj URL na FB i provjeri kako izgleda

---

## Slike vozila

### Pravne napomene
- Slike novih vozila skidamo **isključivo s press-kit stranica** proizvođača (`media.audi.com`, `mediahub.bmwgroup.com`, `media.skoda-auto.com`, ...)
- Provjeri uvjete licence — većina dozvoljava editorial use
- Slike rabljenih vozila uvijek upload-aju **dileri kroz svoj dashboard**
- Privatni prodavači šalju slike kroz formu → admin odobrava prije publish-a

### Specifikacije
- **Hero (stranica modela)**: 1920×1080 (16:9), JPG, max 500KB nakon optimizacije
- **Galerija (rabljeni)**: min 1200×800, max 10 slika po oglasu
- **Card thumbnail**: agent automatski generira iz hero (ne treba ručno)

### Upload kroz Payload
1. Login u `/admin`
2. Media → Upload
3. **Obavezna polja**:
   - **ALT text** (HR jezik)
   - **Source** (vlastite / press_kit / dealer_uploaded / stock_photo)
   - **Credit** ("Foto: Audi AG")
   - **License URL** (link na licencu, opcijsko)
4. Tags (opcijsko, npr. "audi", "a4", "hero")
5. Spremi → koristi se kroz cijeli site automatski

---

## Boje

1. Otvori `config/theme.ts`
2. Zamijeni `primary` paletu HEX kodovima — možeš generirati paletu na **uicolors.app** unosom jedne boje
3. Promijeni `neutral` ako brand zahtijeva drugačiji ton sivila
4. Funkcionalne boje (success/warning/error/info) — defaulti su pripremljeni, mijenjaj samo ako brand zahtijeva
5. Pokreni `pnpm dev`
6. Provjeri sve komponente na `/test/branding`

---

## Fontovi

### Google Fonts
1. Odaberi font na **fonts.google.com**
2. Promijeni `fonts.sans` u `config/theme.ts`
3. Agent automatski preuzima i self-hosta (`next/font`)

### Custom font
1. Stavi `.woff2` fileove u `/public/fonts/`
2. Prati upute u `docs/custom-fonts.md`

---

## Provjera nakon SVAKE zamjene

```bash
pnpm dev
# Otvori http://localhost:3000/test/branding
```

I ručno provjeri:
- [ ] Logo na naslovnici (header light bg)
- [ ] Logo u footeru (dark bg)
- [ ] Favicon u browser tabu
- [ ] OG image — share na FB/LinkedIn (developer modu)
- [ ] Apple touch icon — dodaj na home screen iOS-а
- [ ] Boje na CTA gumbima
- [ ] Boje na error states
```

---

## Tekstualni placeholderi (XXX format)

### Filozofija
Sve tekstove koji nisu UI labels (npr. "Pošalji upit", "Tvoj email") agent stavlja kao placeholder s prefiksom `[XXX_*]`. Vlasnik popunjava kroz Payload `MarketingCopy` global ili pojedinačne kolekcije.

### Popis svih tekstova koje vlasnik popunjava

#### Marketing / landing
| Placeholder | Lokacija | Tip | Preporuka |
|---|---|---|---|
| `XXX_TAGLINE` | Settings.tagline | string | 8-12 riječi |
| `XXX_HERO_HEADLINE` | MarketingCopy.hero_headline | string | 5-8 riječi |
| `XXX_HERO_SUBHEADLINE` | MarketingCopy.hero_subheadline | string | 15-25 riječi, 1-2 rečenice |
| `XXX_HERO_CTA_TEXT` | MarketingCopy.hero_cta_text | string | 2-4 riječi |
| `XXX_VALUE_PROP_1_TITLE` × 3-4 | MarketingCopy.value_props[].title | string | Kratko, 3-5 riječi |
| `XXX_VALUE_PROP_1_DESC` × 3-4 | MarketingCopy.value_props[].desc | string | 1-2 rečenice |
| `XXX_HOW_IT_WORKS_STEP_1_TITLE` × 3 | MarketingCopy.steps[].title | string | Kratko |
| `XXX_HOW_IT_WORKS_STEP_1_DESC` × 3 | MarketingCopy.steps[].desc | string | 1-2 rečenice |
| `XXX_TESTIMONIAL_1_QUOTE` × 3-5 | MarketingCopy.testimonials[].quote | string | 1-3 rečenice |
| `XXX_TESTIMONIAL_1_AUTHOR` × 3-5 | MarketingCopy.testimonials[].author | string | "Ime, lokacija" |
| `XXX_FOOTER_DESCRIPTION` | Settings.footer_description | string | 1-2 rečenice o firmi |
| `XXX_TRUST_SIGNAL_DEALERS` | MarketingCopy.trust_dealers | number | broj partnera |
| `XXX_TRUST_SIGNAL_CUSTOMERS` | MarketingCopy.trust_customers | number | broj zadovoljnih kupaca |

#### Statične stranice (vlasnik piše full content kroz Payload Lexical editor)
- `pages/o-nama` — O nama (h1, sekcije: misija, tim, povijest, partneri)
- `pages/kontakt` — Kontakt (info + forma)
- `pages/kako-funkcionira` — 3-koračni proces u detaljima
- `pages/cesta-pitanja` — FAQ (15-20 pitanja)
- `pages/kako-provjeravamo-recenzije` — DSA obveza

#### FAQ — agent priprema 15-20 pitanja-okvira
| # | Pitanje | Placeholder |
|---|---|---|
| 1 | Kako funkcionira "Zatraži ponudu"? | `[XXX_FAQ_HOW_IT_WORKS]` |
| 2 | Naplaćujete li uslugu? | `[XXX_FAQ_PRICING]` |
| 3 | Što ako mi se ne svidi nijedna ponuda? | `[XXX_FAQ_NO_OFFER]` |
| 4 | Mogu li otkazati upit nakon slanja? | `[XXX_FAQ_CANCEL]` |
| 5 | Kako odabirete dilere kojima šaljete moj upit? | `[XXX_FAQ_DEALER_SELECTION]` |
| 6 | Koliko brzo mogu očekivati ponude? | `[XXX_FAQ_RESPONSE_TIME]` |
| 7 | Mogu li platiti vozilo preko vozilla.hr? | `[XXX_FAQ_PAYMENT]` |
| 8 | Što s rabljenim vozilima? | `[XXX_FAQ_USED_CARS]` |
| 9 | Je li leasing kalkulator točan? | `[XXX_FAQ_LEASING_ACCURACY]` |
| 10 | Što s mojim osobnim podacima? | `[XXX_FAQ_PRIVACY]` |
| 11 | Kako se mogu odjaviti od newslettera? | `[XXX_FAQ_NEWSLETTER_UNSUB]` |
| 12 | Možete li mi pomoći ako imam problem s dilerom? | `[XXX_FAQ_DEALER_DISPUTE]` |
| 13 | Kako vidim status svog upita? | `[XXX_FAQ_TRACKER]` |
| 14 | Što je trade-in i kako to radi? | `[XXX_FAQ_TRADEIN]` |
| 15 | Mogu li biti diler na vozilla.hr? | `[XXX_FAQ_BECOME_DEALER]` |
| 16 | Tko piše recenzije i kako ih provjeravate? | `[XXX_FAQ_REVIEWS]` |
| 17 | Što je razlika između operativnog i financijskog leasinga? | `[XXX_FAQ_LEASING_TYPES]` |
| 18 | Kako mogu obrisati svoje podatke (GDPR)? | `[XXX_FAQ_GDPR]` |
| 19 | Imate li mobilnu aplikaciju? | `[XXX_FAQ_MOBILE_APP]` |
| 20 | Gdje se nalazi vaš ured? | `[XXX_FAQ_OFFICE]` |

#### Pravne stranice (vlasnik dostavlja gotov tekst)
- OUP — `[XXX_OUP_TEKST]`
- Politika privatnosti — `[XXX_PP_TEKST]`
- Politika kolačića — `[XXX_PK_TEKST]`
- Impressum — auto-generiran iz `company.yml`, vlasnik samo popunjava XXX vrijednosti
- "Kako provjeravamo recenzije" — `[XXX_RECENZIJE_PROCES_TEKST]`

#### Email template-i — sadržaj (vlasnik prilagođava kroz Payload Email Templates kolekciju)
Svaki template ima:
- **Subject** (placeholder)
- **Heading** (placeholder)
- **Body sections** (placeholderi)
- **CTA text** (placeholder)
- **Footer notes** (placeholder)

Agent stvara default tekst koji izgleda profesionalno (ne lorem ipsum), ali vlasnik može override-ati.

---

## Email template-i (svi pripremljeni, ključni ON, ostali OFF)

### Lokacija
`/emails/` folder, svaki template je React Email `.tsx` file.

### Struktura
```
/emails/
├── _layout.tsx                       Shared layout (logo, footer, brand colors)
├── _components/                      Reusable: button, divider, header, footer
├── lead-confirmation.tsx             ← ON (kupcu)
├── lead-to-dealer.tsx                ← ON (dileru)
├── magic-link.tsx                    ← ON (kupcu, tracker link)
├── dealer-reminder-24h.tsx           ← ON (dileru)
├── dealer-reminder-48h.tsx           ← ON (dileru)
├── customer-feedback-day3.tsx        ← OFF (feature flag)
├── customer-feedback-day14.tsx       ← OFF
├── customer-feedback-day30.tsx       ← OFF
├── newsletter-double-optin.tsx       ← OFF (newsletter inactive)
├── newsletter-welcome.tsx            ← OFF
├── gdpr-request-received.tsx         ← ON
├── gdpr-request-resolved.tsx         ← ON
├── dealer-invite.tsx                 ← OFF (admin manual u MVP)
├── dealer-password-reset.tsx         ← ON
├── dealer-account-suspended.tsx      ← OFF
├── admin-new-lead-notification.tsx   ← ON
└── README.md                         Upute za uređivanje
```

### Feature flag pristup
Payload `EmailSettings` global s checkboxima:
```yaml
EmailSettings:
  lead_confirmation_enabled: true       # uvijek ON
  lead_to_dealer_enabled: true          # uvijek ON
  magic_link_enabled: true
  dealer_reminder_24h_enabled: true
  dealer_reminder_48h_enabled: true
  customer_feedback_day3_enabled: false
  customer_feedback_day14_enabled: false
  customer_feedback_day30_enabled: false
  newsletter_optin_enabled: false       # newsletter inactive
  newsletter_welcome_enabled: false
  gdpr_received_enabled: true
  gdpr_resolved_enabled: true
  dealer_invite_enabled: false
  dealer_password_reset_enabled: true
  dealer_suspended_enabled: false
  admin_new_lead_enabled: true
```

Agent obvezan provjeriti flag prije slanja. Ako disabled, log događaj ("would send X to Y") ali **ne pošalji** stvarni email.

### Preview sustav
`/admin/email-preview` stranica:
- Lista svih template-a
- Klik na template → preview u iframe-u s sample podacima
- Gumb "Pošalji test email" na vlastitu adresu
- Gumb "Edit" → vodi u Payload edit za taj template

### Tekstovi
Svi tekstovi u template-ima su **prazne stringove ili XXX placeholderi**. Vlasnik popunjava kroz Payload `EmailTemplates` kolekciju koja override-a default tekst iz koda.

---

## `/test/branding` mini playground

Stranica dostupna **samo u dev modu** (`NODE_ENV !== 'production'`) ili iza `?preview=token` query param-a u produkciji.

### Sadržaj
- Sve varijante logo-a na različitim pozadinama (light, dark, color)
- Color paletu (sve nijanse + primjeri primjene)
- Tipografska skala (h1-h6, body, small, caption)
- Glavne komponente:
  - **Button** — sve varijante (primary, secondary, ghost, destructive) × sve veličine × sva stanja (hover, focus, disabled, loading)
  - **Input** (text, email, phone, textarea, select, checkbox, radio, multi-select)
  - **Card** (osnovni, s slikom, s actions, hover effect)
  - **Header** (full desktop + mobile hamburger)
  - **Footer** (skraćen)
- Form examples — jedan korak iz "Zatraži ponudu" + sticky widget (zatvoren + otvoren)
- Cookie banner preview
- Email template preview iframe-ovi
- Schema.org markup tester

### Kako pristupiti
- **Dev**: `pnpm dev` → `http://localhost:3000/test/branding`
- **Produkcija**: `https://vozilla.hr/test/branding?preview=XXX_PREVIEW_TOKEN` (token u env)

Agent dokumentira u `docs/branding.md` kako se koristi.

---

## Demo content (cleanup obavezan prije produkcije)

### Što agent generira kao demo data
- 5-10 demo recenzija (s placeholder slikama, tekst vidno označen "DEMO TEXT — REPLACE")
- 5 demo savjeta
- 5 demo rabljenih oglasa
- 5 demo dilera (s `DEMO_DEALER_*` prefiksom)
- 20-30 demo leadova (s `@example.com` emailovima)

Razlog: site mora "izgledati živ" za demo i development. Pre-launch checklist obavezno traži cleanup.

### Cleanup
`/admin/demo-content/` stranica s gumbom **"Obriši sve demo podatke"**:
- Briše sve zapise gdje je `is_demo: true`
- Traži double-confirmation: upiši riječ "OBRIŠI" da nastaviš
- Loguje akciju u audit_log
- Ne može se vratiti (osim restore iz backupa)
- **Pre-launch checklist** stavka: "✅ Obrisani svi DEMO_* zapisi"

CLI varijanta: `pnpm seed:cleanup-demo` (za scriptable use).

---

## `docs/PLACEHOLDERS.md` — master placeholder index

Ovaj dokument **agent automatski ažurira** kad doda novi XXX. Format:

```markdown
| Placeholder | Lokacija | Tip | Tko popunjava | Preporuka |
| --- | --- | --- | --- | --- |
| XXX_LEGAL_NAME | config/company.yml:5 | text | vlasnik | Pun naziv firme s pravnim oblikom |
| XXX_HERO_HEADLINE | Payload Settings → Marketing Copy | text | vlasnik | 5-8 riječi |
| logo-light.svg | /public/branding/ | image | vlasnik | SVG, 4:1 aspekt |
| ... | ... | ... | ... | ... |
```

### Kako se ažurira
- **Auto**: pri `pnpm placeholders:check`, skripta scan-a sve XXX-ove i regenerira tablicu
- **Manualno**: agent edit-a kad doda novu placeholder vrijednost koja nije u kodu (npr. Payload polje)

### Kako se koristi
- Vlasnik prati ovaj dokument kao "ToDo" listu
- Pre-launch checklist referencira ovaj dokument
- Sve XXX-ove popune ili dokumentira (ako je namjerno ostavljen)

---

## Placeholder guard (CI hook)

### `pnpm placeholders:check`

Skripta `scripts/check-placeholders.ts`:

1. Prolazi kroz sve fileove u repo:
   - `**/*.ts`, `**/*.tsx`, `**/*.md`, `**/*.yml`, `**/*.yaml`, `**/*.json`, `**/*.env.example`
   - `public/branding/**/*`, `public/placeholders/**/*`
2. Traži regex match: `/XXX_[A-Z_]+/`, `/\[XXX_/`, `"PLACEHOLDER"`, `"DEMO_DEALER_"`, `"@example.com"` (u ne-test contextima)
3. Ispisuje listu hitova s:
   - File path
   - Linija
   - Context (snippet)
4. Exit code:
   - **0** — sve čisto
   - **1** — ima placeholder ostataka (CI fail)

### Bypass
Env var `ALLOW_PLACEHOLDERS=true` — za development build (lokalno radi). U produkciji obavezno `false` ili nedefinirano.

### Whitelist
File `placeholder-whitelist.txt` — neki XXX-ovi namjerno ostaju (npr. example value-i u dokumentaciji, MD fileovi koji opisuju placeholder strategiju). Agent dokumentira što i zašto.

### Vercel CI hook
U `package.json`:
```json
{
  "scripts": {
    "build": "pnpm placeholders:check && next build"
  }
}
```

Ako placeholder check fail-a → build pukne → Vercel deploy fail → produkcija ne ide live s placeholderima.

---

## Definicija uspjeha Faze 6

✅ Filozofija "agent priprema, vlasnik popunjava" jasno definirana  
✅ Brand boje (crna + žuta) konkretizirane s default HEX paletom  
✅ Light theme strategija s pripremom za dark mode  
✅ Logo placeholderi (vidno označeni SVG-ovi)  
✅ `/public/branding/` i `/public/placeholders/` strukture  
✅ `README.md` u `/public/branding/` na hrvatskom (kako zamjenjivati)  
✅ Tekstualni placeholderi popis (XXX i [XXX_*])  
✅ FAQ 20 pitanja-okvira  
✅ Email template-i lista (17 ukupno) s feature flag statusima  
✅ `/test/branding` playground specs  
✅ Demo content cleanup proces  
✅ `pnpm placeholders:check` skripta + CI hook  
✅ `docs/PLACEHOLDERS.md` master index

Sljedeća faza: [`07-delivery-and-deployment.md`](./07-delivery-and-deployment.md)
