import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { getDealerSession } from "@/lib/dealer/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Prijava",
  robots: { index: false, follow: false, nocache: true },
};

type SearchParams = Promise<{ redirect?: string; reason?: string }>;

export default async function DealerLoginPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getDealerSession();
  const { redirect: redirectTo, reason } = await searchParams;

  if (session) {
    // Already authenticated — bounce to dashboard (or wherever they were headed).
    redirect(safeRedirect(redirectTo) ?? "/dileri/dashboard");
  }

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <Heading level={1}>Diler prijava</Heading>
          <p className="text-text-muted text-sm">
            Prijavi se da pristupiš leadovima koje ti je dodijelio vozilla.hr.
          </p>
        </div>

        {reason === "inactive" ? (
          <p
            className="border-state-error/30 bg-state-error/5 rounded-md border p-3 text-sm"
            role="status"
          >
            Tvoj nalog je trenutno suspendiran. Kontaktiraj nas za detalje.
          </p>
        ) : null}

        <LoginForm redirectTo={safeRedirect(redirectTo) ?? "/dileri/dashboard"} />

        <p className="text-text-muted text-center text-sm">
          <Link className="underline" href="/dileri/zaboravljena-lozinka">
            Zaboravljena lozinka?
          </Link>
        </p>
      </div>
    </Container>
  );
}

/**
 * Only accept same-site, /dileri-prefixed paths. Prevents an attacker from
 * crafting /dileri/login?redirect=https://evil.example/ that would bounce a
 * freshly-authenticated dealer off-site.
 */
function safeRedirect(input: string | undefined): string | null {
  if (!input) return null;
  if (!input.startsWith("/dileri/")) return null;
  if (input.startsWith("//")) return null;
  return input;
}
