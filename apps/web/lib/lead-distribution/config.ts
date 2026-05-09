import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

// Read-only loader for config/lead-distribution.yml. The Payload
// `lead_distribution` global mirrors the same shape and will eventually
// override at runtime (Sprint 7 polish, same pattern as feature-flags).

const dirname = path.dirname(fileURLToPath(import.meta.url));

export type Weights = {
  w_response: number;
  w_conversion: number;
  w_rating: number;
  w_capacity: number;
};

export type Rules = {
  closest_dealer_always_included: boolean;
  max_dealers_per_lead: number;
  default_dealers_per_lead: number;
  min_dealers_per_lead: number;
};

export type Throttling = {
  max_leads_per_dealer_per_day: number;
  max_leads_per_dealer_per_week: number;
};

export type Reminders = {
  first_reminder_hours: number;
  second_reminder_hours: number;
  expire_no_response_hours: number;
};

export type ScoreThresholds = {
  warn_below: number;
  suspend_below: number;
};

export type LeadDistributionConfig = {
  weights: Weights;
  rules: Rules;
  throttling: Throttling;
  reminders: Reminders;
  score_thresholds: ScoreThresholds;
};

let _cached: LeadDistributionConfig | null = null;

function configPath(): string {
  // apps/web/lib/lead-distribution/config.ts → ../../../../config/lead-distribution.yml
  return path.resolve(dirname, "../../../../config/lead-distribution.yml");
}

export function loadLeadDistributionConfig(): LeadDistributionConfig {
  if (_cached) return _cached;
  const text = readFileSync(configPath(), "utf-8");
  // The YAML uses uppercase keys (W_response). We accept either case for
  // forward-compat with a Payload override that uses the camelCase shape.
  const raw = parseYaml(text) as Record<string, Record<string, unknown>>;

  const weightsRaw = raw.weights ?? {};
  const weights: Weights = {
    w_response: Number(weightsRaw.W_response ?? weightsRaw.w_response),
    w_conversion: Number(weightsRaw.W_conversion ?? weightsRaw.w_conversion),
    w_rating: Number(weightsRaw.W_rating ?? weightsRaw.w_rating),
    w_capacity: Number(weightsRaw.W_capacity ?? weightsRaw.w_capacity),
  };
  for (const [key, value] of Object.entries(weights)) {
    if (!Number.isFinite(value)) {
      throw new Error(`lead-distribution.yml: weights.${key} is not a finite number`);
    }
  }

  _cached = {
    weights,
    rules: raw.rules as unknown as Rules,
    throttling: raw.throttling as unknown as Throttling,
    reminders: raw.reminders as unknown as Reminders,
    score_thresholds: raw.score_thresholds as unknown as ScoreThresholds,
  };
  return _cached;
}

export function _resetConfigCache(): void {
  _cached = null;
}
