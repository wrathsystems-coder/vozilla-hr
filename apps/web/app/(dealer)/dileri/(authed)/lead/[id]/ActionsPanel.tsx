"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { closeLead, markContacted, markViewed, saveNotes } from "./actions";

type Props = {
  leadId: number;
  status: "sent" | "viewed" | "contacted" | "closed";
  initialNotes: string;
  initialOutcome: "sold" | "not_sold" | "customer_unresponsive" | "other" | null;
  initialOutcomeReason: string;
};

export default function ActionsPanel({
  leadId,
  status,
  initialNotes,
  initialOutcome,
  initialOutcomeReason,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(initialNotes);
  const [notesDirty, setNotesDirty] = useState(false);
  const [outcome, setOutcome] = useState<Props["initialOutcome"]>(initialOutcome ?? null);
  const [outcomeReason, setOutcomeReason] = useState(initialOutcomeReason);

  const isClosed = status === "closed";

  function run(fn: () => Promise<{ ok: true } | { ok: false; message: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.message);
    });
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p
          className="border-state-error/30 bg-state-error/5 rounded-md border p-3 text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Akcije</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={pending || status !== "sent"}
            onClick={() => run(() => markViewed(leadId))}
          >
            {status === "sent" ? "Označi kao pregledano" : "✓ Pregledano"}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={pending || isClosed || status === "contacted"}
            onClick={() => run(() => markContacted(leadId))}
          >
            {status === "contacted" || isClosed ? "✓ Kontaktirao" : "Kontaktirao sam kupca"}
          </Button>
        </div>
        <p className="text-text-muted text-xs">
          Kupac vidi tvoj status u svom trackeru. Brzina odgovora utječe na rang u idućim leadovima.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Zatvori lead</h3>
        {isClosed ? (
          <p className="text-text-muted text-sm">
            Lead je zatvoren ({outcomeLabel(outcome)}). Ako trebaš izmjenu, kontaktiraj admina.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="outcome" className="text-sm">
                Ishod
              </label>
              <Select
                id="outcome"
                value={outcome ?? ""}
                onChange={(e) =>
                  setOutcome(
                    (e.target.value as Props["initialOutcome"]) ||
                      (null as Props["initialOutcome"]),
                  )
                }
              >
                <option value="">— odaberi —</option>
                <option value="sold">Prodano</option>
                <option value="not_sold">Nije prodano</option>
                <option value="customer_unresponsive">Kupac ne odgovara</option>
                <option value="other">Drugo</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="outcome_reason" className="text-sm">
                Detalji (datum, što je kupljeno, razlog ako nije prodano)
              </label>
              <Textarea
                id="outcome_reason"
                value={outcomeReason}
                onChange={(e) => setOutcomeReason(e.target.value)}
                rows={3}
                placeholder="npr. Prodano 12.05.2026, kupac je odabrao Škoda Octavia umjesto Audi A4."
              />
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={pending || !outcome}
              onClick={() =>
                run(() =>
                  closeLead({
                    leadId,
                    outcome: outcome!,
                    outcomeReason,
                  }),
                )
              }
            >
              Zatvori lead
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Bilješke (samo ti vidiš)</h3>
        <Textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setNotesDirty(true);
          }}
          rows={4}
          placeholder="Privatne bilješke o ovom leadu…"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending || !notesDirty}
          onClick={() =>
            run(async () => {
              const r = await saveNotes(leadId, notes);
              if (r.ok) setNotesDirty(false);
              return r;
            })
          }
        >
          {notesDirty ? "Spremi bilješke" : "✓ Spremljeno"}
        </Button>
      </section>
    </div>
  );
}

function outcomeLabel(outcome: Props["initialOutcome"]): string {
  switch (outcome) {
    case "sold":
      return "Prodano";
    case "not_sold":
      return "Nije prodano";
    case "customer_unresponsive":
      return "Kupac ne odgovara";
    case "other":
      return "Drugo";
    default:
      return "—";
  }
}
