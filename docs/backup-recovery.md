# Backup and recovery — vozilla.hr

> Skeleton. Full procedure documented and dry-run-tested before launch (Sprint 7).

## Backup scope

- **Postgres database** — Supabase daily snapshots (Pro plan retention)
- **Payload media uploads** — Supabase Storage / S3 versioning (Sprint 1+)
- **Code** — GitHub
- **Env vars** — Vercel + 1Password / Bitwarden vault (owner)
- **DNS records** — Cloudflare export (manual, before any DNS change)

## Backup cadence

- **Automated**: daily via Supabase
- **Manual**: pre-release snapshot before each major sprint deploy

## Retention

- Daily: 30 days (Supabase Pro)
- Pre-release: kept until next pre-release snapshot succeeds

## Recovery test

- **Dry run quarterly minimum**
- **Full restore documented** before launch (Sprint 7)
- **Rollback tested** as part of pre-launch checklist

## Restore procedure

> TODO Sprint 7 — step-by-step from Supabase snapshot to live.

Outline:

1. Spin up new Supabase project from snapshot
2. Update `DATABASE_URL` on Vercel preview deployment
3. Smoke test (auth, lead submission, admin flows)
4. Cut over: change production `DATABASE_URL` and redeploy
5. Verify by submitting test lead

## TODO

- [ ] First dry-run report
- [ ] Document RTO and RPO targets
- [ ] Document who can authorize a restore (chain of authority)
