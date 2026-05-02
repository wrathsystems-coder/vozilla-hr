# Architecture — vozilla.hr

> Skeleton. Each section expands as components ship.

## Stack overview

- **Next.js 15** (App Router, TS strict) hosts both the public site and the Payload CMS admin
- **PostgreSQL** via Supabase (production) / Docker (local)
- **Drizzle ORM** for raw operational tables; **Payload CMS 3** owns content collections
- **Tailwind 4** for styles
- **React Email + Resend** for transactional mail
- **Vercel** (Frankfurt FRA1) for hosting; **Cloudflare** in front

See `docs/spec/05-data-and-systems.md` for full stack details.

## Repo layout

See `docs/spec/07-delivery-and-deployment.md` ("Struktura repozitorija").

Top-level: `apps/web/` is the Next.js + Payload monolith. Shared resources
(`config/`, `seeds/`, `scripts/`, `docs/`) live alongside.

## Data ownership

- **Drizzle (raw)** — operational tables: `consent_log`, `audit_log`,
  `magic_link_tokens`, `rate_limit_buckets`, `newsletter_subscribers`,
  `quiz_results`, `email_log`, `counties`.
- **Payload (managed)** — content collections: `Brands`, `Models`,
  `ModelVersions`, `BodyTypes`, `VehicleAttributes`, `UsedCarListings`,
  `Dealers`, `DealerUsers`, `Reviews`, `Articles`, `Pages`,
  `ComparisonPairs`, `GdprRequests`, `AdminUsers`, `LeadRequests`,
  `LeadAssignments`.

Both share the same Postgres database; tables coexist via separate
naming conventions and Payload's own metadata tables.

## Auth model

- Customers — no accounts in MVP. Magic link tracker only (`/upit/[token]/`).
- Dealers — Payload-backed `DealerUsers` collection, Argon2id hash.
- Admins — Payload-backed `AdminUsers` (slug `admins` for Sprint 0),
  Argon2id + 2FA in production.

## Lead flow (high level)

See [`how-leads-work.md`](./how-leads-work.md) for the business logic
and [`spec/04-features-and-flows.md`](./spec/04-features-and-flows.md)
for the full spec.

## TODO

- [ ] Diagram: request flow (Cloudflare → Vercel → Postgres)
- [ ] Diagram: lead distribution sequence
- [ ] Decision log (ORM, CMS, hosting region rationale)
