"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { resetPasswordAction, type ResetActionState } from "./actions";

const initialState: ResetActionState = { status: "idle" };

export default function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="token" value={token} />
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="hp-reset-website">Website</label>
        <input
          id="hp-reset-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Nova lozinka
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          aria-invalid={state.status === "error"}
        />
        <p className="text-text-muted text-xs">Minimalno 10 znakova.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password_confirm" className="text-sm font-medium">
          Potvrdi novu lozinku
        </label>
        <Input
          id="password_confirm"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
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
        {pending ? "Spremam…" : "Postavi novu lozinku"}
      </Button>
    </form>
  );
}
