import "server-only";

import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import config from "@payload-config";
import type { MarketingCopy } from "@/payload-types";

/**
 * Loader for the MarketingCopy global. Cached for 1h with the
 * `marketing_copy` tag so admin edits can revalidateTag for instant
 * propagation (Sprint 7 revalidate-hook pattern). Mirrors the shape +
 * fallback approach of `lib/leasing/defaults.ts`.
 *
 * Hardcoded fallback is the existing `[XXX_*]` placeholder strings —
 * if the global isn't filled in yet (fresh DB, no admin edits) the
 * homepage shows the same XXX prompts the design originally shipped
 * with, which is the desired "this needs CMS content" cue.
 */

const ONE_HOUR = 3600;

export type MarketingCopyResolved = {
  hero: {
    headline: string;
    subheadline: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
  };
  valueProps: Array<{ title: string; description: string; iconName: string | null }>;
  howItWorks: Array<{ stepNumber: number; title: string; description: string }>;
  testimonials: Array<{ quote: string; authorName: string; authorRole: string | null }>;
};

const FALLBACK: MarketingCopyResolved = {
  hero: {
    headline: "[XXX_HERO_HEADLINE: 5-8 riječi]",
    subheadline: "[XXX_HERO_SUBHEADLINE: 1-2 rečenice opisa platforme]",
    primaryCtaLabel: "Zatraži ponudu",
    primaryCtaHref: "/zatrazi-ponudu",
  },
  valueProps: [],
  howItWorks: [],
  testimonials: [],
};

function s(v: string | null | undefined, fallback: string): string {
  return typeof v === "string" && v.trim().length > 0 ? v : fallback;
}

export const getMarketingCopy = unstable_cache(
  async (): Promise<MarketingCopyResolved> => {
    try {
      const p = await getPayload({ config });
      const g = (await p.findGlobal({ slug: "marketing_copy" })) as MarketingCopy;
      return {
        hero: {
          headline: s(g.hero?.headline, FALLBACK.hero.headline),
          subheadline: s(g.hero?.subheadline, FALLBACK.hero.subheadline),
          primaryCtaLabel: s(g.hero?.primary_cta_label, FALLBACK.hero.primaryCtaLabel),
          primaryCtaHref: s(g.hero?.primary_cta_href, FALLBACK.hero.primaryCtaHref),
        },
        valueProps: (g.value_props ?? []).map((v) => ({
          title: v.title,
          description: v.description ?? "",
          iconName: v.icon_name ?? null,
        })),
        howItWorks: (g.how_it_works ?? []).map((step) => ({
          stepNumber: step.step_number,
          title: step.title,
          description: step.description ?? "",
        })),
        testimonials: (g.testimonials ?? []).map((t) => ({
          quote: t.quote,
          authorName: t.author_name,
          authorRole: t.author_role ?? null,
        })),
      };
    } catch {
      return FALLBACK;
    }
  },
  ["marketing:copy"],
  { tags: ["marketing_copy"], revalidate: ONE_HOUR },
);
