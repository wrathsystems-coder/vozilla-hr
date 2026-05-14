import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import Gallery from "@/components/used-cars/Gallery";
import ListingCard from "@/components/used-cars/ListingCard";
import {
  fetchSimilarListings,
  fetchUsedCarById,
  fetchUsedCarImages,
  type UsedCarDetail,
} from "@/lib/used-cars/fetch";
import { formatPrice, formatDate } from "@/lib/utils/format";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";
import { usedCarJsonLd } from "@/lib/seo/used-car-jsonld";
import type { Dealer } from "@/payload-types";

export const dynamic = "force-dynamic";

type Params = { id: string };

const CONDITION_LABEL: Record<string, string> = {
  excellent: "Odlično",
  good: "Vrlo dobro",
  fair: "Dobro",
  poor: "Slabije",
};

const FUEL_LABEL: Record<string, string> = {
  benzin: "Benzin",
  dizel: "Dizel",
  hibrid: "Hibrid",
  phev: "Plug-in hibrid",
  ev: "Električni",
  lpg: "LPG",
  cng: "CNG",
};

const TRANSMISSION_LABEL: Record<string, string> = {
  manual: "Manualni",
  automatic: "Automatski",
  dct: "DCT",
  cvt: "CVT",
};

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const numericId = Number.parseInt(id, 10);
  if (!Number.isFinite(numericId)) return { title: "Oglas" };
  const listing = await fetchUsedCarById(numericId);
  if (!listing) return { title: "Oglas" };
  const title = `${listing.model.brand.name} ${listing.model.name} (${listing.year})`;
  return {
    title,
    description: `${title} · ${listing.mileage_km.toLocaleString("hr-HR")} km · ${formatPrice(
      listing.price_eur,
      { decimals: 0 },
    )} · ${listing.location.city}`,
    alternates: { canonical: `/rabljena-vozila/oglas/${listing.id}` },
    // Detail of a (potentially individual) listing — leave robots default
    // (index, follow). When listing is sold/expired the page still renders
    // for direct visits but explicit canonical points here so duplicate
    // detection works as listings rotate.
  };
}

function contactHref(listing: UsedCarDetail): string {
  // Pre-fill the lead wizard with brand + model + listing id.
  const qs = new URLSearchParams({
    marka: listing.model.brand.slug,
    model: listing.model.slug,
    oglas: String(listing.id),
    izvor: "oglas",
  });
  return `/zatrazi-ponudu?${qs.toString()}`;
}

export default async function UsedCarDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const numericId = Number.parseInt(id, 10);
  if (!Number.isFinite(numericId) || numericId <= 0) notFound();

  const listing = await fetchUsedCarById(numericId);
  if (!listing) notFound();

  // Parallel fetch — gallery + similar are both depth=1+ Payload reads
  // and the page can't render the rail or hero until both land.
  const [images, similar] = await Promise.all([
    fetchUsedCarImages(numericId),
    fetchSimilarListings(listing),
  ]);

  const model = listing.model;
  const brand = model.brand;
  const dealer = isPopulated<Dealer>(listing.dealer) ? listing.dealer : null;

  const breadcrumbs = [
    { name: "Početna", href: "/" },
    { name: "Rabljena vozila", href: "/rabljena-vozila" },
    { name: model.body_type.name, href: `/rabljena-vozila?kategorija=${model.body_type.slug}` },
    { name: `${brand.name} ${model.name}` },
  ];

  const isClosed = listing.status === "sold" || listing.status === "expired";
  const title = `${brand.name} ${model.name}`;

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />
      <JsonLd data={usedCarJsonLd(listing)} />

      <section className="bg-surface py-8">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
            <Gallery images={images} bodyTypeSlug={model.body_type.slug} />

            <div className="space-y-5">
              <div>
                <p className="text-text-muted text-sm">{listing.year}</p>
                <Heading level={1} className="mt-1">
                  {title}
                </Heading>
                <p className="text-text-muted mt-1 text-sm">
                  {listing.mileage_km.toLocaleString("hr-HR")} km
                  {listing.color ? ` · ${listing.color}` : ""}
                  {" · "}
                  {CONDITION_LABEL[listing.condition] ?? listing.condition}
                </p>
              </div>

              {isClosed ? (
                <div className="border-state-error/30 bg-state-error/5 rounded-md border p-4">
                  <p className="text-text font-medium">
                    {listing.status === "sold" ? "Vozilo je prodano." : "Oglas je istekao."}
                  </p>
                  <p className="text-text-muted mt-1 text-sm">
                    Pogledaj slične oglase niže ili pretraži cijeli katalog.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-text text-3xl font-bold">
                    {formatPrice(listing.price_eur, { decimals: 0 })}
                  </p>
                  <Link
                    href={contactHref(listing)}
                    className="bg-brand-accent text-brand-primary block w-full rounded-md px-5 py-3 text-center text-sm font-semibold hover:opacity-90"
                  >
                    Kontaktiraj prodavatelja
                  </Link>
                </>
              )}

              <SellerBlock dealer={dealer} listing={listing} />

              <LocationBlock listing={listing} />
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-surface-muted py-10">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-8">
              <SpecsBlock listing={listing} />
              {listing.description_md ? <DescriptionBlock text={listing.description_md} /> : null}
            </div>

            <aside className="space-y-3">
              <Heading level={2} className="text-lg">
                Brzi pregled
              </Heading>
              <dl className="border-surface-border bg-surface space-y-2 rounded-md border p-4 text-sm">
                <Row label="ID oglasa" value={listing.public_id} />
                <Row label="Postavljeno" value={formatDate(listing.createdAt.slice(0, 10))} />
                {listing.expires_at ? (
                  <Row label="Vrijedi do" value={formatDate(listing.expires_at.slice(0, 10))} />
                ) : null}
              </dl>
            </aside>
          </div>
        </Container>
      </section>

      {similar.length > 0 ? (
        <section className="bg-surface py-10">
          <Container>
            <Heading level={2} className="text-xl">
              Slični oglasi
            </Heading>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <ListingCard key={s.id} listing={s} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}

function isPopulated<T extends { id: number }>(v: unknown): v is T {
  return typeof v === "object" && v !== null && "id" in (v as Record<string, unknown>);
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-text text-right font-medium">{value}</dd>
    </div>
  );
}

function SpecsBlock({ listing }: { listing: UsedCarDetail }) {
  const model = listing.model;
  const rows: { label: string; value: string }[] = [
    { label: "Marka", value: model.brand.name },
    { label: "Model", value: model.name },
    { label: "Karoserija", value: model.body_type.name },
    { label: "Godina", value: String(listing.year) },
    { label: "Kilometraža", value: `${listing.mileage_km.toLocaleString("hr-HR")} km` },
    { label: "Stanje", value: CONDITION_LABEL[listing.condition] ?? listing.condition },
  ];
  if (model.fuel_types && model.fuel_types.length > 0) {
    rows.push({
      label: "Pogon",
      value: model.fuel_types.map((f) => FUEL_LABEL[f] ?? f).join(", "),
    });
  }
  if (model.transmissions && model.transmissions.length > 0) {
    rows.push({
      label: "Mjenjač",
      value: model.transmissions.map((t) => TRANSMISSION_LABEL[t] ?? t).join(", "),
    });
  }
  if (listing.color) rows.push({ label: "Boja", value: listing.color });

  return (
    <div>
      <Heading level={2} className="text-xl">
        Specifikacije
      </Heading>
      <dl className="border-surface-border bg-surface mt-4 rounded-md border">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={
              "flex justify-between gap-4 px-4 py-3 text-sm" +
              (i < rows.length - 1 ? " border-surface-border border-b" : "")
            }
          >
            <dt className="text-text-muted">{r.label}</dt>
            <dd className="text-text text-right font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DescriptionBlock({ text }: { text: string }) {
  return (
    <div>
      <Heading level={2} className="text-xl">
        Opis
      </Heading>
      <p className="text-text mt-4 whitespace-pre-line leading-relaxed">{text}</p>
    </div>
  );
}

function SellerBlock({ dealer, listing }: { dealer: Dealer | null; listing: UsedCarDetail }) {
  if (dealer) {
    return (
      <div className="border-surface-border bg-surface rounded-md border p-4">
        <p className="text-text-muted text-xs uppercase tracking-wide">Prodavatelj</p>
        <p className="text-text mt-1 font-medium">{dealer.legal_name}</p>
        {dealer.address?.city ? (
          <p className="text-text-muted text-sm">{dealer.address.city}</p>
        ) : null}
      </div>
    );
  }
  const seller = listing.private_seller_data;
  if (seller?.name || seller?.city) {
    return (
      <div className="border-surface-border bg-surface rounded-md border p-4">
        <p className="text-text-muted text-xs uppercase tracking-wide">Privatni prodavatelj</p>
        {seller.name ? <p className="text-text mt-1 font-medium">{seller.name}</p> : null}
        {seller.city ? <p className="text-text-muted text-sm">{seller.city}</p> : null}
      </div>
    );
  }
  return null;
}

function LocationBlock({ listing }: { listing: UsedCarDetail }) {
  return (
    <div className="border-surface-border bg-surface rounded-md border p-4">
      <p className="text-text-muted text-xs uppercase tracking-wide">Lokacija</p>
      <p className="text-text mt-1 font-medium">{listing.location.city}</p>
    </div>
  );
}
