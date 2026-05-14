import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";
import { eq } from "drizzle-orm";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { requireAdmin } from "@/lib/admin/auth";
import { getDb } from "@/lib/db/client";
import { counties } from "@/lib/db/schema";
import { suggestDealersForLead } from "@/lib/lead-distribution/suggest";
import { scoreBreakdown } from "@/lib/lead-distribution/score";
import { loadLeadDistributionConfig } from "@/lib/lead-distribution/config";
import type { Brand, Dealer, LeadRequest, Model } from "@/payload-types";
import DispatchForm, { type SuggestedDealerVm } from "./DispatchForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Otpremi lead",
  robots: { index: false, follow: false, nocache: true },
};

type Params = Promise<{ lead_id: string }>;

export default async function LeadDispatchPage({ params }: { params: Params }) {
  const { lead_id } = await params;
  const leadId = Number(lead_id);
  if (!Number.isInteger(leadId) || leadId <= 0) notFound();

  await requireAdmin(`/admin-tools/lead-dispatch/${leadId}`);

  const payload = await getPayload({ config });
  let lead: LeadRequest;
  try {
    lead = (await payload.findByID({
      collection: "lead_requests",
      id: leadId,
      depth: 1,
    })) as LeadRequest;
  } catch {
    notFound();
  }

  // We need a lat/lng for the lead. The wizard stores postcode + county,
  // not coordinates — for Sprint 4 we use the dealer-side seed lat/lng
  // and approximate the customer's location with the seed for their
  // postcode prefix. Sprint 6 polish: geocode postcode → centroid.
  const customerCenter = await deriveCustomerLatLng(lead);
  const cfg = loadLeadDistributionConfig();
  const brandRel = lead.brand;
  const brandId =
    typeof brandRel === "number" ? brandRel : ((brandRel as Brand | null)?.id ?? null);

  const suggestion = await suggestDealersForLead({
    lead: { lat: customerCenter.lat, lng: customerCenter.lng, brandId },
    radiusKm: 200,
  });

  // Hydrate VM with full dealer info for the UI.
  const dealersById = await fetchDealersByIds(
    payload,
    suggestion.suggested.map((s) => s.dealer.id),
  );
  const suggestionsVm: SuggestedDealerVm[] = suggestion.suggested.map((s) => {
    const fullDealer = dealersById.get(s.dealer.id);
    const breakdown = scoreBreakdown(s.dealer, cfg.weights);
    return {
      dealerId: s.dealer.id,
      dealerName: fullDealer?.legal_name ?? "Partner",
      city: fullDealer?.address?.city ?? null,
      distanceKm: s.distanceKm,
      qualityScore: s.qualityScore,
      isClosest: s.isClosest,
      reason: s.reason,
      scoring: {
        avgRating: s.dealer.avg_rating ?? 0,
        avgResponseTimeHours: s.dealer.avg_response_time_hours ?? 0,
        conversionRate: s.dealer.conversion_rate ?? 0,
        currentLoad: s.dealer.current_month_leads ?? 0,
        monthlyCap: s.dealer.monthly_lead_cap ?? 0,
        throttleFactor: breakdown.throttle,
      },
    };
  });

  const brandLabel = brandRel && typeof brandRel !== "number" ? (brandRel as Brand).name : "—";
  const modelRel = lead.model;
  const modelLabel = modelRel && typeof modelRel !== "number" ? (modelRel as Model).name : "—";

  const isAlreadyDispatched = lead.status === "sent";
  const isClosed = lead.status === "closed";

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-text-muted text-sm">Admin tools · Lead dispatch</p>
            <Heading level={1} className="mt-1">
              {lead.display_id}
            </Heading>
          </div>
          <Link href="/admin" className="text-text-muted text-sm underline">
            Natrag na admin
          </Link>
        </header>

        <section className="border-surface-border bg-surface rounded-md border p-5">
          <Heading level={2} className="text-base">
            Lead summary
          </Heading>
          <dl className="text-text mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <Field label="Status" value={lead.status} />
            <Field label="Source" value={lead.source ?? "—"} />
            <Field label="reCAPTCHA" value={String(lead.recaptcha_score ?? "—")} />
            <Field label="Tip" value={lead.request_type} />
            <Field label="Marka" value={brandLabel} />
            <Field label="Model" value={modelLabel} />
            <Field label="Cijena" value={`${lead.price_min ?? "—"} – ${lead.price_max ?? "—"} €`} />
            <Field label="Financing" value={lead.financing_type ?? "—"} />
            <Field label="Time-frame" value={lead.time_frame ?? "—"} />
            <Field label="Kupac" value={lead.customer_name ?? "—"} />
            <Field label="Email" value={lead.customer_email ?? "—"} />
            <Field label="Telefon" value={lead.customer_phone ?? "—"} />
            <Field
              label="Lokacija"
              value={`PB ${lead.customer_postcode ?? "—"} (county ${lead.customer_county_id ?? "—"})`}
            />
            <Field
              label="Kontakt"
              value={`${lead.preferred_contact_method ?? "—"} ${lead.best_contact_time ? `· ${lead.best_contact_time}` : ""}`}
            />
          </dl>
        </section>

        {isClosed ? (
          <p className="border-state-error/30 bg-state-error/5 rounded-md border p-4 text-sm">
            Lead je zatvoren (otkazan ili spam) — dispatch nije dostupan.
          </p>
        ) : isAlreadyDispatched ? (
          <p className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
            Lead je već poslan partnerima. Dodatni dispatch ide preko ručnog odabira (re-send će
            preskočiti dilere kojima je već poslan).
          </p>
        ) : null}

        <section>
          <Heading level={2} className="text-base">
            Auto-suggest 5 partnera
          </Heading>
          <p className="text-text-muted mt-1 text-xs">
            Algoritam: 1/response × {cfg.weights.w_response} + conversion ×{" "}
            {cfg.weights.w_conversion} + rating/5 × {cfg.weights.w_rating} + capacity ×{" "}
            {cfg.weights.w_capacity} (Carwow rule: najbliži uvijek u top-N).
          </p>
          <div className="mt-4">
            <DispatchForm
              leadId={leadId}
              suggestions={suggestionsVm}
              warnings={suggestion.warnings}
            />
          </div>
        </section>
      </div>
    </Container>
  );
}

function Field({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <dt className="text-text-muted text-xs">{label}</dt>
      <dd className="font-medium">{value ?? "—"}</dd>
    </div>
  );
}

async function fetchDealersByIds(
  payload: Awaited<ReturnType<typeof getPayload>>,
  ids: number[],
): Promise<Map<number, Dealer>> {
  if (ids.length === 0) return new Map();
  const result = await payload.find({
    collection: "dealers",
    where: { id: { in: ids } },
    limit: ids.length,
    depth: 0,
  });
  return new Map((result.docs as Dealer[]).map((d) => [d.id as number, d]));
}

const COUNTY_CENTROIDS: Record<number, { lat: number; lng: number }> = {
  21: { lat: 45.815, lng: 15.9819 }, // Grad Zagreb
  17: { lat: 43.5081, lng: 16.4402 }, // Splitsko-dalmatinska
  8: { lat: 45.3271, lng: 14.4422 }, // Primorsko-goranska (Rijeka)
  14: { lat: 45.555, lng: 18.6955 }, // Osječko-baranjska
  13: { lat: 44.1194, lng: 15.2314 }, // Zadarska
  18: { lat: 44.8666, lng: 13.8496 }, // Istarska
};

const DEFAULT_CENTROID = { lat: 45.815, lng: 15.9819 }; // Zagreb fallback

async function deriveCustomerLatLng(lead: LeadRequest): Promise<{ lat: number; lng: number }> {
  // Sprint 4: county centroid lookup via the seeded counties + a static
  // map of major-city coords. Sprint 6 polish: real postcode → lat/lng.
  const countyId = lead.customer_county_id as number | undefined;
  if (countyId && COUNTY_CENTROIDS[countyId]) return COUNTY_CENTROIDS[countyId];

  // Fall back to a county lookup so we don't 500 on unseeded counties.
  if (countyId) {
    try {
      const [row] = await getDb()
        .select({ slug: counties.slug })
        .from(counties)
        .where(eq(counties.id, countyId))
        .limit(1);
      void row;
    } catch {
      /* ignore */
    }
  }
  return DEFAULT_CENTROID;
}
