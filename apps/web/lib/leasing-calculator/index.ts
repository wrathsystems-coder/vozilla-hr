// Pure leasing-payment calculator. No DB, no Payload, no I/O — safe to
// import from a client component or a server fetcher.
//
// Two leasing types are supported in the HR market:
//
//   - financial: customer amortises the full financed amount (price - deposit)
//     over `term_months`. No balloon at the end — the asset belongs to the
//     lessee. Residual is ignored.
//
//   - operating: customer only finances the depreciation (price - deposit -
//     residual) plus interest on the balloon residual. At end of term the
//     asset is returned (or bought out at residual price). Lower monthly
//     payment than financial for the same headline numbers.
//
// Both flow through the same balloon-PMT formula with a future-value (FV)
// term. Setting FV=0 reduces it to the textbook PMT formula.

export type LeasingType = "financial" | "operating";

export type LeasingInput = {
  /** Vehicle price in €. Must be > 0. */
  price: number;
  /** Down payment in €. Must be 0 ≤ deposit ≤ price. */
  deposit: number;
  /** Term in months. Must be an integer > 0. */
  termMonths: number;
  /** Annual interest rate as a percent (e.g. 5.5 for 5.5%). Must be ≥ 0. */
  ratePercent: number;
  /**
   * Operating leasing only: balloon residual as a percent of the price
   * (e.g. 30 for 30%). Must be 0 ≤ residualPercent < 100. Ignored when
   * `type === 'financial'`.
   */
  residualPercent?: number;
  type: LeasingType;
};

export type LeasingOutput = {
  monthlyPayment: number;
  /** Cash the customer actually pays out: deposit + Σ monthly. */
  totalCost: number;
  /**
   * Interest paid: `totalCost + residualValue - price`. For financial the
   * `residualValue` term is 0 and this simplifies to `totalCost - price`.
   * Represents what the customer pays above the value they consumed.
   */
  totalInterest: number;
  /** Principal that's amortised: price - deposit. */
  financedAmount: number;
  /** Balloon at end of contract for operating leasing (0 for financial). */
  residualValue: number;
};

function assertFinite(name: string, value: number): void {
  if (!Number.isFinite(value)) {
    throw new Error(`leasing-calculator: ${name} must be a finite number`);
  }
}

export function calculateLeasing(input: LeasingInput): LeasingOutput {
  const { price, deposit, termMonths, ratePercent, type } = input;
  const residualPercent = input.residualPercent ?? 0;

  assertFinite("price", price);
  assertFinite("deposit", deposit);
  assertFinite("termMonths", termMonths);
  assertFinite("ratePercent", ratePercent);
  assertFinite("residualPercent", residualPercent);

  if (price <= 0) throw new Error("leasing-calculator: price must be > 0");
  if (deposit < 0) throw new Error("leasing-calculator: deposit must be ≥ 0");
  if (deposit > price) throw new Error("leasing-calculator: deposit must be ≤ price");
  if (!Number.isInteger(termMonths) || termMonths <= 0) {
    throw new Error("leasing-calculator: termMonths must be a positive integer");
  }
  if (ratePercent < 0) throw new Error("leasing-calculator: ratePercent must be ≥ 0");
  if (residualPercent < 0 || residualPercent >= 100) {
    throw new Error("leasing-calculator: residualPercent must be in [0, 100)");
  }

  const financedAmount = price - deposit;
  const residualValue = type === "operating" ? (price * residualPercent) / 100 : 0;

  if (residualValue > financedAmount) {
    throw new Error("leasing-calculator: residual exceeds financed amount");
  }

  // r = monthly rate (annual / 12), n = number of payments
  const r = ratePercent / 100 / 12;
  const n = termMonths;

  let monthlyPayment: number;
  if (financedAmount === 0) {
    monthlyPayment = 0;
  } else if (r === 0) {
    // No interest: amortise the depreciation only (financed - residual).
    // The residual is returned, not paid, so it never enters the payments.
    monthlyPayment = (financedAmount - residualValue) / n;
  } else {
    // Balloon-PMT: P = (PV - FV / (1+r)^n) * r / (1 - (1+r)^-n)
    const pow = Math.pow(1 + r, n);
    monthlyPayment = ((financedAmount - residualValue / pow) * r) / (1 - 1 / pow);
  }

  // Round to cents for stable display + comparison. The balloon-PMT formula
  // can produce sub-cent rounding noise that breaks user-facing parity tests.
  const roundCents = (x: number): number => Math.round(x * 100) / 100;
  monthlyPayment = roundCents(monthlyPayment);

  const totalCost = roundCents(deposit + monthlyPayment * n);
  const totalInterest = roundCents(totalCost + residualValue - price);

  return {
    monthlyPayment,
    totalCost,
    totalInterest,
    financedAmount,
    residualValue,
  };
}
