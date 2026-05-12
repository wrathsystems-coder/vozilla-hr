"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { updateProfileAction, type ProfileActionState } from "./actions";

type County = { id: number; name: string };

type Props = {
  initial: {
    phone: string;
    street: string;
    city: string;
    postcode: string;
    countyId: number | null;
  };
  counties: County[];
};

const initialState: ProfileActionState = { status: "idle" };

export default function ProfileForm({ initial, counties }: Props) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={action} className="space-y-4">
      {state.status === "success" ? (
        <p
          className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm"
          role="status"
        >
          Spremljeno.
        </p>
      ) : null}
      {state.status === "error" ? (
        <p
          className="border-state-error/30 bg-state-error/5 rounded-md border p-3 text-sm"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <Field label="Telefon" name="phone" error={getFieldError(state, "phone")}>
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initial.phone}
          autoComplete="tel"
          required
        />
      </Field>

      <Field label="Ulica" name="street" error={getFieldError(state, "street")}>
        <Input
          id="street"
          name="street"
          type="text"
          defaultValue={initial.street}
          autoComplete="address-line1"
          required
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Grad" name="city" error={getFieldError(state, "city")}>
          <Input
            id="city"
            name="city"
            type="text"
            defaultValue={initial.city}
            autoComplete="address-level2"
            required
          />
        </Field>
        <Field label="Poštanski broj" name="postcode" error={getFieldError(state, "postcode")}>
          <Input
            id="postcode"
            name="postcode"
            type="text"
            inputMode="numeric"
            defaultValue={initial.postcode}
            autoComplete="postal-code"
            required
          />
        </Field>
      </div>

      <Field label="Županija" name="county_id" error={getFieldError(state, "county_id")}>
        <Select
          id="county_id"
          name="county_id"
          defaultValue={initial.countyId !== null ? String(initial.countyId) : ""}
          required
        >
          <option value="">— odaberi županiju —</option>
          {counties.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Spremam…" : "Spremi promjene"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-state-error text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function getFieldError(state: ProfileActionState, field: string): string | undefined {
  if (state.status !== "error") return undefined;
  return state.fieldErrors?.[field];
}
