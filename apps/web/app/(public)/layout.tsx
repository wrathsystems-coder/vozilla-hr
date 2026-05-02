import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "vozilla.hr",
    template: "%s — vozilla.hr",
  },
  description: "[XXX_SITE_DESCRIPTION: opis platforme, 150-160 znakova]",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-black focus:px-3 focus:py-2 focus:text-white"
        >
          Preskoči na sadržaj
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
