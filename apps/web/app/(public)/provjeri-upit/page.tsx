import type { Metadata } from "next";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import ResendForm from "./ResendForm";

export const metadata: Metadata = {
  title: "Provjeri svoj upit",
  description: "Izgubio/la si tracking link? Unesi email i broj upita pa ti šaljemo novi link.",
};

export default function ProvjeriUpitPage() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-md">
        <Heading level={1}>Provjeri svoj upit</Heading>
        <p className="text-text-muted mt-3 text-base">
          Unesi email s kojim si poslao/la upit i broj upita iz potvrdnog emaila. Šaljemo ti novi
          tracking link.
        </p>
        <div className="mt-8">
          <ResendForm />
        </div>
      </div>
    </Container>
  );
}
