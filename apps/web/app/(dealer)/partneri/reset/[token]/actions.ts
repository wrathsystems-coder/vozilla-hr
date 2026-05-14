"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import { logAudit } from "@/lib/audit-log";
import { getClientIp } from "@/lib/http/client-ip";
import { consumeToken, revokeTokensFor } from "@/lib/magic-link";

// Atomic token consumption + password update. The magic-link library's
// consumeToken() flips the row to used inside a single UPDATE so two
// concurrent submissions can't both succeed — the loser gets `already_used`.

const MIN_PASSWORD = 10;
const MAX_PASSWORD = 200;

export type ResetActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

export async function resetPasswordAction(
  _prev: ResetActionState,
  formData: FormData,
): Promise<ResetActionState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const honeypot = String(formData.get("website") ?? "");
  if (honeypot.length > 0) {
    return { status: "error", message: "Nije moguće dovršiti zahtjev." };
  }

  if (!token) return { status: "error", message: "Nedostaje token." };
  if (password.length < MIN_PASSWORD) {
    return {
      status: "error",
      message: `Lozinka mora imati najmanje ${MIN_PASSWORD} znakova.`,
    };
  }
  if (password.length > MAX_PASSWORD) {
    return {
      status: "error",
      message: `Lozinka može imati najviše ${MAX_PASSWORD} znakova.`,
    };
  }
  if (password !== passwordConfirm) {
    return { status: "error", message: "Lozinke se ne poklapaju." };
  }

  const result = await consumeToken(token, "password_reset");
  if (!result.valid) {
    const message =
      result.reason === "expired"
        ? "Link je istekao. Zatraži novi reset."
        : result.reason === "already_used"
          ? "Link je već iskorišten. Zatraži novi reset."
          : "Link nije važeći.";
    return { status: "error", message };
  }
  if (result.entityType !== "dealer") {
    return { status: "error", message: "Link nije važeći." };
  }
  const dealerId = Number(result.entityId);
  if (!Number.isInteger(dealerId) || dealerId <= 0) {
    return { status: "error", message: "Link nije važeći." };
  }

  const payload = await getPayload({ config });
  const headerList = await headers();
  const ip = getClientIp(new Request("http://x", { headers: headerList }));

  try {
    await payload.update({
      collection: "dealers",
      id: dealerId,
      overrideAccess: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { password } as any,
    });
  } catch (err) {
    return {
      status: "error",
      message:
        "Promjena lozinke nije uspjela: " +
        (err instanceof Error ? err.message : "nepoznata greška."),
    };
  }

  // Invalidate any other still-fresh reset tokens for the same dealer so a
  // stolen-and-replayed link can't reset the password a second time.
  await revokeTokensFor("dealer", dealerId);

  await logAudit({
    actorType: "dealer",
    actorId: String(dealerId),
    action: "dealer.password_reset_completed",
    entityType: "dealer",
    entityId: dealerId,
    ipAddress: ip,
  });

  redirect("/partneri/login?reset=ok");
}
