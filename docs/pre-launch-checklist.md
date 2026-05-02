# Pre-launch checklist — vozilla.hr

> Final form in Sprint 7. This is a skeleton with section markers. Each
> item gets verified during Sprint 7 polish.

## 1. Brand and content

- [ ] Logo / favicon / OG images replaced (no PLACEHOLDER files)
- [ ] Brand colors finalized (`config/theme.ts` `XXX_BRAND_*`)
- [ ] All XXX\_ values filled (`pnpm placeholders:check --strict` passes)
- [ ] Marketing copy filled (Payload Settings + MarketingCopy globals)
- [ ] Legal pages have final text (lawyer-supplied, in Payload Pages)
- [ ] FAQ filled (~20 questions)
- [ ] About / Contact / How-it-works pages filled
- [ ] Email template texts filled (Payload EmailSettings)
- [ ] Demo data cleaned up (`pnpm seed:cleanup-demo`)

## 2. Configuration

- [ ] Production env vars on Vercel
- [ ] reCAPTCHA production keys
- [ ] Resend domain verified (SPF / DKIM / DMARC)
- [ ] Cookiebot production ID
- [ ] Supabase production project (Pro plan, EU region, DPA signed)
- [ ] Cloudflare proxy + SSL strict
- [ ] HSTS active and preload submitted
- [ ] CSP final policy tested

## 3. Legal

- [ ] Cookies blocked before consent (test in fresh incognito)
- [ ] Cookie banner logs consent with timestamp / IP / UA
- [ ] GDPR request form works end-to-end
- [ ] Consent NOT pre-checked anywhere
- [ ] OUP / PP / PK accessible BEFORE consent (no JS / cookie required)
- [ ] PDF download for legal pages works
- [ ] DPO email in `config/company.yml`
- [ ] Newsletter feature flag `false` (or `true` after legal review)
- [ ] HANFA disclaimer on leasing calculator
- [ ] DSA "kako provjeravamo recenzije" page published

## 4. Technical

- [ ] `pnpm build` passes (placeholder check strict mode)
- [ ] `pnpm test` passes
- [ ] `pnpm test:e2e` passes
- [ ] Lighthouse production: Perf ≥ 90, A11y ≥ 90, BP ≥ 90, SEO ≥ 95
- [ ] Core Web Vitals green
- [ ] axe-core: zero serious / critical violations
- [ ] sitemap.xml + robots.txt valid
- [ ] Schema.org valid on every page type (Rich Results Test)
- [ ] OG / Twitter Card valid (debugger tools)
- [ ] 404 + 500 pages helpful and on-brand
- [ ] Sentry catches a synthetic error and notifies

## 5. Security

- [ ] reCAPTCHA + honeypot + rate limit on every public form
- [ ] Zod validation on every API endpoint
- [ ] CSRF tokens on every POST
- [ ] Argon2id password hashing
- [ ] Admin 2FA enforced
- [ ] Magic link tokens secure (UUID v4 + entropy + short TTL)
- [ ] Audit log records every admin state change
- [ ] Backup tested (restore dry run completed)

## 6. Email

- [ ] SPF / DKIM / DMARC verified in Cloudflare DNS
- [ ] Test email lands in Inbox at Gmail / Outlook / Yahoo (not Spam)
- [ ] Unsubscribe link works (newsletter, when active)
- [ ] Reply-to address works
- [ ] Lead confirmation looks good on mobile + desktop

## 7. SEO

- [ ] Google Search Console verified
- [ ] Sitemap submitted
- [ ] hreflang="hr" on all pages
- [ ] Canonical URLs correct
- [ ] Meta title / description on every page (no template placeholders)
- [ ] Indexing allowed (`robots.txt` and meta tags) — `noindex` removed at go-live

## 8. Operational

- [ ] Strong admin password + 2FA
- [ ] Backup procedure documented and tested
- [ ] Sentry alerts configured (errors, performance regressions)
- [ ] On-call contacts documented
- [ ] First-month roadmap committed
- [ ] Monitoring dashboard URL bookmarked

## Go-live

- [ ] Remove `noindex` from `robots.txt`
- [ ] Submit sitemap to Google Search Console
- [ ] Open for traffic
- [ ] Monitor error rate for first 24h
- [ ] Submit launch announcement
