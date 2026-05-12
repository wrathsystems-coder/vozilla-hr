"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import { markDealerInterestAction } from "./actions";

type Props = {
  token: string;
  assignmentId: number;
  initialInterested: boolean;
  initialNotInterested: boolean;
};

export default function DealerInterestButtons({
  token,
  assignmentId,
  initialInterested,
  initialNotInterested,
}: Props) {
  const [interested, setInterested] = useState(initialInterested);
  const [notInterested, setNotInterested] = useState(initialNotInterested);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function mark(value: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await markDealerInterestAction(token, assignmentId, value);
      if (res.ok) {
        setInterested(value);
        setNotInterested(!value);
      } else {
        setError("Nije uspjelo. Pokušaj ponovno.");
      }
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={interested ? "primary" : "secondary"}
          size="sm"
          disabled={pending}
          onClick={() => mark(true)}
          aria-pressed={interested}
        >
          {interested ? "✓ Zainteresiran" : "Zainteresiran"}
        </Button>
        <Button
          type="button"
          variant={notInterested ? "primary" : "secondary"}
          size="sm"
          disabled={pending}
          onClick={() => mark(false)}
          aria-pressed={notInterested}
        >
          {notInterested ? "✓ Nezainteresiran" : "Nezainteresiran"}
        </Button>
      </div>
      {error ? (
        <p className="text-state-error text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
