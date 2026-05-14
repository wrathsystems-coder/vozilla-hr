import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { validateToken } from "@/lib/magic-link";
import ResetForm from "./ResetForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset lozinke",
  robots: { index: false, follow: false, nocache: true },
};

type Params = Promise<{ token: string }>;

export default async function DealerResetPasswordPage({ params }: { params: Params }) {
  const { token } = await params;
  const validation = await validateToken(token, "password_reset");

  // Token is only validated (not consumed) here — the server action consumes
  // it on submit. The validateToken call gives us a friendly error page
  // when the user lands with a stale or already-used link, instead of
  // letting them type their new password into a form that's about to fail.
  const invalid =
    !validation.valid ||
    (validation.valid && validation.usedAt !== null) ||
    (validation.valid && validation.entityType !== "dealer");

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <Heading level={1}>Resetiraj lozinku</Heading>
        </div>

        {invalid ? (
          <div className="border-state-error/30 bg-state-error/5 space-y-3 rounded-md border p-4 text-sm">
            <p>Ovaj link nije važeći — možda je istekao (vrijedi 1 sat) ili je već iskorišten.</p>
            <p>
              <Link href="/partneri/zaboravljena-lozinka" className="underline">
                Zatraži novi reset link
              </Link>
            </p>
          </div>
        ) : (
          <>
            <p className="text-text-muted text-sm">
              Postavi novu lozinku za svoj diler račun. Nakon promjene, prijavi se s novom lozinkom.
            </p>
            <ResetForm token={token} />
          </>
        )}

        <p className="text-text-muted text-center text-sm">
          <Link href="/partneri/login" className="underline">
            ← Natrag na prijavu
          </Link>
        </p>
      </div>
    </Container>
  );
}
