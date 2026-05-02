# Dokumentacija — vozilla.hr

Direktorij `docs/` sadrži svu projektnu dokumentaciju. Spec dokumenti
(originalni 7-fazni blueprint) su u `docs/spec/`, ostalo je operativna
dokumentacija.

## Za vlasnika projekta (hrvatski)

| Dokument                                           | Opis                                                  |
| -------------------------------------------------- | ----------------------------------------------------- |
| [content-editing.md](./content-editing.md)         | Vodič za uređivanje sadržaja kroz Payload admin       |
| [branding.md](./branding.md)                       | Logo, fotografije, brand assete — što treba dostaviti |
| [PLACEHOLDERS.md](./PLACEHOLDERS.md)               | Master index svih `XXX_` vrijednosti                  |
| [post-launch-roadmap.md](./post-launch-roadmap.md) | Phase 2+ plan                                         |

## Za agenta (mix HR/EN)

| Dokument                                 | Opis                                            |
| ---------------------------------------- | ----------------------------------------------- |
| [`../CLAUDE.md`](../CLAUDE.md)           | Pravila projekta — agent čita pri svakoj sesiji |
| [architecture.md](./architecture.md)     | Tehnička arhitektura                            |
| [how-leads-work.md](./how-leads-work.md) | Business logika lead distribution-a             |

## Operativni (engleski)

| Dokument                                             | Opis                                  |
| ---------------------------------------------------- | ------------------------------------- |
| [local-dev.md](./local-dev.md)                       | Local development setup               |
| [deployment.md](./deployment.md)                     | Production deployment guide           |
| [pre-launch-checklist.md](./pre-launch-checklist.md) | Pre-launch ~80 stavki                 |
| [security.md](./security.md)                         | Security policies + incident playbook |
| [seo.md](./seo.md)                                   | SEO checklist                         |
| [accessibility.md](./accessibility.md)               | WCAG 2.1 AA compliance                |
| [backup-recovery.md](./backup-recovery.md)           | Backup procedure                      |
| [gdpr-vendors.md](./gdpr-vendors.md)                 | GDPR vendor list (DPA-ovi)            |

## Auto-generirani (NE u repo-u dok ih generator ne napravi)

| Dokument             | Generator             | Sprint   |
| -------------------- | --------------------- | -------- |
| `database-schema.md` | Drizzle introspection | Sprint 1 |
| `feature-flags.md`   | Custom skripta        | Sprint 1 |
| `api-routes.md`      | Custom skripta        | Sprint 4 |

## Spec dokumenti

[`spec/`](./spec/) — original 7-faza blueprint. Pročitaj relevantnu
fazu prije rada na sprintu.
