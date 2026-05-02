import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "vozilla.hr",
    template: "%s — vozilla.hr",
  },
  description: "[XXX_SITE_DESCRIPTION: opis platforme, 150-160 znakova]",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body>{children}</body>
    </html>
  );
}
