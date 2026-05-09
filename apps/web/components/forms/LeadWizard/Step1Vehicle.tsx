import Heading from "@/components/ui/Heading";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import type { Brand, Model } from "@/payload-types";
import type { LeadDraft, RequestType, StepErrors } from "./types";
import { FieldError, FieldLabel } from "./controls";

type Step1Props = {
  draft: LeadDraft;
  setDraft: React.Dispatch<React.SetStateAction<LeadDraft>>;
  errors: StepErrors;
  brands: Brand[];
  models: Model[];
};

const REQUEST_TYPE_OPTIONS: { value: RequestType; label: string }[] = [
  { value: "new", label: "Novo vozilo" },
  { value: "used", label: "Rabljeno vozilo" },
  { value: "leasing", label: "Leasing" },
  { value: "unsure", label: "Nisam siguran" },
];

export default function Step1Vehicle({ draft, setDraft, errors, brands, models }: Step1Props) {
  const modelsForBrand = draft.brand_id
    ? models.filter((m) => {
        const brandRel = m.brand;
        const brandId = typeof brandRel === "number" ? brandRel : brandRel?.id;
        return brandId === draft.brand_id;
      })
    : [];

  return (
    <fieldset className="space-y-6">
      <legend className="sr-only">Korak 1: Što tražiš?</legend>
      <Heading level={2}>Što tražiš?</Heading>

      <div>
        <FieldLabel id="request_type" required>
          Tip upita
        </FieldLabel>
        <div
          role="radiogroup"
          aria-labelledby="request_type"
          className="mt-2 grid gap-2 sm:grid-cols-2"
        >
          {REQUEST_TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="border-surface-border hover:bg-surface-muted flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3"
            >
              <input
                type="radio"
                name="request_type"
                value={opt.value}
                checked={draft.request_type === opt.value}
                onChange={() => setDraft((d) => ({ ...d, request_type: opt.value }))}
                aria-describedby={errors.request_type ? "request_type_error" : undefined}
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
        <FieldError id="request_type_error" message={errors.request_type} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel id="brand_id">Marka</FieldLabel>
          <Select
            id="brand_id"
            value={draft.brand_id ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                brand_id: e.target.value ? Number(e.target.value) : undefined,
                model_id: undefined, // reset model when brand changes
              }))
            }
          >
            <option value="">— odaberi marku —</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <FieldLabel id="model_id">Model</FieldLabel>
          <Select
            id="model_id"
            value={draft.model_id ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                model_id: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            disabled={!draft.brand_id}
          >
            <option value="">— odaberi model —</option>
            {modelsForBrand.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <FieldLabel id="version_text">Verzija ili specifikacija (opcijski)</FieldLabel>
        <Input
          id="version_text"
          type="text"
          maxLength={200}
          value={draft.version_text ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, version_text: e.target.value }))}
          placeholder="npr. 2.0 TDI Quattro"
        />
      </div>

      <div>
        <FieldLabel id="comments">Dodatne želje (opcijski)</FieldLabel>
        <Textarea
          id="comments"
          maxLength={2000}
          rows={4}
          value={draft.comments ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, comments: e.target.value }))}
          placeholder="Boja, oprema, posebni zahtjevi…"
        />
      </div>
    </fieldset>
  );
}
