import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import type { AdminUser } from "@/payload-types";

// Custom Next.js routes outside the Payload admin chrome (e.g.
// /admin-tools/*) need to validate the Payload session cookie themselves.
// requireAdmin() resolves the session and redirects to /admin/login on
// failure, so call sites get a typed user or never proceed.

const PRIVILEGED_ROLES: ReadonlyArray<AdminUser["role"]> = ["super_admin", "admin", "operator"];

export type AdminSession = {
  user: AdminUser;
};

export async function requireAdmin(redirectTo: string): Promise<AdminSession> {
  const payload = await getPayload({ config });
  const headerList = await headers();
  const auth = await payload.auth({ headers: headerList });
  const user = auth.user as AdminUser | null;

  if (!user) {
    redirect(`/admin/login?redirect=${encodeURIComponent(redirectTo)}`);
  }

  if (!user.is_active) {
    redirect(`/admin/login?reason=inactive`);
  }

  if (!PRIVILEGED_ROLES.includes(user.role)) {
    // Viewer / unknown role — bounce back to admin home, no privilege escalation.
    redirect(`/admin?reason=forbidden`);
  }

  return { user };
}
