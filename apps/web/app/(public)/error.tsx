"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // No-op when SENTRY_DSN is empty (MVP default). Reporting the
    // server-supplied digest helps correlate with server-side traces.
    Sentry.captureException(error);
  }, [error]);

  return (
    <Container className="py-20 text-center">
      <p className="text-text-muted text-sm font-semibold">500</p>
      <Heading level={1} className="mt-2">
        Došlo je do greške
      </Heading>
      <p className="text-text-muted mx-auto mt-4 max-w-xl">
        Pokušajte ponovno za nekoliko trenutaka. Ako se problem nastavi, javite nam.
      </p>
      {error.digest && (
        <p className="text-text-muted mt-2 font-mono text-xs">Šifra: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button onClick={reset} variant="primary" size="lg">
          Pokušaj ponovno
        </Button>
        <Link
          href="/kontakt"
          className="bg-surface-muted text-text hover:bg-surface-border focus-visible:outline-brand-accent inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Kontakt
        </Link>
      </div>
    </Container>
  );
}
