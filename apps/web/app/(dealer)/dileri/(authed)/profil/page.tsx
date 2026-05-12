import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { getDb } from "@/lib/db/client";
import { counties } from "@/lib/db/schema";
import { requireDealer } from "@/lib/dealer/auth";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profil",
  robots: { index: false, follow: false, nocache: true },
};

export default async function DealerProfilePage() {
  const { dealer } = await requireDealer("/dileri/profil");

  const countyRows = await getDb()
    .select({ id: counties.id, name: counties.name })
    .from(counties)
    .orderBy(asc(counties.sortOrder));

  const addr = dealer.address ?? {
    street: "",
    city: "",
    postcode: "",
    county_id: null as number | null,
  };

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <Heading level={1}>Profil</Heading>
          <p className="text-text-muted mt-1 text-sm">
            Možeš urediti telefon i adresu. Pravne podatke (ime tvrtke, OIB, marke koje prodaješ)
            mijenja admin — pošalji nam mail ako trebaš izmjenu.
          </p>
        </div>

        <ReadOnlySummary dealer={dealer} />

        <ProfileForm
          initial={{
            phone: dealer.phone ?? "",
            street: addr.street ?? "",
            city: addr.city ?? "",
            postcode: addr.postcode ?? "",
            countyId: addr.county_id ?? null,
          }}
          counties={countyRows}
        />
      </div>
    </Container>
  );
}

function ReadOnlySummary({
  dealer,
}: {
  dealer: {
    legal_name: string;
    oib: string;
    email: string;
    is_verified?: boolean | null;
  };
}) {
  return (
    <section className="border-surface-border bg-surface rounded-md border p-5">
      <h2 className="text-sm font-semibold">Pravni podaci</h2>
      <dl className="text-text mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Row label="Naziv tvrtke" value={dealer.legal_name} />
        <Row label="OIB" value={dealer.oib} />
        <Row label="Email" value={dealer.email} />
        <Row label="Verifikacija" value={dealer.is_verified ? "Verificiran" : "U postupku"} />
      </dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-text-muted text-xs">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
