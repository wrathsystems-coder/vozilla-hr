"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { dispatchLeadAction, type DispatchActionResult } from "./actions";

export type SuggestedDealerVm = {
  dealerId: number;
  dealerName: string;
  city: string | null;
  distanceKm: number;
  qualityScore: number;
  isClosest: boolean;
  reason: "top_score" | "closest";
  scoring: {
    avgRating: number;
    avgResponseTimeHours: number;
    conversionRate: number;
    currentLoad: number;
    monthlyCap: number;
    throttleFactor: number;
  };
};

type Props = {
  leadId: number;
  suggestions: SuggestedDealerVm[];
  warnings: string[];
};

export default function DispatchForm({ leadId, suggestions, warnings }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    () => new Set(suggestions.map((s) => s.dealerId)),
  );
  const [result, setResult] = useState<DispatchActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const selections = useMemo(
    () =>
      suggestions
        .filter((s) => selectedIds.has(s.dealerId))
        .map((s) => ({ dealerId: s.dealerId, qualityScoreAtDispatch: s.qualityScore })),
    [suggestions, selectedIds],
  );

  function toggle(dealerId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(dealerId)) next.delete(dealerId);
      else next.add(dealerId);
      return next;
    });
  }

  function onSubmit() {
    setResult(null);
    startTransition(async () => {
      const r = await dispatchLeadAction(leadId, selections);
      setResult(r);
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {warnings.length > 0 ? (
        <ul className="border-state-error/30 bg-state-error/5 text-text rounded-md border p-3 text-sm">
          {warnings.map((w) => (
            <li key={w}>⚠️ {w}</li>
          ))}
        </ul>
      ) : null}

      {suggestions.length === 0 ? (
        <p className="text-text-muted">
          Nema dilera u radijusu za ovaj lead. Proširi radijus ili ručno dodaj dilera (Sprint 5
          polish).
        </p>
      ) : (
        <ul className="space-y-3">
          {suggestions.map((s, idx) => {
            const checked = selectedIds.has(s.dealerId);
            return (
              <li
                key={s.dealerId}
                className={`border-surface-border rounded-md border p-4 ${
                  checked ? "bg-surface" : "bg-surface-muted opacity-70"
                }`}
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(s.dealerId)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-text font-medium">
                        #{idx + 1} {s.dealerName}
                        {s.city ? ` · ${s.city}` : ""}
                      </p>
                      <div className="flex gap-2 text-xs">
                        {s.isClosest ? (
                          <span className="bg-brand-accent text-brand-primary rounded-full px-2 py-0.5 font-semibold">
                            Najbliži
                          </span>
                        ) : null}
                        {s.reason === "closest" ? (
                          <span className="bg-surface-border text-text-muted rounded-full px-2 py-0.5">
                            Carwow rule
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <dl className="text-text-muted mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                      <div>
                        <dt className="font-medium">Score</dt>
                        <dd>{s.qualityScore.toFixed(3)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Udaljenost</dt>
                        <dd>{s.distanceKm.toFixed(0)} km</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Brzina odg.</dt>
                        <dd>
                          {s.scoring.avgResponseTimeHours > 0
                            ? `${s.scoring.avgResponseTimeHours.toFixed(1)}h`
                            : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium">Konv.</dt>
                        <dd>{(s.scoring.conversionRate * 100).toFixed(0)}%</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Rating</dt>
                        <dd>{s.scoring.avgRating.toFixed(1)} / 5</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Load</dt>
                        <dd>
                          {s.scoring.currentLoad}/{s.scoring.monthlyCap}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium">Throttle</dt>
                        <dd>{s.scoring.throttleFactor.toFixed(2)}×</dd>
                      </div>
                    </dl>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-surface-border bg-surface flex items-center justify-between gap-3 rounded-md border p-4">
        <p className="text-text text-sm">
          Odabrano: <strong>{selections.length}</strong> / {suggestions.length}
        </p>
        <Button type="button" onClick={onSubmit} disabled={pending || selections.length === 0}>
          {pending ? "Šaljem…" : `Pošalji ${selections.length} dilerima`}
        </Button>
      </div>

      {result ? (
        <div
          role={result.ok ? "status" : "alert"}
          className={`rounded-md border p-4 text-sm ${
            result.ok
              ? "border-emerald-500/30 bg-emerald-500/5"
              : "border-state-error/30 bg-state-error/5"
          }`}
        >
          <p className="text-text font-medium">
            {result.ok ? "✓ Poslano." : "Slanje djelomično ili neuspješno."}
          </p>
          <p className="text-text-muted mt-1 text-xs">
            Kreirano: {result.assignmentsCreated} · Preskočeno (već postoji):{" "}
            {result.assignmentsSkipped} · Email-a poslano: {result.emailsDispatched}
          </p>
          {result.errors.length > 0 ? (
            <ul className="text-text-muted mt-2 list-inside list-disc text-xs">
              {result.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
