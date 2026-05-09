import Link from "next/link";
import Heading from "@/components/ui/Heading";
import type { LeadDraft, StepErrors } from "./types";
import { FieldError } from "./controls";

type Step4Props = {
  draft: LeadDraft;
  setDraft: React.Dispatch<React.SetStateAction<LeadDraft>>;
  errors: StepErrors;
  brandName?: string;
  modelName?: string;
  countyName?: string;
};

const FINANCING_LABEL: Record<string, string> = {
  cash: "Gotovina",
  bank_loan: "Kredit banke",
  leasing: "Leasing",
  undecided: "Razmišljam",
};

const TIME_FRAME_LABEL: Record<string, string> = {
  immediate: "Odmah (do 7 dana)",
  "1m": "U sljedećih mjesec dana",
  "3m": "U sljedeća 3 mjeseca",
  "6m": "U sljedećih 6 mjeseci",
  later: "Više od 6 mjeseci",
};

function formatPriceRange(min?: number, max?: number): string {
  if (min == null && max == null) return "—";
  const fmt = (n: number) => `${n.toLocaleString("hr-HR")} €`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `od ${fmt(min)}`;
  return `do ${fmt(max!)}`;
}

export default function Step4Consent({
  draft,
  setDraft,
  errors,
  brandName,
  modelName,
  countyName,
}: Step4Props) {
  return (
    <fieldset className="space-y-6">
      <legend className="sr-only">Korak 4: Pregled i privole</legend>
      <Heading level={2}>Pregled i privole</Heading>

      <dl className="border-surface-border grid gap-3 rounded-md border p-5 text-sm">
        <Row label="Tip upita" value={draft.request_type ?? "—"} />
        <Row label="Vozilo" value={[brandName, modelName].filter(Boolean).join(" ") || "—"} />
        {draft.version_text ? <Row label="Verzija" value={draft.version_text} /> : null}
        <Row label="Cijena" value={formatPriceRange(draft.price_min, draft.price_max)} />
        <Row
          label="Način kupnje"
          value={draft.financing_type ? FINANCING_LABEL[draft.financing_type] : "—"}
        />
        <Row
          label="Vremenski okvir"
          value={draft.time_frame ? TIME_FRAME_LABEL[draft.time_frame] : "—"}
        />
        {draft.has_trade_in ? <Row label="Trade-in" value="Da (detalji u upitu)" /> : null}
        <Row label="Ime" value={draft.customer_name ?? "—"} />
        <Row label="Email" value={draft.customer_email ?? "—"} />
        <Row label="Telefon" value={draft.customer_phone ?? "—"} />
        <Row
          label="Lokacija"
          value={[countyName, draft.customer_postcode].filter(Boolean).join(", ") || "—"}
        />
      </dl>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={draft.gdpr_consent}
            onChange={(e) => setDraft((d) => ({ ...d, gdpr_consent: e.target.checked }))}
            aria-describedby={errors.gdpr_consent ? "gdpr_consent_error" : undefined}
            aria-invalid={errors.gdpr_consent ? true : undefined}
            className="mt-1"
          />
          <span>
            Slažem se s{" "}
            <Link href="/opci-uvjeti" className="underline" target="_blank" rel="noreferrer">
              Općim uvjetima
            </Link>{" "}
            i privolu na obradu osobnih podataka u svrhu posredovanja prema dilerima (
            <Link
              href="/politika-privatnosti"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              Politika privatnosti
            </Link>
            ).{" "}
            <span aria-hidden="true" className="text-state-error">
              *
            </span>
          </span>
        </label>
        <FieldError id="gdpr_consent_error" message={errors.gdpr_consent} />

        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={draft.marketing_consent}
            onChange={(e) => setDraft((d) => ({ ...d, marketing_consent: e.target.checked }))}
            className="mt-1"
          />
          <span>Želim primati personalizirane ponude i savjete od vozilla.hr. (opcijski)</span>
        </label>
      </div>
    </fieldset>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      <dt className="text-text-muted col-span-1 font-medium">{label}</dt>
      <dd className="col-span-2 sm:col-span-3">{value}</dd>
    </div>
  );
}
