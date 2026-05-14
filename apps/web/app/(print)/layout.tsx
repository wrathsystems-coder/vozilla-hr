import type { Metadata } from "next";
import "../globals.css";

// Print-only layout. Separate from (public) so the print routes don't
// inherit Header / Footer / Cookiebot / sticky widget — those would
// land in the saved PDF otherwise.
//
// The window.print() trigger lives in components/print/AutoPrint.tsx
// so this layout stays static. CSS uses @media print to enforce A4-ish
// margins and strip residual color so the browser produces clean output.

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr">
      <body>
        <main>{children}</main>
        <style>{`
          @page {
            margin: 2cm 2cm 2.5cm 2cm;
            size: A4;
          }
          @media print {
            html, body {
              background: #fff !important;
              color: #000;
              font-family: Georgia, "Times New Roman", serif;
              line-height: 1.55;
              font-size: 11pt;
            }
            .no-print { display: none !important; }
            a { color: #000; text-decoration: none; }
            a[href]:after { content: " (" attr(href) ")"; font-size: 9pt; color: #555; }
            /* Skip the "(href)" hint for internal anchors and javascript: links. */
            a[href^="#"]:after,
            a[href^="javascript:"]:after { content: ""; }
            h1, h2, h3, h4 { page-break-after: avoid; }
            article { white-space: pre-wrap; }
          }
          @media screen {
            body {
              max-width: 720px;
              margin: 2rem auto;
              padding: 0 1.5rem;
              font-family: Georgia, "Times New Roman", serif;
              line-height: 1.6;
              color: #111;
              background: #fafafa;
            }
            .print-hint {
              background: #fffbe6;
              border: 1px solid #f3d779;
              padding: 0.75rem 1rem;
              border-radius: 6px;
              margin-bottom: 1.5rem;
              font-size: 0.9rem;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
