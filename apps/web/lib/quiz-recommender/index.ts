// Pure rule-based recommender for the "Pomozi mi izabrati" quiz.
// Caller supplies the user's answers + a list of models to score; we return
// every model's score and a per-rule breakdown so the UI can explain
// "92% match" with reasons. No DB, no Payload, no I/O — fully testable.
//
// Scoring rules (sum = MAX_SCORE = 75):
//
//   - bodyType match              +20
//   - budget in range             +15 at midpoint, linear falloff to 0 at edges
//   - fuel type intersection      +10
//   - transmission compatibility  +5
//   - seat-category match         +10
//   - priority signal             +15
//
// Skipped questions contribute 0 (don't penalise — caller may simply omit
// the field). Spec: `docs/spec/03-information-architecture.md` quiz section.
//
// Two of the eight quiz questions (Q3 "novo/rabljeno", Q7 "glavna upotreba")
// are intentionally not scored — they steer downstream filtering, not the
// model ranking itself.

export type QuizBodyType = "suv" | "hatchback" | "karavan" | "sedan" | "sportski" | "elektricni";

export type QuizFuel = "benzin" | "dizel" | "hibrid" | "elektricni" | "plin";

export type QuizTransmission = "manual" | "automatic";

export type QuizSeats = "2" | "4-5" | "5-7" | "7+";

export type QuizPriority =
  | "cijena"
  | "pouzdanost"
  | "performanse"
  | "ekologija"
  | "komfor"
  | "prostor";

export type QuizAnswers = {
  bodyType?: QuizBodyType;
  budgetMin?: number;
  budgetMax?: number;
  fuelType?: QuizFuel;
  transmission?: QuizTransmission;
  seats?: QuizSeats;
  priority?: QuizPriority;
  // Q3, Q7 informational only — caller uses them for filtering, not scoring.
  newOrUsed?: "new" | "used" | "both";
  usage?: "city" | "long_distance" | "off_road" | "mixed";
};

export type ModelForScoring = {
  id: number;
  bodyTypeSlug: string;
  basePriceEur?: number | null;
  fuelTypes?: string[] | null;
  transmissions?: string[] | null;
  segment?: string | null;
  /** Seat count, if known. Caller resolves from model_versions or estimates. */
  seats?: number | null;
};

export type ScoreBreakdown = {
  bodyType: number;
  budget: number;
  fuel: number;
  transmission: number;
  seats: number;
  priority: number;
};

export type ScoredModel = {
  modelId: number;
  score: number;
  breakdown: ScoreBreakdown;
};

export const MAX_SCORE = 75;

const EV_LIKE_FUELS = new Set(["ev", "hibrid", "phev"]);

const BODY_TYPE_PRIMARY_FUEL: Record<QuizBodyType, string | null> = {
  suv: null,
  hatchback: null,
  karavan: null,
  sedan: null,
  sportski: null,
  elektricni: "ev",
};

/** UI fuel value (HR) → model fuel_types catalogue values. */
function fuelMatches(answer: QuizFuel, modelFuels: string[]): boolean {
  const set = new Set(modelFuels);
  switch (answer) {
    case "benzin":
      return set.has("benzin");
    case "dizel":
      return set.has("dizel");
    case "hibrid":
      return set.has("hibrid") || set.has("phev");
    case "elektricni":
      return set.has("ev");
    case "plin":
      return set.has("lpg") || set.has("cng");
  }
}

/** "Automatski" in the UI covers automatic + DCT + CVT. */
function transmissionMatches(answer: QuizTransmission, modelTrans: string[]): boolean {
  const set = new Set(modelTrans);
  if (answer === "manual") return set.has("manual");
  return set.has("automatic") || set.has("dct") || set.has("cvt");
}

/**
 * Body type matching also honours the "Električni" quiz answer, which is a
 * powertrain choice masquerading as a body type. When the user picks it we
 * award the full bonus to any EV model regardless of its actual body.
 */
function bodyTypeMatches(answer: QuizBodyType, modelBodySlug: string): boolean {
  if (answer === "elektricni") return false; // handled via fuel match instead
  return modelBodySlug === answer;
}

function seatsMatch(answer: QuizSeats, modelSeats: number): boolean {
  switch (answer) {
    case "2":
      return modelSeats === 2;
    case "4-5":
      return modelSeats >= 4 && modelSeats <= 5;
    case "5-7":
      return modelSeats >= 5 && modelSeats <= 7;
    case "7+":
      return modelSeats >= 7;
  }
}

function budgetScore(price: number, min: number, max: number): number {
  if (price < min || price > max) return 0;
  const mid = (min + max) / 2;
  const halfRange = (max - min) / 2;
  if (halfRange === 0) return price === mid ? 15 : 0;
  const distFromMid = Math.abs(price - mid) / halfRange;
  return 15 * (1 - distFromMid);
}

function priorityScore(priority: QuizPriority, model: ModelForScoring): number {
  switch (priority) {
    case "ekologija":
      if (!model.fuelTypes) return 0;
      return model.fuelTypes.some((f) => EV_LIKE_FUELS.has(f)) ? 15 : 0;

    case "cijena":
      // Without a budget anchor we can't define "cheap", so cijena is only
      // meaningful when the budget range is set. We hand that off to the
      // caller via a wrapper below — here we return 0 and let `scoreModel`
      // compose with budget context.
      return 0;

    case "prostor":
      // SUV (J) and MPV (M) segments are the structural answer; body type
      // suv/karavan is the visible signal. We accept either.
      if (model.segment === "J" || model.segment === "M") return 15;
      if (model.bodyTypeSlug === "suv" || model.bodyTypeSlug === "karavan") return 15;
      if (model.seats != null && model.seats >= 5) return 7; // partial
      return 0;

    case "performanse":
      if (model.segment === "S") return 15;
      if (model.bodyTypeSlug === "sportski") return 15;
      if (model.segment === "E" || model.segment === "F") return 7;
      return 0;

    case "komfor":
      if (model.segment === "E" || model.segment === "F") return 15;
      if (model.segment === "D") return 10;
      return 0;

    case "pouzdanost":
      // No reliability data in MVP. Awarding 0 to every model is fair —
      // doesn't bias toward any model, and the other rules carry the weight.
      return 0;
  }
}

function priceProximityToMin(price: number, min: number, max: number): number {
  // For "cijena" priority: cheaper-within-range scores higher.
  // Linear: at min → 15, at max → 0, outside → 0.
  if (price < min || price > max) return 0;
  if (max === min) return 15;
  return 15 * (1 - (price - min) / (max - min));
}

export function scoreModel(answers: QuizAnswers, model: ModelForScoring): ScoredModel {
  const breakdown: ScoreBreakdown = {
    bodyType: 0,
    budget: 0,
    fuel: 0,
    transmission: 0,
    seats: 0,
    priority: 0,
  };

  if (answers.bodyType) {
    if (bodyTypeMatches(answers.bodyType, model.bodyTypeSlug)) {
      breakdown.bodyType = 20;
    } else if (answers.bodyType === "elektricni") {
      // "Električni" awards the body-type bonus to actual EVs (handled below
      // via fuel, but the spec lists tip_vozila +20 specifically — we mirror
      // the intent by giving the +20 when the model is an EV).
      const primary = BODY_TYPE_PRIMARY_FUEL.elektricni;
      if (primary && model.fuelTypes?.includes(primary)) breakdown.bodyType = 20;
    }
  }

  if (
    answers.budgetMin != null &&
    answers.budgetMax != null &&
    answers.budgetMin >= 0 &&
    answers.budgetMax >= answers.budgetMin &&
    model.basePriceEur != null
  ) {
    breakdown.budget = budgetScore(model.basePriceEur, answers.budgetMin, answers.budgetMax);
  }

  if (answers.fuelType && model.fuelTypes && model.fuelTypes.length > 0) {
    if (fuelMatches(answers.fuelType, model.fuelTypes)) breakdown.fuel = 10;
  }

  if (answers.transmission && model.transmissions && model.transmissions.length > 0) {
    if (transmissionMatches(answers.transmission, model.transmissions)) breakdown.transmission = 5;
  }

  if (answers.seats && model.seats != null) {
    if (seatsMatch(answers.seats, model.seats)) breakdown.seats = 10;
  }

  if (answers.priority) {
    if (
      answers.priority === "cijena" &&
      answers.budgetMin != null &&
      answers.budgetMax != null &&
      model.basePriceEur != null
    ) {
      breakdown.priority = priceProximityToMin(
        model.basePriceEur,
        answers.budgetMin,
        answers.budgetMax,
      );
    } else {
      breakdown.priority = priorityScore(answers.priority, model);
    }
  }

  const score =
    breakdown.bodyType +
    breakdown.budget +
    breakdown.fuel +
    breakdown.transmission +
    breakdown.seats +
    breakdown.priority;

  return { modelId: model.id, score, breakdown };
}

/**
 * Score every input model and return them sorted by score descending. Ties
 * break on model id ascending so the order is deterministic across runs —
 * critical for the test suite and for stable URLs in cached responses.
 *
 * Caller slices the top N (spec says 5-10) for display.
 */
export function recommendModels(answers: QuizAnswers, models: ModelForScoring[]): ScoredModel[] {
  return models
    .map((m) => scoreModel(answers, m))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.modelId - b.modelId;
    });
}

export function matchPercent(score: number): number {
  return Math.round((score / MAX_SCORE) * 100);
}
