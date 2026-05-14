import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AutoPrint from "@/components/print/AutoPrint";
import { getLegalPage, listLegalSlugs } from "@/lib/legal/pages";
import { now } from "@/lib/utils/time";

// Print-friendly rendering of a legal page. Lives in the (print) route
// group so it doesn't inherit Header / Footer / CookieBanner. CSS in the
// layout switches to A4 dimensions + serif body for the saved PDF.

type Params = { slug: string };

const dateFmt = new Intl.DateTimeFormat("hr-HR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function generateStaticParams(): Array<Params> {
  return listLegalSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getLegalPage(slug);
  return {
    title: page ? `${page.title} — PDF verzija` : "Stranica nije pronađena",
    robots: { index: false, follow: false },
  };
}

export default async function PrintLegalPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = getLegalPage(slug);
  if (!page) notFound();

  const lastUpdated = dateFmt.format(now());

  return (
    <>
      <AutoPrint />
      <p className="print-hint no-print">
        Pritisni <kbd>Ctrl</kbd>+<kbd>P</kbd> (ili <kbd>Cmd</kbd>+<kbd>P</kbd>) i odaberi
        <strong> Spremi kao PDF</strong>. Dijalog bi se trebao automatski otvoriti.
      </p>
      <header>
        <h1 style={{ fontSize: "20pt", margin: 0 }}>{page.title}</h1>
        <p style={{ fontSize: "10pt", color: "#444", marginTop: "0.25rem" }}>
          vozilla.hr · Posljednja izmjena: {lastUpdated}
        </p>
      </header>
      <hr style={{ margin: "1.25rem 0", border: 0, borderTop: "1px solid #ccc" }} />
      <article>{page.placeholder}</article>
      <footer
        style={{
          marginTop: "2rem",
          paddingTop: "1rem",
          borderTop: "1px solid #ccc",
          fontSize: "9pt",
          color: "#555",
        }}
      >
        vozilla.hr — automatski generirana PDF verzija. Za interaktivnu verziju posjeti{" "}
        <a href={`https://vozilla.hr/${slug}`}>vozilla.hr/{slug}</a>.
      </footer>
    </>
  );
}
