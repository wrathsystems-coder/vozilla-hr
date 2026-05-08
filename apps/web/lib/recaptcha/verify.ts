import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

// Spec: docs/spec/02-legal-and-compliance.md "CAPTCHA". Treated as a
// security/anti-fraud essential under GDPR legitimate interest, NOT
// "statistical" — that's why we don't gate it behind cookie consent.

const dirname = path.dirname(fileURLToPath(import.meta.url));
const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

type Thresholds = { block_below: number; review_below: number };

let _thresholds: Thresholds | null = null;

function loadThresholds(): Thresholds {
  if (_thresholds) return _thresholds;
  // apps/web/lib/recaptcha/verify.ts → ../../../../config/recaptcha.yml
  const yamlPath = path.resolve(dirname, "../../../../config/recaptcha.yml");
  const text = readFileSync(yamlPath, "utf-8");
  const parsed = parseYaml(text) as Partial<Thresholds>;
  if (typeof parsed.block_below !== "number" || typeof parsed.review_below !== "number") {
    throw new Error("recaptcha.yml: block_below + review_below must be numbers");
  }
  if (parsed.block_below >= parsed.review_below) {
    throw new Error("recaptcha.yml: block_below must be < review_below");
  }
  if (parsed.block_below < 0 || parsed.review_below > 1) {
    throw new Error("recaptcha.yml: thresholds must be inside [0, 1]");
  }
  _thresholds = { block_below: parsed.block_below, review_below: parsed.review_below };
  return _thresholds;
}

export function _resetThresholdsCache(): void {
  _thresholds = null;
}

export type VerifyArgs = {
  /** Token returned by grecaptcha.execute() on the client. */
  token: string;
  /** Action name expected to come back from Google — defends against token reuse on a different form. */
  expectedAction: string;
  /** Caller IP for rate-limit context on Google's side. */
  remoteIp?: string;
};

export type VerifyOutcome = "pass" | "review" | "block" | "dev_bypass";

export type VerifyResult = {
  outcome: VerifyOutcome;
  /** 0–1 from Google, 1.0 in dev_bypass, null when verification short-circuited (missing token, network failure). */
  score: number | null;
  /** Action Google echoed back, or null when we never reached Google. */
  action: string | null;
  /** Failure reason — Google error codes, score-below-threshold, action mismatch, etc. */
  reason: string | null;
};

function isDev(): boolean {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  return !secret || secret.startsWith("XXX_");
}

export async function verifyRecaptcha(args: VerifyArgs): Promise<VerifyResult> {
  if (!args.token) {
    return { outcome: "block", score: null, action: null, reason: "missing_token" };
  }

  if (isDev()) {
    console.warn(
      `[recaptcha:dev] RECAPTCHA_SECRET_KEY missing or placeholder — bypassing verification for action="${args.expectedAction}"`,
    );
    return { outcome: "dev_bypass", score: 1.0, action: args.expectedAction, reason: null };
  }

  const params = new URLSearchParams({
    secret: process.env.RECAPTCHA_SECRET_KEY!,
    response: args.token,
  });
  if (args.remoteIp) params.set("remoteip", args.remoteIp);

  let response: Response;
  try {
    response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { outcome: "block", score: null, action: null, reason: `network_${message}` };
  }

  if (!response.ok) {
    return { outcome: "block", score: null, action: null, reason: `http_${response.status}` };
  }

  const data = (await response.json()) as {
    success: boolean;
    score?: number;
    action?: string;
    hostname?: string;
    "error-codes"?: string[];
  };

  if (!data.success) {
    const codes = data["error-codes"]?.join(",") ?? "unknown";
    return { outcome: "block", score: null, action: null, reason: `recaptcha_${codes}` };
  }

  const score = typeof data.score === "number" ? data.score : 0;
  const action = data.action ?? null;

  if (action !== args.expectedAction) {
    return {
      outcome: "block",
      score,
      action,
      reason: `action_mismatch_expected_${args.expectedAction}`,
    };
  }

  const { block_below, review_below } = loadThresholds();
  if (score < block_below) {
    return { outcome: "block", score, action, reason: `score_below_${block_below}` };
  }
  if (score < review_below) {
    return { outcome: "review", score, action, reason: `score_below_${review_below}` };
  }
  return { outcome: "pass", score, action, reason: null };
}
