"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { FieldError, FieldLabel } from "@/components/forms/LeadWizard/controls";

const DISPLAY_ID_RE = /^VZ-\d{4}-\d{2}-\d{2}-[A-Z2-9]{4}$/;

export default function ResendForm() {
  const [email, setEmail] = useState("");
  const [displayId, setDisplayId] = useState("");
  const [errors, setErrors] = useState<{ email?: string; display_id?: string }>({});
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitMessage(null);

    const nextErrors: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Neispravan email.";
    if (!DISPLAY_ID_RE.test(displayId.trim()))
      nextErrors.display_id = "Format mora biti VZ-YYYY-MM-DD-XXXX.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/upit/resend-tracker", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: email.trim(), display_id: displayId.trim() }),
        });
        if (res.status === 429) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setSubmitError("Previše pokušaja. Pokušaj ponovno za nekoliko sati.");
          void body;
          return;
        }
        if (!res.ok) {
          setSubmitError("Slanje nije uspjelo. Pokušaj ponovno.");
          return;
        }
        const data = (await res.json()) as { message: string };
        setSubmitMessage(data.message);
      } catch {
        setSubmitError("Greška mreže. Pokušaj ponovno.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div>
        <FieldLabel id="resend_email" required>
          Email
        </FieldLabel>
        <Input
          id="resend_email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-describedby={errors.email ? "resend_email_error" : undefined}
          aria-invalid={errors.email ? true : undefined}
        />
        <FieldError id="resend_email_error" message={errors.email} />
      </div>

      <div>
        <FieldLabel id="resend_display_id" required>
          Broj upita
        </FieldLabel>
        <Input
          id="resend_display_id"
          type="text"
          placeholder="VZ-YYYY-MM-DD-XXXX"
          value={displayId}
          onChange={(e) => setDisplayId(e.target.value.toUpperCase())}
          aria-describedby={errors.display_id ? "resend_display_id_error" : undefined}
          aria-invalid={errors.display_id ? true : undefined}
        />
        <FieldError id="resend_display_id_error" message={errors.display_id} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Šaljem…" : "Pošalji novi link"}
      </Button>

      {submitMessage ? (
        <p role="status" className="text-text rounded-md bg-emerald-50 p-3 text-sm">
          {submitMessage}
        </p>
      ) : null}
      {submitError ? (
        <p
          role="alert"
          className="text-state-error border-state-error/30 bg-state-error/5 rounded-md border p-3 text-sm"
        >
          {submitError}
        </p>
      ) : null}
    </form>
  );
}
