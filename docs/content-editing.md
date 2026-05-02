# Uređivanje sadržaja — vozilla.hr

Vodič za **netehničke korisnike** (vlasnik, urednik, marketing). Objašnjava
kako ažurirati tekstove, slike, recenzije i ostalo kroz **Payload admin**.

> Skeleton. Pišemo postupno tijekom sprintova. Konačan dokument nakon
> Sprinta 7 (s screenshot-ima i step-by-step uputama).

## Pristup

> TODO: dokumentiraj nakon prvog produkcijskog deploy-a.

Otvori `https://vozilla.hr/admin/`, logiraj se s emailom i lozinkom.
U produkciji je 2FA obavezan.

## Što možeš mijenjati

Sve placeholder vrijednosti popunjavaš ovdje, ne diraš kod.

- ⬜ Marketing tekstovi (hero, value props, CTA tekstovi) — **Settings global**
- ⬜ Marke i modeli — **Brands** i **Models** kolekcije
- ⬜ Recenzije vozila — **Reviews** kolekcija (Lexical editor s blocks)
- ⬜ Savjeti / blog — **Articles** kolekcija
- ⬜ Pravne stranice (kad pravnik dostavi) — **Pages** kolekcija
- ⬜ Dileri — **Dealers** kolekcija
- ⬜ Email tekstovi — **EmailSettings** global
- ⬜ Težine algoritma za lead distribution — **LeadDistribution** global
- ⬜ Default kamatne stope leasinga — **LeasingDefaults** global

## Što NE diraj

- Schema (struktura kolekcija) — agent radi
- Feature flag-ovi — agent / DevOps radi
- Audit log — read-only
- API ključevi — Vercel dashboard, ne kroz Payload

## TODO

- [ ] Screenshot-i nakon Sprinta 2
- [ ] Step-by-step "kako uploadati novu recenziju" nakon Sprinta 3
- [ ] "Kako obraditi lead" nakon Sprinta 4
- [ ] "Kako odgovoriti na GDPR zahtjev" nakon Sprinta 4
- [ ] "Kako dodati novu marku/model" nakon Sprinta 1 (CSV importer + Payload UI)
