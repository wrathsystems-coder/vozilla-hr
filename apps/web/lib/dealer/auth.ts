import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Dealer } from "@/payload-types";

// Dealer-portal session helper, parallel to lib/admin/auth.ts. The Payload
// auth cookie (`payload-token`) is shared across auth collections — we
// gate on `user.collection === 'dealers'` so an admin browsing /dileri/*
// is treated as logged out, and vice versa.

export type DealerSession = {
  dealer: Dealer;
};

export async function getDealerSession(): Promise<DealerSession | null> {
  const payload = await getPayload({ config });
  const headerList = await headers();
  const auth = await payload.auth({ headers: headerList });
  const user = auth.user as (Dealer & { collection?: string }) | null;
  if (!user) return null;
  if (user.collection !== "dealers") return null;
  return { dealer: user };
}

export async function requireDealer(redirectTo: string): Promise<DealerSession> {
  const session = await getDealerSession();
  if (!session) {
    redirect(`/dileri/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
  if (!session.dealer.is_active) {
    redirect(`/dileri/login?reason=inactive`);
  }
  return session;
}
