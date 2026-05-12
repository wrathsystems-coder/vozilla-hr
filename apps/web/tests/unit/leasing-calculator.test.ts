import { describe, expect, it } from "vitest";
import { calculateLeasing } from "@/lib/leasing-calculator";

describe("calculateLeasing — financial leasing", () => {
  it("matches standard PMT for a textbook case", () => {
    // L = 16000, r = 5.5%/12 = 0.004583, n = 60
    // P = L * r / (1 - (1+r)^-n) ≈ 305.39 €
    const out = calculateLeasing({
      price: 20000,
      deposit: 4000,
      termMonths: 60,
      ratePercent: 5.5,
      type: "financial",
    });
    expect(out.financedAmount).toBe(16000);
    expect(out.residualValue).toBe(0);
    expect(out.monthlyPayment).toBeGreaterThan(305);
    expect(out.monthlyPayment).toBeLessThan(306);
    // Total cost = deposit + 60 * monthly ≈ 4000 + 18323.4 = 22323.40
    expect(out.totalCost).toBeCloseTo(4000 + out.monthlyPayment * 60, 1);
    // Total interest = totalCost - price
    expect(out.totalInterest).toBeCloseTo(out.totalCost - 20000, 1);
  });

  it("zero rate yields equal installments with no interest", () => {
    const out = calculateLeasing({
      price: 12000,
      deposit: 0,
      termMonths: 60,
      ratePercent: 0,
      type: "financial",
    });
    expect(out.monthlyPayment).toBeCloseTo(200, 2);
    expect(out.totalInterest).toBeCloseTo(0, 2);
  });

  it("deposit equal to price → zero financing, zero monthly", () => {
    const out = calculateLeasing({
      price: 15000,
      deposit: 15000,
      termMonths: 36,
      ratePercent: 5.5,
      type: "financial",
    });
    expect(out.monthlyPayment).toBe(0);
    expect(out.financedAmount).toBe(0);
    expect(out.totalCost).toBe(15000);
    expect(out.totalInterest).toBe(0);
  });

  it("higher deposit strictly lowers monthly payment", () => {
    const low = calculateLeasing({
      price: 25000,
      deposit: 2000,
      termMonths: 48,
      ratePercent: 6,
      type: "financial",
    });
    const high = calculateLeasing({
      price: 25000,
      deposit: 10000,
      termMonths: 48,
      ratePercent: 6,
      type: "financial",
    });
    expect(high.monthlyPayment).toBeLessThan(low.monthlyPayment);
  });

  it("longer term lowers monthly but raises total interest", () => {
    const short = calculateLeasing({
      price: 30000,
      deposit: 6000,
      termMonths: 36,
      ratePercent: 7,
      type: "financial",
    });
    const long = calculateLeasing({
      price: 30000,
      deposit: 6000,
      termMonths: 72,
      ratePercent: 7,
      type: "financial",
    });
    expect(long.monthlyPayment).toBeLessThan(short.monthlyPayment);
    expect(long.totalInterest).toBeGreaterThan(short.totalInterest);
  });
});

describe("calculateLeasing — operating leasing", () => {
  it("residual reduces monthly payment vs financial with same inputs", () => {
    const financial = calculateLeasing({
      price: 30000,
      deposit: 3000,
      termMonths: 48,
      ratePercent: 5.5,
      type: "financial",
    });
    const operating = calculateLeasing({
      price: 30000,
      deposit: 3000,
      termMonths: 48,
      ratePercent: 5.5,
      residualPercent: 30,
      type: "operating",
    });
    expect(operating.residualValue).toBe(9000);
    expect(operating.monthlyPayment).toBeLessThan(financial.monthlyPayment);
  });

  it("operating ≡ financial when residualPercent is 0", () => {
    const financial = calculateLeasing({
      price: 18000,
      deposit: 0,
      termMonths: 60,
      ratePercent: 6,
      type: "financial",
    });
    const operating = calculateLeasing({
      price: 18000,
      deposit: 0,
      termMonths: 60,
      ratePercent: 6,
      residualPercent: 0,
      type: "operating",
    });
    expect(operating.monthlyPayment).toBe(financial.monthlyPayment);
    expect(operating.residualValue).toBe(0);
  });

  it("totalInterest accounts for residual not being paid", () => {
    const out = calculateLeasing({
      price: 20000,
      deposit: 2000,
      termMonths: 48,
      ratePercent: 5,
      residualPercent: 30,
      type: "operating",
    });
    // Customer outlay = deposit + monthly*48. Value consumed = price - residual.
    // Interest = outlay - (price - residual) = outlay + residual - price.
    expect(out.totalInterest).toBeCloseTo(out.totalCost + out.residualValue - 20000, 1);
  });

  it("residual exceeds financed amount → throws", () => {
    expect(() =>
      calculateLeasing({
        price: 10000,
        deposit: 8000,
        termMonths: 36,
        ratePercent: 5,
        residualPercent: 50,
        type: "operating",
      }),
    ).toThrow(/residual exceeds/i);
  });
});

describe("calculateLeasing — validation", () => {
  it("rejects non-positive price", () => {
    expect(() =>
      calculateLeasing({
        price: 0,
        deposit: 0,
        termMonths: 60,
        ratePercent: 5,
        type: "financial",
      }),
    ).toThrow(/price/);
  });

  it("rejects deposit greater than price", () => {
    expect(() =>
      calculateLeasing({
        price: 10000,
        deposit: 15000,
        termMonths: 60,
        ratePercent: 5,
        type: "financial",
      }),
    ).toThrow(/deposit/);
  });

  it("rejects zero or non-integer term", () => {
    expect(() =>
      calculateLeasing({
        price: 10000,
        deposit: 0,
        termMonths: 0,
        ratePercent: 5,
        type: "financial",
      }),
    ).toThrow(/termMonths/);
    expect(() =>
      calculateLeasing({
        price: 10000,
        deposit: 0,
        termMonths: 60.5,
        ratePercent: 5,
        type: "financial",
      }),
    ).toThrow(/termMonths/);
  });

  it("rejects negative rate and residualPercent out of [0,100)", () => {
    expect(() =>
      calculateLeasing({
        price: 10000,
        deposit: 0,
        termMonths: 60,
        ratePercent: -1,
        type: "financial",
      }),
    ).toThrow(/ratePercent/);
    expect(() =>
      calculateLeasing({
        price: 10000,
        deposit: 0,
        termMonths: 60,
        ratePercent: 5,
        residualPercent: 100,
        type: "operating",
      }),
    ).toThrow(/residualPercent/);
  });
});
