"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Brand, BodyType } from "@/payload-types";

// Megamenu trigger pattern: the label itself is a `<Link>` to the hub,
// not a button that just toggles. Hover / focus opens the dropdown;
// click on the label navigates. This matches typical megamenu UX
// (Apple, Carwow, Mercedes site) — without this users have no way to
// reach `/nova-vozila` from the top nav (every dropdown item links to
// a sub-page like /marke/{slug}, never to the hub itself).
//
// Touch devices: hover/focus never fires, so click navigates immediately.
// Mobile users get the menu through `<MobileNav>` (separate component);
// MegaMenu is desktop-only (hidden md:block in Header).

type Props = {
  label: string;
  href: string;
  topBrands: Brand[];
  bodyTypes: BodyType[];
};

export default function MegaMenu({ label, href, topBrands, bodyTypes }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLLIElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  // Small leave delay so the user can move mouse from label across to
  // the panel without it disappearing. 120ms is the same value Apple
  // uses; feels instant but tolerates diagonal mouse travel.
  function scheduleClose() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setOpen(false), 120);
  }
  function cancelClose() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }
  function openMenu() {
    cancelClose();
    setOpen(true);
  }

  const close = () => setOpen(false);

  return (
    <li
      ref={containerRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <Link
        href={href}
        onFocus={openMenu}
        onBlur={scheduleClose}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        className="text-text hover:text-brand-accent focus-visible:outline-brand-accent inline-flex items-center gap-1 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
      >
        {label}
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </Link>

      {open && (
        <div
          id={panelId}
          role="menu"
          aria-label={label}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="border-surface-border bg-surface absolute left-1/2 top-full z-40 mt-2 w-screen max-w-5xl -translate-x-1/2 rounded-md border shadow-lg"
        >
          <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-3">
            <div>
              <h3 className="text-text-muted text-xs font-semibold uppercase tracking-wide">
                Marke
              </h3>
              {topBrands.length === 0 ? (
                <p className="text-text-muted mt-3 text-sm">Katalog se popunjava.</p>
              ) : (
                <ul className="mt-3 grid grid-cols-2 gap-2">
                  {topBrands.map((brand) => (
                    <li key={brand.id}>
                      <Link
                        role="menuitem"
                        href={`/nova-vozila/marke/${brand.slug}`}
                        onClick={close}
                        className="text-text hover:text-brand-accent focus-visible:outline-brand-accent block py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        {brand.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                role="menuitem"
                href="/nova-vozila/marke"
                onClick={close}
                className="text-brand-accent focus-visible:outline-brand-accent mt-4 inline-block text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Sve marke →
              </Link>
            </div>

            <div>
              <h3 className="text-text-muted text-xs font-semibold uppercase tracking-wide">
                Kategorije
              </h3>
              {bodyTypes.length === 0 ? (
                <p className="text-text-muted mt-3 text-sm">Nema kategorija.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-1">
                  {bodyTypes.map((bt) => (
                    <li key={bt.id}>
                      <Link
                        role="menuitem"
                        href={`/nova-vozila/kategorije/${bt.slug}`}
                        onClick={close}
                        className="text-text hover:text-brand-accent focus-visible:outline-brand-accent block py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                      >
                        {bt.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-surface-muted flex flex-col justify-between rounded-md p-5">
              <div>
                <h3 className="text-text text-base font-semibold">Ne znaš što tražiš?</h3>
                <p className="text-text-muted mt-2 text-sm">
                  Odgovori na 8 kratkih pitanja i dobit ćeš preporuku modela prema tvojim potrebama.
                </p>
              </div>
              <Link
                role="menuitem"
                href="/pomoc-pri-izboru"
                onClick={close}
                className="bg-brand-accent text-brand-primary focus-visible:outline-brand-accent mt-4 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Pokreni kviz
              </Link>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
