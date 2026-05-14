"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { loginAction, type LoginActionState } from "./actions";

type Props = { redirectTo: string };

const initialState: LoginActionState = { status: "idle" };

export default function LoginForm({ redirectTo }: Props) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="redirect_to" value={redirectTo} />
      {/* Honeypot — invisible, bots fill it, real users don't. */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor="hp-website">Website</label>
        <input
          id="hp-website"
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

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Lozinka
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
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
        {pending ? "Prijavljujem…" : "Prijavi se"}
      </Button>
    </form>
  );
}
