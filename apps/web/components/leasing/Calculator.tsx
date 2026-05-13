"use client";

import Link from "next/link";
import { useMemo, useState, useDeferredValue } from "react";
import { AlertTriangle } from "lucide-react";
import { calculateLeasing, type LeasingType } from "@/lib/leasing-calculator";
import type { LeasingDefaultsResolved } from "@/lib/leasing/defaults";
import { formatPrice } from "@/lib/utils/format";

/**
 * Live leasing calculator. All inputs are client state; output recomputes
 * on every change but the displayed result uses `useDeferredValue` so
 * keystrokes feel smooth (React queues the recompute behind input echo).
 * Defaults come from the LeasingDefaults global — admin-editable in
 * Sprint 1; this component never hardcodes financial assumptions.
 *
 * URL sync is intentionally one-way: state lives in React, and the
 * "Zatraži ponudu" CTA reads current state to build a pre-filled URL.
 * Putting state in the URL would re-render the parent server component
 * on every keystroke, which is wasteful and breaks the smooth-typing
 * experience.
 */

type Props = {
  defaults: LeasingDefaultsResolved;
};

const TERM_OPTIONS = [12, 24, 36, 48, 60, 72, 84];

type FormState = {
  price: number;
  depositPercent: number;
  termMonths: number;
  ratePercent: number;
  residualPercent: number;
  type: LeasingType;
};

export default function Calculator({ defaults }: Props) {
  const [state, setState] = useState<FormState>({
    price: 25000,
    depositPercent: defaults.depositPercentDefault,
    termMonths: defaults.termMonthsDefault,
    ratePercent: defaults.defaultRatePercent,
    residualPercent: defaults.residualPercentDefault,
    type: "financial",
  });

  // The displayed result uses a deferred snapshot of state — typing into
  // the price field stays snappy because React renders the input echo
  // before the recompute. The math itself is O(1) so this is mostly UX
  // polish for noisy keystrokes.
  const deferred = useDeferredValue(state);

  const result = useMemo(() => {
    const deposit = (deferred.price * deferred.depositPercent) / 100;
    try {
      return calculateLeasing({
        price: deferred.price,
        deposit,
        termMonths: deferred.termMonths,
        ratePercent: deferred.ratePercent,
        residualPercent: deferred.type === "operating" ? deferred.residualPercent : 0,
        type: deferred.type,
      });
    } catch {
      return null;
    }
  }, [deferred]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
      <form className="border-surface-border bg-surface space-y-6 rounded-md border p-6">
        <SliderWithNumber
          label="Cijena vozila"
          unit="€"
          min={1000}
          max={200000}
          step={500}
          value={state.price}
          onChange={(v) => update("price", v)}
        />

        <SliderWithNumber
          label="Polog"
          unit="%"
          min={defaults.depositPercentMin}
          max={defaults.depositPercentMax}
          step={1}
          value={state.depositPercent}
          onChange={(v) => update("depositPercent", v)}
          helper={`= ${formatPrice((state.price * state.depositPercent) / 100, { decimals: 0 })}`}
        />

        <div>
          <label htmlFor="calc-term" className="text-text mb-1 block text-sm font-medium">
            Period otplate
          </label>
          <select
            id="calc-term"
            value={state.termMonths}
            onChange={(e) => update("termMonths", Number.parseInt(e.target.value, 10))}
            className="border-surface-border bg-surface text-text focus:border-brand-accent focus:ring-brand-accent w-full rounded-md border px-3 py-2 text-sm focus:ring-1"
          >
            {TERM_OPTIONS.filter(
              (m) => m >= defaults.termMonthsMin && m <= defaults.termMonthsMax,
            ).map((m) => (
              <option key={m} value={m}>
                {m} mjeseci
              </option>
            ))}
          </select>
        </div>

        <SliderWithNumber
          label="Kamatna stopa (NKS)"
          unit="%"
          min={defaults.minRatePercent}
          max={defaults.maxRatePercent}
          step={0.1}
          value={state.ratePercent}
          onChange={(v) => update("ratePercent", v)}
        />

        <fieldset>
          <legend className="text-text mb-2 block text-sm font-medium">Vrsta leasinga</legend>
          <div className="flex gap-3">
            <RadioCard
              name="type"
              value="financial"
              checked={state.type === "financial"}
              onChange={() => update("type", "financial")}
              title="Financijski"
              hint="Vozilo postaje vaše na kraju otplate."
            />
            <RadioCard
              name="type"
              value="operating"
              checked={state.type === "operating"}
              onChange={() => update("type", "operating")}
              title="Operativni"
              hint="Vozilo se vraća uz preostalu vrijednost (balon)."
            />
          </div>
        </fieldset>

        {state.type === "operating" ? (
          <SliderWithNumber
            label="Preostala vrijednost (balon)"
            unit="%"
            min={0}
            max={60}
            step={1}
            value={state.residualPercent}
            onChange={(v) => update("residualPercent", v)}
            helper={`= ${formatPrice((state.price * state.residualPercent) / 100, { decimals: 0 })}`}
          />
        ) : null}
      </form>

      <aside className="space-y-4">
        <div className="flex items-start gap-3 rounded-md border border-yellow-300 bg-yellow-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-yellow-900">
              Informativni izračun. Ne predstavlja ponudu.
            </p>
            <p className="mt-1 text-sm text-yellow-900/80">{defaults.disclaimer}</p>
          </div>
        </div>

        {result ? (
          <div className="border-surface-border bg-surface rounded-md border p-6">
            <p className="text-text-muted text-xs uppercase tracking-wide">Procijenjena rata</p>
            <p className="text-text mt-1 text-4xl font-bold">
              {formatPrice(result.monthlyPayment, { decimals: 0 })}
            </p>
            <p className="text-text-muted mt-1 text-sm">/ mjesečno</p>

            <dl className="border-surface-border mt-5 space-y-2 border-t pt-4 text-sm">
              <ResultRow label="Ukupno plaćanje" value={formatPrice(result.totalCost)} />
              <ResultRow label="Ukupna kamata" value={formatPrice(result.totalInterest)} />
              <ResultRow label="Financirani iznos" value={formatPrice(result.financedAmount)} />
              {result.residualValue > 0 ? (
                <ResultRow label="Preostala vrijednost" value={formatPrice(result.residualValue)} />
              ) : null}
            </dl>

            <Link
              href={ctaHref(state)}
              className="bg-brand-accent text-brand-primary mt-6 block w-full rounded-md px-5 py-3 text-center text-sm font-semibold hover:opacity-90"
            >
              Zatraži leasing ponudu
            </Link>
          </div>
        ) : (
          <div className="border-state-error/30 bg-state-error/5 rounded-md border p-4">
            <p className="text-text text-sm">
              Provjeri unose — kombinacija cijene, pologa i balona nije valjana.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function ctaHref(state: FormState): string {
  const deposit = Math.round((state.price * state.depositPercent) / 100);
  const qs = new URLSearchParams({
    cijena: String(state.price),
    polog: String(deposit),
    period: String(state.termMonths),
    izvor: "leasing",
  });
  return `/zatrazi-ponudu?${qs.toString()}`;
}

function SliderWithNumber({
  label,
  unit,
  min,
  max,
  step,
  value,
  onChange,
  helper,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (n: number) => void;
  helper?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-text text-sm font-medium">{label}</label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={Number.isFinite(value) ? value : ""}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const n = Number.parseFloat(e.target.value);
              if (Number.isFinite(n)) onChange(n);
            }}
            aria-label={label}
            className="border-surface-border bg-surface text-text focus:border-brand-accent focus:ring-brand-accent w-28 rounded-md border px-2 py-1 text-right text-sm focus:ring-1"
          />
          <span className="text-text-muted text-sm">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value))}
        aria-label={`${label} klizač`}
        className="bg-surface-muted accent-brand-accent h-2 w-full cursor-pointer appearance-none rounded-full"
      />
      {helper ? <p className="text-text-muted mt-1 text-xs">{helper}</p> : null}
    </div>
  );
}

function RadioCard({
  name,
  value,
  checked,
  onChange,
  title,
  hint,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  hint: string;
}) {
  return (
    <label
      className={
        "flex flex-1 cursor-pointer flex-col gap-1 rounded-md border p-3 text-sm transition-colors " +
        (checked
          ? "border-brand-accent bg-brand-accent/5"
          : "border-surface-border bg-surface hover:border-brand-accent/60")
      }
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className="text-text font-medium">{title}</span>
      <span className="text-text-muted text-xs">{hint}</span>
    </label>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-text font-medium">{value}</dd>
    </div>
  );
}
