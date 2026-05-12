import { describe, expect, it } from "vitest";
import {
  MAX_SCORE,
  matchPercent,
  recommendModels,
  scoreModel,
  type ModelForScoring,
  type QuizAnswers,
} from "@/lib/quiz-recommender";

const golf: ModelForScoring = {
  id: 1,
  bodyTypeSlug: "hatchback",
  basePriceEur: 22000,
  fuelTypes: ["benzin", "dizel"],
  transmissions: ["manual", "dct"],
  segment: "C",
  seats: 5,
};

const tiguan: ModelForScoring = {
  id: 2,
  bodyTypeSlug: "suv",
  basePriceEur: 38000,
  fuelTypes: ["benzin", "dizel", "phev"],
  transmissions: ["automatic"],
  segment: "J",
  seats: 5,
};

const id4: ModelForScoring = {
  id: 3,
  bodyTypeSlug: "suv",
  basePriceEur: 45000,
  fuelTypes: ["ev"],
  transmissions: ["automatic"],
  segment: "J",
  seats: 5,
};

const sharan: ModelForScoring = {
  id: 4,
  bodyTypeSlug: "karavan",
  basePriceEur: 42000,
  fuelTypes: ["dizel"],
  transmissions: ["dct"],
  segment: "M",
  seats: 7,
};

const allModels = [golf, tiguan, id4, sharan];

describe("quiz-recommender — base behaviour", () => {
  it("all-skipped answers → every model scores 0", () => {
    const results = recommendModels({}, allModels);
    expect(results).toHaveLength(4);
    expect(results.every((r) => r.score === 0)).toBe(true);
    // Tie-break: id ascending
    expect(results.map((r) => r.modelId)).toEqual([1, 2, 3, 4]);
  });

  it("body type match adds exactly 20", () => {
    const { breakdown, score } = scoreModel({ bodyType: "suv" }, tiguan);
    expect(breakdown.bodyType).toBe(20);
    expect(score).toBe(20);
  });

  it('"elektricni" body answer routes the bonus to EV models even with different actual body', () => {
    // id4 is an SUV but its EV powertrain claims the bodyType bonus
    const ev = scoreModel({ bodyType: "elektricni" }, id4);
    expect(ev.breakdown.bodyType).toBe(20);
    // golf is hatchback ICE — no body bonus when user asks for "elektricni"
    const ice = scoreModel({ bodyType: "elektricni" }, golf);
    expect(ice.breakdown.bodyType).toBe(0);
  });
});

describe("quiz-recommender — budget proximity", () => {
  it("midpoint price gets full 15, edges decay linearly to 0", () => {
    const answers: QuizAnswers = { budgetMin: 20000, budgetMax: 40000 };
    // Midpoint = 30000
    const mid = scoreModel(answers, { ...golf, basePriceEur: 30000 });
    expect(mid.breakdown.budget).toBeCloseTo(15, 4);
    const edge = scoreModel(answers, { ...golf, basePriceEur: 20000 });
    expect(edge.breakdown.budget).toBeCloseTo(0, 4);
    const halfway = scoreModel(answers, { ...golf, basePriceEur: 25000 });
    expect(halfway.breakdown.budget).toBeCloseTo(7.5, 4);
  });

  it("price outside range → 0", () => {
    const answers: QuizAnswers = { budgetMin: 20000, budgetMax: 25000 };
    expect(scoreModel(answers, tiguan).breakdown.budget).toBe(0);
    expect(scoreModel(answers, { ...golf, basePriceEur: 19000 }).breakdown.budget).toBe(0);
  });
});

describe("quiz-recommender — fuel + transmission compatibility", () => {
  it('"hibrid" answer matches both hibrid and phev model fuel types', () => {
    expect(scoreModel({ fuelType: "hibrid" }, tiguan).breakdown.fuel).toBe(10); // phev
    expect(scoreModel({ fuelType: "hibrid" }, golf).breakdown.fuel).toBe(0); // none
  });

  it('"automatski" transmission answer matches automatic + DCT + CVT models', () => {
    expect(scoreModel({ transmission: "automatic" }, golf).breakdown.transmission).toBe(5); // DCT
    expect(scoreModel({ transmission: "automatic" }, tiguan).breakdown.transmission).toBe(5);
    expect(scoreModel({ transmission: "manual" }, tiguan).breakdown.transmission).toBe(0);
  });
});

describe("quiz-recommender — seats + priority", () => {
  it("seat-category match awards 10", () => {
    expect(scoreModel({ seats: "5-7" }, sharan).breakdown.seats).toBe(10);
    expect(scoreModel({ seats: "7+" }, sharan).breakdown.seats).toBe(10);
    expect(scoreModel({ seats: "4-5" }, sharan).breakdown.seats).toBe(0); // 7 doesn't match 4-5
    expect(scoreModel({ seats: "4-5" }, golf).breakdown.seats).toBe(10);
  });

  it('priority "ekologija" boosts only EV/hybrid-class models', () => {
    expect(scoreModel({ priority: "ekologija" }, id4).breakdown.priority).toBe(15);
    expect(scoreModel({ priority: "ekologija" }, tiguan).breakdown.priority).toBe(15); // phev
    expect(scoreModel({ priority: "ekologija" }, golf).breakdown.priority).toBe(0);
  });

  it('priority "cijena" rewards cheaper-within-range; without budget context falls to 0', () => {
    // Without budget context, no signal
    expect(scoreModel({ priority: "cijena" }, golf).breakdown.priority).toBe(0);
    // With budget context, cheaper-in-range scores higher
    const cheaper = scoreModel(
      { priority: "cijena", budgetMin: 20000, budgetMax: 50000 },
      { ...golf, basePriceEur: 22000 },
    ).breakdown.priority;
    const pricier = scoreModel(
      { priority: "cijena", budgetMin: 20000, budgetMax: 50000 },
      { ...golf, basePriceEur: 45000 },
    ).breakdown.priority;
    expect(cheaper).toBeGreaterThan(pricier);
  });
});

describe("quiz-recommender — sorting + percent display", () => {
  it("results sorted by score desc, tiebreak by id asc", () => {
    // All four models score 0 here → tie-break orders them by id.
    const results = recommendModels({}, [sharan, id4, tiguan, golf]);
    expect(results.map((r) => r.modelId)).toEqual([1, 2, 3, 4]);
  });

  it("higher score wins regardless of model id order in input", () => {
    const answers: QuizAnswers = { bodyType: "suv", fuelType: "elektricni" };
    const results = recommendModels(answers, [golf, sharan, tiguan, id4]);
    // id4 is the only EV-SUV → should win (20 body + 10 fuel = 30)
    expect(results[0].modelId).toBe(3);
    expect(results[0].score).toBe(30);
  });

  it("matchPercent normalises score to 0–100 using MAX_SCORE=75", () => {
    expect(MAX_SCORE).toBe(75);
    expect(matchPercent(75)).toBe(100);
    expect(matchPercent(0)).toBe(0);
    expect(matchPercent(60)).toBe(80); // 60/75 = 0.8 → 80
  });
});
