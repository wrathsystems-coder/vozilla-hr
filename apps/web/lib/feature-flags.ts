import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Source of truth for flag names + types. Every key here must also appear
// in config/feature-flags.yml; loadFlags() validates the round-trip and
// throws on mismatch so a typo in either file fails loud at boot.
//
// Spec: docs/spec/05-data-and-systems.md "Feature flag struktura".
export type FeatureFlags = {
  newsletter: boolean;
  sms_notifications: boolean;
  whatsapp_notifications: boolean;
  google_analytics_4: boolean;
  posthog: boolean;
  meta_pixel: boolean;
  hotjar: boolean;
  dark_mode: boolean;
  user_accounts: boolean;
  real_time_auction: boolean;
  dealer_self_upload_listings: boolean;
  public_dealer_profiles: boolean;
  dealer_subscription_billing: boolean;
  sell_my_car: boolean;
  trade_in_valuation: boolean;
};

export type FlagKey = keyof FeatureFlags;

const FLAG_KEYS: readonly FlagKey[] = [
  "newsletter",
  "sms_notifications",
  "whatsapp_notifications",
  "google_analytics_4",
  "posthog",
  "meta_pixel",
  "hotjar",
  "dark_mode",
  "user_accounts",
  "real_time_auction",
  "dealer_self_upload_listings",
  "public_dealer_profiles",
  "dealer_subscription_billing",
  "sell_my_car",
  "trade_in_valuation",
] as const;

let _cached: FeatureFlags | null = null;

function configPath(): string {
  // apps/web/lib/feature-flags.ts → ../../../config/feature-flags.yml
  return path.resolve(dirname, "../../../config/feature-flags.yml");
}

function parseAndValidate(text: string): FeatureFlags {
  const parsed = parseYaml(text) as unknown;
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("feature-flags.yml: očekivan top-level mapping, dobiven non-object");
  }
  const obj = parsed as Record<string, unknown>;

  const missing: string[] = [];
  const wrongType: string[] = [];
  for (const key of FLAG_KEYS) {
    if (!(key in obj)) {
      missing.push(key);
    } else if (typeof obj[key] !== "boolean") {
      wrongType.push(`${key}=${typeof obj[key]}`);
    }
  }
  if (missing.length > 0 || wrongType.length > 0) {
    throw new Error(
      `feature-flags.yml validation failed.${
        missing.length ? ` Missing keys: ${missing.join(", ")}.` : ""
      }${wrongType.length ? ` Non-boolean values: ${wrongType.join(", ")}.` : ""}`,
    );
  }

  const known = new Set<string>(FLAG_KEYS);
  const unknownKeys = Object.keys(obj).filter((k) => !known.has(k));
  if (unknownKeys.length > 0) {
    throw new Error(
      `feature-flags.yml has keys not in FeatureFlags type: ${unknownKeys.join(", ")}. ` +
        `Add them to lib/feature-flags.ts or remove from YAML.`,
    );
  }

  const result: Partial<FeatureFlags> = {};
  for (const key of FLAG_KEYS) {
    result[key] = obj[key] as boolean;
  }
  return result as FeatureFlags;
}

export function loadFlags(): FeatureFlags {
  if (_cached) return _cached;
  const text = readFileSync(configPath(), "utf-8");
  _cached = parseAndValidate(text);
  return _cached;
}

/**
 * Returns whether a flag is enabled. Pass `overrides` to short-circuit the
 * YAML lookup — useful when a Payload global has been loaded server-side
 * and admin runtime toggles should win over the build-time YAML.
 *
 * Payload override wiring is deferred until a consumer needs it (Sprint 7
 * polish at earliest); the parameter is here so callers don't have to be
 * refactored later.
 */
export function isEnabled(key: FlagKey, overrides?: Partial<FeatureFlags>): boolean {
  if (overrides && key in overrides && typeof overrides[key] === "boolean") {
    return overrides[key]!;
  }
  return loadFlags()[key];
}

/** Test-only: drop the module cache so a test can re-exercise loading. */
export function _resetCache(): void {
  _cached = null;
}
