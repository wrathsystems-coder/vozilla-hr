import Link from "next/link";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";

export default function NotFound() {
  return (
    <Container className="py-20 text-center">
      <p className="text-text-muted text-sm font-semibold">404</p>
      <Heading level={1} className="mt-2">
        Stranica nije pronađena
      </Heading>
      <p className="text-text-muted mx-auto mt-4 max-w-xl">
        Tražena stranica ne postoji, premještena je ili je link koji ste pratili pogrešan.
      </p>
      <Link
        href="/"
        className="bg-brand-accent text-brand-primary focus-visible:outline-brand-accent mt-8 inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        Natrag na početnu
      </Link>
    </Container>
  );
}
