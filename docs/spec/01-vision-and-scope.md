# Faza 1 — Vizija i opseg

## Naziv projekta

**vozilla.hr**

Tagline (placeholder): *"Hrvatska platforma za istraživanje, usporedbu i kupnju vozila"*

> Konačan tagline mi ćemo dostaviti — agent koristi placeholder `[XXX_TAGLINE: 8-12 riječi]` u Payload Settings → Marketing Copy.

---

## Poslovni model

Hibridna platforma koja kombinira **3 komponente** (kao Carwow):

### 1. Media / sadržaj
Uređivačke recenzije vozila, savjeti, vodiči, usporedbe — **organski SEO promet** kao gornji dio funela. U MVP-u manji opseg, ali strukturа za rast pripremljena.

### 2. Lead generation ("controlled auction")
Kupac šalje upit kroz formu → operater platforme (admin) ručno ili polu-automatski prosljeđuje na **3-5 dilera** odabranih na temelju marke, lokacije, dostupnosti, kvalitete → dileri kontaktiraju kupca direktno.

> **Bitno**: NE radimo full real-time reverse-auction (kao kasni Carwow). Naša verzija u MVP-u je "controlled" — admin ima manualnu kontrolu nad svakim leadom. Real-time auction je predviđen za Phase 2 (struktura tablica `lead_assignments` već je pripremljena za to).

### 3. Listings
Rabljena vozila — dileri (kasnije) sami unose inventar kroz dashboard. Privatni prodavači idu kroz formu, admin odobrava prije publish-a.

---

## Tipovi vozila u MVP-u

- ✅ **Nova vozila** (preko lead requesta)
- ✅ **Rabljena vozila** (listings + lead request)
- ✅ **Leasing** kao opcija financiranja, s informativnim kalkulatorom

❌ Ne: kamioni/teretna vozila, motocikli, plovila, kamp prikolice (Phase 2 razmatranje)

---

## Korisnici (3 tipa)

### Tip 1: Kupci
- **Bez registracije** u MVP-u
- Pristup svim public sadržajima
- Šalju upit kroz formu (4-step wizard ili sticky widget)
- Dobivaju **magic link tracker** za praćenje statusa
- Mogu opcionalno popuniti feedback nakon kontakta s dilerom
- GDPR: jasna privola, pravo na brisanje, pravo pristupa

### Tip 2: Dileri (light dashboard)
- Login s emailom + lozinkom (Argon2id hash)
- Vide listu primljenih leadova
- Označavaju status: pregledano, kontaktirano, ishod (prodano / nije + razlog)
- Vide vlastite osnovne statistike (broj leadova ovaj mjesec, conversion rate)
- Edit vlastitog profila (kontakti, opis, brands)
- **NEMAJU** u MVP-u: napredni CRM, A/B testovi, analitika, real-time bidding, vlastiti upload listings (admin to radi za njih u MVP-u)

### Tip 3: Admin (operater platforme)
- Puni pristup Payload admin panelu
- Upravlja katalogom (marke, modeli, kategorije, recenzije, savjeti)
- **Obrađuje lead requests**: vidi pristigle upite, sustav predlaže 5 dilera, admin potvrđuje/mijenja, šalje
- Upravlja dilerima (CRUD, suspend, throttle)
- Obrađuje GDPR zahtjeve
- Mijenja postavke (kamatne stope, weights, threshold-ovi)
- Vidi audit log

---

## Glavni korisnički tok (kupac)

```
1. Korisnik dolazi na vozilla.hr
   ↓
2. Pretražuje katalog ili čita recenziju ili koristi quiz
   ↓
3. Pronalazi vozilo (model ili rabljeni listing)
   ↓
4. Klika "Zatraži ponudu"
   ↓
5. Ispunjava 4-step formu (želje + uvjeti + podaci + privole)
   ↓
6. Submit → reCAPTCHA + validacija → spremljeno
   ↓
7. Dobiva potvrdni email + magic link tracker URL
   ↓
8. Admin prima notifikaciju, odabire 3-5 dilera, šalje
   ↓
9. Dileri primaju email + vide u dashboardu
   ↓
10. Dileri kontaktiraju kupca direktno (telefon/email)
   ↓
11. Diler označava ishod u dashboardu
   ↓
12. Kupac dobiva feedback emailove (dan 3, 14, 30) — opcionalno odgovara
```

---

## Što JE u MVP-u

| Funkcionalnost | Status |
|---|---|
| Naslovnica + statične stranice | ✅ |
| Katalog marki/modela | ✅ (top 20-30 modela seed) |
| Recenzije vozila | ✅ (admin unosi kroz Payload) |
| Savjeti / blog | ✅ |
| 4-step lead request wizard | ✅ |
| Sticky widget za brzi kontakt | ✅ |
| Magic link tracker za kupca | ✅ |
| Admin lead processing (semi-auto dealer suggest) | ✅ |
| Dealer light dashboard | ✅ |
| Quiz "Pomoć pri izboru" | ✅ |
| Leasing kalkulator (informativni) | ✅ |
| Usporedba vozila (dinamička + pre-generated top 50) | ✅ |
| Rabljena vozila — listings + filteri + detalj | ✅ |
| Sve pravne stranice (placeholder content) | ✅ |
| Cookie banner (Cookiebot/Iubenda) | ✅ |
| reCAPTCHA v3 | ✅ |
| GDPR zahtjev forma | ✅ |
| Email pipeline (transakcijski) | ✅ |
| Sentry error tracking | ✅ |
| Sitemap, robots.txt, schema.org | ✅ |
| Light theme | ✅ |
| Hrvatski jezik | ✅ |

---

## Što NIJE u MVP-u (eksplicitno za agenta)

| Funkcionalnost | Razlog izostavljanja |
|---|---|
| Korisnički računi i registracija | Kompleksnost + GDPR režija. Magic link tracker dovoljan za MVP. |
| Real-time reverse-auction (full Carwow) | Phase 2. MVP koristi "controlled auction" s admin obradom. |
| Online plaćanje / kupoprodajni ugovor | Mi smo posrednik, ne trgovac vozilima. Plaćanja idu izravno između kupca i dilera. |
| Sell My Car (otkup od korisnika) | Phase 2. Carwow je ovo dodao tek kroz akviziciju Wizzle-a. |
| Live chat | Phase 2 ili kasnije. Sticky widget i kontakt forma dovoljni. |
| Mobilna aplikacija | Phase 3. Web responsivni dovoljan za MVP. |
| Više jezika (engleski, njemački) | Samo HR u MVP-u. i18n struktura priprema, ali samo HR locale aktiviran. |
| Video produkcija / YouTube embed kao primary | Phase 2+. Embed YouTube videa unutar recenzija je OK ako mi ručno dodamo. |
| Newsletter aktivan | Pripremljen, **disabled** (feature flag). Vidi `02-legal-and-compliance.md`. |
| Dark mode | Phase 2. CSS varijable strukturirane za laku aktivaciju. |
| Smart Match AI (ML preporuke) | Phase 3. Quiz koristi jednostavan rule-based scoring algoritam. |
| Napredni dealer dashboard (CRM, A/B, statistike) | Phase 2. MVP ima light verziju (login + lista + status). |
| Dealer self-upload za rabljene oglase | Phase 2. Admin ručno unosi rabljene u MVP-u. |
| WhatsApp / SMS notifikacije dilerima | Pripremljeno (feature flag), OFF u MVP-u. Email je dovoljan. |
| Subscription billing za dilere | MVP koristi pilot model (besplatno za prve dilere). Billing ide u Phase 2 kad ima signala. |
| Public dealer reviews / ratings page | Phase 2. Ratings se prikupljaju u MVP-u (kroz feedback flow), ali interno za scoring. |

---

## Jezik i lokalizacija

- **Samo hrvatski** u MVP-u
- **Hrvatski znakovi obavezni** svuda u UI-ju (č, ć, š, đ, ž)
- URL slug-ovi **bez dijakritika** (npr. `/recenzije/skoda-octavia-2024/`)
- Datum: `DD.MM.YYYY.` format
- Cijena: `12.345,67 €` (točka tisuće, zarez decimala)
- Telefon: `+385 XX XXX XXXX` ili `0XX XXX XXXX`
- Sortiranje: hrvatska abeceda preko `Intl.Collator('hr')`
- i18n struktura **pripremljena** (next-intl ili sličan), ali samo `hr` locale aktiviran. Phase 2 dodavanje engleskog/njemačkog ne traži refactor.

---

## Brand pozicija

**Konkurencija u HR**:
- Njuškalo, Index Auto, Auto Krešo, AutoNet, Auto Plac — uglavnom listings rabljenih
- Auto.hr — informativni portal s recenzijama
- Direktni dileri (BMW HR, VW HR itd.) — vlastiti websitei

**Naša diferencijacija**:
- "Bez cjenkanja, najbolje cijene od provjerenih dilera"
- Transparentnost (pokazujemo kako odabiremo dilere, kako provjeravamo recenzije — DSA compliance)
- Holistic pristup: istraživanje + usporedba + kupnja na jednom mjestu
- Hrvatski-native (njuškalo + autotrader-style portal su listings only, mi dodajemo kontent + lead-gen)

---

## Definicija uspjeha Faze 1

✅ Vlasnik projekta i agent imaju **isto razumijevanje**:
- Tko su korisnici i što rade
- Što JE i NIJE u MVP-u
- Glavni tok kupca i operatera
- Granica između MVP-a i Phase 2

Sljedeća faza: [`02-legal-and-compliance.md`](./02-legal-and-compliance.md)
