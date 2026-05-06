# Branding assetovi — kako zamijeniti

Sve datoteke u ovom folderu su **placeholderi**. Vlasnik projekta dostavlja
finalne. Agent ih nikad ne generira.

## Glavni logo

| File                       | Korištenje                                    |
| -------------------------- | --------------------------------------------- |
| `logo-light.svg`           | Header (svijetla pozadina), default           |
| `logo-dark.svg`            | Footer (tamna), hero overlays                 |
| `logo-square.svg`          | Favicon source, social profile                |
| `logo-monochrome-white.svg` | Bijela varijanta na coloured pozadinu         |

### Specifikacije

- **Format**: SVG (vektorski) — preporučeno; PNG fallback samo ako nema SVG
- **Aspekt**: 4:1 ili 5:1 (široki layout)
- **Visina pri prikazu**: 40px desktop, 32px mobile
- **Provjera nakon zamjene**: `pnpm dev` → `/test/branding` i provjeri header
  + footer. Inline `vozilla.hr` wordmark u `Header.tsx` i `Footer.tsx` se
  ručno zamjenjuje `<Image>` linkom kad logo stigne.

## Brand logoi (po marki)

Dileri / proizvođači — uploadaju se u `public/branding/brands/{slug}.svg`,
gdje `slug` odgovara `brands.slug` u Payload kolekciji
(npr. `audi`, `skoda`, `vw`).

Specifikacije:

- **Format**: SVG ili PNG transparent (1×, idealno 2×)
- **Aspekt**: kvadrat ili 4:1; renderira se centriran u 240×80 box-u
- Ako file ne postoji za taj slug, prikazuje se text wordmark
  (`AUDI` u brand color box-u) kao fallback

## Favicon paket

Najjednostavniji put: **realfavicongenerator.net** → upload `logo-square.svg` →
download paket → raspakiraj sve u `public/branding/`. Manifest je u
`public/branding/manifest.json` (auto-generiran, agent dokumentira ako se
mijenjaju nazivi).

Očekivani fileovi:
- `favicon.ico`, `favicon-16.png`, `favicon-32.png`
- `apple-touch-icon.png` (180×180)
- `android-chrome-192.png`, `android-chrome-512.png`

## OG slike (Open Graph)

`og-default.png` — 1200×630, prikazuje se kad netko share-a vozilla.hr na
Facebook, LinkedIn, X, Slack itd. Za pojedinačne stranice (recenzije,
modeli) može se override-ati `og_image_path` u Payload SEO polju.

- **Test**: opengraph.xyz, metatags.io, Facebook Debugger.

## Slike vozila (hero / model gallery)

Skidaš isključivo s **press-kit stranica proizvođača** (npr.
`media.audi.com`, `mediahub.bmwgroup.com`). Editorial use je u pravilu
dozvoljen — provjeri uvjete licence po brandu.

Upload kroz Payload admin → Media. Obavezna polja: `alt`, `source`,
`credit`, `license_url` (opcijsko). Width 1920×1080 za hero, 1200×800 min za
listings galeriju.

Dok hero slika nije postavljena, public stranice prikazuju siluetu iz
`public/placeholders/vehicles/{body_type}.svg` (vidi
`public/placeholders/README.md`).
