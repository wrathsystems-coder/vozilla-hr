import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import ForgotForm from "./ForgotForm";

export const metadata: Metadata = {
  title: "Zaboravljena lozinka",
  robots: { index: false, follow: false, nocache: true },
};

export default function DealerForgotPasswordPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <Heading level={1}>Zaboravljena lozinka</Heading>
          <p className="text-text-muted text-sm">
            Unesi email kojim se prijavljuješ. Poslat ćemo ti link za postavljanje nove lozinke.
          </p>
        </div>

        <ForgotForm />

        <p className="text-text-muted text-center text-sm">
          <Link href="/partneri/login" className="underline">
            ← Natrag na prijavu
          </Link>
        </p>
      </div>
    </Container>
  );
}
