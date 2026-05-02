# Branding — vozilla.hr

Što vlasnik projekta dostavlja, gdje to ide, koje su specifikacije.

> CLAUDE.md rule #1: agent NIKAD ne generira brand assete. Logo,
> fotografije, slike vozila, OG slike — sve dostavlja korisnik. Agent
> priprema točan file path, placeholder file (vidno označen
> "PLACEHOLDER — REPLACE") i README upute s točnim specifikacijama.

## Logo paket

> TODO: dodaj specifikacije nakon Sprinta 2 (kad je header gotov i
> znamo final dimenzije).

| Asset             | Format    | Dimenzije               | File path                                 |
| ----------------- | --------- | ----------------------- | ----------------------------------------- |
| Glavni logo (svg) | SVG       | viewbox proizvoljan     | `apps/web/public/branding/logo.svg`       |
| Glavni logo (png) | PNG       | 512×128                 | `apps/web/public/branding/logo.png`       |
| Logo light theme  | SVG/PNG   | isto                    | `apps/web/public/branding/logo-light.*`   |
| Favicon           | ICO + PNG | 32×32, 192×192, 512×512 | `apps/web/public/favicon.ico` + manifest  |
| OG slika default  | PNG       | 1200×630                | `apps/web/public/branding/og-default.png` |

## Brand boje

Definirano u `config/theme.ts`:

- `XXX_BRAND_PRIMARY` — default placeholder `#000000` (crna)
- `XXX_BRAND_ACCENT` — default placeholder `#FFC107` (žuta)

Korisnik finalizira HEX kodove prije Sprinta 7. Promjena u `config/theme.ts`
i u Payload Settings global (Sprint 1+) se reflektira na cijelu aplikaciju.

## Fotografije / hero slike

> TODO Sprint 2: dimenzije za hero, model placeholdere, kategorija ilustracije,
> brand logo grid (popularne marke).

## Email branding

`apps/web/emails/_layout.tsx` — header logo (TODO Sprint 4), footer s
adresom (composite iz `config/company.yml`).

## Što agent SMIJE generirati (CLAUDE.md rule #1 iznimke)

- HEX kodove boja
- Klasične UI ikone (chevron, search, hamburger — koristi `lucide-react`)
- Generične SVG siluete vozila po kategoriji (`apps/web/public/placeholders/vehicles/*.svg`)
- SVG patterne za pozadine

## TODO

- [ ] Sprint 2: header / footer asset specifikacije
- [ ] Sprint 4: email asset specifikacije
- [ ] Sprint 7: pre-launch asset checklist
