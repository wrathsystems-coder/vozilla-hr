"use client";

import { useMemo, useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { FieldError, FieldLabel } from "@/components/forms/LeadWizard/controls";
import { executeRecaptcha } from "@/components/forms/LeadWizard/recaptcha";

const REQUEST_TYPE_OPTIONS = [
  { value: "access", label: "Pristup mojim podacima (čl. 15)" },
  { value: "erasure", label: "Brisanje / zaborav (čl. 17)" },
  { value: "rectification", label: "Ispravak (čl. 16)" },
  { value: "portability", label: "Prenosivost podataka (čl. 20)" },
  { value: "objection", label: "Prigovor na obradu (čl. 21)" },
] as const;

type Errors = Partial<{
  customer_name: string;
  customer_email: string;
  customer_oib: string;
  request_type: string;
  lead_request_display_id: string;
  description: string;
  gdpr_consent: string;
}>;

const DISPLAY_ID_RE = /^VZ-\d{4}-\d{2}-\d{2}-[A-Z2-9]{4}$/;

export default function GdprRequestForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oib, setOib] = useState("");
  const [requestType, setRequestType] = useState<
    (typeof REQUEST_TYPE_OPTIONS)[number]["value"] | ""
  >("");
  const [leadDisplayId, setLeadDisplayId] = useState("");
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(false);
  const [hp, setHp] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const idempotencyKey = useMemo(
    () => (typeof crypto !== "undefined" ? crypto.randomUUID() : `gdpr-${Date.now()}`),
    [],
  );

  function validate(): Errors {
    const next: Errors = {};
    if (name.trim().length < 2) next.customer_name = "Ime i prezime, najmanje 2 znaka.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.customer_email = "Neispravan email.";
    if (oib && !/^\d{11}$/.test(oib)) next.customer_oib = "OIB mora imati 11 znamenki.";
    if (!requestType) next.request_type = "Odaberi tip zahtjeva.";
    if (leadDisplayId && !DISPLAY_ID_RE.test(leadDisplayId.trim())) {
      next.lead_request_display_id = "Format mora biti VZ-YYYY-MM-DD-XXXX.";
    }
    if (!consent) next.gdpr_consent = "Privola za obradu zahtjeva je obavezna.";
    return next;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitMessage(null);
    setSubmitError(null);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    startTransition(async () => {
      try {
        const recaptchaToken = await executeRecaptcha("gdpr_request");
        const res = await fetch("/api/gdpr-request", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "idempotency-key": idempotencyKey,
          },
          body: JSON.stringify({
            customer_name: name.trim(),
            customer_email: email.trim(),
            customer_oib: oib.trim() || undefined,
            request_type: requestType,
            lead_request_display_id: leadDisplayId.trim() || undefined,
            description: description.trim() || undefined,
            gdpr_consent: true,
            recaptcha_token: recaptchaToken,
            recaptcha_action: "gdpr_request",
            _hp_email: hp,
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { display_id: string };
          setSubmitMessage(
            `Zaprimili smo tvoj zahtjev pod brojem ${data.display_id}. Riješit ćemo ga unutar 30 dana.`,
          );
          return;
        }
        if (res.status === 429) {
          setSubmitError("Previše pokušaja. Pokušaj ponovno za nekoliko sati.");
          return;
        }
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        setSubmitError(errBody.error ?? `http_${res.status}`);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "submit_failed");
      }
    });
  }

  if (submitMessage) {
    return (
      <p
        role="status"
        className="text-text border-state-success/30 bg-state-success/5 rounded-md border p-4 text-sm"
      >
        {submitMessage}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel id="gdpr_name" required>
            Ime i prezime
          </FieldLabel>
          <Input
            id="gdpr_name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-describedby={errors.customer_name ? "gdpr_name_error" : undefined}
            aria-invalid={errors.customer_name ? true : undefined}
          />
          <FieldError id="gdpr_name_error" message={errors.customer_name} />
        </div>
        <div>
          <FieldLabel id="gdpr_email" required>
            Email
          </FieldLabel>
          <Input
            id="gdpr_email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-describedby={errors.customer_email ? "gdpr_email_error" : undefined}
            aria-invalid={errors.customer_email ? true : undefined}
          />
          <FieldError id="gdpr_email_error" message={errors.customer_email} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel id="gdpr_oib">OIB (opcijski)</FieldLabel>
          <Input
            id="gdpr_oib"
            type="text"
            inputMode="numeric"
            maxLength={11}
            value={oib}
            onChange={(e) => setOib(e.target.value.replace(/\D/g, "").slice(0, 11))}
            aria-describedby={errors.customer_oib ? "gdpr_oib_error" : undefined}
            aria-invalid={errors.customer_oib ? true : undefined}
          />
          <FieldError id="gdpr_oib_error" message={errors.customer_oib} />
        </div>
        <div>
          <FieldLabel id="gdpr_lead_id">Broj upita (opcijski)</FieldLabel>
          <Input
            id="gdpr_lead_id"
            type="text"
            placeholder="VZ-YYYY-MM-DD-XXXX"
            value={leadDisplayId}
            onChange={(e) => setLeadDisplayId(e.target.value.toUpperCase())}
            aria-describedby={errors.lead_request_display_id ? "gdpr_lead_id_error" : undefined}
            aria-invalid={errors.lead_request_display_id ? true : undefined}
          />
          <FieldError id="gdpr_lead_id_error" message={errors.lead_request_display_id} />
        </div>
      </div>

      <div>
        <FieldLabel id="gdpr_request_type" required>
          Tip zahtjeva
        </FieldLabel>
        <Select
          id="gdpr_request_type"
          value={requestType}
          onChange={(e) =>
            setRequestType(e.target.value as (typeof REQUEST_TYPE_OPTIONS)[number]["value"] | "")
          }
          aria-describedby={errors.request_type ? "gdpr_request_type_error" : undefined}
          aria-invalid={errors.request_type ? true : undefined}
        >
          <option value="">— odaberi —</option>
          {REQUEST_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <FieldError id="gdpr_request_type_error" message={errors.request_type} />
      </div>

      <div>
        <FieldLabel id="gdpr_description">Opis zahtjeva (opcijski)</FieldLabel>
        <Textarea
          id="gdpr_description"
          rows={4}
          maxLength={1000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          aria-describedby={errors.gdpr_consent ? "gdpr_consent_error" : undefined}
          aria-invalid={errors.gdpr_consent ? true : undefined}
          className="mt-1"
        />
        <span>
          Slažem se s obradom mojih osobnih podataka u svrhu obrade ovog GDPR zahtjeva.{" "}
          <span aria-hidden="true" className="text-state-error">
            *
          </span>
        </span>
      </label>
      <FieldError id="gdpr_consent_error" message={errors.gdpr_consent} />

      {/* Honeypot */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px" }}>
        <label>
          Email (ne popunjavajte)
          <input
            type="text"
            name="_hp_email"
            tabIndex={-1}
            autoComplete="off"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
          />
        </label>
      </div>

      {submitError ? (
        <p
          role="alert"
          className="text-state-error border-state-error/30 bg-state-error/5 rounded-md border p-3 text-sm"
        >
          Slanje nije uspjelo: {submitError}.
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Šaljem…" : "Pošalji zahtjev"}
      </Button>
    </form>
  );
}
