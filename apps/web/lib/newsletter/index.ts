import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { newsletterSubscribers } from "@/lib/db/schema";
import { now } from "@/lib/utils/time";

// Newsletter pipeline state machine. Spec: docs/spec/04-features-and-flows.md
// + spec/02-legal-and-compliance.md double-opt-in requirement under GDPR.
//
// Transitions (status column on newsletter_subscribers):
//   subscribe()   →  pending_confirmation  (UPSERT — re-subscribe paths reset the token)
//   confirm()     →  active                (clears confirmation_token, sets confirmed_at)
//   unsubscribe() →  unsubscribed          (preserves history for re-subscribe; sets unsubscribed_at)

export const CONFIRMATION_TTL_HOURS = 24;

export type SubscribeResult =
  | { status: "queued"; confirmationToken: string; id: number }
  | { status: "already_active"; id: number }
  | { status: "pending_resent"; confirmationToken: string; id: number };

/** Normalise email for storage + lookup (Postgres unique index is case-sensitive). */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function newConfirmationToken(): string {
  return randomUUID();
}

export async function subscribe(args: {
  email: string;
  sourceForm: string;
  ipAddress?: string | null;
}): Promise<SubscribeResult> {
  const email = normalizeEmail(args.email);
  const db = getDb();
  const existing = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);
  const row = existing[0];

  // Already active subscriber: idempotent success — don't re-send confirm
  // email (would be spam), don't reset the consent timestamp.
  if (row && row.status === "active") {
    return { status: "already_active", id: row.id };
  }

  // Existing pending or previously-unsubscribed row: refresh the token,
  // re-arm to pending_confirmation, send a fresh email. Same UX as a new
  // signup, no email enumeration concern (we don't tell the form caller
  // which branch it hit — they always get { status: "queued" } 200).
  const confirmationToken = newConfirmationToken();
  const nowTs = now();

  if (row) {
    await db
      .update(newsletterSubscribers)
      .set({
        status: "pending_confirmation",
        confirmationToken,
        confirmedAt: null,
        unsubscribedAt: null,
        sourceForm: args.sourceForm,
        ipAddress: args.ipAddress ?? null,
        updatedAt: nowTs,
      })
      .where(eq(newsletterSubscribers.id, row.id));
    return { status: "pending_resent", confirmationToken, id: row.id };
  }

  const inserted = await db
    .insert(newsletterSubscribers)
    .values({
      email,
      status: "pending_confirmation",
      confirmationToken,
      sourceForm: args.sourceForm,
      ipAddress: args.ipAddress ?? null,
    })
    .returning({ id: newsletterSubscribers.id });

  return { status: "queued", confirmationToken, id: inserted[0].id };
}

export type ConfirmResult =
  | { status: "ok"; email: string }
  | { status: "not_found" }
  | { status: "already_confirmed" };

export async function confirm(token: string): Promise<ConfirmResult> {
  if (typeof token !== "string" || token.length < 16) return { status: "not_found" };
  const db = getDb();
  const rows = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.confirmationToken, token))
    .limit(1);
  const row = rows[0];
  if (!row) return { status: "not_found" };
  if (row.status === "active") return { status: "already_confirmed" };

  await db
    .update(newsletterSubscribers)
    .set({
      status: "active",
      confirmedAt: now(),
      confirmationToken: null,
      updatedAt: now(),
    })
    .where(eq(newsletterSubscribers.id, row.id));
  return { status: "ok", email: row.email };
}

export type UnsubscribeResult =
  | { status: "ok"; email: string }
  | { status: "not_found" }
  | { status: "already_unsubscribed" };

export async function unsubscribe(email: string): Promise<UnsubscribeResult> {
  const normalized = normalizeEmail(email);
  const db = getDb();
  const rows = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, normalized))
    .limit(1);
  const row = rows[0];
  if (!row) return { status: "not_found" };
  if (row.status === "unsubscribed") return { status: "already_unsubscribed" };

  await db
    .update(newsletterSubscribers)
    .set({
      status: "unsubscribed",
      unsubscribedAt: now(),
      confirmationToken: null,
      updatedAt: now(),
    })
    .where(eq(newsletterSubscribers.id, row.id));
  return { status: "ok", email: normalized };
}

// HMAC-signed unsubscribe URLs so we can put one-click unsubscribe in the
// footer of every newsletter without exposing a token DB lookup. The
// signature ties the email to PAYLOAD_SECRET — anyone who gets the link
// can only unsubscribe that one email.

function unsubscribeSecret(): Buffer {
  const secret = process.env.PAYLOAD_SECRET;
  if (!secret || secret.startsWith("XXX_")) {
    throw new Error("PAYLOAD_SECRET is not set — unsubscribe signing cannot proceed");
  }
  // Derive a dedicated key per purpose so a future use of PAYLOAD_SECRET in
  // another context can't be replayed against the unsubscribe endpoint.
  return createHash("sha256").update(`vozilla:newsletter:unsubscribe:${secret}`).digest();
}

function signUnsubscribe(email: string): string {
  return createHmac("sha256", unsubscribeSecret()).update(normalizeEmail(email)).digest("hex");
}

export function buildUnsubscribeUrl(email: string, baseUrl: string): string {
  const sig = signUnsubscribe(email);
  const qs = new URLSearchParams({ email: normalizeEmail(email), sig });
  return `${baseUrl}/odjava-newslettera?${qs.toString()}`;
}

export function verifyUnsubscribeSignature(email: string, sig: string): boolean {
  if (typeof sig !== "string" || sig.length !== 64) return false;
  const expected = signUnsubscribe(email);
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"));
  } catch {
    return false;
  }
}
