import "../globals.css";

// Admin-tools route group has its own root <html>/<body> so it doesn't
// inherit either the public chrome (Header/Footer/CookieBanner/StickyWidget)
// or Payload's RootLayout. Pages under /admin-tools/* are gated server-side
// via lib/admin/auth.ts requireAdmin().

export default function AdminToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body className="bg-surface-muted text-text min-h-screen">{children}</body>
    </html>
  );
}
