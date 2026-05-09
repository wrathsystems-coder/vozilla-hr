import Heading from "@/components/ui/Heading";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { FinancingType, LeadDraft, LeasingType, StepErrors, TimeFrame } from "./types";
import { FieldError, FieldLabel } from "./controls";

type Step2Props = {
  draft: LeadDraft;
  setDraft: React.Dispatch<React.SetStateAction<LeadDraft>>;
  errors: StepErrors;
};

const FINANCING_OPTIONS: { value: FinancingType; label: string }[] = [
  { value: "cash", label: "Gotovina" },
  { value: "bank_loan", label: "Kredit banke" },
  { value: "leasing", label: "Leasing" },
  { value: "undecided", label: "Razmislit ću" },
];

const LEASING_OPTIONS: { value: LeasingType; label: string }[] = [
  { value: "operating", label: "Operativni leasing" },
  { value: "financial", label: "Financijski leasing" },
];

const TIME_FRAME_OPTIONS: { value: TimeFrame; label: string }[] = [
  { value: "immediate", label: "Odmah (do 7 dana)" },
  { value: "1m", label: "U sljedećih mjesec dana" },
  { value: "3m", label: "U sljedeća 3 mjeseca" },
  { value: "6m", label: "U sljedećih 6 mjeseci" },
  { value: "later", label: "Više od 6 mjeseci / istražujem" },
];

const CONDITION_OPTIONS = [
  { value: "excellent", label: "Odlično" },
  { value: "good", label: "Vrlo dobro" },
  { value: "fair", label: "Dobro" },
  { value: "poor", label: "Loše" },
] as const;

function num(value: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default function Step2Budget({ draft, setDraft, errors }: Step2Props) {
  return (
    <fieldset className="space-y-6">
      <legend className="sr-only">Korak 2: Tvoji uvjeti</legend>
      <Heading level={2}>Tvoji uvjeti</Heading>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel id="price_min">Cijena od (€)</FieldLabel>
          <Input
            id="price_min"
            type="number"
            min={0}
            value={draft.price_min ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, price_min: num(e.target.value) }))}
            aria-describedby={errors.price_min ? "price_min_error" : undefined}
            aria-invalid={errors.price_min ? true : undefined}
          />
          <FieldError id="price_min_error" message={errors.price_min} />
        </div>
        <div>
          <FieldLabel id="price_max">Cijena do (€)</FieldLabel>
          <Input
            id="price_max"
            type="number"
            min={0}
            value={draft.price_max ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, price_max: num(e.target.value) }))}
          />
        </div>
      </div>

      <div>
        <FieldLabel id="financing_type">Način kupnje</FieldLabel>
        <Select
          id="financing_type"
          value={draft.financing_type ?? ""}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              financing_type: e.target.value ? (e.target.value as FinancingType) : undefined,
              // Reset leasing_type when financing changes away from leasing.
              leasing_type: e.target.value === "leasing" ? d.leasing_type : undefined,
            }))
          }
        >
          <option value="">— odaberi —</option>
          {FINANCING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {draft.financing_type === "leasing" && (
        <div>
          <FieldLabel id="leasing_type" required>
            Vrsta leasinga
          </FieldLabel>
          <Select
            id="leasing_type"
            value={draft.leasing_type ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                leasing_type: e.target.value ? (e.target.value as LeasingType) : undefined,
              }))
            }
            aria-describedby={errors.leasing_type ? "leasing_type_error" : undefined}
            aria-invalid={errors.leasing_type ? true : undefined}
          >
            <option value="">— odaberi —</option>
            {LEASING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <FieldError id="leasing_type_error" message={errors.leasing_type} />
        </div>
      )}

      {(draft.financing_type === "leasing" || draft.financing_type === "bank_loan") && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel id="deposit">Polog (€)</FieldLabel>
            <Input
              id="deposit"
              type="number"
              min={0}
              value={draft.deposit ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, deposit: num(e.target.value) }))}
            />
          </div>
          <div>
            <FieldLabel id="period_months">Period otplate (mjeseci)</FieldLabel>
            <Select
              id="period_months"
              value={draft.period_months ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, period_months: num(e.target.value) }))}
            >
              <option value="">— odaberi —</option>
              {[24, 36, 48, 60, 72].map((m) => (
                <option key={m} value={m}>
                  {`${m} mj.`}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      <div>
        <FieldLabel id="time_frame" required>
          Vremenski okvir kupnje
        </FieldLabel>
        <Select
          id="time_frame"
          value={draft.time_frame ?? ""}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              time_frame: e.target.value ? (e.target.value as TimeFrame) : undefined,
            }))
          }
          aria-describedby={errors.time_frame ? "time_frame_error" : undefined}
          aria-invalid={errors.time_frame ? true : undefined}
        >
          <option value="">— odaberi —</option>
          {TIME_FRAME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <FieldError id="time_frame_error" message={errors.time_frame} />
      </div>

      <div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.has_trade_in}
            onChange={(e) => setDraft((d) => ({ ...d, has_trade_in: e.target.checked }))}
          />
          Imam vozilo za zamjenu
        </label>
      </div>

      {draft.has_trade_in && (
        <fieldset className="border-surface-border space-y-4 rounded-md border p-4">
          <legend className="px-1 text-sm font-medium">Vozilo za zamjenu</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel id="trade_in_brand" required>
                Marka
              </FieldLabel>
              <Input
                id="trade_in_brand"
                type="text"
                maxLength={80}
                value={draft.trade_in_brand ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, trade_in_brand: e.target.value }))}
                aria-describedby={errors.trade_in_brand ? "trade_in_brand_error" : undefined}
                aria-invalid={errors.trade_in_brand ? true : undefined}
              />
              <FieldError id="trade_in_brand_error" message={errors.trade_in_brand} />
            </div>
            <div>
              <FieldLabel id="trade_in_model">Model</FieldLabel>
              <Input
                id="trade_in_model"
                type="text"
                maxLength={80}
                value={draft.trade_in_model ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, trade_in_model: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <FieldLabel id="trade_in_year">Godina</FieldLabel>
              <Input
                id="trade_in_year"
                type="number"
                min={1950}
                max={2100}
                value={draft.trade_in_year ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, trade_in_year: num(e.target.value) }))}
              />
            </div>
            <div>
              <FieldLabel id="trade_in_mileage_km">Kilometraža</FieldLabel>
              <Input
                id="trade_in_mileage_km"
                type="number"
                min={0}
                value={draft.trade_in_mileage_km ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, trade_in_mileage_km: num(e.target.value) }))
                }
              />
            </div>
            <div>
              <FieldLabel id="trade_in_condition">Stanje</FieldLabel>
              <Select
                id="trade_in_condition"
                value={draft.trade_in_condition ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    trade_in_condition: e.target.value
                      ? (e.target.value as LeadDraft["trade_in_condition"])
                      : undefined,
                  }))
                }
              >
                <option value="">— odaberi —</option>
                {CONDITION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </fieldset>
      )}
    </fieldset>
  );
}
