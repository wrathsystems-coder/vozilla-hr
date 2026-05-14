"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { executeRecaptcha } from "@/components/forms/LeadWizard/recaptcha";

// Client form used by both Footer and NewsletterCta. Submits to
// /api/newsletter/subscribe. When `feature_flag` is false the parent
// renders the disabled placeholder copy instead — this component is
// only mounted when the flag is on, so we don't gate again here.

type Variant = "footer" | "hero";

type Props = {
  /** Where the form lives — informs the source_form param + visual layout. */
  variant: Variant;
  /** Required by API; passed through verbatim to `source_form`. */
  sourceForm: string;
};

type State = "idle" | "submitting" | "success" | "error";

export default function NewsletterForm({ variant, sourceForm }: Props) {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "submitting") return;
    setState("submitting");
    setErrorMsg(null);
    try {
      const recaptchaToken = await executeRecaptcha("newsletter_subscribe");
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          source_form: sourceForm,
          recaptcha_token: recaptchaToken,
          recaptcha_action: "newsletter_subscribe",
          _hp_email: hp,
        }),
      });
      if (res.ok) {
        setState("success");
        setEmail("");
        return;
      }
      if (res.status === 503) {
        setErrorMsg("Newsletter trenutno nije aktivan.");
      } else if (res.status === 429) {
        setErrorMsg("Previše pokušaja. Pokušaj ponovno za sat vremena.");
      } else if (res.status === 422) {
        setErrorMsg("Provjeri email adresu.");
      } else {
        setErrorMsg("Nešto je pošlo po krivu. Pokušaj ponovno.");
      }
      setState("error");
    } catch {
      setErrorMsg("Mreža nije dostupna. Pokušaj ponovno.");
      setState("error");
    }
  }

  const isFooter = variant === "footer";
  const inputId = isFooter ? "newsletter-email-footer" : "newsletter-email-hero";

  if (state === "success") {
    return (
      <p
        className={`text-sm ${isFooter ? "text-text-muted" : "text-text"}`}
        role="status"
        aria-live="polite"
      >
        Provjeri email — poslali smo ti link za potvrdu pretplate.
      </p>
    );
  }

  return (
    <form
      aria-label="Pretplata na newsletter"
      className={isFooter ? "mt-6" : "mt-6"}
      onSubmit={onSubmit}
    >
      <label
        htmlFor={inputId}
        className={isFooter ? "text-text-muted block text-xs font-medium" : "sr-only"}
      >
        {isFooter ? "Newsletter" : "Email adresa"}
      </label>

      {/* Honeypot — visually hidden, off-tab, off-autocomplete. */}
      <input
        type="text"
        name="_hp_email"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="absolute h-0 w-0 overflow-hidden opacity-0"
      />

      <div
        className={
          isFooter ? "mt-2 flex gap-2" : "flex flex-col gap-2 sm:flex-row sm:justify-center"
        }
      >
        <Input
          id={inputId}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vaš@email.hr"
          className={isFooter ? "flex-1" : "sm:max-w-xs"}
          disabled={state === "submitting"}
        />
        <Button
          type="submit"
          variant={isFooter ? "secondary" : "primary"}
          size="md"
          disabled={state === "submitting"}
        >
          {state === "submitting" ? "Slanje…" : "Pretplati se"}
        </Button>
      </div>

      {errorMsg ? (
        <p className="text-text-muted mt-2 text-xs" role="alert">
          {errorMsg}
        </p>
      ) : null}
    </form>
  );
}
