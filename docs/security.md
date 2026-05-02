# Security — vozilla.hr

> Skeleton. Each section expands as systems ship.

## Threat model

In scope:

- Lead form abuse (spam, fake submissions)
- Dealer account takeover
- Admin account takeover
- GDPR data leakage / unauthorized access
- Magic link token forgery / replay
- Rate-limit bypass

Out of scope (MVP):

- L7 DDoS at infra level (Cloudflare handles)
- Physical security
- Insider threats beyond audit log

## Controls

### Network / transport

- HTTPS everywhere (Cloudflare strict, HSTS preload)
- CSP defined in `next.config.ts` — minimal in Sprint 0, expanded in Sprint 7
- Security headers: X-Frame-Options DENY, X-Content-Type-Options nosniff,
  Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy
  (camera/mic/geolocation off)

### Application

- CSRF tokens on POST forms (Next.js 15 built-in)
- reCAPTCHA v3 + honeypot + rate limit on every public form
- Zod validation on every API endpoint input
- Argon2id password hashing (Payload default)
- Admin 2FA in production

### Tokens / sessions

- Magic link tokens: UUID v4 + entropy, single-purpose, short TTL
  (defaults defined in Payload Settings, Sprint 4)
- Session cookies: httpOnly, secure, SameSite=Lax (Payload default)

### Data

- Audit log entry for every admin state change
- Soft delete + retention period (no hard delete)
- Consent log: timestamp, IP, user-agent, form
- GDPR right-to-erasure: end-to-end implementation, not just SQL DELETE

## Incident playbook

> TODO Sprint 7 — define escalation, communication, and forensics steps.

## Vulnerability disclosure

> TODO: publish `security.txt` and disclosure policy before launch.

## TODO

- [ ] Final CSP policy (Sprint 7)
- [ ] Rate limit thresholds per endpoint (Sprint 4)
- [ ] On-call rotation document
- [ ] Annual penetration test plan (post-launch)
