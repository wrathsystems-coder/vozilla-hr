"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { cancelLeadAction } from "./actions";

type Props = {
  token: string;
};

export default function CancelButton({ token }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await cancelLeadAction(token);
      if (!result.ok) {
        setError(result.error ?? "unknown");
        return;
      }
      // Page revalidation happens server-side; refresh to pick it up.
      router.refresh();
    });
  }

  if (!confirming) {
    return (
      <Button variant="ghost" type="button" onClick={() => setConfirming(true)}>
        Otkaži upit
      </Button>
    );
  }

  return (
    <div className="border-state-error/30 bg-state-error/5 space-y-3 rounded-md border p-4 text-sm">
      <p className="text-text">
        Otkazivanje briše tvoje osobne podatke iz našeg sustava i obavještava sve dilere koji su
        primili upit. Akcija se ne može poništiti. Hard delete sustav izvršava unutar 30 dana.
      </p>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Ne
        </Button>
        <Button type="button" onClick={onConfirm} disabled={pending}>
          {pending ? "Otkazujem…" : "Da, otkaži upit"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-state-error text-xs">
          Greška: {error}
        </p>
      ) : null}
    </div>
  );
}
