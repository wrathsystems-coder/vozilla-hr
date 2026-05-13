import Link from "next/link";
import type { ReviewWithModelRefs } from "@/lib/reviews/fetch";

/**
 * Card for one review. Used on /recenzije/, /recenzije/kategorija/[kat],
 * and the model detail page rail. Hero image falls back to body-type
 * silhouette when no review-specific image is set.
 */

type Props = { review: ReviewWithModelRefs };

function heroSrc(r: ReviewWithModelRefs): string {
  if (r.hero_image_path) return r.hero_image_path;
  const bodyTypeSlug =
    r.model && typeof r.model === "object" && typeof r.model.body_type === "object"
      ? r.model.body_type?.slug
      : null;
  return `/placeholders/vehicles/${bodyTypeSlug ?? "limuzina"}.svg`;
}

export default function ReviewCard({ review }: Props) {
  const model = review.model && typeof review.model === "object" ? review.model : null;
  const brand = model && typeof model.brand === "object" ? model.brand : null;
  const subtitle = brand && model ? `${brand.name} ${model.name}` : "vozilla.hr";
  const overall = review.scores?.overall;
  return (
    <Link
      href={`/recenzije/${review.slug}`}
      className="border-surface-border bg-surface hover:border-brand-accent group flex h-full flex-col overflow-hidden rounded-md border transition-colors"
    >
      <div className="bg-surface-muted relative aspect-[16/10] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSrc(review)}
          alt={review.title}
          className="text-text-muted h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          loading="lazy"
        />
        {typeof overall === "number" ? (
          <div className="bg-brand-accent text-brand-primary absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold">
            {overall.toFixed(1)} / 10
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-text-muted text-xs">{subtitle}</p>
        <h3 className="text-text text-base font-semibold">{review.title}</h3>
      </div>
    </Link>
  );
}
