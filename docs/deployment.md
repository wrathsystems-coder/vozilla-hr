# Deployment — vozilla.hr

> Skeleton. Expand once Vercel project is created and first deploy succeeds.

## Production targets

- Hosting: Vercel (Frankfurt FRA1, Pro plan)
- Database: Supabase (EU region, Pro plan) with daily backups
- DNS / CDN: Cloudflare (proxy enabled, SSL strict, HSTS)
- Email: Resend (custom domain `vozilla.hr` with SPF/DKIM/DMARC)
- Error tracking: Sentry (Sprint 7)
- Consent management: Cookiebot

## First-time setup (owner action — agent cannot perform)

1. **Vercel project**: import `wrathsystems-coder/vozilla-hr`, region FRA1,
   framework Next.js. Set every var from `.env.example` to its production value.
2. **Supabase project**: create EU-region project, Pro plan. Copy the
   pooler connection string into `DATABASE_URL` on Vercel. Sign DPA.
3. **Cloudflare zone**: add `vozilla.hr`, point DNS to Vercel, enable
   proxy + SSL Strict + HSTS. Add basic WAF rules.
4. **Resend domain**: verify `vozilla.hr`. Add SPF / DKIM / DMARC TXT
   records to Cloudflare DNS. Test mail to Gmail / Outlook / Yahoo —
   must land in Inbox, not Spam.
5. **reCAPTCHA**: register `vozilla.hr` for v3 site key + secret key.
6. **Cookiebot**: register site, configure 4 categories
   (Necessary / Functional / Statistics / Marketing), language `hr`.
7. **Sentry** (Sprint 7): create project, copy DSN.

## First production migration

Once env vars are set on Vercel and Supabase is reachable:

```bash
# locally, with .env.production pointing at Supabase
pnpm db:migrate
pnpm payload migrate
```

Then visit `https://vozilla.hr/admin/` and create the super-admin
account with a strong password. Enable 2FA immediately.

## Recurring deploys

- Push to `main` → Vercel deploys to production
- Push to feature branch → Vercel deploys preview at `vozilla-hr-{branch}.vercel.app`
- No GitHub Actions in MVP — Vercel built-in CI is enough

## Pre-launch

See [`pre-launch-checklist.md`](./pre-launch-checklist.md).

## Rollback

> TODO: document Vercel "promote previous deployment" + DB migration
> rollback strategy (Drizzle does not auto-generate down migrations —
> we hand-write them in `lib/db/migrations/down/` if needed).

## TODO

- [ ] Document monitoring / alerting setup (Sprint 7)
- [ ] Document backup/restore procedure (cross-link `backup-recovery.md`)
- [ ] Document on-call rotation
