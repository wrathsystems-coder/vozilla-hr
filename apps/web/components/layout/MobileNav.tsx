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
        className="-mr-2 p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500 md:hidden"
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
            className="absolute inset-y-0 right-0 flex w-80 max-w-full flex-col bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={close}
                aria-label="Zatvori navigaciju"
                className="-mr-2 p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-500"
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
                      className="block text-base font-medium text-gray-900 hover:text-yellow-600"
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
                className="block w-full rounded-md bg-yellow-400 px-4 py-3 text-center text-sm font-semibold text-black hover:bg-yellow-500"
              >
                {primaryCta.label}
              </Link>
              <ul className="mt-4 flex flex-col gap-2 text-sm text-gray-600">
                {secondaryNav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} onClick={close} className="hover:text-gray-900">
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
