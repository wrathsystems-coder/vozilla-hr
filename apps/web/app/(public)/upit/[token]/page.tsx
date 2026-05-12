import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle, Mail, MessageCircle, Phone } from "lucide-react";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { validateToken } from "@/lib/magic-link";
import { loadTrackerData, type TrackerAssignment } from "@/lib/leads/tracker-data";
import BoughtForm from "./BoughtForm";
import CancelButton from "./CancelButton";
import DealerInterestButtons from "./DealerInterestButtons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Praćenje upita",
  // Token-bearing URL — never index, never follow.
  robots: { index: false, follow: false, nocache: true },
  // Keep referrer scope tight so the token doesn't leak to outbound links.
  referrer: "strict-origin",
};

const ASSIGNMENT_STATUS_LABEL: Record<TrackerAssignment["status"], string> = {
  sent: "Diler je obaviješten",
  viewed: "Diler je pregledao upit",
  contacted: "Diler te kontaktirao",
  closed: "Diler je zatvorio kontakt",
};

function fmtDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("hr-HR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function TrackerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const validated = await validateToken(token, "lead_tracker");

  if (!validated.valid) {
    return <ExpiredOrInvalid reason={validated.reason} />;
  }

  const leadId = Number(validated.entityId);
  const data = await loadTrackerData(leadId);
  if (!data) return <ExpiredOrInvalid reason="not_found" />;

  const { lead, assignments } = data;
  const isCancelled = lead.status === "closed";

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <header>
          <p className="text-text-muted text-sm">Praćenje upita</p>
          <Heading level={1} className="mt-1">
            {lead.display_id}
          </Heading>
          <p className="text-text-muted mt-2 text-sm">
            Status: <strong>{statusLabel(lead.status)}</strong>
          </p>
        </header>

        {isCancelled ? (
          <div className="border-state-error/30 bg-state-error/5 rounded-md border p-5">
            <Heading level={2} className="text-base">
              Upit je otkazan.
            </Heading>
            <p className="text-text mt-2 text-sm">
              Tvoji osobni podaci su anonimizirani. Hard delete iz baze izvršava se unutar 30 dana
              kako nalaže GDPR. Ako trebaš dodatne informacije, kontaktiraj nas preko stranice{" "}
              <Link href="/kontakt" className="underline">
                Kontakt
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <Timeline lead={lead} />
            <Dealers assignments={assignments} token={token} />
            <Bought token={token} />
            <Actions token={token} />
          </>
        )}
      </div>
    </Container>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "new":
      return "Zaprimljeno";
    case "under_review":
      return "Na pregledu";
    case "in_progress":
      return "U obradi";
    case "sent":
      return "Poslano dilerima";
    case "closed":
      return "Otkazano";
    case "spam":
      return "Označeno kao spam";
    default:
      return status;
  }
}

function Timeline({ lead }: { lead: { status: string; createdAt?: string } }) {
  const steps = [
    {
      key: "received",
      label: "Zaprimljeno",
      date: lead.createdAt ? fmtDateTime(lead.createdAt) : null,
      done: true,
    },
    {
      key: "review",
      label: "U obradi",
      date: null,
      done: ["under_review", "in_progress", "sent"].includes(lead.status),
      current: ["under_review", "in_progress"].includes(lead.status),
    },
    {
      key: "sent",
      label: "Poslano dilerima",
      date: null,
      done: lead.status === "sent",
      current: lead.status === "sent",
    },
  ];

  return (
    <ol className="space-y-3">
      {steps.map((s) => (
        <li key={s.key} className="flex items-start gap-3">
          {s.done ? (
            <CheckCircle2 className="text-brand-accent mt-0.5 h-5 w-5" aria-hidden="true" />
          ) : (
            <Circle className="text-text-muted mt-0.5 h-5 w-5" aria-hidden="true" />
          )}
          <div>
            <p className={s.done ? "text-text font-medium" : "text-text-muted"}>{s.label}</p>
            {s.date ? <p className="text-text-muted text-xs">{s.date}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Dealers({ assignments, token }: { assignments: TrackerAssignment[]; token: string }) {
  if (assignments.length === 0) {
    return (
      <section className="border-surface-border bg-surface-muted rounded-md border p-5">
        <Heading level={2} className="text-base">
          Tvoji dileri
        </Heading>
        <p className="text-text-muted mt-2 text-sm">
          Naš tim još nije proslijedio upit. Email s obavijesti dolazi čim diler primi upit.
        </p>
      </section>
    );
  }

  return (
    <section>
      <Heading level={2} className="text-lg">
        Tvoji dileri ({assignments.length})
      </Heading>
      <ul className="mt-4 space-y-3">
        {assignments.map((a) => (
          <li
            key={a.id}
            className="border-surface-border bg-surface space-y-2 rounded-md border p-4"
          >
            <p className="text-text font-medium">
              {a.dealerName}
              {a.dealerCity ? ` · ${a.dealerCity}` : ""}
            </p>
            <p className="text-text-muted text-sm">{ASSIGNMENT_STATUS_LABEL[a.status]}</p>
            <DealerTimestamps assignment={a} />
            {a.status !== "closed" ? (
              <div className="pt-1">
                <DealerInterestButtons
                  token={token}
                  assignmentId={a.id}
                  initialInterested={a.markedInterested}
                  initialNotInterested={a.markedNotInterested}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Bought({ token }: { token: string }) {
  return (
    <section className="border-surface-border space-y-3 rounded-md border p-5">
      <Heading level={2} className="text-base">
        Jesi li kupio vozilo?
      </Heading>
      <p className="text-text-muted text-sm">
        Ako si kupio vozilo (preko nas ili negdje drugdje), javi nam — zaustavit ćemo dalje
        kontaktiranje od strane dilera.
      </p>
      <BoughtForm token={token} />
    </section>
  );
}

function DealerTimestamps({ assignment }: { assignment: TrackerAssignment }) {
  const items = [
    { label: "Poslano", at: assignment.sentAt, icon: Mail },
    { label: "Pregledano", at: assignment.viewedAt, icon: MessageCircle },
    { label: "Kontaktirano", at: assignment.contactedAt, icon: Phone },
  ].filter((i) => i.at);

  if (items.length === 0) return null;
  return (
    <ul className="text-text-muted mt-2 space-y-1 text-xs">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <i.icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {i.label}: {fmtDateTime(i.at)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Actions({ token }: { token: string }) {
  return (
    <section className="border-surface-border space-y-3 rounded-md border p-5">
      <Heading level={2} className="text-base">
        Trebaš nešto promijeniti?
      </Heading>
      <p className="text-text-muted text-sm">
        Ako više nisi zainteresiran ili želiš da brišemo tvoj upit iz našeg sustava, otkaži ga
        ovdje. Akcija je nepovratna.
      </p>
      <CancelButton token={token} />
    </section>
  );
}

function ExpiredOrInvalid({ reason }: { reason: string }) {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-xl text-center">
        <Heading level={1}>Link nije aktivan</Heading>
        <p className="text-text-muted mt-3 text-base">
          {reason === "expired"
            ? "Tracking link je istekao."
            : "Link nije pronađen ili više nije aktivan."}{" "}
          Možeš zatražiti novi link emailom.
        </p>
        <Link
          href="/provjeri-upit"
          className="bg-brand-accent text-brand-primary mt-6 inline-block rounded-md px-5 py-3 text-sm font-semibold"
        >
          Zatraži novi link
        </Link>
      </div>
    </Container>
  );
}
