import { useEffect, useRef, useState } from "react";
import Heading from "@/components/ui/Heading";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { ContactMethod, LeadDraft, StepErrors } from "./types";
import { FieldError, FieldLabel } from "./controls";

type Step3Props = {
  draft: LeadDraft;
  setDraft: React.Dispatch<React.SetStateAction<LeadDraft>>;
  errors: StepErrors;
  counties: { id: number; name: string }[];
};

const CONTACT_OPTIONS: { value: ContactMethod; label: string }[] = [
  { value: "phone", label: "Telefon" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "any", label: "Bilo koje" },
];

const TIME_HINT_OPTIONS = [
  { value: "anytime", label: "Bilo kada" },
  { value: "weekday_morning", label: "Pon-Pet 8-16" },
  { value: "weekday_evening", label: "Pon-Pet 16-20" },
  { value: "weekend", label: "Vikend" },
];

export default function Step3Contact({ draft, setDraft, errors, counties }: Step3Props) {
  const [postcodeStatus, setPostcodeStatus] = useState<"idle" | "loading" | "ok" | "miss">("idle");
  const lastLookup = useRef<string>("");

  // Debounced lookup of /api/lookup/postcode/[code]. When it resolves, fill
  // county_id automatically — user can still override via the dropdown.
  useEffect(() => {
    const code = draft.customer_postcode;
    if (!code || !/^\d{5}$/.test(code) || code === lastLookup.current) {
      return;
    }
    const handle = setTimeout(async () => {
      lastLookup.current = code;
      setPostcodeStatus("loading");
      try {
        const res = await fetch(`/api/lookup/postcode/${code}`);
        if (!res.ok) {
          setPostcodeStatus("miss");
          return;
        }
        const data = (await res.json()) as { countyId: number };
        setDraft((d) => ({ ...d, customer_county_id: data.countyId }));
        setPostcodeStatus("ok");
      } catch {
        setPostcodeStatus("miss");
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [draft.customer_postcode, setDraft]);

  return (
    <fieldset className="space-y-6">
      <legend className="sr-only">Korak 3: Tvoji podaci</legend>
      <Heading level={2}>Tvoji podaci</Heading>

      <div>
        <FieldLabel id="customer_name" required>
          Ime i prezime
        </FieldLabel>
        <Input
          id="customer_name"
          type="text"
          autoComplete="name"
          maxLength={120}
          value={draft.customer_name ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, customer_name: e.target.value }))}
          aria-describedby={errors.customer_name ? "customer_name_error" : undefined}
          aria-invalid={errors.customer_name ? true : undefined}
        />
        <FieldError id="customer_name_error" message={errors.customer_name} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel id="customer_email" required>
            Email
          </FieldLabel>
          <Input
            id="customer_email"
            type="email"
            autoComplete="email"
            maxLength={200}
            value={draft.customer_email ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, customer_email: e.target.value }))}
            aria-describedby={errors.customer_email ? "customer_email_error" : undefined}
            aria-invalid={errors.customer_email ? true : undefined}
          />
          <FieldError id="customer_email_error" message={errors.customer_email} />
        </div>
        <div>
          <FieldLabel id="customer_phone" required>
            Telefon
          </FieldLabel>
          <Input
            id="customer_phone"
            type="tel"
            autoComplete="tel"
            placeholder="+385 ili 0..."
            value={draft.customer_phone ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, customer_phone: e.target.value }))}
            aria-describedby={errors.customer_phone ? "customer_phone_error" : undefined}
            aria-invalid={errors.customer_phone ? true : undefined}
          />
          <FieldError id="customer_phone_error" message={errors.customer_phone} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel id="customer_postcode" required>
            Poštanski broj
          </FieldLabel>
          <Input
            id="customer_postcode"
            type="text"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            autoComplete="postal-code"
            value={draft.customer_postcode ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                customer_postcode: e.target.value.replace(/\D/g, "").slice(0, 5),
              }))
            }
            aria-describedby={
              errors.customer_postcode ? "customer_postcode_error" : "postcode_status"
            }
            aria-invalid={errors.customer_postcode ? true : undefined}
          />
          <FieldError id="customer_postcode_error" message={errors.customer_postcode} />
          {!errors.customer_postcode && postcodeStatus !== "idle" ? (
            <p id="postcode_status" className="text-text-muted mt-1 text-xs" aria-live="polite">
              {postcodeStatus === "loading" && "Tražim županiju…"}
              {postcodeStatus === "ok" && "Županija auto-popunjena."}
              {postcodeStatus === "miss" && "Nije pronađeno — odaberi ručno."}
            </p>
          ) : null}
        </div>
        <div>
          <FieldLabel id="customer_county_id" required>
            Županija
          </FieldLabel>
          <Select
            id="customer_county_id"
            value={draft.customer_county_id ?? ""}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                customer_county_id: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            aria-describedby={errors.customer_county_id ? "customer_county_id_error" : undefined}
            aria-invalid={errors.customer_county_id ? true : undefined}
          >
            <option value="">— odaberi županiju —</option>
            {counties.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <FieldError id="customer_county_id_error" message={errors.customer_county_id} />
        </div>
      </div>

      <div>
        <FieldLabel id="preferred_contact_method" required>
          Preferirani način kontakta
        </FieldLabel>
        <Select
          id="preferred_contact_method"
          value={draft.preferred_contact_method ?? ""}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              preferred_contact_method: e.target.value
                ? (e.target.value as ContactMethod)
                : undefined,
            }))
          }
          aria-describedby={
            errors.preferred_contact_method ? "preferred_contact_method_error" : undefined
          }
          aria-invalid={errors.preferred_contact_method ? true : undefined}
        >
          <option value="">— odaberi —</option>
          {CONTACT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <FieldError id="preferred_contact_method_error" message={errors.preferred_contact_method} />
      </div>

      <div>
        <FieldLabel id="best_contact_time">Najbolje vrijeme za kontakt (opcijski)</FieldLabel>
        <Select
          id="best_contact_time"
          value={draft.best_contact_time ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, best_contact_time: e.target.value }))}
        >
          <option value="">— bilo kada —</option>
          {TIME_HINT_OPTIONS.map((o) => (
            <option key={o.value} value={o.label}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </fieldset>
  );
}
