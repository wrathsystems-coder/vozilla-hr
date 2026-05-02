# vozilla.hr — Blueprint za razvoj

Ovo je **kompletna projektna specifikacija** za izradu hrvatske verzije Carwowa (radni naziv: **vozilla.hr**). Dokumenti u ovom folderu služe kao input za agentskog programera (Claude Code ili sličan), ali su pisani tako da ih može pratiti i čovjek.

## Sadržaj

| # | Datoteka | Što sadrži |
|---|---|---|
| — | [`README.md`](./README.md) | Ovaj index |
| — | [`CLAUDE.md`](./CLAUDE.md) | **Pravila projekta za agenta** — agent ovo čita pri svakoj sesiji |
| — | [`SPEC.md`](./SPEC.md) | Master overview svih 7 faza, jedan dokument za brzi pregled |
| 1 | [`spec/01-vision-and-scope.md`](./spec/01-vision-and-scope.md) | Vizija, MVP scope, korisnici, glavni tok |
| 2 | [`spec/02-legal-and-compliance.md`](./spec/02-legal-and-compliance.md) | GDPR, OUP, cookies, captcha, HR pravne specifike |
| 3 | [`spec/03-information-architecture.md`](./spec/03-information-architecture.md) | Sitemap, navigacija, URL strukture, footer |
| 4 | [`spec/04-features-and-flows.md`](./spec/04-features-and-flows.md) | Korisnički tokovi, lead distribution, edge cases |
| 5 | [`spec/05-data-and-systems.md`](./spec/05-data-and-systems.md) | Tehnološki stack, schema, integracije, hosting |
| 6 | [`spec/06-branding-and-assets.md`](./spec/06-branding-and-assets.md) | Placeholderi, branding, gdje ide što |
| 7 | [`spec/07-delivery-and-deployment.md`](./spec/07-delivery-and-deployment.md) | Struktura repa, sprintovi, testovi, deploy |

## Kako koristiti ove dokumente

### Za agenta (Claude Code)
1. Postaviti **`CLAUDE.md`** u korijen projekta (vozilla-hr repo)
2. Postaviti **`SPEC.md`** + cijeli `spec/` folder u `/docs/spec/` projekta
3. Pokrenuti agenta s instrukcijom da prvo pročita `CLAUDE.md` pa `SPEC.md`
4. Pratiti sprint plan iz [`07-delivery-and-deployment.md`](./spec/07-delivery-and-deployment.md)

### Za tebe (vlasnika projekta)
1. Pročitaj `SPEC.md` za high-level pregled
2. Pročitaj `06-branding-and-assets.md` da vidiš **što sve moraš pripremiti** (logo, slike, tekstovi)
3. Nakon Sprint 0 dobivaš working dev environment — dalje testiraš i popunjavaš
4. Prati `docs/pre-launch-checklist.md` (agent ga generira u Sprint 7) prije produkcije

## Filozofija blueprintа

- **Mi diktiramo "što i zašto"**, agent odlučuje "kako tehnički"
- **Sve što agent ne može pogoditi je placeholder** s prefiksom `XXX_`
- **Agent ne generira brand assete** — priprema mjesto + README upute
- **Hrvatski jezik svuda** — UI, error poruke, validacije, mailovi
- **GDPR + HR pravo by default** — nije dodano kasnije
- **Faze + checkpoints** — agent ne ide na sljedeći sprint dok current nije verified

## Stack (zaključen)

- **Frontend/fullstack**: Next.js 15 (App Router) + TypeScript
- **Baza**: PostgreSQL preko Supabase
- **ORM**: Drizzle (preferirano) ili Prisma (alternative)
- **CMS**: Payload CMS 3 (self-hosted u Next.js-u)
- **Hosting**: Vercel (frontend) + Supabase (DB) — EU regije
- **Email**: Resend (transakcijski) + React Email (templateи)
- **Captcha**: Google reCAPTCHA v3
- **Cookies**: Cookiebot ili Iubenda
- **Boje**: crna + žuta (placeholder HEX, mi finaliziramo)

## Status

✅ Plan zaključen kroz 7 faza razgovora s vlasnikom projekta  
🚧 Sljedeći korak: predati ovaj blueprint agentu za izvedbu  
🎯 Cilj: deployable MVP nakon 8 sprintova

---

*Blueprint izrađen na temelju Anthropic best practices: explore → plan → checkpoint → verify.*
