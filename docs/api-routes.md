# API routes — vozilla.hr

> Auto-generated from `app/**/route.ts`. Run `pnpm generate:docs` to refresh.

Total endpoints: 17.

## `/api/[...slug]`

| Path | Methods | File | Summary |
|---|---|---|---|
| `/api/[...slug]` | — | `app/(payload)/api/[...slug]/route.ts` | — |

## `/api/cron`

| Path | Methods | File | Summary |
|---|---|---|---|
| `/api/cron/cleanup-expired` | GET | `app/api/cron/cleanup-expired/route.ts` | — |
| `/api/cron/customer-feedback` | GET | `app/api/cron/customer-feedback/route.ts` | Daily cron. Each lead receives at most one email per day-3/14/30 |
| `/api/cron/dealer-reminders` | GET | `app/api/cron/dealer-reminders/route.ts` | Vercel Cron: hits this hourly (see vercel.json). Idempotent — fires at |
| `/api/cron/gdpr-hard-delete` | GET | `app/api/cron/gdpr-hard-delete/route.ts` | — |
| `/api/cron/monthly-counter-reset` | GET | `app/api/cron/monthly-counter-reset/route.ts` | — |

## `/api/gdpr-request`

| Path | Methods | File | Summary |
|---|---|---|---|
| `/api/gdpr-request` | POST | `app/api/gdpr-request/route.ts` | — |

## `/api/graphql`

| Path | Methods | File | Summary |
|---|---|---|---|
| `/api/graphql` | — | `app/(payload)/api/graphql/route.ts` | — |

## `/api/graphql-playground`

| Path | Methods | File | Summary |
|---|---|---|---|
| `/api/graphql-playground` | — | `app/(payload)/api/graphql-playground/route.ts` | — |

## `/api/health`

| Path | Methods | File | Summary |
|---|---|---|---|
| `/api/health` | GET | `app/api/health/route.ts` | — |

## `/api/leads`

| Path | Methods | File | Summary |
|---|---|---|---|
| `/api/leads` | POST | `app/api/leads/route.ts` | 30 days |

## `/api/lookup`

| Path | Methods | File | Summary |
|---|---|---|---|
| `/api/lookup/postcode/[code]` | GET | `app/api/lookup/postcode/[code]/route.ts` | Public lookup used by the lead wizard step 3 to auto-fill the county |

## `/api/newsletter`

| Path | Methods | File | Summary |
|---|---|---|---|
| `/api/newsletter/subscribe` | POST | `app/api/newsletter/subscribe/route.ts` | Newsletter subscribe. Gated on feature-flags.yml `newsletter`. When the |
| `/api/newsletter/unsubscribe` | GET, POST | `app/api/newsletter/unsubscribe/route.ts` | One-click unsubscribe via HMAC-signed URL from the newsletter footer. |

## `/api/quiz`

| Path | Methods | File | Summary |
|---|---|---|---|
| `/api/quiz/save` | POST | `app/api/quiz/save/route.ts` | — |

## `/api/search`

| Path | Methods | File | Summary |
|---|---|---|---|
| `/api/search` | GET | `app/api/search/route.ts` | — |

## `/api/upit`

| Path | Methods | File | Summary |
|---|---|---|---|
| `/api/upit/resend-tracker` | POST | `app/api/upit/resend-tracker/route.ts` | Generic 200 response on every code path that doesn't trip rate-limit — |

