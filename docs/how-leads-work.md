# How leads work — vozilla.hr

Business logika lead distribution-a u ljudskom jeziku, sinkronizirana s
implementacijom iz Sprinta 4. Spec je u
[`spec/04-features-and-flows.md`](./spec/04-features-and-flows.md);
ovaj dokument je za agenta i vlasnika da imaju isti mentalni model
lifecycle-a od submita do dispatch-a.

## TL;DR

1. Kupac šalje upit kroz 4-step formu (`/zatrazi-ponudu/`) ili sticky widget
2. Sustav pohranjuje lead, šalje potvrdni email, izdaje magic-link tracker
3. Admin otvara `/admin-tools/lead-dispatch/<id>`, vidi auto-suggest 5 dilera
4. **Najbliži diler uvijek ulazi u prijedlog** (Carwow pravilo)
5. Top 4 sljedećih po `quality_score` se predlažu adminu
6. Admin (de)selektira i klikne "Pošalji" → lead_assignments + emailovi
7. Dileri vide u dashboardu (Sprint 5), kontaktiraju kupca u 24-72h
8. Kupac prati status na `/upit/<token>/`, može otkazati (soft delete)
9. Diler označava ishod (Sprint 5) → ažurira score
10. Kupac dobiva feedback emailove dan 3/14/30 (Sprint 6+)

---

## Lifecycle staze

### 1. Submit — `POST /api/leads`

Kupac klikne "Pošalji upit" na 4. koraku wizarda. Server radi:

| #   | Step                                                                                             | File                         |
| --- | ------------------------------------------------------------------------------------------------ | ---------------------------- |
| 1   | Idempotency-Key replay check                                                                     | `lib/leads/idempotency.ts`   |
| 2   | Zod schema validacija (incl. honeypot literal-empty + leasing_type conditional + price_min<=max) | `app/api/leads/route.ts`     |
| 3   | Per-IP rate limit (5/15min) + per-email (3/15min)                                                | `lib/rate-limit/index.ts`    |
| 4   | reCAPTCHA verify (block / review / dev_bypass)                                                   | `lib/recaptcha/verify.ts`    |
| 5   | Disposable-email + E.164 phone normalization                                                     | `lib/utils/validate.ts`      |
| 6   | Generate `VZ-YYYY-MM-DD-XXXX` display id                                                         | `lib/leads/display-id.ts`    |
| 7   | Payload `create({ collection: 'lead_requests', overrideAccess: true })`                          | Payload local API            |
| 8   | Issue magic-link token (purpose=`lead_tracker`, TTL 30d)                                         | `lib/magic-link/index.ts`    |
| 9   | `consent_log` row (oup, optionally marketing) + `audit_log` row (action=`lead.create`)           | `lib/{consent,audit}-log.ts` |
| 10  | Parallel dispatch: `lead-confirmation` to customer + `admin-new-lead-notification` to admin      | `lib/email/dispatch.ts`      |
| 11  | Cache response in `idempotency_keys` (TTL 60s)                                                   | —                            |
| 12  | Return `201 { display_id, tracker_url, flagged_for_review }`                                     | —                            |

reCAPTCHA outcomes:

- `pass` → status `new`
- `review` → status `under_review`, `flagged_for_review: true` u response-u, admin notification flagira "🚩 (review)"
- `block` → 403 prije insert-a
- `dev_bypass` → status `new`, `recaptcha_score: 1.0` (only when SECRET key is unset / XXX)

### 2. Customer tracker — `/upit/<token>/`

Server-side validira token, fetch-a lead + populated assignments (`lib/leads/tracker-data.ts`),
renderira status timeline + dealer cards. Customer akcije:

- **Otkaži upit** → server action `cancelLeadAction` → `cancelLead({ leadId, reason: 'customer_cancelled' })`
  - Anonimizira `customer_name` ("Izbrisano"), `customer_email` (deterministic SHA-256 hash + `@vozilla.invalid`), `customer_phone` ("+385000000000" placeholder satisfies HR-format regex)
  - Zatvori sve `lead_assignments` (status=closed, outcome=other)
  - `revokeTokensFor('lead_request', leadId)` — revokira tracker + draft tokene
  - Audit row sa SHA-256 hash-em prethodnog email-a (audit trail bez PII-ja)
  - Hard delete cron Sprint 5 (30-day retention)
- "Označi zainteresiran" / "Kupio sam vozilo" / "Pošalji feedback dileru" — Sprint 5/6

Lost tracker link → `/provjeri-upit/` forma → `POST /api/upit/resend-tracker`. Generic 200 svaki put (no enumeration), rate-limited 3/24h/email.

### 3. Admin dispatch — `/admin-tools/lead-dispatch/<id>`

Custom Next.js admin route, gated by `requireAdmin()` (Payload session via `payload.auth({ headers })`, redirects to `/admin/login` na miss / inactive / non-privileged role).

Server page:

1. Fetch lead (depth=1 za brand+model populate)
2. Derive customer lat/lng iz county_id (centroid lookup za 6 major cities; Sprint 6 polish: real postcode→lat/lng)
3. `suggestDealersForLead({ lead: { lat, lng, brandId }, radiusKm: 200 })`:
   - Payload find dealers `is_active=true AND throttle_factor>0 AND brands contains brandId`
   - Compute `quality_score` (formula below) + haversine distance
   - Top 5 by score; closest dealer always promoted into list (Carwow rule); secondary sort by distance
4. Hydrate VM s pun dealer info za UI (legal_name, city, scoring breakdown)

Client form (`DispatchForm.tsx`): checkbox per dealer (default checked), shows score breakdown + "Najbliži" badge + "Carwow rule" tag for promoted-by-distance entries.

Submit → server action `dispatchLeadAction` → `dispatchToDealers`:

- Per dealer:
  - Skip if `(lead, dealer)` pair already exists (idempotent re-dispatch)
  - Skip if `dealer.is_active=false` (with per-dealer error in result)
  - Insert `lead_assignments` row (status=sent, sent_at=now, quality_score_at_dispatch snapshot)
  - Increment `dealer.scoring.current_month_leads`
- If at least one created → `lead.status = 'sent'`
- Dispatch `lead-to-dealer` email per created assignment
  - `competitorCount = created.length - 1` (Carwow transparency)
- Audit row `lead.dispatch_to_dealers` s actorAdminId + dealer_ids + counts
- `revalidatePath('/admin-tools/lead-dispatch/<id>')` da se UI osvježi

### 4. Diler — Sprint 5

Dealer dashboard, status mutations (viewed → contacted → closed), reminder cron (24h/48h/72h), customer feedback flow (dan 3/14/30) ostaje za Sprint 5/6.

---

## quality_score formula

`lib/lead-distribution/score.ts`. Spec verzija u
[`spec/04-features-and-flows.md`](./spec/04-features-and-flows.md).

```
score_raw = W_response * (1 / avg_response_time_hours)
          + W_conversion * conversion_rate
          + W_rating * (avg_rating / 5)         # 0-5 normaliziran u 0-1
          + W_capacity * (1 - current_load_ratio)

score_total = score_raw * throttle_factor
```

Defaults (`config/lead-distribution.yml`, override-ano kroz Payload `LeadDistribution` global Sprint 7+):

- `W_response: 0.40` — favorira brze odgovaratelje
- `W_conversion: 0.30`
- `W_rating: 0.20`
- `W_capacity: 0.10`

Fallback vrijednosti za nove dilere (no history) — hardcoded u `score.ts`:

- `avg_response_time_hours = 0` ili null → koristi 24h baseline
- `monthly_lead_cap = 0` ili null → koristi 20

`current_load_ratio = current_month_leads / monthly_lead_cap`, capped na 1.0
(over-capacity dileri imaju capacity component = 0, ne negativan).

### Worked example

Dealer s `avg_response_time=4h, conversion=0.15, rating=4.0, cap=30, used=10, throttle=1.0`:

```
response   = (1/4) * 0.40 = 0.100
conversion = 0.15  * 0.30 = 0.045
rating     = (4/5) * 0.20 = 0.160
capacity   = (1 - 10/30) * 0.10 = 0.067
raw        = 0.372
total      = 0.372 * 1.0 = 0.372
```

Threshold-ovi (admin-side warning, ne hard-block):

- `warn_below: 0.30` — admin sees a flag in dispatch UI
- `suspend_below: 0.15` — kandidat za auto-suspend (manual approve)

### Carwow rule + tie-break

`lib/lead-distribution/rank.ts`:

1. Filter dealers within `radiusKm` (default 200)
2. Compute score per dealer
3. Take top-N by score (default N=5 from `rules.max_dealers_per_lead`)
4. **If `closest_dealer_always_included=true`** (default) and the closest dealer isn't in top-N, drop the lowest top-scorer and insert closest
5. Final sort: closest first (when promoted), else by score desc; distance asc as tie-breaker
6. `reason: 'top_score' | 'closest'` per entry — `closest` only when Carwow rule promoted a non-top-scorer

Warnings vraćeni iz rank-a:

- `no_dealers_provided` / `no_dealers_in_radius_<km>km`
- `below_min_<N>_only_<count>_in_radius` — pao ispod `min_dealers_per_lead`
- `fewer_than_max_<N>_only_<count>_in_radius` — između min i max

---

## Throttling

`config/lead-distribution.yml > throttling`:

- `max_leads_per_dealer_per_day: 20` (default)
- `max_leads_per_dealer_per_week: 80`

Sprint 4: `throttle_factor` per dealer (1.0 = normal, 0.5 = throttled, 0 = suspended) je već primijenjen u `qualityScore` kao multiplier. Daily/weekly enforcement (cron koji decay-a current_month_leads i markira throttle_factor) ide u Sprint 5.

---

## Reminder timeline (Sprint 5 cron)

`config/lead-distribution.yml > reminders`:

- `first_reminder_hours: 24` — prvi mail dileru ako još nije pregledao lead
- `second_reminder_hours: 48` — drugi mail + admin notification
- `expire_no_response_hours: 72` — marker `expired-no-response`, score down

LeadAssignments collection već ima `reminders.first_reminder_sent_at`, `second_reminder_sent_at`, `expired_no_response` polja iz Sprinta 1 — Sprint 5 vodi cron koji čita i piše.

---

## GDPR + privola pipeline

- **GDPR forma** `/gdpr-zahtjev/` → `POST /api/gdpr-request` → `gdpr_requests` row + `gdpr-request-received` email + audit row
- **Soft delete** kroz `cancelLead({ leadId, reason: 'customer_cancelled' | 'gdpr_erasure' })`
- **Audit log** za sve admin akcije koje mijenjaju stanje
- **consent_log** row pri svakom lead submit-u (oup uvijek, marketing ako check-iran)
- **Hard delete** cron — Sprint 5 (30-day retention; `lib/leads/cancel-lead.ts` već anonimizira sve PII pa cron može sigurno DELETE)

---

## Idempotency contract

Klijenti koji žele replay-safe behavior šalju `Idempotency-Key` header (UUID generiran na strani klijenta). Server:

1. Lookup `idempotency_keys` row za (key, endpoint)
2. Ako pronađen i nije expired (TTL 60s) → vrati cached `response_status` + `response_body` + `X-Idempotent-Replay: 1` header
3. Inače izvrši normalno; cache rezultat na kraju

Endpointi koji podržavaju idempotency: `POST /api/leads`, `POST /api/gdpr-request`. Sprint 5 dodaje `POST /api/dileri/...` mutations.

Wizard (`components/forms/LeadWizard/index.tsx`) generira UUID jednom per mount — double-click submit-a nikad ne kreira drugi lead.

---

## Edge cases adresirani u Sprintu 4

| #   | Scenarij                                 | Handler                                                               |
| --- | ---------------------------------------- | --------------------------------------------------------------------- |
| 1   | Double-click submit                      | Idempotency-Key UUID per wizard mount                                 |
| 2   | Mreža izgubljena tijekom forme           | localStorage draft autosave + restore on remount                      |
| 3   | beforeunload tijekom forme               | Browser warning kad ima meaningful content                            |
| 4   | reCAPTCHA score < 0.3                    | 403 + `captcha_failed` reason                                         |
| 5   | reCAPTCHA score 0.3–0.5                  | Pass + `flagged_for_review`, admin notification flagira               |
| 6   | Disposable email                         | 422 + `email_invalid: disposable`                                     |
| 7   | Telefon nije HR format                   | 422 + `phone_invalid` (server-side normalization fail)                |
| 8   | Postcode mismatch s county               | wizard auto-fill iz `/api/lookup/postcode/<code>`; user može override |
| 9   | Honeypot triggered                       | 422 (bot signal)                                                      |
| 10  | Per-IP rate limit                        | 429 + `Retry-After` header                                            |
| 11  | Per-email rate limit                     | 429 + `scope: email`                                                  |
| 12  | Customer cancels via tracker             | Soft delete + token revoke + dealer assignments closed                |
| 13  | Customer loses tracker email             | `/provjeri-upit/` resend, generic 200 (no enumeration), 3/24h/email   |
| 14  | Re-dispatch same lead to same dealer     | Idempotent skip (`assignments_skipped` counter)                       |
| 15  | Inactive dealer in selection             | Skip with per-dealer error                                            |
| 16  | Lead status='closed' on dispatch attempt | Returns `lead_closed` error                                           |

Spec section 4 ima dodatne edge cases za Sprint 5+ (oglas izbrisan/prodan, Sell-My-Car flow, dealer suspended mid-dispatch).

---

## Sprint 4 → Sprint 5 handoff

Dospjeli artefakti:

- ✅ End-to-end customer lead flow (wizard → API → email → tracker)
- ✅ Magic-link tracker s soft-delete cancel
- ✅ Admin auto-suggest + dispatch UI (idempotent)
- ✅ GDPR request form
- ✅ Sticky widget (handoff to wizard via sessionStorage prefill)
- ✅ Audit + consent + email logging na svim mutation putanjama
- ✅ E2e test pokriva golden path

Sprint 5 mora donijeti:

- Dealer login (`/dileri/login/`)
- Dealer dashboard + lead detail + status mutations (viewed/contacted/closed)
- Cron jobs (Vercel Cron):
  - Dealer reminder 24h/48h/72h
  - Lead hard-delete (30-day retention)
  - Monthly counter reset (`dealer.scoring.current_month_leads = 0`)
  - Idempotency_keys + rate_limit_buckets cleanup (expired rows)
  - Magic-link tokens cleanup (expired)
- Customer-side dealer interest marking (zainteresiran / nezainteresiran / kupio sam)
- "Konkurencija" sekcija u dealer dashboardu (rank-among-N badge)
