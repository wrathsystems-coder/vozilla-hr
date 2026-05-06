# Generičke siluete (placeholders)

SVG-ovi koje agent **smije** generirati jer nemaju brand element. Koriste se kao
fallback dok korisnik (vlasnik projekta) ne dostavi prave fotografije ili logoe.

## `vehicles/`

Jednobojne siluete po `body_types.slug` (vidi `seeds/body-types.json`):

- `limuzina.svg`, `hatchback.svg`, `karavan.svg`, `suv.svg`, `crossover.svg`,
  `coupe.svg`, `cabriolet.svg`, `mpv.svg`, `pickup.svg`, `mini.svg`
- `default.svg` — fallback ako body_type slug nema dedicated siluetu

Sve su:

- viewBox `0 0 200 80` (4:1.6 aspekt) — pristaje u kartice i hero placeholdere
- `stroke="currentColor"`, `fill="none"` — uzimaju boju iz parent elementa
  (`text-text-muted`, `text-brand-accent`, ...)
- Imaju `role="img"` + `aria-label` — accessible

## `brand-wordmark-placeholder.svg`

Fallback za brand kartice dok vlasnik ne uploada pravi `logo-light.svg` u
`public/branding/brands/{slug}.svg`. Ne renderira se ako brand ima dostupan
logo.

## Kad zamijeniti

- **Hero slike vozila**: vlasnik upload-a kroz Payload Media library;
  silueta se renderira samo dok hero polje nije popunjeno
- **Brand logo**: vlasnik dodaje SVG u `public/branding/brands/{slug}.svg` —
  vidi `public/branding/README.md`
