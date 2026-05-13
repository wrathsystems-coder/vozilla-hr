import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { quizResults } from "@/lib/db/schema/quizResults";
import { getClientIp } from "@/lib/http/client-ip";
import { enforce as rateLimit } from "@/lib/rate-limit";
import { recommendModels, type QuizAnswers } from "@/lib/quiz-recommender";
import { fetchModelsForRecommender } from "@/lib/quiz/fetch";
import { now } from "@/lib/utils/time";

/**
 * POST /api/quiz/save
 *
 * Persists the user's answers + a snapshot of the recommended model ids,
 * issues a token, returns { token }. Token URL `/pomoc-pri-izboru/
 * rezultati/{token}` is shareable and remains valid until expires_at
 * (now + 30 days) — the existing cleanup-expired cron sweeps stale rows.
 *
 * Scoring runs server-side so the snapshot uses the same recommender
 * the results page would use — no drift, and the call is bound to one
 * pure function over a few hundred models in memory.
 */

const ANSWERS_SCHEMA = z
  .object({
    bodyType: z.enum(["suv", "hatchback", "karavan", "sedan", "sportski", "elektricni"]).optional(),
    budgetMin: z.number().int().min(0).max(1_000_000).optional(),
    budgetMax: z.number().int().min(0).max(1_000_000).optional(),
    fuelType: z.enum(["benzin", "dizel", "hibrid", "elektricni", "plin"]).optional(),
    transmission: z.enum(["manual", "automatic"]).optional(),
    seats: z.enum(["2", "4-5", "5-7", "7+"]).optional(),
    priority: z
      .enum(["cijena", "pouzdanost", "performanse", "ekologija", "komfor", "prostor"])
      .optional(),
    newOrUsed: z.enum(["new", "used", "both"]).optional(),
    usage: z.enum(["city", "long_distance", "off_road", "mixed"]).optional(),
  })
  .strict();

const BODY_SCHEMA = z.object({ answers: ANSWERS_SCHEMA });

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const RECOMMENDED_SNAPSHOT_LIMIT = 20;

export async function POST(req: Request): Promise<NextResponse> {
  // Rate limit: 10/h per IP — the quiz is one submit per visit; an attacker
  // can't be filling the table from a single source.
  const ip = getClientIp(req);
  const rate = await rateLimit({
    key: `ip:${ip}`,
    endpoint: "quiz-save",
    limit: 10,
    windowSec: 60 * 60,
  });
  if (!rate.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let parsed: z.infer<typeof BODY_SCHEMA>;
  try {
    const json = await req.json();
    parsed = BODY_SCHEMA.parse(json);
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // budgetMin > budgetMax is the one cross-field invariant worth checking
  // at the boundary — recommender clamps internally but the snapshot
  // should still reflect coherent user intent.
  const { budgetMin, budgetMax } = parsed.answers;
  if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
    return NextResponse.json({ error: "budget_min_gt_max" }, { status: 400 });
  }

  // Score and snapshot the top N. Storing only ids + score keeps the
  // payload small; the results page re-fetches model details with
  // current catalog data so renames / price updates propagate.
  const catalog = await fetchModelsForRecommender();
  const scored = recommendModels(parsed.answers as QuizAnswers, catalog).slice(
    0,
    RECOMMENDED_SNAPSHOT_LIMIT,
  );
  const snapshot = scored.map((s) => ({ modelId: s.modelId, score: s.score }));

  const token = randomBytes(32).toString("hex");
  const ts = now();
  const expiresAt = new Date(ts.getTime() + THIRTY_DAYS_MS);

  const db = getDb();
  await db.insert(quizResults).values({
    token,
    answers: parsed.answers,
    recommendedModels: snapshot,
    expiresAt,
  });

  return NextResponse.json({ token }, { status: 200 });
}
