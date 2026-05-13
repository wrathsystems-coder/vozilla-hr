"use client";

import { useState } from "react";
import type { GalleryImage } from "@/lib/used-cars/fetch";

/**
 * Used-car detail gallery. Main image + thumbnail strip. Clicking a
 * thumbnail swaps the main image. Full lightbox / pinch-to-zoom is
 * deferred to Sprint 7 polish — for MVP this matches the spec
 * requirement of "Hero galerija" while staying lightweight (no
 * external lightbox library, ~40 lines).
 */

type Props = {
  images: GalleryImage[];
  /** Body-type slug, used to pick the silhouette placeholder when empty. */
  bodyTypeSlug: string | null;
};

function placeholderSrc(bodyTypeSlug: string | null): string {
  if (!bodyTypeSlug) return "/placeholders/vehicles/limuzina.svg";
  return `/placeholders/vehicles/${bodyTypeSlug}.svg`;
}

export default function Gallery({ images, bodyTypeSlug }: Props) {
  const [activeIndex, setActiveIndex] = useState(() => {
    const heroIdx = images.findIndex((i) => i.isHero);
    return heroIdx >= 0 ? heroIdx : 0;
  });

  if (images.length === 0) {
    return (
      <div className="bg-surface-muted border-surface-border flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-md border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={placeholderSrc(bodyTypeSlug)}
          alt="Slika nije dostupna"
          className="text-text-muted h-full w-full object-contain p-12"
        />
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <div className="space-y-3">
      <div className="bg-surface-muted relative aspect-[16/10] w-full overflow-hidden rounded-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.url}
          alt={active.alt || "Slika oglasa"}
          width={active.width ?? undefined}
          height={active.height ?? undefined}
          className="h-full w-full object-cover"
        />
      </div>
      {images.length > 1 ? (
        <ul role="list" aria-label="Galerija" className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => {
            const isActive = i === activeIndex;
            return (
              <li key={i} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`Slika ${i + 1} od ${images.length}`}
                  className={
                    "bg-surface-muted block aspect-[16/10] w-24 overflow-hidden rounded-md border-2 transition-colors " +
                    (isActive
                      ? "border-brand-accent"
                      : "hover:border-surface-border border-transparent")
                  }
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
