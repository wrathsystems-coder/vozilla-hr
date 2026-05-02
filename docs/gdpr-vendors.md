# GDPR vendor list — vozilla.hr

Every vendor that processes personal data must have a signed DPA
(Data Processing Agreement) before production. CLAUDE.md rule #5: GDPR
by default, not afterthought.

## Status legend

- ⬜ — DPA not signed yet
- ✅ — DPA signed and on file
- ⚠️ — DPA pending review
- ➖ — vendor does not process personal data

## Active vendors

| Vendor           | Purpose             | DPA           | Region                | Notes                     |
| ---------------- | ------------------- | ------------- | --------------------- | ------------------------- |
| Vercel           | Hosting             | ⬜            | Frankfurt FRA1 (EU)   | Pro plan                  |
| Supabase         | Database            | ⬜            | EU region             | Pro plan, daily backups   |
| Cloudflare       | CDN/proxy           | ⬜            | Global edge           | EU traffic stays in EU    |
| Resend           | Transactional email | ⬜            | EU region             | Domain `vozilla.hr`       |
| Cookiebot        | Consent management  | ⬜            | EU                    | 4 categories, HR language |
| Google reCAPTCHA | Bot protection      | ⬜            | US (consent required) | v3 score-based            |
| Google Maps      | Dealer locations    | ⬜            | US                    | Static maps in MVP        |
| Sentry           | Error tracking      | ⬜ (Sprint 7) | EU region             | self-hosted optional      |

## Pending / planned

| Vendor            | Purpose           | Status                    |
| ----------------- | ----------------- | ------------------------- |
| Twilio / Infobip  | SMS notifications | OFF in MVP (feature flag) |
| WhatsApp Business | Notifications     | OFF in MVP (feature flag) |
| Stripe            | Dealer billing    | Phase 2                   |
| PostHog           | Product analytics | OFF in MVP (feature flag) |
| GA4               | Web analytics     | OFF in MVP (feature flag) |

## Owner action

Before production go-live:

- Sign DPA with each ⬜ vendor
- Update privacy notice (`/politika-privatnosti/`) listing all vendors
- Update cookie banner categories (Cookiebot dashboard) to match
- Document each in `docs/spec/02-legal-and-compliance.md` if process changes

## TODO

- [ ] Sign DPAs with all active vendors
- [ ] Privacy notice draft listing every vendor + purpose + region
- [ ] Annual DPA review reminder (post-launch routine)
