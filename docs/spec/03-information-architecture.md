# Faza 3 — Informacijska arhitektura i sitemap

## Sitemap (kompletni MVP)

```
vozilla.hr/
│
├── /                                       Naslovnica
│
├── /nova-vozila/                           Hub za sva nova vozila
│   ├── /nova-vozila/marke/                 Lista svih marki
│   ├── /nova-vozila/marke/{marka}/         Stranica marke (npr. /nova-vozila/marke/audi)
│   ├── /nova-vozila/marke/{marka}/{model}/ Stranica modela (npr. /audi/a4)
│   └── /nova-vozila/kategorije/{kategorija}/  SUV, hatchback, električna...
│
├── /rabljena-vozila/                       Listings rabljenih
│   ├── /rabljena-vozila/oglas/{id}/        Pojedinačni oglas
│   └── /rabljena-vozila/?filter=...        Pretraga s filterima (query params)
│
├── /leasing/                               Leasing hub
│   ├── /leasing/kalkulator/                Informativni kalkulator
│   └── /leasing/vodic/                     Što je leasing, vrste, pojmovi
│
├── /usporedi/                              Hub usporedbe
│   ├── /usporedi/?modeli={id1},{id2}       Dinamička stranica (query params)
│   └── /usporedi/{slug-a}-vs-{slug-b}/     Pre-generated SEO stranice
│
├── /recenzije/                             Hub recenzija
│   ├── /recenzije/{slug}/                  Pojedinačna recenzija
│   └── /recenzije/kategorija/{kat}/        Filter po kategoriji
│
├── /savjeti/                               Hub savjeta (blog)
│   ├── /savjeti/{slug}/                    Pojedinačni članak
│   └── /savjeti/kategorija/{kat}/          Kategorije
│
├── /pomoc-pri-izboru/                      Kviz "Pomozi mi izabrati"
│   └── /pomoc-pri-izboru/rezultati/{token}/  Rezultat kviza (token-based)
│
├── /zatrazi-ponudu/                        Glavni CTA tok (4-step wizard)
│   └── /zatrazi-ponudu/uspjeh/?id=...      Thank-you stranica
│
├── /upit/{token}/                          Magic link tracker (kupac)
│
├── /za-dilere/                             Marketing stranica za nove dilere
│   └── /za-dilere/prijava/                 Forma za prijavu novog dilera
│
├── /dileri/                                Dealer portal
│   ├── /dileri/login/
│   ├── /dileri/dashboard/                  Lista pristiglih leadova
│   ├── /dileri/lead/{id}/                  Detalj leada
│   ├── /dileri/profil/                     Editiranje vlastitih podataka
│   └── /dileri/zaboravljena-lozinka/
│
├── /admin/                                 Payload admin panel
│   (Payload generira sve admin rute automatski)
│
├── /o-nama/                                Statične stranice
├── /kontakt/
├── /cesta-pitanja/                         FAQ
├── /kako-funkcionira/                      "How it works"
├── /kako-provjeravamo-recenzije/           DSA obveza
│
├── /opci-uvjeti/                           Pravne stranice
├── /politika-privatnosti/
├── /politika-kolacica/
├── /impressum/
├── /gdpr-zahtjev/
├── /odjava-newslettera/
│
├── /pretraga/                              Globalna pretraga (rezultati)
├── /404
├── /500
├── /sitemap.xml                            Auto-generated
└── /robots.txt
```

---

## URL konvencije

| Pravilo | Primjer |
|---|---|
| Hrvatski slug-ovi (ne engleski) | `/nova-vozila/`, ne `/new-cars/` |
| Bez dijakritika u URL-u | `skoda-octavia`, ne `škoda-octavia` |
| Lowercase, hyphen-separated | `audi-a4-avant`, ne `Audi_A4_Avant` |
| Bez trailing slasha | Konzistentno (agent odlučuje, ali svi ili nijedan) |
| Pluralni oblici za hub-ove | `/recenzije/` ne `/recenzija/` |
| Stable IDs | rabljeni oglasi koriste numerički ID, ne slug (jer naslov mijenjati) |
| Date-based blogovi | `/savjeti/{slug}/` (slug uključuje godinu, npr. `kako-kupiti-rabljeni-auto-2026`) |

### URL utility (agent obvezan)
- `lib/utils/slug.ts` — `slugify()` koja briše dijakritike, lowercase, replace whitespace s hyphen
- Test: `slugify("Škoda Octavia 2024")` → `"skoda-octavia-2024"`

---

## Glavna navigacija (header)

### Desktop layout
```
[VOZILLA logo]   Nova vozila ▼   Rabljena vozila   Leasing   Recenzije   Savjeti       [🔍]   [Zatraži ponudu →]
```

5 glavnih stavki + search + primary CTA gumb.

### Mega-menu na "Nova vozila"
Klik / hover otvara dropdown s 4 stupca:
1. **Marke** — popis 20-30 najpopularnijih (linkovi na `/nova-vozila/marke/{marka}/`)
2. **Kategorije** — SUV, Hatchback, Sedan, Karavan, Električni, Hibridi, Sportski
3. **Najnovije recenzije** — top 5 nedavnih
4. **Pomoć pri izboru** — CTA box "Ne znaš što tražiš? Pokreni kviz →"

### Mobile layout
```
[☰]  [VOZILLA logo]                      [🔍]   [Zatraži]
```

Hamburger otvara full-screen overlay s istim 5 sekcija + footer linkovi.

### Sticky behavior
- Header **sticky** pri scroll-u (uvijek vidljiv)
- Background-blur efekt nakon scroll-a 50px (modern look, ne bitno)
- Mobile: dodatno **bottom CTA bar** "Zatraži ponudu" sticky pri dnu

---

## Footer

### Layout: 5 stupaca + zaključni red

```
| O VOZILLI         | KUPNJA           | DILERI          | PRAVNO              | KONTAKT           |
|-------------------|------------------|-----------------|---------------------|-------------------|
| O nama            | Kako funkcionira | Postani diler   | Opći uvjeti         | XXX_EMAIL         |
| Kontakt           | Pomoć pri izboru | Dileri login    | Politika privatnosti| XXX_TELEFON       |
| Česta pitanja     | Leasing          |                 | Politika kolačića   | XXX_ADRESA        |
| Recenzije         | Usporedba        |                 | Impressum           | (Newsletter forma |
| Savjeti           | Rabljena vozila  |                 | GDPR zahtjev        |  - inactive)      |
| Kako provjer. rec.|                  |                 | Postavke kolačića   | (social ikone)    |
```

### Zaključni red
```
vozilla.hr je informacijska platforma i posrednik. Nije strana u kupoprodajnom ugovoru.
© XXX_GODINA XXX_LEGAL_NAME · OIB: XXX_OIB
```

### Bilješke za agenta
- Svi linkovi koji vode na statične stranice rade i prije cookie privole
- "Postavke kolačića" otvara Cookiebot/Iubenda widget (re-opens consent dialog)
- Newsletter forma postoji UI-jevski, ali submit je disabled (poruka: "Newsletter aktivan uskoro!" + feature flag check)
- Social ikone se prikazuju samo ako je social URL non-empty i različit od defaulta (vidi `02-legal-and-compliance.md` config primjer)
- Footer je **isti na svim public stranicama** (osim admin/dealer portal koji ima minimalan footer)

---

## CTA strategija (hibrid)

### Globalni CTA
- **"Zatraži ponudu"** u headeru — primary button, vidljiv svuda osim u admin/dealer portalima
- Mobile: dodatno sticky CTA pri dnu zaslona

### Kontekstualni CTA-i (na detail stranicama)

| Stranica | Primary CTA | Pre-fill query |
|---|---|---|
| Stranica modela (`/audi/a4/`) | "Zatraži ponudu za Audi A4" | `?marka=audi&model=a4&izvor=detail` |
| Rabljeni oglas | "Kontaktiraj prodavatelja" | `?oglas={id}&izvor=oglas` |
| Recenzija | "Zatraži ponudu za {model}" | `?marka=...&model=...&izvor=recenzija` |
| Leasing kalkulator (nakon izračuna) | "Zatraži leasing ponudu" | `?cijena=...&period=...&polog=...&izvor=leasing` |
| Usporedba | 2 CTA-a, jedan po modelu | Pre-fill obe konfiguracije |
| Quiz rezultati | "Zatraži ponudu za {top model}" | Pre-fill iz quiz odgovora |

### Sekundarni CTA-i (gdje je relevantno)
- "Usporedi s drugim modelom"
- "Preuzmi PDF specifikacije"
- "Izračunaj leasing ratu"
- "Pošalji prijatelju" (kasnije)

### Source tracking
Svi CTA-i koji vode u "Zatraži ponudu" tok nose **`izvor` query param**. Backend logira u `lead_requests.source` polje. Admin vidi u panelu odakle je upit došao — ključno za analitiku konverzije po stranici.

---

## Sticky widget "Brzi kontakt"

### Pozicija
- **Desktop**: bottom-right kut, 24px od ruba
- **Mobile**: bottom-center, iznad mobilnog CTA bara

### Trigger logika (konfigurabilno u `config/widgets.yml`)
```yaml
sticky_widget:
  delay_ms: 8000              # ne pokazuj prvih 8s
  scroll_trigger_percent: 40  # pokazuj nakon 40% scroll-a
  dismiss_cookie_hours: 24    # ako zatvoreno, ne pokazuj 24h
  exclude_paths:              # ne pokazuj na ovim stranicama
    - /admin/*
    - /dileri/*
    - /zatrazi-ponudu/*
    - /upit/*
    - /opci-uvjeti
    - /politika-privatnosti
    - /politika-kolacica
    - /impressum
    - /gdpr-zahtjev
```

### Sadržaj — zatvoreno stanje (mali tab)
```
[💬  Dobij najbolju cijenu]
```

### Sadržaj — otvoreno stanje (kratka forma)
```
┌────────────────────────────────────┐
│  Dobij najbolju cijenu          [×]│
│  Reci nam što tražiš —             │
│  pošaljemo upit našim dilerima.    │
│                                    │
│  Ime i prezime: [_______________]  │
│  Email:         [_______________]  │
│  Telefon:       [_______________]  │
│  Što tražiš?    [_______________]  │  ← textarea, max 300 znakova
│                                    │
│  ☐ Prihvaćam OUP i privolu         │  ← link na OUP/PP
│                                    │
│  [Pošalji upit]                    │
│                                    │
│  reCAPTCHA: zaštićeno              │
└────────────────────────────────────┘
```

### Backend
- Forma šalje na `POST /api/leads` s flagom `source: 'sticky-widget'`
- Ista pipeline kao 4-step wizard, samo manje polja
- Admin vidi u panelu kao "Brzi upit" (badge), zna da je manje strukturiran

### Cookie-i widget koristi
- `vozilla_widget_dismissed` — kad zatvoriš, traje 24h
- `vozilla_lead_sent` — kad pošalješ upit u toj sesiji, ne pokazuj više

Oba su funkcionalni cookies (traže "Funkcionalni" privolu).

---

## "Pomoć pri izboru" kviz (`/pomoc-pri-izboru/`)

### Tok
Multi-step, jedna stranica s progresom (8 pitanja). Svako pitanje ima **"Preskoči"** opciju.

### Pitanja
1. **Tip vozila** — SUV / Hatchback / Karavan / Sedan / Sportski / Električni / Svejedno
2. **Budžet** — slider/raspon u € (5.000 - 100.000+) ili "Mjesečna rata leasinga" (100 - 1500€)
3. **Novo ili rabljeno?** — Novo / Rabljeno / Oboje
4. **Tip pogona** — Benzin / Dizel / Hibrid / Električni / Plin / Svejedno
5. **Mjenjač** — Manualni / Automatski / Svejedno
6. **Veličina obitelji / broj sjedala** — 2 / 4-5 / 5-7 / 7+
7. **Glavna upotreba** — Grad / Duga putovanja / Off-road / Mješovito
8. **Prioritet** — Cijena / Pouzdanost / Performanse / Ekologija / Komfor / Prostor

### Algoritam preporuke (rule-based scoring u MVP-u)
```
Za svaki model u katalogu:
  match_score = 0
  Ako tip_vozila match → +20
  Ako u budžet rasponu → +15 (proporcionalno koliko blizu sredine raspona)
  Ako pogon match → +10
  Ako mjenjač match → +5
  Ako broj_sjedala match → +10
  Ako prioritet match (npr. "ekologija" → električni/hibrid) → +15
  
Vrati top 5-10 modela po match_score.
```

Preskočena pitanja imaju težinu 0 (ne penaliziraju).

### Rezultati
URL: `/pomoc-pri-izboru/rezultati/{token}/`
- Token-based (UUID) tako da korisnik može share-ati ili vratiti se
- Sprema se u `quiz_results` tablicu (TTL 30 dana)
- Lista modela s match score-om (vidljivo "92% match", "85% match" — vizualizacija)
- CTA "Zatraži ponudu" za svaki + "Pokušaj ponovno" + "Spremi rezultat" (mailom)

### Algoritam u kodu
- `services/quiz-recommender.ts` — agent piše čistu funkciju, lako se mijenja
- README objašnjava kako se mijenjaju težine i pravila

---

## Stranice usporedbe (`/usporedi/`)

### Dinamičke stranice
- URL: `/usporedi/?modeli={id1},{id2},{id3}`
- Korisnik odabere do **3 modela** kroz UI (search-dropdown)
- Stranica generira tablicu spec-ova rame uz rame
- CTA "Zatraži ponudu" za svaki model
- Schema.org `Product` markup

### Pre-generirane SEO stranice (top 50 parova)
- URL: `/usporedi/{slug-a}-vs-{slug-b}/`
- Liste parova u `seeds/comparison-pairs.csv` (vlasnik popunjava, agent priprema template)
- Statički renderirane (ISR), s rich content (zaključak generиран iz spec-ova)
- Linkane iz `/usporedi/` hub stranice + iz pojedinačnih model stranica ("Često se uspoređuje s...")
- Canonical na sebe (ne na dinamičnu URL)
- Sitemap.xml ih sve uključuje

### Primjeri parova (vlasnik finalizira u CSV-u)
- `golf-vs-octavia`
- `sandero-vs-aygo-x`
- `tucson-vs-rav4`
- `model-3-vs-id-4`
- `x1-vs-q3`
- `panda-vs-c3`
- `corolla-vs-civic`
- `kona-electric-vs-zoe`

### Tablica usporedbe (sadržaj)
- Hero: 2-3 slike modela rame uz rame
- Cijena (od-do)
- Specifikacije: dimenzije, motor, snaga, potrošnja, CO2, prtljažnik, sjedala
- Standard oprema (popis razlika)
- Pros/Cons po modelu
- "Naša preporuka" — kratak zaključak (placeholder, vlasnik popunjava ili agent generira iz spec-ova)
- CTA-i

---

## Schema.org / Rich snippets

Agent obvezan ugraditi:

| Schema | Gdje |
|---|---|
| `Organization` | Globalno (svaka stranica preko `_layout`) |
| `WebSite` + `SearchAction` | Naslovnica (Sitelinks search box u Googlu) |
| `Vehicle` | Stranice modela + rabljeni oglasi |
| `Review` + `AggregateRating` | Recenzije |
| `Article` | Savjeti |
| `BreadcrumbList` | Sve stranice dublje od 1 razine |
| `FAQPage` | FAQ stranica + sve gdje ima FAQ akordeon |
| `Product` | Comparison stranice |
| `LocalBusiness` | Stranica dilera (kasnije, kad imamo public dealer page) |

Validation: agent obvezan testirati na **Google Rich Results Test** prije deploy-a.

---

## Breadcrumbs

Obavezno na svim stranicama dubljim od 1 razine.

Format:
```
Početna > Nova vozila > Marke > Audi > A4
```

- Razdjelnik: ` > ` ili `/` (agent odlučuje konzistentno)
- Mobile: skraćena verzija ako pre-duga (`... > Audi > A4`)
- Schema.org `BreadcrumbList` markup obavezan
- Klikabilni svi razini (ne samo poslednji)

---

## Mobilna navigacija

### Bottom CTA bar (sticky)
- Fixed bottom, full width
- Sadrži: jedan primary CTA "Zatraži ponudu →"
- Visina ~56px, ne zatrpava sadržaj (bottom padding na body)
- Sakriven na: admin, dealer portal, pravne stranice (gdje CTA nema smisla)

### Bottom nav (4 ikone) — opcijsko, agent procjenjuje
- 🏠 Početna
- 🔍 Pretraga
- 💬 Upit
- ☰ Više
- Ako previše s gornjim CTA bar-om, izostavi (jedan ili drugi, ne oba)

### Tap targets
- Minimum **44×44px** (Apple/Google guideline)
- Spacing između interactive elemenata minimum **8px**

### Hamburger menu
- Full-screen overlay (ne side drawer — bolji UX na mobitelu)
- Sve glavne stavke vidljive
- Footer linkovi pri dnu
- Close gumb (×) gore desno
- Esc tipka zatvara

---

## Globalna pretraga (`/pretraga/`)

### Trigger
- 🔍 ikonica u headeru
- Klik otvara overlay s search input-om (autofocus)
- Esc zatvara

### Backend
- Server-side search preko Supabase pgvector (kasnije za semantic) ili full-text search (PostgreSQL `tsvector` u MVP-u)
- Indexirane kolekcije: brands, models, reviews, articles, used_car_listings
- Min 3 znaka prije nego se search pokrene
- Debounced (300ms)

### Rezultati stranica
- Grupacija po tipu: Vozila / Recenzije / Savjeti / Rabljena
- Top 5 iz svake kategorije
- "Vidi sve rezultate u {kategorija}" link
- "Bez rezultata" stanje s prijedlozima

---

## Naslovnica — sekcije

Sve sekcije imaju naslove i tekstove kao XXX placeholderi (popunjava se kroz Payload Settings → Marketing Copy).

1. **Hero** — naslov + podnaslov + primary CTA + hero slika (placeholder)
2. **Kako funkcionira** — 3 koraka (ikona + naslov + opis za svaki)
3. **Popularne marke** — grid logo-a top marki, klik vodi na brand stranicu
4. **Najnovije recenzije** — 3-4 card-a s linkovima
5. **Kategorije** — SUV / Hatchback / Električni — vizualni grid s ilustracijama
6. **Pomoć pri izboru** — CTA banner s linkom na quiz
7. **Recent rabljena** — 4-6 card-a (najnovije objavljeni)
8. **Trust signals** — broj dilera, broj zadovoljnih kupaca (XXX placeholderi)
9. **Testimonials** — 3 svjedočanstva (XXX placeholderi, kasnije real)
10. **Newsletter signup** — forma (disabled u MVP-u, vizualno pripremljeno)
11. **Final CTA** — još jedan poziv na "Zatraži ponudu"

Svaka sekcija je **block** u Payload-u — admin može mijenjati redoslijed, on/off, sadržaj.

---

## SEO obvezno (na svakoj stranici)

- **Meta title** (max 60 znakova) — auto iz Payload polja `seo_title` ili fallback iz naslova
- **Meta description** (max 160 znakova) — auto iz Payload `seo_description` ili fallback iz prvih 160 znakova content-a
- **Open Graph tags** (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`)
- **Twitter Card** (`twitter:card`, `twitter:title`, ...)
- **Canonical URL** (self-canonical default; cross-canonical samo za pre-generated comparison-e ako duplikati)
- **hreflang="hr"** (priprema za multi-language)
- **Robots meta**: `index, follow` default; `noindex, nofollow` na admin/dealer/upit-token
- **JSON-LD** schema.org (vidi gore)

---

## Definicija uspjeha Faze 3

✅ Sitemap je kompletan i jednoznačan  
✅ URL konvencije dosljedne  
✅ Glavna navigacija (header) jasno definirana, mega-menu specs  
✅ Footer struktura s 5 stupaca + zaključni red  
✅ CTA strategija jasna (globalni + kontekstualni)  
✅ Sticky widget specs (pozicija, trigger, sadržaj, cookies)  
✅ Quiz tok i scoring algoritam  
✅ Comparison stranice (dynamic + pre-generated)  
✅ Schema.org i SEO requirements  
✅ Mobilna navigacija (bottom CTA, hamburger)

Sljedeća faza: [`04-features-and-flows.md`](./04-features-and-flows.md)
