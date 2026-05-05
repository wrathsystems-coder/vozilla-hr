"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { mainNav, primaryCta, secondaryNav } from "./nav-items";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Otvori navigaciju"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        className="focus-visible:outline-brand-accent -mr-2 p-2 focus-visible:outline-2 focus-visible:outline-offset-2 md:hidden"
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/50 md:hidden" onClick={close}>
          <div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobilna navigacija"
            className="bg-surface absolute inset-y-0 right-0 flex w-80 max-w-full flex-col p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={close}
                aria-label="Zatvori navigaciju"
                className="focus-visible:outline-brand-accent -mr-2 p-2 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Mobilna navigacija" className="mt-4">
              <ul className="flex flex-col gap-4">
                {mainNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      className="text-text hover:text-brand-accent block text-base font-medium"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-auto">
              <Link
                href={primaryCta.href}
                onClick={close}
                className="bg-brand-accent text-brand-primary block w-full rounded-md px-4 py-3 text-center text-sm font-semibold transition-colors hover:opacity-90"
              >
                {primaryCta.label}
              </Link>
              <ul className="text-text-muted mt-4 flex flex-col gap-2 text-sm">
                {secondaryNav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={close} className="hover:text-text">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
