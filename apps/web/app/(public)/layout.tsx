import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import CookieBanner from "@/components/widgets/CookieBanner";
import JsonLd from "@/lib/seo/jsonld";
import { siteUrl } from "@/lib/seo/site-url";
import "../globals.css";

const description = "[XXX_SITE_DESCRIPTION: opis platforme, 150-160 znakova]";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "vozilla.hr",
    template: "%s — vozilla.hr",
  },
  description,
  openGraph: {
    type: "website",
    locale: "hr_HR",
    url: "/",
    siteName: "vozilla.hr",
    title: "vozilla.hr",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "vozilla.hr",
    description,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "vozilla.hr",
  url: siteUrl(),
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "vozilla.hr",
  url: siteUrl(),
  inLanguage: "hr-HR",
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl()}/pretraga?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body>
        <CookieBanner />
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[70] focus:rounded focus:bg-black focus:px-3 focus:py-2 focus:text-white"
        >
          Preskoči na sadržaj
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
