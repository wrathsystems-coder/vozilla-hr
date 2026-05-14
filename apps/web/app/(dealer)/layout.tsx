import type { Metadata } from "next";
import "../globals.css";

// Dealer portal route group has its own root <html>/<body> so it doesn't
// inherit the public chrome (Header/Footer/CookieBanner/StickyWidget) or
// Payload's RootLayout. Individual pages under /partneri/* gate themselves
// via lib/dealer/auth.ts requireDealer() — the login page does not gate.

export const metadata: Metadata = {
  title: { default: "Partneri — vozilla.hr", template: "%s — Partneri — vozilla.hr" },
  robots: { index: false, follow: false, nocache: true },
};

export default function DealerRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body className="bg-surface-muted text-text min-h-screen">{children}</body>
    </html>
  );
}
