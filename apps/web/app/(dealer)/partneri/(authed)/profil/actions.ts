"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { z } from "zod";
import { logAudit } from "@/lib/audit-log";
import { requireDealer } from "@/lib/dealer/auth";
import { getClientIp } from "@/lib/http/client-ip";
import { validatePhoneHR, validatePostcodeHR } from "@/lib/utils/validate";

// Profile update is intentionally narrow: phone + address (street, city,
// postcode, county_id). Read-only fields here (legal_name, OIB, email,
// brands, scoring, is_active) are admin-managed — letting a dealer edit
// their own OIB would let them masquerade as another business, and
// scoring/is_active changes belong to the admin tools, not the dealer.
// The server-side allowlist below is the only authoritative gate; the
// UI's `disabled` attribute is just a hint.

const profileSchema = z.object({
  phone: z
    .string()
    .min(1, "Telefon je obavezan.")
    .refine((v) => validatePhoneHR(v), "Telefon nije u HR formatu."),
  street: z.string().min(1, "Ulica je obavezna.").max(200),
  city: z.string().min(1, "Grad je obavezan.").max(100),
  postcode: z
    .string()
    .min(1, "Poštanski broj je obavezan.")
    .refine((v) => validatePostcodeHR(v), "Nije HR poštanski broj."),
  county_id: z
    .string()
    .min(1, "Županija je obavezna.")
    .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, "Nepoznata županija."),
});

export type ProfileActionState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "success" };

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const { dealer } = await requireDealer("/partneri/profil");

  const parsed = profileSchema.safeParse({
    phone: String(formData.get("phone") ?? "").trim(),
    street: String(formData.get("street") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    postcode: String(formData.get("postcode") ?? "").trim(),
    county_id: String(formData.get("county_id") ?? "").trim(),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = issue.message;
    }
    return { status: "error", message: "Provjeri unos.", fieldErrors };
  }

  const payload = await getPayload({ config });
  const headerList = await headers();
  const ip = getClientIp(new Request("http://x", { headers: headerList }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patch: any = {
    phone: parsed.data.phone,
    address: {
      ...(dealer.address ?? {}),
      street: parsed.data.street,
      city: parsed.data.city,
      postcode: parsed.data.postcode,
      county_id: Number(parsed.data.county_id),
    },
  };

  try {
    await payload.update({
      collection: "dealers",
      id: dealer.id as number,
      overrideAccess: true,
      data: patch,
    });
  } catch (err) {
    return {
      status: "error",
      message:
        "Spremanje nije uspjelo: " + (err instanceof Error ? err.message : "nepoznata greška."),
    };
  }

  await logAudit({
    actorType: "dealer",
    actorId: String(dealer.id),
    action: "dealer.update_profile",
    entityType: "dealer",
    entityId: dealer.id,
    before: {
      phone: dealer.phone,
      address: dealer.address,
    },
    after: {
      phone: parsed.data.phone,
      address: patch.address,
    },
    ipAddress: ip,
  });

  revalidatePath("/partneri/profil");
  return { status: "success" };
}
