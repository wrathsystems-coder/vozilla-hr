# Post-launch roadmap — vozilla.hr

Phase 2+ plan. Detalji su u
[`spec/07-delivery-and-deployment.md`](./spec/07-delivery-and-deployment.md)
sekcija "Post-Launch Roadmap".

## Phase 2 (3-6 mjeseci nakon launch-a)

### Pripremljeno u MVP-u (samo aktivacija)

- [ ] **Newsletter** — feature flag flip; pipeline je gotov
- [ ] **Dark mode** — uključi `next-themes`; CSS varijable pripremljene
- [ ] **Korisnički računi** — magic link tokens evolve u full auth
- [ ] **GA4 + PostHog** — feature flag flip kad odluka donesena

### Novi development

- [ ] **Reverse-auction full** — real-time dealer bidding (struktura
      `lead_assignments` već priprema)
- [ ] **Sell My Car** — kupac prodaje vozilo platformi, dileri bid-aju
      (Carwow Wizzle pattern)
- [ ] **Dealer self-service portal** — full CRM, A/B, statistike, vlastiti
      upload listings
- [ ] **Subscription billing za dilere** — Stripe integracija
- [ ] **WhatsApp / SMS notifikacije** — feature flagovi već postoje
- [ ] **Public dealer profiles** — sa public reviews i ratings
- [ ] **Live chat** (Intercom, Crisp ili custom)

## Phase 3 (6-12 mjeseci)

- [ ] **Smart Match AI** — ML preporuke modela
- [ ] **Mobilna aplikacija** (React Native ili Native)
- [ ] **Više jezika** — engleski + njemački (i18n struktura priprema)
- [ ] **Video produkcija** — YouTube kanal + recenzijski videi
- [ ] **API integracija s OEM** — direktan feed s proizvođačima
- [ ] **B2B Auto Trader-style** — listings za fleet/business

## Phase 4+ (1+ godina)

- [ ] **Regionalna ekspanzija** — Slovenija, BiH, Srbija
- [ ] **Aftermarket** — servis, dijelovi, osiguranje
- [ ] **Test drive booking** — direktan booking kalendar dilera
- [ ] **Trade-in instant procjena** — AI-based valuation

---

> Roadmap se revidira kvartalno na temelju post-launch metrika.
> Trenutni stav: blueprint complete, MVP build u tijeku.
