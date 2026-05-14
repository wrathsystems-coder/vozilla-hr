"use client";

import { useEffect } from "react";

// Auto-trigger the browser print dialog once the page has rendered.
// Small delay lets fonts settle so the saved PDF isn't paginated against
// the fallback font. A user gesture isn't required for window.print()
// in evergreen browsers; if a future browser tightens that, the print
// hint above remains a visible CTA so the user can trigger it manually.

export default function AutoPrint() {
  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        window.print();
      } catch {
        // print() can throw inside cross-origin iframes — harmless here.
      }
    }, 250);
    return () => window.clearTimeout(id);
  }, []);

  return null;
}
