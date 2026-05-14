import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { requireDealer } from "@/lib/dealer/auth";
import { loadLeadDetailForDealer } from "@/lib/dealer/lead-detail";
import { formatPrice } from "@/lib/utils/format";
import ActionsPanel from "./ActionsPanel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lead",
  robots: { index: false, follow: false, nocache: true },
};

type Params = Promise<{ id: string }>;

export default async function LeadDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isInteger(leadId) || leadId <= 0) notFound();

  const { dealer } = await requireDealer(`/partneri/lead/${leadId}`);
  const detail = await loadLeadDetailForDealer(leadId, dealer.id as number);
  if (!detail) notFound();

  const { lead, assignment, competitorCount, brand, model, responseRank } = detail;
  const vehicleLabel = [brand, model].filter(Boolean).join(" ") || "—";

  return (
    <Container className="py-10">
      <div className="space-y-8">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-text-muted text-sm">
              <Link href="/partneri/dashboard" className="underline">
                ← Dashboard
              </Link>
            </p>
            <Heading level={1} className="mt-1">
              {lead.display_id}
            </Heading>
            <p className="text-text-muted text-sm">
              {vehicleLabel} · {requestTypeLabel(lead.request_type)}
            </p>
          </div>
          <CompetitorBadge count={competitorCount} rank={responseRank} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <StatusTimeline assignment={assignment} />
            <CustomerSection lead={lead} />
            <VehicleSection lead={lead} vehicleLabel={vehicleLabel} />
            <FinancingSection lead={lead} />
            <TradeInSection lead={lead} />
          </div>

          <aside className="border-surface-border bg-surface space-y-6 rounded-md border p-5">
            <ActionsPanel
              leadId={leadId}
              status={assignment.status}
              initialNotes={assignment.dealer_notes ?? ""}
              initialOutcome={assignment.outcome ?? null}
              initialOutcomeReason={assignment.outcome_reason ?? ""}
            />
          </aside>
        </div>
      </div>
    </Container>
  );
}

function CompetitorBadge({
  count,
  rank,
}: {
  count: number;
  rank: { rank: number; total: number } | null;
}) {
  return (
    <div className="border-surface-border bg-surface rounded-md border p-3 text-right text-sm">
      <p className="text-text-muted text-xs uppercase tracking-wide">Konkurencija</p>
      <p className="font-medium">
        {count === 0
          ? "Samo ti"
          : `Lead poslan još ${count} ${count === 1 ? "partneru" : "partnera"}`}
      </p>
      {rank ? (
        <p className="text-text-muted mt-1 text-xs">
          Tvoj odgovor: <b>{rank.rank}.</b> od {rank.total} po brzini
        </p>
      ) : null}
    </div>
  );
}

function StatusTimeline({
  assignment,
}: {
  assignment: {
    status: "sent" | "viewed" | "contacted" | "closed";
    sent_at?: string | null;
    viewed_at?: string | null;
    contacted_at?: string | null;
    closed_at?: string | null;
  };
}) {
  const steps: Array<{ label: string; at: string | null | undefined; done: boolean }> = [
    { label: "Poslano", at: assignment.sent_at, done: true },
    {
      label: "Pregledano",
      at: assignment.viewed_at,
      done:
        assignment.status === "viewed" ||
        assignment.status === "contacted" ||
        assignment.status === "closed",
    },
    {
      label: "Kontaktirano",
      at: assignment.contacted_at,
      done: assignment.status === "contacted" || assignment.status === "closed",
    },
    { label: "Zatvoreno", at: assignment.closed_at, done: assignment.status === "closed" },
  ];
  return (
    <section className="border-surface-border bg-surface rounded-md border p-5">
      <h2 className="text-sm font-semibold">Status</h2>
      <ol className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {steps.map((s) => (
          <li key={s.label}>
            <p
              className={`text-xs ${s.done ? "text-emerald-700" : "text-text-muted"}`}
              aria-current={s.done ? "step" : undefined}
            >
              {s.done ? "✓ " : "○ "}
              {s.label}
            </p>
            <p className="text-text-muted text-xs">{formatStamp(s.at)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CustomerSection({
  lead,
}: {
  lead: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_postcode: string;
    preferred_contact_method?: "phone" | "email" | "whatsapp" | "any" | null;
    best_contact_time?: string | null;
  };
}) {
  return (
    <section className="border-surface-border bg-surface rounded-md border p-5">
      <h2 className="text-sm font-semibold">Kupac</h2>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Field label="Ime" value={lead.customer_name} />
        <Field
          label="Email"
          value={
            <a className="underline" href={`mailto:${lead.customer_email}`}>
              {lead.customer_email}
            </a>
          }
        />
        <Field
          label="Telefon"
          value={
            <a className="underline" href={`tel:${lead.customer_phone}`}>
              {lead.customer_phone}
            </a>
          }
        />
        <Field label="Poštanski broj" value={lead.customer_postcode} />
        <Field
          label="Preferirani kontakt"
          value={preferredContactLabel(lead.preferred_contact_method)}
        />
        <Field label="Najbolje vrijeme" value={lead.best_contact_time ?? "—"} />
      </dl>
    </section>
  );
}

function VehicleSection({
  lead,
  vehicleLabel,
}: {
  lead: {
    version_text?: string | null;
    comments?: string | null;
    year_from?: number | null;
    year_to?: number | null;
  };
  vehicleLabel: string;
}) {
  return (
    <section className="border-surface-border bg-surface rounded-md border p-5">
      <h2 className="text-sm font-semibold">Što traži</h2>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Field label="Vozilo" value={vehicleLabel} />
        <Field label="Verzija/spec" value={lead.version_text ?? "—"} />
        <Field
          label="Godina"
          value={
            lead.year_from || lead.year_to
              ? `${lead.year_from ?? "?"} – ${lead.year_to ?? "?"}`
              : "—"
          }
        />
        <Field label="Komentar" value={lead.comments ?? "—"} full />
      </dl>
    </section>
  );
}

function FinancingSection({
  lead,
}: {
  lead: {
    price_min?: number | null;
    price_max?: number | null;
    financing_type?: "cash" | "bank_loan" | "leasing" | "undecided" | null;
    leasing_type?: "operating" | "financial" | null;
    deposit?: number | null;
    period_months?: number | null;
    time_frame?: "immediate" | "1m" | "3m" | "6m" | "later" | null;
  };
}) {
  return (
    <section className="border-surface-border bg-surface rounded-md border p-5">
      <h2 className="text-sm font-semibold">Budget i financiranje</h2>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Field
          label="Cjenovni raspon"
          value={
            lead.price_min || lead.price_max
              ? `${lead.price_min ? formatPrice(lead.price_min) : "—"} – ${lead.price_max ? formatPrice(lead.price_max) : "—"}`
              : "—"
          }
        />
        <Field label="Tip financiranja" value={financingLabel(lead.financing_type)} />
        <Field label="Leasing tip" value={leasingTypeLabel(lead.leasing_type)} />
        <Field label="Polog" value={lead.deposit ? formatPrice(lead.deposit) : "—"} />
        <Field
          label="Period otplate"
          value={lead.period_months ? `${lead.period_months} mj` : "—"}
        />
        <Field label="Vremenski okvir" value={timeFrameLabel(lead.time_frame)} />
      </dl>
    </section>
  );
}

function TradeInSection({
  lead,
}: {
  lead: { has_trade_in?: boolean | null; trade_in_data?: unknown };
}) {
  if (!lead.has_trade_in) return null;
  const t = lead.trade_in_data as
    | {
        brand?: string | null;
        model?: string | null;
        year?: number | null;
        mileage_km?: number | null;
        condition?: string | null;
        estimated_value_eur?: number | null;
      }
    | undefined
    | null;
  return (
    <section className="border-surface-border bg-surface rounded-md border p-5">
      <h2 className="text-sm font-semibold">Trade-in</h2>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Field label="Marka" value={t?.brand ?? "—"} />
        <Field label="Model" value={t?.model ?? "—"} />
        <Field label="Godina" value={t?.year ?? "—"} />
        <Field
          label="Kilometraža"
          value={typeof t?.mileage_km === "number" ? `${t.mileage_km} km` : "—"}
        />
        <Field label="Stanje" value={t?.condition ?? "—"} />
        <Field
          label="Procjena"
          value={
            typeof t?.estimated_value_eur === "number" ? formatPrice(t.estimated_value_eur) : "—"
          }
        />
      </dl>
    </section>
  );
}

function Field({
  label,
  value,
  full = false,
}: {
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-text-muted text-xs">{label}</dt>
      <dd className="font-medium">{value ?? "—"}</dd>
    </div>
  );
}

function formatStamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("hr-HR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function preferredContactLabel(v: string | null | undefined): string {
  switch (v) {
    case "phone":
      return "Telefon";
    case "email":
      return "Email";
    case "whatsapp":
      return "WhatsApp";
    case "any":
      return "Bilo koje";
    default:
      return "—";
  }
}

function financingLabel(v: string | null | undefined): string {
  switch (v) {
    case "cash":
      return "Gotovina";
    case "bank_loan":
      return "Kredit banke";
    case "leasing":
      return "Leasing";
    case "undecided":
      return "Razmislit ću";
    default:
      return "—";
  }
}

function leasingTypeLabel(v: string | null | undefined): string {
  switch (v) {
    case "operating":
      return "Operativni leasing";
    case "financial":
      return "Financijski leasing";
    default:
      return "—";
  }
}

function timeFrameLabel(v: string | null | undefined): string {
  switch (v) {
    case "immediate":
      return "Odmah";
    case "1m":
      return "1 mjesec";
    case "3m":
      return "3 mjeseca";
    case "6m":
      return "6 mjeseci";
    case "later":
      return "Više od 6 mjeseci";
    default:
      return "—";
  }
}

function requestTypeLabel(v: string): string {
  switch (v) {
    case "new":
      return "Novo vozilo";
    case "used":
      return "Rabljeno";
    case "leasing":
      return "Leasing";
    case "unsure":
      return "Nisam siguran";
    default:
      return v;
  }
}
