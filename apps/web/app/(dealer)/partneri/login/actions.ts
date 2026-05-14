"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import { generateExpiredPayloadCookie, generatePayloadCookie } from "payload/shared";
import config from "@payload-config";
import { logAudit } from "@/lib/audit-log";
import { getClientIp } from "@/lib/http/client-ip";
import { enforce as rateLimit } from "@/lib/rate-limit";
import { now } from "@/lib/utils/time";
import type { Dealer } from "@/payload-types";

// Server actions for the dealer login + logout flows. The Payload local
// `payload.login()` API verifies password + handles loginAttempts/lockUntil
// on its own; we layer on an IP-level rate limit + honeypot, then set the
// shared payload-token cookie ourselves so the existing requireDealer()
// helper picks it up on the next request.

const LOGIN_RATE_LIMIT_MAX = 10;
const LOGIN_RATE_LIMIT_WINDOW_SEC = 15 * 60;

export type LoginActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const honeypot = String(formData.get("website") ?? "");
  const redirectTo = sanitizeRedirect(String(formData.get("redirect_to") ?? "/partneri/dashboard"));

  if (honeypot.length > 0) {
    // Bot — pretend success-ish but go nowhere meaningful. Return a generic
    // error so we don't tip them off about the honeypot.
    return { status: "error", message: GENERIC_ERROR };
  }
  if (!email || !password) {
    return { status: "error", message: "Unesi email i lozinku." };
  }

  const headerList = await headers();
  const ip = getClientIp(new Request("http://x", { headers: headerList }));

  const rate = await rateLimit({
    key: `ip:${ip}`,
    endpoint: "dealer-login",
    limit: LOGIN_RATE_LIMIT_MAX,
    windowSec: LOGIN_RATE_LIMIT_WINDOW_SEC,
  });
  if (!rate.allowed) {
    return {
      status: "error",
      message: `Previše pokušaja prijave. Pokušaj ponovno za ${Math.ceil(rate.retryAfterSec / 60)} min.`,
    };
  }

  const payload = await getPayload({ config });
  const sanitized = payload.collections["dealers"];
  if (!sanitized) throw new Error("dealers collection missing");

  let result: { token?: string; user?: Dealer } | null = null;
  try {
    result = (await payload.login({
      collection: "dealers",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { email, password } as any,
    })) as unknown as { token?: string; user?: Dealer };
  } catch (err) {
    // Payload throws AuthenticationError / LockedAuth / etc. We collapse all
    // failure modes into one generic message to avoid email-enumeration.
    await logAudit({
      actorType: "dealer",
      actorId: email,
      action: "dealer.login_failed",
      entityType: "dealer",
      entityId: null,
      after: { reason: err instanceof Error ? err.name : "unknown" },
      ipAddress: ip,
    });
    return { status: "error", message: GENERIC_ERROR };
  }

  const user = result?.user;
  const token = result?.token;
  if (!user || !token) return { status: "error", message: GENERIC_ERROR };

  if (!user.is_active) {
    // Don't issue a cookie for suspended accounts. Surface a distinct
    // message — the spec separates "wrong creds" from "suspended" so the
    // dealer knows to contact us rather than reset their password.
    await logAudit({
      actorType: "dealer",
      actorId: String(user.id),
      action: "dealer.login_blocked_inactive",
      entityType: "dealer",
      entityId: user.id,
      ipAddress: ip,
    });
    return {
      status: "error",
      message: "Nalog je suspendiran. Kontaktiraj nas za detalje.",
    };
  }

  const cookie = generatePayloadCookie({
    collectionAuthConfig: sanitized.config.auth,
    cookiePrefix: payload.config.cookiePrefix ?? "payload",
    token,
  });
  const cookieStore = await cookies();
  // Payload's helper returns a Set-Cookie style string; we feed the parsed
  // pieces into Next's cookies().set() so HttpOnly + secure + sameSite apply
  // consistently with the rest of the auth chain.
  cookieStore.set(parseSetCookie(cookie));

  // Best-effort last_login_at touch; failure must not block the response.
  try {
    await payload.update({
      collection: "dealers",
      id: user.id,
      overrideAccess: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { last_login_at: now().toISOString() } as any,
    });
  } catch {
    /* ignore */
  }

  await logAudit({
    actorType: "dealer",
    actorId: String(user.id),
    action: "dealer.login_success",
    entityType: "dealer",
    entityId: user.id,
    ipAddress: ip,
  });

  redirect(redirectTo);
}

export async function logoutAction(): Promise<void> {
  const payload = await getPayload({ config });
  const sanitized = payload.collections["dealers"];
  if (!sanitized) throw new Error("dealers collection missing");

  const headerList = await headers();
  const auth = await payload.auth({ headers: headerList });
  if (auth.user && (auth.user as { collection?: string }).collection === "dealers") {
    await logAudit({
      actorType: "dealer",
      actorId: String((auth.user as Dealer).id),
      action: "dealer.logout",
      entityType: "dealer",
      entityId: (auth.user as Dealer).id,
      ipAddress: getClientIp(new Request("http://x", { headers: headerList })),
    });
  }

  const expired = generateExpiredPayloadCookie({
    collectionAuthConfig: sanitized.config.auth,
    cookiePrefix: payload.config.cookiePrefix ?? "payload",
  });
  const cookieStore = await cookies();
  cookieStore.set(parseSetCookie(expired));

  redirect("/partneri/login");
}

const GENERIC_ERROR = "Pogrešan email ili lozinka.";

function sanitizeRedirect(input: string): string {
  if (!input.startsWith("/partneri/")) return "/partneri/dashboard";
  if (input.startsWith("//")) return "/partneri/dashboard";
  return input;
}

/**
 * Payload returns a Set-Cookie string (key=value; HttpOnly; Secure; …). Next's
 * cookies().set() takes a structured object — we parse just the bits we care
 * about so the cookie roundtrips with the same flags Payload would have set
 * on its own /api/dealers/login route.
 */
function parseSetCookie(raw: string): {
  name: string;
  value: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  maxAge?: number;
  expires?: Date;
  domain?: string;
} {
  const parts = raw.split(";").map((p) => p.trim());
  const [pair, ...attrs] = parts;
  const eq = pair.indexOf("=");
  const name = pair.slice(0, eq);
  const value = pair.slice(eq + 1);

  const out: {
    name: string;
    value: string;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    path?: string;
    maxAge?: number;
    expires?: Date;
    domain?: string;
  } = { name, value };

  for (const attr of attrs) {
    const [k, v] = attr.split("=").map((s) => s.trim());
    const lk = k.toLowerCase();
    if (lk === "httponly") out.httpOnly = true;
    else if (lk === "secure") out.secure = true;
    else if (lk === "samesite" && v) {
      const lv = v.toLowerCase();
      if (lv === "lax" || lv === "strict" || lv === "none") out.sameSite = lv;
    } else if (lk === "path" && v) out.path = v;
    else if (lk === "max-age" && v) out.maxAge = Number(v);
    else if (lk === "expires" && v) out.expires = new Date(v);
    else if (lk === "domain" && v) out.domain = v;
  }
  return out;
}
