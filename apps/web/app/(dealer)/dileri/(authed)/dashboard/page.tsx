import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { requireDealer } from "@/lib/dealer/auth";
import {
  fetchDealerAssignments,
  pickStats,
  type DashboardAssignment,
  type DashboardStats,
} from "@/lib/dealer/dashboard-data";
import { formatPrice } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false, nocache: true },
};

type SearchParams = Promise<{ status?: string }>;

const STATUS_OPTIONS: Array<{
  value: "all" | "sent" | "viewed" | "contacted" | "closed";
  label: string;
}> = [
  { value: "all", label: "Sve" },
  { value: "sent", label: "Novo" },
  { value: "viewed", label: "Pregledano" },
  { value: "contacted", label: "Kontaktirano" },
  { value: "closed", label: "Zatvoreno" },
];

const STATUS_LABEL: Record<DashboardAssignment["status"], string> = {
  sent: "Novo",
  viewed: "Pregledano",
  contacted: "Kontaktirano",
  closed: "Zatvoreno",
};

export default async function DealerDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { dealer } = await requireDealer("/dileri/dashboard");
  const { status } = await searchParams;
  const filter = normalizeFilter(status);

  const stats = pickStats(dealer);
  const assignments = await fetchDealerAssignments({
    dealerId: dealer.id as number,
    statusFilter: filter,
    limit: 200,
  });

  return (
    <Container className="py-10">
      <div className="space-y-8">
        <div>
          <Heading level={1}>Dashboard</Heading>
          <p className="text-text-muted mt-1 text-sm">
            Lijepa večer, {dealer.legal_name}. Ovdje su tvoji aktivni leadovi.
          </p>
        </div>

        <StatsRow stats={stats} />

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <Heading level={2} className="text-xl">
              Leadovi
            </Heading>
            <StatusFilter active={filter} />
          </div>

          {assignments.length === 0 ? (
            <p className="border-surface-border text-text-muted rounded-md border border-dashed p-8 text-center text-sm">
              Nema leadova za odabrani filter. Kad ti admin dodijeli novi upit, pojavit će se ovdje.
            </p>
          ) : (
            <AssignmentsTable assignments={assignments} />
          )}
        </section>
      </div>
    </Container>
  );
}

function normalizeFilter(
  input: string | undefined,
): "all" | "sent" | "viewed" | "contacted" | "closed" {
  if (input === "sent" || input === "viewed" || input === "contacted" || input === "closed")
    return input;
  return "all";
}

function StatsRow({ stats }: { stats: DashboardStats }) {
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard
        label="Leadova ovaj mjesec"
        value={`${stats.monthlyLeadCount}${stats.monthlyLeadCap > 0 ? ` / ${stats.monthlyLeadCap}` : ""}`}
      />
      <StatCard label="Conversion rate" value={`${(stats.conversionRate * 100).toFixed(1)}%`} />
      <StatCard
        label="Prosj. odgovor"
        value={stats.avgResponseTimeHours > 0 ? `${stats.avgResponseTimeHours.toFixed(1)} h` : "—"}
      />
      <StatCard
        label="Prosj. ocjena"
        value={stats.avgRating > 0 ? `${stats.avgRating.toFixed(2)} / 5` : "—"}
      />
    </dl>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-surface-border bg-surface rounded-md border p-4">
      <dt className="text-text-muted text-xs uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-xl font-semibold">{value}</dd>
    </div>
  );
}

function StatusFilter({ active }: { active: "all" | "sent" | "viewed" | "contacted" | "closed" }) {
  return (
    <div className="flex flex-wrap gap-1.5 text-sm">
      {STATUS_OPTIONS.map((opt) => {
        const isActive = active === opt.value;
        const href =
          opt.value === "all" ? "/dileri/dashboard" : `/dileri/dashboard?status=${opt.value}`;
        return (
          <Link
            key={opt.value}
            href={href}
            className={`rounded-md border px-3 py-1 ${
              isActive
                ? "border-brand-accent bg-brand-accent text-brand-primary font-medium"
                : "border-surface-border bg-surface text-text-muted hover:text-text"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}

function AssignmentsTable({ assignments }: { assignments: DashboardAssignment[] }) {
  return (
    <div className="border-surface-border overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-surface-muted text-text-muted text-left text-xs uppercase tracking-wide">
          <tr>
            <th scope="col" className="px-3 py-2">
              Status
            </th>
            <th scope="col" className="px-3 py-2">
              ID
            </th>
            <th scope="col" className="px-3 py-2">
              Kupac
            </th>
            <th scope="col" className="px-3 py-2">
              Vozilo
            </th>
            <th scope="col" className="px-3 py-2">
              Cijena
            </th>
            <th scope="col" className="px-3 py-2">
              Konkurencija
            </th>
            <th scope="col" className="px-3 py-2">
              Poslano
            </th>
            <th scope="col" className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-surface-border divide-y">
          {assignments.map((a) => (
            <tr key={a.id} className="bg-surface">
              <td className="px-3 py-2">
                <StatusBadge status={a.status} />
              </td>
              <td className="px-3 py-2 font-mono text-xs">{a.displayId || `#${a.leadId}`}</td>
              <td className="px-3 py-2">{a.customerName || "—"}</td>
              <td className="px-3 py-2">{[a.brand, a.model].filter(Boolean).join(" ") || "—"}</td>
              <td className="px-3 py-2">{formatPriceRange(a.priceMin, a.priceMax)}</td>
              <td className="text-text-muted px-3 py-2">
                {a.competitorCount > 0 ? `+ ${a.competitorCount}` : "samo ti"}
              </td>
              <td className="text-text-muted px-3 py-2">{formatRelative(a.sentAt)}</td>
              <td className="px-3 py-2 text-right">
                <Link
                  href={`/dileri/lead/${a.leadId}`}
                  className="text-brand-accent hover:underline"
                >
                  Otvori →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: DashboardAssignment["status"] }) {
  const tones: Record<DashboardAssignment["status"], string> = {
    sent: "bg-state-info/10 text-state-info border-state-info/30",
    viewed: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    contacted: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    closed: "bg-surface-muted text-text-muted border-surface-border",
  };
  return (
    <span className={`inline-block rounded-md border px-2 py-0.5 text-xs ${tones[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function formatPriceRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return "—";
  if (min !== null && max !== null) return `${formatPrice(min)} – ${formatPrice(max)}`;
  if (min !== null) return `od ${formatPrice(min)}`;
  return `do ${formatPrice(max!)}`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const hours = diffMs / (60 * 60 * 1000);
  if (hours < 1) return "< 1h";
  if (hours < 24) return `${Math.floor(hours)}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
