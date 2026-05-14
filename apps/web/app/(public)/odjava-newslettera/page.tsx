import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { isEnabled } from "@/lib/feature-flags";
import { confirm, unsubscribe, verifyUnsubscribeSignature } from "@/lib/newsletter";

// Two flows on one page:
//   ?confirm=<uuid>          → double opt-in landing (signup → confirm)
//   ?email=<addr>&sig=<hmac> → one-click unsubscribe from email footer
//
// Plain page with no client JS — every state change happens server-side
// on render. The user lands here from an email; the page reports the
// outcome and offers a sensible follow-up link.
//
// When `newsletter` feature flag is off, this page still renders for a
// stale email link but every action is a no-op informational message.

export const metadata: Metadata = {
  title: "Newsletter — odjava i potvrda",
  description: "Potvrdi pretplatu ili se odjavi s newsletter liste vozilla.hr.",
  robots: { index: false, follow: false },
};

type SearchParams = {
  confirm?: string;
  email?: string;
  sig?: string;
};

type Outcome =
  | { kind: "idle" }
  | { kind: "feature_disabled" }
  | { kind: "confirm_ok"; email: string }
  | { kind: "confirm_already" }
  | { kind: "confirm_invalid" }
  | { kind: "unsubscribe_ok"; email: string }
  | { kind: "unsubscribe_already" }
  | { kind: "unsubscribe_invalid_signature" }
  | { kind: "unsubscribe_not_found" };

async function resolveOutcome(params: SearchParams): Promise<Outcome> {
  if (!isEnabled("newsletter")) return { kind: "feature_disabled" };

  if (params.confirm) {
    const result = await confirm(params.confirm);
    if (result.status === "ok") return { kind: "confirm_ok", email: result.email };
    if (result.status === "already_confirmed") return { kind: "confirm_already" };
    return { kind: "confirm_invalid" };
  }

  if (params.email && params.sig) {
    if (!verifyUnsubscribeSignature(params.email, params.sig)) {
      return { kind: "unsubscribe_invalid_signature" };
    }
    const result = await unsubscribe(params.email);
    if (result.status === "ok") return { kind: "unsubscribe_ok", email: result.email };
    if (result.status === "already_unsubscribed") return { kind: "unsubscribe_already" };
    return { kind: "unsubscribe_not_found" };
  }

  return { kind: "idle" };
}

function MessageCopy({ outcome }: { outcome: Outcome }) {
  switch (outcome.kind) {
    case "idle":
      return (
        <>
          <Heading level={1}>Newsletter</Heading>
          <p className="text-text-muted mt-3">
            Ova stranica se otvara iz potvrdnog ili odjavnog emaila. Ako si ovdje direktno,
            kontaktiraj nas — sigurno možemo riješiti što ti treba.
          </p>
        </>
      );
    case "feature_disabled":
      return (
        <>
          <Heading level={1}>Newsletter trenutno nije aktivan</Heading>
          <p className="text-text-muted mt-3">
            Newsletter platforma trenutno nije u funkciji. Ako si dobio/la stari odjavni link, ne
            brini — već nismo dio aktivne mailing liste.
          </p>
        </>
      );
    case "confirm_ok":
      return (
        <>
          <Heading level={1}>Pretplata potvrđena</Heading>
          <p className="text-text-muted mt-3">
            Hvala! Tvoja adresa <strong>{outcome.email}</strong> je sad na listi. Šaljemo nove
            recenzije i savjete jednom mjesečno — bez spama.
          </p>
        </>
      );
    case "confirm_already":
      return (
        <>
          <Heading level={1}>Već si potvrdio/la pretplatu</Heading>
          <p className="text-text-muted mt-3">
            Tvoja adresa je već aktivna na listi. Ne treba ništa raditi.
          </p>
        </>
      );
    case "confirm_invalid":
      return (
        <>
          <Heading level={1}>Link nije važeći</Heading>
          <p className="text-text-muted mt-3">
            Linkovi za potvrdu vrijede 24 sata. Ako je tvoj istekao, registriraj se ponovno na
            footer-u stranice.
          </p>
        </>
      );
    case "unsubscribe_ok":
      return (
        <>
          <Heading level={1}>Odjavljen/a si</Heading>
          <p className="text-text-muted mt-3">
            Više nećeš dobivati newsletter emailove na <strong>{outcome.email}</strong>. Hvala što
            si bio/la dio liste!
          </p>
        </>
      );
    case "unsubscribe_already":
      return (
        <>
          <Heading level={1}>Već si odjavljen/a</Heading>
          <p className="text-text-muted mt-3">Tvoja adresa nije na aktivnoj listi.</p>
        </>
      );
    case "unsubscribe_invalid_signature":
      return (
        <>
          <Heading level={1}>Link nije važeći</Heading>
          <p className="text-text-muted mt-3">
            Odjavni link je neispravan ili promijenjen. Kontaktiraj nas direktno ako želiš da te
            ručno skinemo s liste.
          </p>
        </>
      );
    case "unsubscribe_not_found":
      return (
        <>
          <Heading level={1}>Adresa nije na listi</Heading>
          <p className="text-text-muted mt-3">
            Ne pronalazimo tvoju adresu u našoj newsletter bazi. Možda si već odjavljen/a.
          </p>
        </>
      );
  }
}

export default async function OdjavaNewsletteraPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const outcome = await resolveOutcome(params);

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-xl text-center">
        <MessageCopy outcome={outcome} />
        <div className="mt-8">
          <Link href="/" className="text-sm font-medium underline">
            Vrati se na naslovnicu
          </Link>
        </div>
      </div>
    </Container>
  );
}
