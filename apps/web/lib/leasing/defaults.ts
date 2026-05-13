import "server-only";

import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import config from "@payload-config";
import type { LeasingDefault } from "@/payload-types";

/**
 * Loader for the LeasingDefaults global. Cached for 1h with the
 * 'leasing_defaults' tag so admin edits can revalidateTag for instant
 * propagation (Sprint 7). The shape is flattened to plain numbers + the
 * disclaimer string — the client calculator doesn't need to know about
 * Payload's nested groups.
 */

const ONE_HOUR = 3600;

export type LeasingDefaultsResolved = {
  defaultRatePercent: number;
  minRatePercent: number;
  maxRatePercent: number;
  termMonthsDefault: number;
  termMonthsMin: number;
  termMonthsMax: number;
  depositPercentDefault: number;
  depositPercentMin: number;
  depositPercentMax: number;
  residualPercentDefault: number;
  disclaimer: string;
};

// Hardcoded fallback so a fresh DB without the global filled in still
// renders a sensible calculator. The Payload defaults declared in the
// global config will overwrite these once the global is saved.
const FALLBACK: LeasingDefaultsResolved = {
  defaultRatePercent: 5.5,
  minRatePercent: 3,
  maxRatePercent: 12,
  termMonthsDefault: 60,
  termMonthsMin: 12,
  termMonthsMax: 84,
  depositPercentDefault: 20,
  depositPercentMin: 0,
  depositPercentMax: 50,
  residualPercentDefault: 30,
  disclaimer:
    "Informativni izračun. Konačnu ponudu radi banka/leasing kuća na temelju vaše kreditne sposobnosti.",
};

function n(v: number | null | undefined, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export const getLeasingDefaults = unstable_cache(
  async (): Promise<LeasingDefaultsResolved> => {
    try {
      const p = await getPayload({ config });
      const g = (await p.findGlobal({
        slug: "leasing_defaults",
      })) as LeasingDefault;
      return {
        defaultRatePercent: n(g.interest_rates?.default_rate_percent, FALLBACK.defaultRatePercent),
        minRatePercent: n(g.interest_rates?.min_rate_percent, FALLBACK.minRatePercent),
        maxRatePercent: n(g.interest_rates?.max_rate_percent, FALLBACK.maxRatePercent),
        termMonthsDefault: n(g.term_months?.default, FALLBACK.termMonthsDefault),
        termMonthsMin: n(g.term_months?.min, FALLBACK.termMonthsMin),
        termMonthsMax: n(g.term_months?.max, FALLBACK.termMonthsMax),
        depositPercentDefault: n(g.deposit_percent?.default, FALLBACK.depositPercentDefault),
        depositPercentMin: n(g.deposit_percent?.min, FALLBACK.depositPercentMin),
        depositPercentMax: n(g.deposit_percent?.max, FALLBACK.depositPercentMax),
        residualPercentDefault: n(
          g.residual_value_percent?.default,
          FALLBACK.residualPercentDefault,
        ),
        disclaimer: g.disclaimer?.trim() || FALLBACK.disclaimer,
      };
    } catch {
      return FALLBACK;
    }
  },
  ["leasing:defaults"],
  { tags: ["leasing_defaults"], revalidate: ONE_HOUR },
);
