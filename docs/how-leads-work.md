# How leads work — vozilla.hr

Business logika lead distribution-a u ljudskom jeziku. Spec verzija je
u [`spec/04-features-and-flows.md`](./spec/04-features-and-flows.md).
Ovaj dokument je za agenta i vlasnika da imaju isti mentalni model.

## TL;DR

1. Kupac šalje upit kroz 4-step formu (`/zatrazi-ponudu/`) ili sticky widget
2. Sustav skenira dilere koji prodaju traženu marku, sortira ih po `quality_score`
3. **Najbliži diler uvijek ulazi u prijedlog** (Carwow pravilo)
4. Top 4 sljedećih po score-u se predlažu adminu
5. Admin potvrđuje (ili mijenja) izbor → emailovi idu na 5 dilera
6. Dileri kontaktiraju kupca u 24-72h
7. Diler označava ishod → ažurira score
8. Kupac dobiva feedback emailove (dan 3, 14, 30) — opcionalno odgovara
9. Agregirane ocjene utječu na future score

## quality_score formula

```
score = W_response × (1 / avg_response_time_h)
      + W_conversion × conversion_rate
      + W_rating × avg_rating
      + W_capacity × (1 − current_load_ratio)
```

Težine u `config/lead-distribution.yml` (default: 0.40 / 0.30 / 0.20 / 0.10).
Korisnik može mijenjati težine kroz Payload **LeadDistribution** global
(Sprint 4) bez deploy-a.

## Throttling

- `max_leads_per_dealer_per_day: 20` (default, override po dileru u Payloadu)
- `max_leads_per_dealer_per_week: 80`

Diler na throttle-u se preskače u auto-suggest-u; admin može ručno forsirati.

## Reminder timeline

- 24h: prvi mail dileru ako još nije pregledao lead
- 48h: drugi mail + admin notification
- 72h: marker `expired-no-response`, score down

## Score thresholds

- `warn_below: 0.30` — admin upozorenje pri auto-suggest-u
- `suspend_below: 0.15` — kandidat za auto-suspend (manual approve)

## Edge cases

> TODO Sprint 4 — popunjava se tijekom implementacije. Spec sec 4 ima
> 20 stavki dokumentirano (double-click submit, mreža izgubljena, email
> već postoji, telefon nije HR format, reCAPTCHA score nizak, oglas
> izbrisan, mobile pre-fill kroz session, GDPR brisanje s retention period itd.).

## TODO

- [ ] Worked example pokazujući score izračun s realnim brojevima
- [ ] Ažuriranje nakon Sprinta 4 implementacije
- [ ] Kako se score normalizira (0-1 ili raw)
- [ ] Kako se rješava tie-break za dva dilera s istim score-om
