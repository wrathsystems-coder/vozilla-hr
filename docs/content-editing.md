# Uređivanje sadržaja — vozilla.hr

Vodič za **netehničke korisnike** (vlasnik, urednik, marketing). Objašnjava
kako ažurirati tekstove, slike, recenzije i ostalo kroz **Payload admin**.

> Sprint 7 — funkcionalno kompletan vodič. Screenshot-i se dodaju tijekom
> prvog produkcijskog sadržajnog popune (Sprint 7+).

## Pristup

1. Otvori `https://vozilla.hr/admin/` (produkcija) ili `http://localhost:3000/admin/` (lokalno).
2. Logiraj se s emailom i lozinkom. Produkcijski računi imaju obavezan 2FA — pri prvom loginu skeniraj QR kod aplikacijom (Google Authenticator / Authy).
3. Ako si zaboravio/la lozinku, koristi "Forgot password" link na login stranici. Magic link stiže emailom.

## Što možeš mijenjati

Sve placeholder vrijednosti (`XXX_*`) popunjavaš kroz Payload, ne diraš kod.

### Marketing tekstovi → `Globals → Marketing Copy`

- Hero naslov (5-8 riječi) i podnaslov (1-2 rečenice)
- 3× Value prop (naslov + body)
- 3× How it works step (naslov + body)
- Trust signali (broj dilera / kupaca / recenzija)
- Quiz CTA + Final CTA naslovi i body
- Newsletter naslov + body (cak i kad je feature flag off — kad se aktivira, tekst je tu)

### Korporativni podaci → `Globals → Settings`

- Tagline (8-12 riječi) → ide u footer + meta opise
- Logo / favicon / OG image putanje (assete dodaješ u Media library prvo)
- Kontakt: opći email, DPO email, dealer email, telefon, adresa
- Društvene mreže: Facebook / Instagram / LinkedIn / YouTube URL-ovi
- SEO defaults: meta title template, opis, default OG image

### Marke i modeli → `Collections → Brands`, `Models`, `ModelVersions`

- **Brands**: slug (ASCII-safe — `audi`, `vw`, `skoda`), naziv, država podrijetla, logo path, opis. `is_active=false` skriva marku sa public stranice.
- **Models**: relacija na brand, slug, naziv, body_type, popularnost. Slug mora biti unique po (brand, slug).
- **ModelVersions**: trim varijante (npr. "2.0 TDI Sport") s engine specs i cijenom.

CSV importer: za bulk-add koristi `pnpm seed:vehicles` lokalno (tehnički tim).

### Recenzije → `Collections → Reviews`

1. Klikni "Create new". Postavi slug (npr. `audi-a4-recenzija-2025`), naslov, model.
2. **Score sidebar**: ocijeni od 1-10 kategorije (vožnja, komfor, prostor, opremljenost, omjer cijena/kvaliteta) — popunjavaj samo polja koja imaš osnovu za, ne sve.
3. **Lexical body**: uobičajeni rich-text editor. Custom blocks dostupni: HeroImage, SpecsTable, ProsCons, CtaButton, DisclaimerBox, Gallery, ComparisonEmbed, YouTubeEmbed, Quote, FAQ, Stats, ImageWithText.
4. **Pros / Cons block**: po jedna lista za svaku stranu.
5. **Published_at**: kad si spreman/na za public, postavi `is_published=true` i datum.

### Savjeti / blog → `Collections → Articles`

Slično kao recenzije. Razlika: `category_slug` umjesto `model` (npr. `vodici`, `savjeti`, `vijesti`, `tehnologija`).

### Pravne stranice → `Collections → Pages`

Kad pravnik dostavi finalni tekst:

1. Kreiraj `Page` sa slug-om `opci-uvjeti` / `politika-privatnosti` / `politika-kolacica`.
2. Lexical body — paste-aj tekst, oblikuj headinge i liste.
3. `is_published=true`.

Sve dok pravnik ne stigne, stranica fallback-a na `[XXX_*_TEKST]` placeholder iz koda.

Impressum se automatski generira iz Settings global-a (XXX*COMPANY*\*) — ne treba ga uređivati posebno.

PDF download radi pre-existing — "Preuzmi PDF" gumb otvara print-friendly stranicu (`/print/<slug>`) → korisnik koristi browser "Save as PDF".

### Dileri → `Collections → Dealers`

- **Pravni podaci**: legal_name, OIB (11 znamenki, checksum-validirano), MBS, kontakt podaci.
- **Brands**: koje marke pokrivaju.
- **Counties**: u kojim županijama rade (1-21).
- **Scoring**: agent računa automatski iz status-a leadova; uređuj samo `is_active`, `is_priority`, `max_leads_per_month`.

### Email tekstovi → `Globals → EmailSettings`

Po template-u (13 templatea trenutno):

- **enabled**: gumb za isključi/uključi pojedinog email-a (npr. ugasi customer-feedback emaile ako rezultat nije dobar)
- **subject_override**: vlastiti subject umjesto code-default-a
- **from_email**: pošiljatelj (default je `RESEND_FROM_EMAIL` env)
- **reply_to**: gdje stižu odgovori (npr. `info@vozilla.hr`)

### Lead distribution → `Globals → LeadDistribution`

Težine algoritma za rangiranje dilera:

- `weights`: 5 brojeva koji se sumiraju u 1 (brand match, geo, kvaliteta, dostupnost, aktivnost)
- `thresholds`: min/max za skor

Promjeni samo ako razumiješ posljedice — netočne težine mogu prouzročiti loš distribution.

### Leasing kalkulator → `Globals → LeasingDefaults`

Default kamate, periodi, polog ranges, residual value. HANFA disclamer (zakonski obavezan iznad rezultata).

## Što NE diraj

- **Schema** (struktura kolekcija) — tehnički tim radi
- **Feature flag-ovi u `config/feature-flags.yml`** — tehnički tim radi
- **Audit log** — read-only
- **API ključevi** — Vercel dashboard, ne kroz Payload
- **Lead requests + Lead assignments** — samo čitanje + status promjena, nikad delete (GDPR)

## Brisanje sadržaja i GDPR

- **Recenzije / savjeti**: `is_published=false` skriva, ne briši. Hard delete je OK ako sadržaj nije nikad bio public.
- **Dileri**: nikad ne briši, samo `is_active=false`. Audit + lead history mora preživjeti.
- **Lead requests**: ako kupac traži brisanje (GDPR right-to-erasure), idi na `Collections → GDPR Requests`, otvori zahtjev, klikni "Process erasure" — to anonimizira lead row i pokreće 30-day hard-delete cron.
- **Media** (slike / dokumenti): brisanje OK kad više nije linkano. Provjeri "Used in" tab prvo.

## Demo cleanup (jednom, pre-launch)

Sve demo dilere i lead-ove (is_demo=true) obriši sa `pnpm seed:cleanup-demo` (tehnički tim). Plan: pokreni neposredno prije go-live-a.

## TODO

- [ ] Screenshot-i za svaki step (Sprint 7+ kad imamo realne podatke u admin-u)
- [ ] Video-walkthrough "od nule do prve objavljene recenzije" (~5 min)
- [ ] FAQ za česta editor pitanja
