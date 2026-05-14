"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { forgotPasswordAction, type ForgotActionState } from "./actions";

const initialState: ForgotActionState = { status: "idle" };

export default function ForgotForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.status === "success") {
    return (
      <p
        className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm"
        role="status"
      >
        Ako postoji nalog s tom email adresom, poslali smo upute za reset lozinke. Provjeri inbox (i
        spam folder). Link vrijedi 1 sat.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="hp-forgot-website">Website</label>
        <input
          id="hp-forgot-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          aria-invalid={state.status === "error"}
        />
      </div>

      {state.status === "error" ? (
        <p
          className="border-state-error/30 bg-state-error/5 rounded-md border p-3 text-sm"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Šaljem…" : "Pošalji link za reset"}
      </Button>
    </form>
  );
}
