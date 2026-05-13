import type { Metadata } from "next";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Container from "@/components/ui/Container";
import Heading from "@/components/ui/Heading";
import { LexicalRenderer } from "@/components/lexical/render";
import { getPageBySlug } from "@/lib/pages/fetch";
import JsonLd from "@/lib/seo/jsonld";
import { breadcrumbsJsonLd } from "@/lib/seo/breadcrumbs";

export const revalidate = 3600;

const PAGE_SLUG = "leasing-vodic";

const breadcrumbs = [
  { name: "Početna", href: "/" },
  { name: "Leasing", href: "/leasing" },
  { name: "Vodič" },
];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug(PAGE_SLUG);
  return {
    title: page?.seo?.title || page?.title || "Vodič kroz leasing",
    description:
      page?.seo?.description ||
      "Vrste leasinga, ključni pojmovi i prava koja imaš kao korisnik — vodič za bolju odluku prije potpisa ugovora.",
    alternates: { canonical: "/leasing/vodic" },
  };
}

export default async function LeasingVodicPage() {
  const page = await getPageBySlug(PAGE_SLUG);

  return (
    <>
      <JsonLd data={breadcrumbsJsonLd(breadcrumbs)} />

      <section className="bg-surface py-12">
        <Container>
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <Heading level={1}>{page?.title ?? "Vodič kroz leasing"}</Heading>
        </Container>
      </section>

      <section className="bg-surface-muted py-12">
        <Container>
          <article className="prose-content max-w-3xl">
            {page?.content ? <LexicalRenderer content={page.content} /> : <FallbackContent />}
          </article>
        </Container>
      </section>
    </>
  );
}

function FallbackContent() {
  // Page hasn't been authored in Payload yet. We render an obvious
  // [XXX_*] marker — the placeholders:check script sees this and
  // PLACEHOLDERS.md documents what an editor needs to write here.
  return (
    <div className="border-surface-border bg-surface text-text-muted rounded-md border p-6 text-sm">
      <p className="text-text mb-2 font-medium">[XXX_LEASING_VODIC_TEKST: editor popunjava]</p>
      <p>
        Stranica vodiča kroz leasing još nije objavljena u Payloadu. Admin može kreirati Page sa
        slugom <code className="bg-surface-muted rounded px-1 py-0.5">leasing-vodic</code> i
        popuniti sadržaj kroz Lexical editor.
      </p>
      <p className="mt-2">Preporučene sekcije:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Što je leasing i kako se razlikuje od kredita</li>
        <li>Vrste leasinga — operativni vs. financijski (kome odgovara koji)</li>
        <li>Ključni pojmovi: NKS, EKS, polog, balon, kasko, ukupni trošak kredita</li>
        <li>Prava korisnika prema Zakonu o leasingu i HANFA pravilima</li>
        <li>Što provjeriti prije potpisa ugovora</li>
        <li>Najčešća pitanja</li>
      </ul>
    </div>
  );
}
