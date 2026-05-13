"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  QuizAnswers,
  QuizBodyType,
  QuizFuel,
  QuizPriority,
  QuizSeats,
  QuizTransmission,
} from "@/lib/quiz-recommender";

/**
 * 8-step "Pomozi mi izabrati" wizard. Each step has a "Preskoči" button
 * that leaves the field undefined (no-penalty per the recommender's
 * scoring contract). Draft autosaves to localStorage on every change so
 * a refresh / accidental-tab-close doesn't lose progress.
 *
 * On submit we POST to /api/quiz/save (commit 12) which issues a token
 * + persists answers; the API returns { token } and we redirect to
 * /pomoc-pri-izboru/rezultati/[token].
 */

const DRAFT_KEY = "vozilla:quiz-draft-v1";
const TOTAL_STEPS = 8;

type Option<T extends string> = { value: T; label: string };

const BODY_TYPES: Option<QuizBodyType>[] = [
  { value: "suv", label: "SUV" },
  { value: "hatchback", label: "Hatchback" },
  { value: "karavan", label: "Karavan" },
  { value: "sedan", label: "Limuzina" },
  { value: "sportski", label: "Sportski" },
  { value: "elektricni", label: "Električni" },
];

const FUELS: Option<QuizFuel>[] = [
  { value: "benzin", label: "Benzin" },
  { value: "dizel", label: "Dizel" },
  { value: "hibrid", label: "Hibrid" },
  { value: "elektricni", label: "Električni" },
  { value: "plin", label: "Plin (LPG / CNG)" },
];

const TRANSMISSIONS: Option<QuizTransmission>[] = [
  { value: "manual", label: "Manualni" },
  { value: "automatic", label: "Automatski" },
];

const SEATS: Option<QuizSeats>[] = [
  { value: "2", label: "2 sjedala" },
  { value: "4-5", label: "4 – 5 sjedala" },
  { value: "5-7", label: "5 – 7 sjedala" },
  { value: "7+", label: "7 ili više sjedala" },
];

const USAGES: Option<NonNullable<QuizAnswers["usage"]>>[] = [
  { value: "city", label: "Grad" },
  { value: "long_distance", label: "Duga putovanja" },
  { value: "off_road", label: "Off-road / izvan ceste" },
  { value: "mixed", label: "Mješovito" },
];

const PRIORITIES: Option<QuizPriority>[] = [
  { value: "cijena", label: "Cijena" },
  { value: "pouzdanost", label: "Pouzdanost" },
  { value: "performanse", label: "Performanse" },
  { value: "ekologija", label: "Ekologija" },
  { value: "komfor", label: "Komfor" },
  { value: "prostor", label: "Prostor" },
];

const NEW_OR_USED: Option<NonNullable<QuizAnswers["newOrUsed"]>>[] = [
  { value: "new", label: "Novo" },
  { value: "used", label: "Rabljeno" },
  { value: "both", label: "Oboje" },
];

const EMPTY: QuizAnswers = {};

function isDirty(a: QuizAnswers): boolean {
  return Object.keys(a).length > 0;
}

function loadDraft(): { answers: QuizAnswers; step: number } {
  if (typeof window === "undefined") return { answers: EMPTY, step: 0 };
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return { answers: EMPTY, step: 0 };
    const parsed = JSON.parse(raw) as { answers?: QuizAnswers; step?: number };
    return {
      answers: parsed.answers ?? EMPTY,
      step:
        typeof parsed.step === "number" ? Math.min(Math.max(parsed.step, 0), TOTAL_STEPS - 1) : 0,
    };
  } catch {
    return { answers: EMPTY, step: 0 };
  }
}

export default function QuizWizard() {
  const router = useRouter();
  const [answers, setAnswers] = useState<QuizAnswers>(EMPTY);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  // Restore once on mount.
  useEffect(() => {
    const { answers: a, step: s } = loadDraft();
    setAnswers(a);
    setStep(s);
  }, []);

  // Autosave on every change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers, step }));
  }, [answers, step]);

  // beforeunload guard while there's progress.
  useEffect(() => {
    if (!isDirty(answers)) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [answers]);

  function patch<K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  function skip<K extends keyof QuizAnswers>(...keys: K[]) {
    setAnswers((a) => {
      const next = { ...a };
      for (const k of keys) delete next[k];
      return next;
    });
    next();
  }

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    setError(null);
    startSubmit(async () => {
      try {
        const res = await fetch("/api/quiz/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
        if (!res.ok) {
          setError("Spremanje nije uspjelo. Pokušaj ponovno.");
          return;
        }
        const data = (await res.json()) as { token?: string };
        if (!data.token) {
          setError("Spremanje nije vratilo token. Pokušaj ponovno.");
          return;
        }
        // Clear the draft once the answers are safely persisted server-side.
        window.localStorage.removeItem(DRAFT_KEY);
        router.push(`/pomoc-pri-izboru/rezultati/${data.token}`);
      } catch {
        setError("Mreža nije dostupna. Pokušaj ponovno.");
      }
    });
  }

  return (
    <div className="border-surface-border bg-surface space-y-6 rounded-md border p-6">
      <ProgressBar step={step} />

      <div className="min-h-[280px]">
        {step === 0 ? (
          <RadioStep
            heading="Koji tip vozila te zanima?"
            hint="Možeš preskočiti ako još ne znaš."
            options={BODY_TYPES}
            value={answers.bodyType}
            onChange={(v) => patch("bodyType", v)}
          />
        ) : null}

        {step === 1 ? (
          <BudgetStep
            min={answers.budgetMin}
            max={answers.budgetMax}
            onChange={(min, max) => {
              setAnswers((a) => ({ ...a, budgetMin: min, budgetMax: max }));
            }}
          />
        ) : null}

        {step === 2 ? (
          <RadioStep
            heading="Novo, rabljeno ili oboje?"
            options={NEW_OR_USED}
            value={answers.newOrUsed}
            onChange={(v) => patch("newOrUsed", v)}
          />
        ) : null}

        {step === 3 ? (
          <RadioStep
            heading="Koji tip pogona ti odgovara?"
            options={FUELS}
            value={answers.fuelType}
            onChange={(v) => patch("fuelType", v)}
          />
        ) : null}

        {step === 4 ? (
          <RadioStep
            heading="Mjenjač?"
            options={TRANSMISSIONS}
            value={answers.transmission}
            onChange={(v) => patch("transmission", v)}
          />
        ) : null}

        {step === 5 ? (
          <RadioStep
            heading="Koliko sjedala trebaš?"
            options={SEATS}
            value={answers.seats}
            onChange={(v) => patch("seats", v)}
          />
        ) : null}

        {step === 6 ? (
          <RadioStep
            heading="Kako ćeš auto najviše koristiti?"
            options={USAGES}
            value={answers.usage}
            onChange={(v) => patch("usage", v)}
          />
        ) : null}

        {step === 7 ? (
          <RadioStep
            heading="Što ti je najvažnije?"
            options={PRIORITIES}
            value={answers.priority}
            onChange={(v) => patch("priority", v)}
          />
        ) : null}
      </div>

      {error ? (
        <p
          className="border-state-error/30 bg-state-error/5 text-text rounded-md border p-3 text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <NavButtons
        step={step}
        canSkip={step !== 7 /* last step: only "Završi" makes sense, no skip */}
        onBack={back}
        onSkipAndNext={() => {
          // Skip clears the current step's field(s) and advances.
          const KEY_FOR_STEP: Record<number, (keyof QuizAnswers)[]> = {
            0: ["bodyType"],
            1: ["budgetMin", "budgetMax"],
            2: ["newOrUsed"],
            3: ["fuelType"],
            4: ["transmission"],
            5: ["seats"],
            6: ["usage"],
            7: ["priority"],
          };
          skip(...KEY_FOR_STEP[step]);
        }}
        onNext={next}
        onSubmit={submit}
        submitting={submitting}
      />
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  const pct = ((step + 1) / TOTAL_STEPS) * 100;
  return (
    <div>
      <div className="text-text-muted mb-2 flex items-center justify-between text-xs">
        <span>
          Pitanje {step + 1} od {TOTAL_STEPS}
        </span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-brand-accent h-full transition-all"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function RadioStep<T extends string>({
  heading,
  hint,
  options,
  value,
  onChange,
}: {
  heading: string;
  hint?: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-text mb-1 block text-lg font-semibold">{heading}</legend>
      {hint ? <p className="text-text-muted mb-3 text-sm">{hint}</p> : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={
                "flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition-colors " +
                (checked
                  ? "border-brand-accent bg-brand-accent/5"
                  : "border-surface-border bg-surface hover:border-brand-accent/60")
              }
            >
              <input
                type="radio"
                checked={checked}
                onChange={() => onChange(o.value)}
                className="accent-brand-accent"
              />
              <span className="text-text">{o.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function BudgetStep({
  min,
  max,
  onChange,
}: {
  min: number | undefined;
  max: number | undefined;
  onChange: (min: number | undefined, max: number | undefined) => void;
}) {
  return (
    <div>
      <p className="text-text mb-1 block text-lg font-semibold">Koliki ti je budžet?</p>
      <p className="text-text-muted mb-4 text-sm">
        Cijena vozila (€). Preskoči ako još istražuješ.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-text-muted text-xs">
          Od (€)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={min ?? ""}
            onChange={(e) => {
              const v = Number.parseInt(e.target.value, 10);
              onChange(Number.isFinite(v) && v >= 0 ? v : undefined, max);
            }}
            placeholder="5.000"
            className="border-surface-border bg-surface text-text focus:border-brand-accent focus:ring-brand-accent mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-1"
          />
        </label>
        <label className="text-text-muted text-xs">
          Do (€)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={max ?? ""}
            onChange={(e) => {
              const v = Number.parseInt(e.target.value, 10);
              onChange(min, Number.isFinite(v) && v >= 0 ? v : undefined);
            }}
            placeholder="50.000"
            className="border-surface-border bg-surface text-text focus:border-brand-accent focus:ring-brand-accent mt-1 w-full rounded-md border px-3 py-2 text-sm focus:ring-1"
          />
        </label>
      </div>
    </div>
  );
}

function NavButtons({
  step,
  canSkip,
  onBack,
  onSkipAndNext,
  onNext,
  onSubmit,
  submitting,
}: {
  step: number;
  canSkip: boolean;
  onBack: () => void;
  onSkipAndNext: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const isLast = step === TOTAL_STEPS - 1;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 0 || submitting}
        className="text-text-muted hover:text-text rounded-md px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      >
        ← Natrag
      </button>
      <div className="flex flex-wrap items-center gap-2">
        {canSkip ? (
          <button
            type="button"
            onClick={onSkipAndNext}
            disabled={submitting}
            className="text-text-muted hover:text-text rounded-md px-3 py-2 text-sm underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Preskoči
          </button>
        ) : null}
        {isLast ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="bg-brand-accent text-brand-primary rounded-md px-5 py-2 text-sm font-semibold hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Pripremam rezultate…" : "Završi i pogledaj preporuke"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={submitting}
            className="bg-brand-accent text-brand-primary rounded-md px-5 py-2 text-sm font-semibold hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Dalje →
          </button>
        )}
      </div>
    </div>
  );
}
