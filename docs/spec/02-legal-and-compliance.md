# Faza 2 — Pravna i compliance osnova (HR/EU)

## Pravni status platforme

**vozilla.hr je informacijska platforma i posrednik** koji povezuje korisnike s dilerima vozila.

> **NIJE** strana u kupoprodajnom ugovoru.  
> **NE** prodaje vozila.  
> **NE** zaprima plaćanja za vozila.  
> Naš prihod (Phase 2): pretplata/lead fee od dilera.

Svaki kupoprodajni ugovor sklapa se **direktno između korisnika i dilera**. Ovo se mora **eksplicitno** napisati u OUP-u i prikazati kao disclamer u footeru i na svim stranicama gdje se traži upit.

Ovaj status nas izuzima iz mnogih web-shop obveza (povrat 14 dana, fiskalizacija prodaje vozila, MTU za skladište), ali **i dalje smo obvezni**:

| Zakon / regulativa | Što mora |
|---|---|
| **GDPR + ZZOP** | Privola, politika privatnosti, audit log, pravo na zaborav |
| **Zakon o elektroničkim komunikacijama** | Privole za marketing/newsletter |
| **Zakon o elektroničkoj trgovini** | Impressum, predugovorne obavijesti |
| **Zakon o zaštiti potrošača (ZZP)** | Predugovorne obavijesti za bilo koju uslugu koju MI naplaćujemo |
| **Zakon o medijima** | Recenzije imaju autora, datum, jasan impressum |
| **Omnibus / DSA** | Objasniti **kako provjeravamo recenzije** (od 2022. EU pravilo) |
| **HANFA** | Ako prikazujemo financijske usluge (leasing) — disclamer obavezan |
| **Zakon o trgovini i nepoštenim trgovačkim praksama** | Aktivno uklanjati lažne/neaktivne oglase |

---

## Nositelj stranice (impressum)

Pravna osoba (d.o.o. ili j.d.o.o.). Placeholderi u **`config/company.yml`** koje agent NE smije popuniti — vlasnik projekta popunjava.

```yaml
# config/company.yml
company:
  brand_name: "Vozilla"
  legal_name: "XXX_LEGAL_NAME"             # npr. "VOZILLA d.o.o."
  legal_form: "XXX_LEGAL_FORM"             # "društvo s ograničenom odgovornošću"
  oib: "XXX_OIB"                            # 11 znamenki, validiran checksumom
  mbs: "XXX_MBS"                            # matični broj subjekta
  registration_court: "XXX_REGISTRATION_COURT"  # npr. "Trgovački sud u Zagrebu"
  share_capital: "XXX_SHARE_CAPITAL"        # npr. "2.500,00 EUR uplaćen u cijelosti"
  director: "XXX_DIRECTOR_NAME"
  hq:
    street: "XXX_STREET"
    city: "XXX_CITY"
    postal_code: "XXX_POSTAL_CODE"
    country: "Hrvatska"
  contact:
    email: "XXX_CONTACT_EMAIL"
    phone: "XXX_CONTACT_PHONE"
    business_hours: "XXX_BUSINESS_HOURS"
  bank:
    name: "XXX_BANK_NAME"
    iban: "XXX_IBAN"
    swift: "XXX_SWIFT"
  dpo:
    email: "XXX_DPO_EMAIL"                  # voditelj obrade osobnih podataka
    phone: "XXX_DPO_PHONE"
  social:
    facebook: "https://facebook.com"        # default placeholder
    instagram: "https://instagram.com"
    youtube: "https://youtube.com"
    linkedin: "https://linkedin.com"
    tiktok: ""
```

Pri prvom deploy-u Payload čita ovaj YAML i seeds **Settings global** s tim vrijednostima. Daljnje izmjene **kroz Payload admin** (`/admin → Settings → Company Info`), ne kroz YAML.

**Impressum stranica** (`/impressum/`) — agent **automatski generira sadržaj** iz Settings globala. Korisnik ne piše tekst impressuma, samo popunjava XXX vrijednosti.

---

## Pravne stranice

| Stranica | URL | Sadržaj | Tko piše |
|---|---|---|---|
| Impressum | `/impressum/` | Auto-generiran iz `company.yml` | Agent struktura, korisnik podatke |
| Opći uvjeti korištenja | `/opci-uvjeti/` | Custom tekst | Korisnik dostavlja, lijepi u Payload |
| Politika privatnosti | `/politika-privatnosti/` | Custom tekst (GDPR-compliant) | Korisnik dostavlja |
| Politika kolačića | `/politika-kolacica/` | Custom tekst | Korisnik dostavlja |
| GDPR zahtjev forma | `/gdpr-zahtjev/` | Forma + statički info | Agent struktura, korisnik tekst |
| "Kako provjeravamo recenzije" | `/kako-provjeravamo-recenzije/` | DSA obvezno, custom tekst | Korisnik dostavlja |
| Pravila za dilere | `/dileri/pravila/` | Custom tekst (Phase 2 kad budu plaćali) | Phase 2 |
| Odjava newslettera | `/odjava-newslettera/` | Forma + info | Agent (newsletter inactive u MVP) |

### Obavezna pravila za sve pravne stranice
- **Zasebni URL-ovi** (linkani u footeru)
- **Datum zadnje izmjene** prikazan na stranici
- **Otvaraju se prije cookie privole** — ne traže JS / cookies za pristup
- **PDF download verzija** (ZZP traži "trajni medij") — generirana iz iste sadržajnice kroz `/api/legal/pdf/{slug}`
- **`XXX_PLACEHOLDER`** na mjestima gdje se ubacuju konkretni podaci (datum stupanja na snagu, naziv firme)
- Linkano iz **footer + cookie banner + svake forme s privolom**

### Default placeholder content (agent stavlja u Payload kao default)
```markdown
# Opći uvjeti korištenja

[XXX_OUP_TEKST: Cjelovit tekst Općih uvjeta korištenja koji 
će dostaviti vlasnik projekta. Pravnik ih treba pregledati 
prije produkcije.]

Datum stupanja na snagu: [XXX_OUP_DATUM]
Verzija: [XXX_OUP_VERZIJA]
```

---

## Cookies — strategija

**Servis**: Cookiebot ili Iubenda (vlasnik bira plaćeni plan; agent integrira odabrani).

**Kategorije** (4, kako EU traži):
1. **Nužni** — uvijek aktivni, ne traže privolu (session cookie, CSRF token, jezik)
2. **Funkcionalni** — privola; preference (favoriti, povijest pretrage, dismiss flagovi za widget)
3. **Analitički** — privola; GA4, PostHog (oba OFF u MVP-u, struktura postoji)
4. **Marketinški** — privola; Meta Pixel, Google Ads remarketing (sve OFF u MVP-u)

### Tehnički zahtjevi
- **Granularna opt-in privola** — odvojeni checkbox-i za svaku ne-nužnu kategoriju
- **Default state**: svi ne-nužni checkbox-i UN-checked (GDPR pravilo)
- **Nikakvi non-essential JS skripte** ne učitavaju se prije privole — GA4, Pixel, ostali idu u `<script>` koji se učitava tek nakon "Prihvati analytics"
- **Prihvati sve** i **Odbij sve** gumbi jednako istaknuti (ne radi "dark pattern" gdje je "Prihvati" zelen, a "Odbij" siv)
- **Mogućnost povlačenja privole** — link "Postavke kolačića" u footeru i mali widget u kutu (re-otvara banner)
- **Consent log** — pohrana tko je kad što prihvatio, s timestampom (GDPR dokaz, retention 6 godina kako pravnik preporuči)

### Implementacijske napomene za agenta
- Cookiebot/Iubenda script ide u `<head>`, ali sam Cookiebot upravlja kad se koje skripte učitavaju
- Custom skripte (npr. naš PostHog) označi s `data-cookieconsent="statistics"` (Cookiebot syntax) ili ekvivalent za Iubenda
- Test scenarij u Sprint 7: provjeri **DevTools → Application → Cookies** prije i poslije privole — ne smije biti GA cookies bez privole

---

## CAPTCHA — Google reCAPTCHA v3

**Zašto v3**: nevidljiva, score-based, najbolji UX. Korisnik ne klika "Nisam robot".

### Implementacija
- Token generiran na klijentu pri submitu
- Server-side verifikacija s Google API-em
- Score (0.0 - 1.0) ulazi u logiku:

```yaml
# config/recaptcha.yml
recaptcha:
  block_threshold: 0.3      # ispod toga = blok, lead se ne sprema
  review_threshold: 0.5     # između 0.3 i 0.5 = ide u "review" red u admin panelu
  # >= 0.5 = pass
```

Defaultne vrijednosti (placeholderi `XXX_RECAPTCHA_BLOCK_THRESHOLD`, `XXX_RECAPTCHA_REVIEW_THRESHOLD`) — admin može mijenjati u Payload Settings.

### Forme s reCAPTCHA
- Sticky widget (kratki upit)
- 4-step lead request (na zadnjem koraku)
- Kontakt forma
- Newsletter signup (kad se aktivira)
- Dealer prijava
- GDPR zahtjev forma

### Antispam dodatno
- **Honeypot polje** — nevidljivo polje koje botovi popunjavaju (CSS hidden)
- **Rate limit** po IP-u + emailu — max 5 upita / 15 min (konfigurabilno)
- **DNS provjera** email domene (MX record check) prije prihvaćanja
- **Disposable email** blacklist (npr. mailinator.com, tempmail) — odbij + javi korisniku

### Fallback
Ako reCAPTCHA padne ili je blokirana (Google domene blokirane na nekim mrežama):
- Prikaži **matematički izazov** ("Koliko je 3 + 5?")
- Logiraj događaj u Sentry da admin vidi koliko često se aktivira

### API ključevi
```env
# .env (placeholderi)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="XXX_RECAPTCHA_SITE_KEY"
RECAPTCHA_SECRET_KEY="XXX_RECAPTCHA_SECRET_KEY"
```

---

## Leasing kalkulator — HANFA disclamer

Kalkulator je **informativni**, ne ponuda. Svaki rezultat ima vidljiv disclamer **iznad** prikaza rate.

### Inputi
- Cijena vozila (€)
- Polog/učešće (€ ili %)
- Period otplate (mjeseci, dropdown: 24, 36, 48, 60, 72)
- Ostatak vrijednosti (€ ili %, opcijsko)
- Vrsta leasinga: Operativni / Financijski (s tooltip objašnjenjem)

### Default kamatne stope (placeholderi u Payload Settings)
- `XXX_LEASING_OPERATING_RATE` — npr. "5,5"
- `XXX_LEASING_FINANCIAL_RATE` — npr. "6,2"

> Vlasnik popunjava aktualne tržišne stope. Agent ne stavlja "fake" vrijednosti, koristi `XXX_` placeholder vidno označen.

### Output
- "**Procijenjena mjesečna rata: ~XXX €**"
- "**Ukupno plaćanje: ~XXX €**"
- "**Ukupna kamata: ~XXX €**"

### Obavezni disclamer (placement: vidljiv prije scroll-a, kontrastna boja)

> ⚠️ **Informativni izračun. Ne predstavlja ponudu.**  
> Stvarne uvjete (kamatna stopa, EKS, naknade za obradu, ostali troškovi) određuje partner-leasing kuća na temelju kreditne sposobnosti i interne procjene. Pravo je leasing kuće odbiti zahtjev. Ovo je informacija u skladu s Pravilnikom o oglašavanju financijskih usluga.

### CTA nakon izračuna
"**Zatraži leasing ponudu**" → ide u standardni 4-step lead flow s pre-filled cijenom, periodom, pologom.

---

## Newsletter — pripremljen, **disabled u MVP-u**

### Filozofija
- Forma postoji u footeru i na pojedinim stranicama
- **Feature flag** `NEWSLETTER_ENABLED=false` u `.env` (default)
- Backend pipeline kompletan: forma → endpoint → confirmation email → DB sprem → unsubscribe link u svakom mailu
- Kad se flag prebaci na `true`, sve počinje raditi automatski

### Double opt-in tok
1. Korisnik upiše email
2. Spremi u DB s `status: pending_confirmation` + token
3. Pošalje confirmation email s magic link-om
4. Korisnik klika link → token se invalidira, status `confirmed`
5. Tek nakon ovoga šaljemo marketing emailove

### Privole (logiranje)
- Timestamp privole
- IP address
- User-agent
- Source obrazac (footer / detail page / popup)

Sve u `consent_log` tablici (separatno od `newsletter_subscribers`).

### Unsubscribe
- **Link u svakom marketing emailu** (one-click, ne traži login)
- Dedikirana stranica `/odjava-newslettera/?token=...`
- Sprema timestamp + ne briše email iz baze (audit trail), samo flag `unsubscribed_at`

### Email provider
Resend (preporučeno) — placeholder env:
```env
EMAIL_PROVIDER="resend"
RESEND_API_KEY="XXX_RESEND_API_KEY"
RESEND_FROM_EMAIL="XXX_RESEND_FROM_EMAIL"
RESEND_REPLY_TO="XXX_RESEND_REPLY_TO"
```

---

## Recenzije i sadržaj — DSA / Omnibus obveze

EU od 2022. traži da platforme jasno objasne **kako provjeravaju recenzije**.

### Obavezno
- **Stranica `/kako-provjeravamo-recenzije/`** — custom tekst koji vlasnik dostavlja
- **Na svakoj recenziji**: jasna oznaka **autora** + **datum objave** + **datum zadnje izmjene**
- Disclamer: "Mišljenje autora, ne predstavlja stav proizvođača/dilera ili stranice vozilla.hr"
- Recenzije korisnika (kad ih budemo imali u Phase 2): označiti je li korisnik **provjereni kupac** (kupio kroz našu platformu) ili nije

### Slike vozila — autorska prava
Svaka slika u Payload media library ima polja:
- **`alt`** (obavezno, HR jezik)
- **`source`** — izvor (vlastite / press-kit proizvođača / dealer-uploaded / stock-photo)
- **`credit_text`** — prikazuje se ispod slike (npr. "Foto: Audi AG")
- **`licence_url`** — link na licencu
- **`uploaded_by`** — admin/dealer/system

README upozorava da se slike novih vozila skidaju **isključivo s press-kit stranica** proizvođača (media.audi.com, mediahub.bmwgroup.com, ...) ili se koriste licencirani stock fotografije.

---

## Sigurnosni minimum (agent obvezan)

### Network / transport
- HTTPS svuda (Vercel automatski)
- HSTS header s `max-age=63072000; includeSubDomains; preload`
- HSTS preload submit (kasnije, kad je site stabilan)
- Cloudflare ispred Vercela (DDoS, WAF basic, bot protection)

### HTTP headers
- **CSP** (Content Security Policy) — striktan, definiran u `next.config.ts`
- **X-Frame-Options**: `DENY` (osim ako neka stranica eksplicitno mora biti embedabilna)
- **X-Content-Type-Options**: `nosniff`
- **Referrer-Policy**: `strict-origin-when-cross-origin`
- **Permissions-Policy**: zatvori sve što ne treba (camera, microphone, geolocation osim ako koristi)

### Aplikacijski
- **CSRF zaštita** na svim POST forme (Next.js 15 built-in)
- **Server-side validacija** svih inputa preko **Zod** schema-i — nikakvi raw inputi u DB
- **SQL injection prevencija** — Drizzle/Payload sve preko parametriziranih upita, nema raw SQL-a osim ako je apsolutno nužno
- **XSS prevencija** — React default escape + sanitizacija user-generated HTML (DOMPurify za Lexical content)
- **Lozinke** — Argon2id hash (Payload default), salt, rounds preporučeni
- **Sessions** — secure + httpOnly + sameSite=lax cookies, 30 min idle timeout za admin/dealer
- **2FA** za admina — preporučeno (Payload supports), opciono za dilere
- **Magic link tokens** — UUID v4 + dodatna entropija, single-purpose, kratki TTL (30 dana max za tracker, 1h za password reset)

### Logiranje
- **Audit log** za sve admin akcije koje mijenjaju stanje (CRUD na ključnim entitetima, slanje leadova, suspend dilera)
- **Consent log** za sve privole
- **Sentry** za errore (placeholder env `SENTRY_DSN`)
- **Vercel logs** za HTTP requeste (built-in)

### Backup
- Supabase Pro: daily auto backup, retencija 7 dana, point-in-time recovery 7 dana
- Manual snapshot pre-deploy svake major migracije
- Pre-launch: testiraj restore proces (dokumentirano u `docs/backup-recovery.md`)

---

## GDPR pipeline

### Zahtjev forma `/gdpr-zahtjev/`
Tipovi zahtjeva (dropdown):
- Pristup mojim podacima (čl. 15)
- Ispravak (čl. 16)
- Brisanje / pravo na zaborav (čl. 17)
- Prigovor (čl. 21)
- Prenosivost (čl. 20)
- Ograničenje obrade (čl. 18)

Polja:
- Email i ime
- OIB (opcijsko, za jednostavniju identifikaciju)
- Tip zahtjeva
- Opis (textarea)
- ID upita ako se odnosi na konkretan slučaj
- Privola za obradu zahtjeva (obavezno)
- reCAPTCHA

### Backend
- Sprema u `gdpr_requests` tablicu sa statusom `pending`
- Notifikacija adminu (email + in-app)
- Auto-reply emailom: "Zaprimili smo zahtjev pod brojem GDPR-2026-XXXX. Riješit ćemo u roku od 30 dana kako nalaže GDPR."
- Admin u Payload-u vidi listu, obrađuje, mijenja status: `in_progress` → `resolved` ili `rejected` (s razlogom)
- Pri `resolved` — automatski email korisniku s rezultatom

### Pravo na zaborav (delete)
- **Soft delete** prvo (anonymize PII, zadržava ID radi audit trail-a)
- **Hard delete** nakon retention period-a (30 dana, konfigurabilno)
- **Audit log** sačuvan (anonimiziran), nije izbrisan
- **Cascade**: brišu se i lead_requests i lead_assignments povezani s tim emailom
- **Notify dilere** koji su imali aktivni lead s tim kupcem

---

## Definicija uspjeha Faze 2

✅ Sve pravne obveze su razumljive i adresirane:
- Impressum auto-generiran iz YAML/Settings
- 4 kategorije cookies, granularna opt-in privola
- reCAPTCHA + honeypot + rate limit na svim formama
- Leasing kalkulator s vidljivim HANFA disclamerom
- Newsletter pripremljen, OFF
- GDPR zahtjev forma + backend pipeline
- Sigurnosni minimum (CSP, CSRF, audit log, Argon2id, magic link tokens)
- DSA "kako provjeravamo recenzije" stranica pripremljena

Sljedeća faza: [`03-information-architecture.md`](./03-information-architecture.md)
