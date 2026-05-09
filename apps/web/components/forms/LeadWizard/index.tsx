"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import type { Brand, Model } from "@/payload-types";
import Step1Vehicle from "./Step1Vehicle";
import Step2Budget from "./Step2Budget";
import Step3Contact from "./Step3Contact";
import Step4Consent from "./Step4Consent";
import { executeRecaptcha } from "./recaptcha";
import { draftToApiBody, validateStep, type LeadDraft, type StepIndex } from "./types";

const DRAFT_KEY = "vozilla:lead-draft-v1";
const STEP_LABELS = ["Što tražiš?", "Tvoji uvjeti", "Tvoji podaci", "Pregled i privole"];

type LeadWizardProps = {
  brands: Brand[];
  models: Model[];
  counties: { id: number; name: string }[];
  initialDraft: LeadDraft;
};

function readDraftFromStorage(fallback: LeadDraft): LeadDraft {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(DRAFT_KEY);
  if (!stored) return fallback;
  try {
    const parsed = JSON.parse(stored) as Partial<LeadDraft>;
    return { ...fallback, ...parsed, _hp_email: "" };
  } catch {
    return fallback;
  }
}

export default function LeadWizard({ brands, models, counties, initialDraft }: LeadWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<StepIndex>(0);
  const [draft, setDraft] = useState<LeadDraft>(initialDraft);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadDraft, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);

  // One UUID per browser-session of this wizard. Resubmits within 60s with
  // the same key get the cached response back from the server (idempotency).
  const idempotencyKey = useMemo(
    () => (typeof crypto !== "undefined" ? crypto.randomUUID() : `wiz-${Date.now()}`),
    [],
  );

  // Restore localStorage draft once on mount. Honeypot stays empty even if
  // a prior session had garbage in it.
  useEffect(() => {
    setDraft((current) => {
      const restoredDraft = readDraftFromStorage(current);
      if (typeof window === "undefined") return restoredDraft;
      // Sticky widget hands off email/phone via sessionStorage. One-shot.
      const prefillRaw = window.sessionStorage.getItem("vozilla:wizard-prefill");
      if (!prefillRaw) return restoredDraft;
      try {
        const prefill = JSON.parse(prefillRaw) as {
          customer_email?: string;
          customer_phone?: string;
        };
        window.sessionStorage.removeItem("vozilla:wizard-prefill");
        return {
          ...restoredDraft,
          customer_email: prefill.customer_email ?? restoredDraft.customer_email,
          customer_phone: prefill.customer_phone ?? restoredDraft.customer_phone,
        };
      } catch {
        return restoredDraft;
      }
    });
    setRestored(true);
  }, []);

  // Autosave on every change (cheap — single localStorage write).
  useEffect(() => {
    if (!restored) return;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, _hp_email: undefined }));
  }, [draft, restored]);

  // beforeunload warning when there's any meaningful draft content. Skipped
  // during submit (we're navigating to /uspjeh on purpose).
  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (submitting) return;
      const meaningful =
        draft.request_type || draft.customer_name || draft.customer_email || draft.customer_phone;
      if (!meaningful) return;
      e.preventDefault();
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [draft, submitting]);

  // Move keyboard focus to the new step heading whenever we navigate.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  function goto(next: StepIndex) {
    setErrors({});
    setStep(next);
  }

  function handleBack() {
    if (step > 0) goto((step - 1) as StepIndex);
  }

  function handleNext() {
    const stepErrors = validateStep(step, draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      headingRef.current?.focus();
      return;
    }
    if (step < 3) goto((step + 1) as StepIndex);
  }

  async function handleSubmit() {
    setSubmitError(null);
    const stepErrors = validateStep(3, draft);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setSubmitting(true);
    try {
      const recaptchaToken = await executeRecaptcha("lead_create");
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": idempotencyKey,
        },
        body: JSON.stringify(draftToApiBody(draft, recaptchaToken)),
      });
      if (res.ok) {
        const data = (await res.json()) as { display_id: string };
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(DRAFT_KEY);
        }
        router.push(`/zatrazi-ponudu/uspjeh?id=${encodeURIComponent(data.display_id)}`);
        return;
      }
      const errBody = (await res.json().catch(() => ({}))) as { error?: string };
      setSubmitError(errBody.error ?? `http_${res.status}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "submit_failed");
    } finally {
      setSubmitting(false);
    }
  }

  const brandName = brands.find((b) => b.id === draft.brand_id)?.name;
  const modelName = models.find((m) => m.id === draft.model_id)?.name;
  const countyName = counties.find((c) => c.id === draft.customer_county_id)?.name;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (step === 3) handleSubmit();
        else handleNext();
      }}
      noValidate
      className="space-y-8"
    >
      <ProgressBar step={step} />

      <div ref={headingRef} tabIndex={-1} className="outline-none">
        {step === 0 && (
          <Step1Vehicle
            draft={draft}
            setDraft={setDraft}
            errors={errors}
            brands={brands}
            models={models}
          />
        )}
        {step === 1 && <Step2Budget draft={draft} setDraft={setDraft} errors={errors} />}
        {step === 2 && (
          <Step3Contact draft={draft} setDraft={setDraft} errors={errors} counties={counties} />
        )}
        {step === 3 && (
          <Step4Consent
            draft={draft}
            setDraft={setDraft}
            errors={errors}
            brandName={brandName}
            modelName={modelName}
            countyName={countyName}
          />
        )}
      </div>

      {/* Honeypot — visually hidden + aria-hidden + tabindex=-1. Bots fill all
          inputs; humans never reach this. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px" }}>
        <label>
          Email (ne popunjavajte ovo polje)
          <input
            type="text"
            name="_hp_email"
            tabIndex={-1}
            autoComplete="off"
            value={draft._hp_email}
            onChange={(e) => setDraft((d) => ({ ...d, _hp_email: e.target.value }))}
          />
        </label>
      </div>

      {submitError ? (
        <div
          role="alert"
          className="border-state-error bg-state-error/10 rounded-md border p-4 text-sm"
        >
          Slanje nije uspjelo: {submitError}. Pokušaj ponovno.
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleBack}
          disabled={step === 0 || submitting}
        >
          Natrag
        </Button>
        {step < 3 ? (
          <Button type="submit" disabled={submitting}>
            Dalje
          </Button>
        ) : (
          <Button type="submit" disabled={submitting || !draft.gdpr_consent}>
            {submitting ? "Šaljem…" : "Pošalji upit"}
          </Button>
        )}
      </div>
    </form>
  );
}

function ProgressBar({ step }: { step: StepIndex }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Koraci upita">
      {STEP_LABELS.map((label, idx) => {
        const isCurrent = idx === step;
        const isDone = idx < step;
        return (
          <li
            key={label}
            aria-current={isCurrent ? "step" : undefined}
            className="flex flex-1 items-center gap-2"
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                isCurrent || isDone
                  ? "bg-brand-accent text-brand-primary"
                  : "bg-surface-muted text-text-muted"
              }`}
            >
              {idx + 1}
            </span>
            <span
              className={`hidden text-sm sm:inline ${
                isCurrent ? "text-text font-medium" : "text-text-muted"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
