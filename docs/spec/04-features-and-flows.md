# Faza 4 — Funkcionalnosti i korisnički tokovi

Ovaj dokument detaljno razrađuje svaki tok od početka do kraja. Agent koristi ovo kao primarni input za Sprint 4 (lead flow) i Sprint 5 (dealer dashboard).

---

## TOK 1 — Kupac šalje upit ("controlled auction")

### Polazne točke (entry points)
- Header CTA "Zatraži ponudu" (generic)
- CTA na stranici modela ("Zatraži ponudu za Audi A4")
- CTA na rabljenom oglasu ("Kontaktiraj prodavatelja")
- Sticky widget (kratka forma)
- Rezultat kviza
- Rezultat leasing kalkulatora
- CTA na recenziji
- CTA na comparison stranici

Svi vode na `/zatrazi-ponudu/` s **`?izvor=...`** query param-om za tracking.

### Forma — multi-step wizard, 4 koraka

#### Korak 1 — Što tražiš?
| Polje | Tip | Obavezno | Bilješka |
|---|---|---|---|
| Tip upita | radio | ✅ | Novo / Rabljeno / Leasing / Nisam siguran |
| Marka | searchable dropdown | ✅ | Pre-filled ako iz detail stranice |
| Model | dropdown (filter po marki) | ✅ | Pre-filled ako iz detail stranice |
| Verzija/specifikacija | dropdown | ❌ | Ako iz konfiguratora ili kviza |
| Godina (od-do) | range slider | ❌ | Samo ako rabljeno |
| Boja preference | multi-select | ❌ | |
| Dodatne želje | textarea, max 500 zn | ❌ | |

#### Korak 2 — Tvoji uvjeti
| Polje | Tip | Obavezno | Bilješka |
|---|---|---|---|
| Cjenovni raspon | dual slider | ✅ | min 1.000€, max 200.000€ |
| Način kupnje | radio | ✅ | Gotovina / Kredit / Leasing operativni / Leasing financijski / Nisam siguran |
| Polog | input + slider | uvjetno | Ako leasing/kredit |
| Period otplate | dropdown | uvjetno | 24/36/48/60/72 mj |
| Imam vozilo za zamjenu? | radio | ✅ | Da/Ne |
| Trade-in: marka, model, godina, km, stanje | grupa polja | uvjetno | Ako "Da" |
| Vremenski okvir kupnje | radio | ✅ | 7 dana / 1 mj / 3 mj / Samo istražujem |

#### Korak 3 — Tvoji podaci
| Polje | Tip | Obavezno | Validacija |
|---|---|---|---|
| Ime i prezime | text | ✅ | min 2 + 2 znaka |
| Email | email | ✅ | RFC + DNS provjera + disposable blacklist |
| Telefon | tel | ✅ | HR format (`+385 XX...` ili `0XX...`) |
| Lokacija | dropdown županija | ✅ | 21 stavki iz seed-a |
| Poštanski broj | text, 5 znamenki | ❌ | Validan HR PB; auto-fill županiju ako prepoznat |
| Preferirani način kontakta | radio | ✅ | Email / Telefon / WhatsApp / Svejedno |
| Najbolje vrijeme za kontakt | radio | ✅ | Bilo kada / Pon-Pet 8-16 / Pon-Pet 16-20 / Vikend |

#### Korak 4 — Privole i potvrda
- **Pregled svih unesenih podataka** (read-only summary, gumb "Promijeni" na svakom koraku)
- ☐ **Slažem se s Općim uvjetima i privolu na obradu osobnih podataka u svrhu posredovanja prema dilerima** ✅ (obavezno) — link na OUP i PP
- ☐ Želim primati personalizirane ponude i savjete od vozilla.hr ❌ (opcijsko, marketing)
- **reCAPTCHA v3** (nevidljiva)
- **[Pošalji upit]** primary CTA

> **Privole — granularnost**: jedan obavezan checkbox za "OUP + obrada za posredovanje" (single privola jer je to nužno za uslugu) + zaseban za marketing (opcijsko). Vidi `02-legal-and-compliance.md`.

### Wizard UX
- **Progress bar** na vrhu (4 koraka, current highlighted)
- **Back / Next** gumbi (Back disabled na koraku 1)
- **Validacija po koraku** — Next disabled dok current nije valjan
- **Auto-save draft** u localStorage svakih 30s + na onChange (opcijsko)
- **"Spremi i nastavi kasnije"** opcija — šalje magic link na email s tokenom za nastavak (TTL 7 dana)
- **Browser back tipka** vraća na prethodni korak (ne resetira)
- **Keyboard navigacija** — Tab, Shift+Tab, Enter na "Dalje"
- **Mobilni layout**: koraci ispod sebe, manji tekst, full-width inputи

### Backend tok nakon submita

```
1. POST /api/leads
2. Server-side validacija (Zod schema)
3. reCAPTCHA verifikacija (Google API)
   → ako score < block_threshold (0.3): odbij + log u Sentry
   → ako između block i review threshold (0.3-0.5): pass ali flag review=true
   → ako >= review threshold (0.5): pass
4. Honeypot polje provjera (mora biti prazno)
5. Rate limit po IP-u + emailu (5 / 15 min)
6. DNS validacija email domene (MX record)
7. Disposable email blacklist provjera
8. Spremanje u `lead_requests` (status: 'new', source iz query param-a)
9. Generiranje internog ID-a: VZ-YYYY-MM-DD-XXXX (npr. VZ-2026-04-29-A7F3)
10. Generiranje secure magic link tokena (UUID v4 + entropy)
11. Slanje potvrdnog emaila kupcu (template: lead-confirmation)
12. Notifikacija adminu (in-app + email; template: admin-new-lead-notification)
13. Logiranje GDPR privole (consent_log: timestamp, IP, user-agent, koji checkboxi, source obrazac)
14. Audit log entry
```

### Korisnik vidi nakon submita

Stranica `/zatrazi-ponudu/uspjeh/?id=VZ-2026-04-29-A7F3`:
- ✅ "Hvala! Tvoj upit je zaprimljen pod brojem VZ-2026-04-29-A7F3"
- "Naš tim će u sljedećih [XXX_LEAD_PROCESSING_HOURS] sati razmotriti upit i poslati ga prema 3-5 dilera"
- "Dileri će te direktno kontaktirati na [email/telefon]"
- "Provjeri spam folder ako ne primiš email"
- "Tvoj tracking link: [magic-link-URL]" + "Spremili smo ga i u email"
- CTA: "U međuvremenu, pogledaj recenzije" / "Saznaj kako funkcionira proces"

---

## TOK 2 — Admin obrađuje upit

### Admin dashboard `/admin/lead-requests/`

Lista svih upita s filterima i sortom.

**Filteri**:
- Status: new / under_review / in_progress / sent / closed / spam
- Datum (date range picker)
- Tip upita (novo/rabljeno/leasing)
- Hitnost (vremenski okvir kupnje)
- Source (header / detail / sticky / quiz / kalkulator)
- Marka

**Sort**:
- Po datumu (default: najnoviji prvi)
- Po hitnosti (kupci s "7 dana" prvi)
- Po reCAPTCHA score-u (sumnjivi prvi)

**Search**: po ID-u, emailu, marki/modelu, telefonu

### Detalj upita `/admin/lead-requests/{id}/`

**Sekcija 1: Podaci kupca**
- Sva polja iz forme (ime, email, telefon, lokacija, kontakt preference, najbolje vrijeme)
- reCAPTCHA score (badge: zelena ≥0.7, žuta 0.5-0.7, crvena <0.5)
- Source tracking (odakle je upit došao)
- Timestamp + IP
- Notes polje (interno, admin only)

**Sekcija 2: Što kupac traži**
- Sva polja iz koraka 1 i 2 wizard-a
- Trade-in podaci ako postoji

**Sekcija 3: Odabir dilera (semi-auto)**

Sustav **automatski predlaže 5 dilera**:

```
Algoritam:
1. Filter dilere koji nisu suspended/inactive
2. Filter po marki (diler ima marku u svom portfolio-u)
3. Filter po radijusu od kupčeve lokacije (default: 100km)
4. Score remaining dilere po quality_score (vidi formula)
5. NAJBLIŽI diler uvijek u top 5 (Carwow pravilo)
6. Top 4 ostala po quality_score
7. Ako manje od 5 dostupno: vrati koliko ih ima + warning
```

**Quality score formula** (težine konfigurabilne u `config/lead-distribution.yml`):
```
quality_score = 
    (1 / avg_response_time_hours) * W_response
  + conversion_rate * W_conversion
  + avg_rating * W_rating
  + (1 - current_load_ratio) * W_capacity

current_load_ratio = current_month_leads / monthly_lead_cap
```

Default težine:
```yaml
# config/lead-distribution.yml
weights:
  W_response: 0.35
  W_conversion: 0.30
  W_rating: 0.20
  W_capacity: 0.15

thresholds:
  default_radius_km: 100
  max_dealers_per_lead: 5
  min_dealers_per_lead: 3
  
throttling:
  enable_auto_throttle: true
  bad_response_time_hours: 48      # ako diler odgovara > 48h, throttle
  bad_conversion_rate: 0.05        # ako diler konvertira < 5%, throttle
  throttle_factor: 0.3             # smanji vjerojatnost odabira na 30%
```

### UI za admin odabir
Lista 5 predloženih dilera sa info za svakog:
- Ime dilera + lokacija
- "Najbliži" badge (na 1. dileru)
- Quality score + breakdown ("Brzina odgovora: 4.2h, conv: 12%, rating: 4.6")
- Trenutno opterećenje ("23/50 leadova ovaj mjesec")
- Dropdown akcija: "Ukloni", "Zamijeni s drugim"

Ispod liste:
- "Dodaj dilera" gumb → otvara modal s pretragom svih dilera, filterима
- Total: "5 dilera odabrano"

### Akcije adminа
- **[Pošalji odabranim dilerima]** primary CTA → trigger TOK 3
- **Označi kao spam** → premjesti u spam red, ne briši (audit trail)
- **Zatvori bez slanja** s razlogom (dropdown: nepotpuno / lažno / izvan opsega / ne mogu naći dilere / drugo + free text)
- **Pošalji korisniku traženje dodatnih info** (template email, custom message admin upiše)
- **Markiraj review** ako je sumnjivo, prati se separately

### Edge cases u admin obradi
- **Nema dilera za marku/regiju**: warning "Pronađeno samo X dilera". Akcije: proširi radijus / pošalji manje / označi za poseban tretman
- **Diler koji bi normalno bio prvi je suspendiran**: skip, agent vidi notifikaciju
- **Duplikat detected** (isti email + isti model u 24h): admin vidi "Mogući duplikat #VZ-...". Može: spojiti / odbiti / nastaviti zasebno
- **reCAPTCHA score < 0.5**: u "review" red, prikazani prije nego ide u glavnu listu

---

## TOK 3 — Diler prima lead

### Triggers (automatski po slanju)
1. **Email** s detaljima leada (template: lead-to-dealer)
2. **In-app notifikacija** u dealer dashboardu (badge brojač)
3. **WhatsApp/SMS** notifikacija (feature flag, OFF u MVP-u)

### Email sadržaj (template `emails/lead-to-dealer.tsx`)
- Subject: `Novi upit od kupca — [Marka Model] — VZ-XXXX`
- Hero: brand logo
- "Imate novi upit od kupca preko vozilla.hr"
- **Lead ID**: VZ-2026-04-29-A7F3
- **Što kupac traži**:
  - Marka / Model / Verzija
  - Cjenovni raspon
  - Način kupnje
  - Trade-in info (ako postoji)
  - Vremenski okvir
- **Kontakt podaci**:
  - Ime
  - Telefon
  - Email
  - Lokacija (županija + PB)
  - Preferirani kontakt + najbolje vrijeme
- **Rok za kontakt**: "Molimo kontaktirajte kupca u sljedećih 48h" (konfigurabilno)
- **Konkurencija** (Carwow-style transparentnost): "Ovaj lead poslan je još 4 dilerima. Brzina i kvaliteta odgovora utječu na vaš rang."
- **CTA**: "Otvori u dashboardu" → vodi na `/dileri/lead/{id}`
- Footer: kontakt, unsubscribe od leadova (suspend self), pravila

### Dealer dashboard `/dileri/dashboard/`

**Vrhovni red: Statistika** (basic, MVP)
- Leadova ovaj mjesec: X
- Conversion rate: Y%
- Prosječna brzina odgovora: Z h
- Trenutni rating: 4.5 / 5

**Glavna lista leadova**
| Kolona | Sortable |
|---|---|
| Status badge | ❌ |
| ID | ❌ |
| Datum | ✅ default desc |
| Kupac (ime + lokacija) | ❌ |
| Marka / Model | ❌ |
| Cijena raspon | ✅ |
| Hitnost | ✅ |
| Status | ✅ |

Status enum:
- `new` — još nije kliknuto "Pregledao"
- `viewed` — kliknuto, nije kontaktirano
- `contacted` — diler kontaktirao kupca
- `closed` — zatvoreno (s ishodom: prodano / nije prodano + razlog)

Klik na lead → `/dileri/lead/{id}`

### Detalj leada `/dileri/lead/{id}/`

**Sve info o kupcu** (osim onog što je interno admin-only kao reCAPTCHA score)

**Akcije za dilera**:
1. **"Pregledao sam"** (timestamp se sprema, status → `viewed`)
2. **"Kontaktirao sam kupca"** (timestamp, status → `contacted`, prikazuje se i kupcu u trackeru)
3. **"Zatvori lead"** s ishodom:
   - Prodano (datum + marka/model što je kupljen — može biti drugačiji od originalnog upita, Carwow pattern)
   - Nije prodano (razlog dropdown: cijena previsoka / kupac otišao kod konkurencije / nije se javio nakon 3 pokušaja / odustao / drugo + free text)
4. **Bilješke** (textarea, samo diler vidi)
5. **Pošalji formalnu ponudu** (Phase 2 — upload PDF s cijenom, kupac vidi u trackeru)

**Konkurencija sekcija** (Carwow-style):
- "Ovaj lead je poslan još **4 dilerima**" (broj, ne imena)
- Kad lead bude zatvoren: "Tvoj odgovor je bio **2. od 5** po brzini" (motivira)

### Auto-podsjetnici (cron job)

Konfigurabilni u Payload Settings:
- `XXX_DEALER_REMINDER_FIRST_HOURS` (default 24)
- `XXX_DEALER_REMINDER_SECOND_HOURS` (default 48)
- `XXX_DEALER_DEADLINE_HOURS` (default 72)

Logika (Vercel Cron Job ili Supabase Edge Function svake 1h):
```
Za svaki lead_assignment gdje status = 'sent':
  Ako (now - sent_at) > 24h AND prvi_podsjetnik_poslan = false:
    Pošalji email "dealer-reminder-24h"
    Set prvi_podsjetnik_poslan = true
  Ako (now - sent_at) > 48h AND drugi_podsjetnik_poslan = false:
    Pošalji email "dealer-reminder-48h"
    Notifikaciju adminu (subtle)
    Set drugi_podsjetnik_poslan = true
  Ako (now - sent_at) > 72h AND status = 'sent':
    Marker status = 'expired-no-response'
    Update dealer.avg_response_time_hours
    Notifikaciju adminu (visible)
```

Sve emaili imaju feature flag (vidi `06-branding-and-assets.md`) i dnevni rate limit po dileru (max 1 podsjetnik / 24h / lead).

---

## TOK 4 — Kupac vidi pristigle ponude (magic link tracker)

### Magic link
- URL: `https://vozilla.hr/upit/{long-secure-token}/`
- Token: UUID v4 + dodatna entropija (32+ chars)
- TTL: 30 dana
- Single-purpose (ne može raditi password reset itd.)
- Ne sadrži PII u URL-u
- Stranica ima `noindex, nofollow`

### Stranica `/upit/{token}/`

**Header**: "Upit VZ-2026-04-29-A7F3" + status badge

**Status timeline** (vizualno):
1. ✅ Zaprimljeno (datum)
2. 🔄 U obradi (datum)
3. ✅ Poslano dilerima (datum + broj dilera)
4. 📞 Dileri te kontaktiraju (live status)

**Sekcija "Tvoji dileri"** (kad je status `sent` ili kasnije):
| Diler | Status | Datum kontakta | Akcije |
|---|---|---|---|
| Auto Salon Zagreb d.o.o. | Kontaktirao te 28.04. u 14:30 | — | "Označi kao zainteresiran" / "Nezainteresiran" |
| BMW Hrvatska — Sesvete | Pregledao 27.04. nije još kontaktirao | — | — |
| ... | ... | ... | ... |

**Akcije za kupca**:
- "Označi dilera kao zainteresiran" → diler u svom dashboardu vidi "Kupac zainteresiran ✅"
- "Označi kao nezainteresiran" → diler dobiva poruku, ne treba više pratiti
- "Kupio sam vozilo!" → mini forma (gdje kupljeno, kada, marka/model) → trigger feedback flow
- "Otkaži cijeli upit" → trigger GDPR brisanje (s dvostrukom potvrdom)
- "Zatraži novi tracking link" → ako stari istekao

**CTA pri dnu**:
- "Stvori račun da spremiš povijest upita" — gumb postoji ali u MVP-u pokazuje "Uskoro!" (Phase 2)
- "Imam pitanje" — link na kontakt

### Bez magic linka — backup
Ako kupac izgubio email s tokenom:
- U footeru link "Provjeri svoj upit"
- Stranica `/provjeri-upit/` — forma: email + ID upita → dobiva novi magic link na taj email
- Rate limit (max 3 / 24h po emailu)

### Sigurnost
- Token rotira ako kupac zatraži novi (stari postaje invalid)
- Sve akcije logirane u audit trail
- Stranica ima `noindex, nofollow` meta tag
- HTTPS obavezno (Vercel auto)

---

## TOK 5 — Feedback flow (Carwow pattern)

### Diler upisuje (obavezno) u dashboardu kad zatvara lead
- Status ishoda (vidi gore: prodano / nije prodano + razlog)
- Datum prodaje (ako prodano)
- Marka/model što je kupac kupio (može biti drugačiji od originalnog upita)
- Bilješke

### Kupac dobiva email feedback flow (svi feature-flag-gated)

| Dan | Email | Sadržaj |
|---|---|---|
| 3 | "Jesu li te kontaktirali dileri?" | Da/Ne brza tipka u mailu (link na tracker) |
| 14 | "Kako napreduje istraživanje?" | Da li si probao test vožnju? |
| 30 | "Jesi li kupio vozilo?" | Forma: Da preko vozilla.hr / Da drugdje / Još tražim / Odustao |

Ako odgovor "Kupio preko vozilla.hr dilera":
- Pita se za **rating dilera (1-5 zvjezdica)** + komentar
- Rating + komentar **utječu na quality_score dilera**
- Komentar ide u admin panel (privatno za sad, kasnije možda public reviews)

### Frequency / opt-out
- Svaki email ima link "Ne želim primati ove podsjetnike" → flag u DB
- Ako kupac napravi GDPR zahtjev za brisanje, feedback emailovi se zaustavljaju automatski

---

## TOK 6 — Pretraga rabljenih vozila

### `/rabljena-vozila/` — listings page

**Filter sidebar (desktop) / collapsible top (mobile)**:
- Marka (multi-select)
- Model (filter po odabranim markama)
- Cjenovni raspon (dual slider)
- Godina proizvodnje (dual range)
- Kilometraža (dual range)
- Tip pogona (multi-select)
- Mjenjač (radio)
- Karoserija/kategorija (multi-select)
- Lokacija (županija + radius slider)
- Boja (multi-select)
- Dodatna oprema (checkbox lista)

**Glavna lista**:
- Card layout (slika hero + ključni podaci + cijena + lokacija + datum dodavanja)
- Sort: Najnoviji / Najjeftiniji / Najmanje km / Najnižia cijena/godina ratio / Najpopularniji
- Pagination (25 po stranici) ili infinite scroll (agent procjenjuje)
- "Spasi pretragu" gumb (Phase 2 — sad samo placeholder)
- "0 rezultata" stanje s prijedlozima

### `/rabljena-vozila/oglas/{id}/` — detail oglas

- **Hero galerija** (lightbox, swipe na mobile, zoom)
- **Specifikacije** (sve iz `used_car_listings` + `vehicle_attributes`)
- **Opis** (Lexical/Markdown content)
- **Lokacija**: county + city + radius indikator (ne tačna adresa zbog privatnosti)
- **Prodavatelj**: Salon (s linkom na dealer profile) ili Privatni (s minimalnim info)
- **Povijest** (ako dostupno): prvi vlasnik, servisna knjiga, prijeđeni km
- **CTA**: "Kontaktiraj prodavatelja" → `/zatrazi-ponudu/?oglas={id}&izvor=oglas`
- **Sekundarni CTA**: "Spremi" (Phase 2), "Podijeli", "Prijavi sumnjiv oglas" (kontakt forma)
- **Slični oglasi** (5-6 cards pri dnu)

### Edge cases
- Oglas obrisan/prodan → 410 Gone status + redirect na "Slični oglasi" sekciju
- Slika ne učita → fallback placeholder + lazy retry
- Filter daje 0 rezultata → "Nema rezultata, evo prijedloga: ..." + savjet "Proširi filter"

---

## TOK 7 — Leasing kalkulator

### `/leasing/kalkulator/`

**Inputi**:
- Cijena vozila (€) — input + slider
- Polog/učešće (€ ili % toggle) — slider
- Period otplate (mjeseci) — dropdown 24/36/48/60/72
- Ostatak vrijednosti (€ ili %, opcijsko) — slider
- Vrsta leasinga — radio: Operativni / Financijski (s tooltip ❓ koji objašnjava razliku)

**Live izračun** (debounced 200ms):
```
Operativni: PMT formula s dohvaćenom kamatnom stopom
Financijski: PMT formula s drugom stopom
```

Izračun u `services/leasing-calculator.ts` — agent piše čistu funkciju, lako se mijenja, testabilno.

**Output**:
- 🟡 **Procijenjena mjesečna rata: ~XXX €** (highlighted, visible)
- Ukupno plaćanje: ~XXX €
- Ukupna kamata: ~XXX €
- Postotak učešća: X%

**Iznad** rezultata, **velikim slovima**, kontrastnom bojom:

> ⚠️ **Informativni izračun. Ne predstavlja ponudu.**  
> Stvarne uvjete (kamatna stopa, EKS, naknade za obradu, ostali troškovi) određuje partner-leasing kuća na temelju kreditne sposobnosti i interne procjene. Pravo je leasing kuće odbiti zahtjev. Ovo je informacija u skladu s Pravilnikom o oglašavanju financijskih usluga.

**Default kamatne stope** (placeholderi u Payload Settings):
- `XXX_LEASING_OPERATING_RATE` — vlasnik popunjava aktualnu tržišnu stopu
- `XXX_LEASING_FINANCIAL_RATE` — vlasnik popunjava

**CTA**: "Zatraži leasing ponudu" → `/zatrazi-ponudu/?cijena=...&period=...&polog=...&izvor=leasing`

---

## TOK 8 — GDPR zahtjev

### `/gdpr-zahtjev/` forma
Polja:
- Tip zahtjeva (dropdown):
  - Pristup mojim podacima (čl. 15 GDPR)
  - Ispravak (čl. 16)
  - Brisanje / pravo na zaborav (čl. 17)
  - Prigovor (čl. 21)
  - Prenosivost (čl. 20)
  - Ograničenje obrade (čl. 18)
- Email (validacija: mora biti email koji je u našoj bazi — soft, ne otkrivamo da je email u bazi zbog enumeration attacka)
- Ime
- OIB (opcijsko, za jednostavniju identifikaciju)
- Tip kontakta s nama (dropdown: Lead request / Newsletter / Drugo)
- ID upita (opcijsko, ako se odnosi na konkretan slučaj)
- Opis zahtjeva (textarea, max 1000 zn)
- ☐ Privola za obradu zahtjeva (obavezno)
- reCAPTCHA

### Backend
- Spremi u `gdpr_requests` (status: 'pending')
- Generiraj ID: `GDPR-2026-XXXX`
- Email kupcu (template: gdpr-request-received): "Zaprimili smo zahtjev pod brojem GDPR-... Riješit ćemo u roku od 30 dana kako nalaže GDPR."
- Notifikacija adminu (in-app + email)

### Admin obrada (Payload `/admin/gdpr-requests/`)
- Lista zahtjeva (status: pending / in_progress / resolved / rejected)
- Detalj: sve info kupca + povijest (svi leadovi, privole, povijest komunikacije)
- Akcije:
  - **Pristup** (čl. 15): export svih podataka u JSON, šalje kupcu kao file
  - **Ispravak** (čl. 16): edit korisnik podataka direktno
  - **Brisanje** (čl. 17): trigger soft delete (vidi sekciju dolje)
  - **Prigovor / Ograničenje**: flag account-a, dileri više ne primaju lead
  - **Prenosivost** (čl. 20): export svih podataka u portable formatu
- Pri svakoj akciji: email kupcu (template: gdpr-request-resolved) + audit log

### Pravo na zaborav (delete) — implementacija
1. **Soft delete**: anonimizacija PII u `lead_requests`, `lead_assignments`, `consent_log`. Email → `deleted-{hash}@vozilla.invalid`. Ime → `Izbrisano`. Telefon → `null`.
2. Cascade: brišu se i povezani magic_link_tokens
3. Audit log entry (anonimiziran nakon retention)
4. Notify dilere koji su imali aktivni lead s tim kupcem (kratki email: "Ovaj lead je otkazan na zahtjev kupca, prestanite ga kontaktirati")
5. Hard delete: nakon **30 dana** retention period (konfigurabilno) — cron job briše soft-deleted zapise
6. Audit log se anonimizira nakon 6 godina (zakonska obveza)

---

## EDGE CASES — checklist (agent obvezan adresirati)

| # | Scenarij | Rješenje |
|---|---|---|
| 1 | Forma submit-ana 2× (double-click) | Debounce + idempotency token + disable submit gumb tijekom requesta |
| 2 | Mreža izgubljena na 3. koraku wizarda | Auto-save draft u localStorage, prikaži toast "Spremljeno offline, online će se poslati" |
| 3 | Korisnik zatvori tab tijekom forme | `beforeunload` warning ako su podaci uneseni |
| 4 | Email već postoji u bazi s aktivnim leadom za isti model | Prikazi: "Već imaš upit za ovaj model. Vidi status: [tracker link]" |
| 5 | Email u disposable blacklisti | Odbij + javi: "Ovaj email izgleda privremen. Molimo koristi pravu adresu." |
| 6 | Telefon nije HR format | Server-side normalizacija (parse "0911234567" → "+385911234567"); ako nije validan, jasna error poruka |
| 7 | reCAPTCHA score < 0.3 | Odbij submission s generic porukom; log u Sentry s detalji |
| 8 | reCAPTCHA score između 0.3-0.5 | Pass ali flag review=true; admin vidi prije nego ide u glavnu listu |
| 9 | Diler nepotvrđen email | Leadovi mu se ne šalju; admin vidi flag "email_verified=false"; podsjetnik na verifikaciju |
| 10 | Diler suspended/inactive | Auto uklonjen iz suggest algoritma; admin vidi notifikaciju |
| 11 | Rabljeni oglas izbrisan/prodan | 410 Gone + "Slični oglasi" prijedlozi; magic link iz emaila i dalje radi (vodi na info "Oglas više nije dostupan") |
| 12 | Slika modela ne učita (404 ili timeout) | Fallback placeholder po kategoriji + lazy retry (max 2 puta) |
| 13 | Pretraga 0 rezultata | "Nema rezultata, evo prijedloga: [...]" + savjet "Proširi filter ili izmijeni kriterije" |
| 14 | Cijena u kalkulatoru < 1.000€ ili > 500.000€ | Soft warning toast "Provjeri unos — nije uobičajen iznos"; ne blokira submit |
| 15 | Mobile pre-fill iz detail stranice | Sačuvaj u sessionStorage prije navigacije; restore na mount forme |
| 16 | Browser back tipka u 4-step formi | Vrati na prethodni korak (router-aware), ne resetira |
| 17 | Lead pokupljen kroz spam (low reCAPTCHA score) | Posebni "review" red u admin panelu, ne u glavnoj listi |
| 18 | Lead duplikat (isti email + isti model u 24h) | Markirati kao duplikat, admin vidi "Mogući duplikat #VZ-..." sa opcijama |
| 19 | Diler zaboravio password | Flow "Zaboravljena lozinka" → magic link na email (TTL 1h) → set new password |
| 20 | Admin briše dilera | Što s aktivnim leadovima dodijeljenima njemu? → reassignment modal: select replacement dealer + automated notification dileru i kupcu |
| 21 | GDPR zahtjev za brisanje od kupca | Soft delete + 30 dana retention + cascade na povezane tablice + notify dilere + hard delete cron |
| 22 | Magic link tracker token istekao (>30 dana) | Stranica prikazuje "Link je istekao. Zatraži novi: [forma]" |
| 23 | Korisnik klika tracker link nakon GDPR brisanja | "Ovaj upit više nije dostupan." (ne otkrivamo razlog) |
| 24 | Cookie banner skriven JavaScript blockerom | Detect i prikaži non-JS warning + osnovne info; site i dalje radi za nužne stvari |
| 25 | reCAPTCHA blokirana (Google domena nedostupna na nečijoj mreži) | Math fallback ("Koliko je 3+5?") |

---

## Definicija uspjeha Faze 4

✅ Svi 8 tokova (lead, admin, dealer, tracker, feedback, listings, leasing, GDPR) imaju jasne korake od početka do kraja  
✅ Quality score algoritam dokumentiran s konfigurabilnim težinama  
✅ Auto-podsjetnici i feedback emails imaju feature flag i konfigurabilne thresholds  
✅ Sve forme imaju validaciju, captcha, honeypot, rate limit  
✅ Edge cases katalog (25 stavki) adresiran  
✅ GDPR pipeline kompletan (zahtjev → admin → resolved)

Sljedeća faza: [`05-data-and-systems.md`](./05-data-and-systems.md)
