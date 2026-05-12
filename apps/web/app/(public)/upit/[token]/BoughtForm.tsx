"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { markBoughtAction } from "./actions";

export default function BoughtForm({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <p
        className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm"
        role="status"
      >
        Hvala što si nam javio. Dileri više neće biti podsjećani na ovaj upit.
      </p>
    );
  }

  if (!open) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Kupio sam vozilo!
      </Button>
    );
  }

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await markBoughtAction(token, formData);
      if (res.ok) setDone(true);
      else
        setError(
          res.error === "rate_limited"
            ? "Previše pokušaja. Pokušaj kasnije."
            : "Nije uspjelo. Provjeri unos.",
        );
    });
  }

  return (
    <form action={submit} className="space-y-3">
      <p className="text-text-muted text-sm">
        Reci nam ukratko što si kupio — pomaže nam poboljšati sustav.
      </p>

      <div className="space-y-1.5">
        <label htmlFor="bought-where" className="text-sm font-medium">
          Gdje si kupio?
        </label>
        <Select id="bought-where" name="where" required defaultValue="">
          <option value="">— odaberi —</option>
          <option value="vozilla">Preko vozilla.hr dilera</option>
          <option value="elsewhere">Drugdje</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="bought-brand" className="text-sm font-medium">
            Marka (opcijski)
          </label>
          <Input id="bought-brand" name="brand" type="text" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="bought-model" className="text-sm font-medium">
            Model (opcijski)
          </label>
          <Input id="bought-model" name="model" type="text" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="bought-notes" className="text-sm font-medium">
          Bilješka (opcijski)
        </label>
        <Textarea id="bought-notes" name="notes" rows={3} maxLength={1000} />
      </div>

      {error ? (
        <p
          className="border-state-error/30 bg-state-error/5 rounded-md border p-3 text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Spremam…" : "Pošalji"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          Otkaži
        </Button>
      </div>
    </form>
  );
}
