import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Upit zaprimljen",
  // Success page is a personal landing for the customer — no point indexing.
  robots: { index: false, follow: false },
};

type SearchParams = { id?: string };

const DISPLAY_ID_RE = /^VZ-\d{4}-\d{2}-\d{2}-[A-Z2-9]{4}$/;

export default async function UspjehPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const validId = params.id && DISPLAY_ID_RE.test(params.id) ? params.id : null;

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <CheckCircle2 className="text-brand-accent mx-auto h-12 w-12" aria-hidden="true" />
        <Heading level={1} className="mt-4">
          Hvala! Upit je zaprimljen.
        </Heading>

        {validId ? (
          <p className="text-text mt-4 text-lg">
            Tvoj broj upita: <strong>{validId}</strong>
          </p>
        ) : (
          <p className="text-text-muted mt-4 text-base">
            Upit je zabilježen. Detalje smo poslali na tvoj email.
          </p>
        )}

        <div className="border-surface-border mt-8 rounded-md border p-6 text-left">
          <Heading level={2} className="text-lg">
            Što sad?
          </Heading>
          <ul className="text-text mt-4 space-y-2 text-sm">
            <li>✉️ Provjeri email — poslali smo ti potvrdu i osobni link za praćenje upita.</li>
            <li>⏱️ Naš tim će u sljedećih 24-48h proslijediti upit prema 3-5 odabranih dilera.</li>
            <li>
              📞 Dileri će te direktno kontaktirati na tvoj email ili telefon, ovisno o postavkama.
            </li>
            <li>
              📨 Ako u idućem danu ne primiš poruku, provjeri spam folder. Tracker link iz emaila
              uvijek prikazuje aktualan status.
            </li>
          </ul>
        </div>
      </div>
    </Container>
  );
}
