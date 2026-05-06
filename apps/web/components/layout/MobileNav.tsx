"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Brand, BodyType } from "@/payload-types";
import { mainNav, primaryCta, secondaryNav } from "./nav-items";

const NOVA_VOZILA_HREF = "/nova-vozila";

type Props = {
  topBrands: Brand[];
  bodyTypes: BodyType[];
};

export default function MobileNav({ topBrands, bodyTypes }: Props) {
  const [open, setOpen] = useState(false);
  const [novaExpanded, setNovaExpanded] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const close = () => {
    setOpen(false);
    setNovaExpanded(false);
  };

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
            className="bg-surface absolute inset-y-0 right-0 flex w-80 max-w-full flex-col overflow-y-auto p-6"
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
              <ul className="flex flex-col gap-1">
                {mainNav.map((item) =>
                  item.href === NOVA_VOZILA_HREF ? (
                    <li key={item.href}>
                      <button
                        type="button"
                        onClick={() => setNovaExpanded((prev) => !prev)}
                        aria-expanded={novaExpanded}
                        aria-controls="mobile-nav-nova-panel"
                        className="text-text flex w-full items-center justify-between py-2 text-base font-medium"
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          aria-hidden="true"
                          className={`h-5 w-5 transition-transform ${novaExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                      {novaExpanded && (
                        <div
                          id="mobile-nav-nova-panel"
                          className="border-surface-border ml-3 mt-1 border-l pl-3"
                        >
                          <Link
                            href="/nova-vozila"
                            onClick={close}
                            className="text-text-muted hover:text-text block py-1.5 text-sm font-medium"
                          >
                            Sve nova vozila
                          </Link>
                          <Link
                            href="/nova-vozila/marke"
                            onClick={close}
                            className="text-text-muted hover:text-text block py-1.5 text-sm font-medium"
                          >
                            Sve marke
                          </Link>
                          <Link
                            href="/nova-vozila/kategorije"
                            onClick={close}
                            className="text-text-muted hover:text-text block py-1.5 text-sm font-medium"
                          >
                            Sve kategorije
                          </Link>

                          {topBrands.length > 0 && (
                            <>
                              <p className="text-text-muted mt-3 text-xs font-semibold uppercase tracking-wide">
                                Marke
                              </p>
                              <ul className="mt-1 flex flex-col">
                                {topBrands.slice(0, 8).map((brand) => (
                                  <li key={brand.id}>
                                    <Link
                                      href={`/nova-vozila/marke/${brand.slug}`}
                                      onClick={close}
                                      className="text-text-muted hover:text-text block py-1 text-sm"
                                    >
                                      {brand.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}

                          {bodyTypes.length > 0 && (
                            <>
                              <p className="text-text-muted mt-3 text-xs font-semibold uppercase tracking-wide">
                                Kategorije
                              </p>
                              <ul className="mt-1 flex flex-col">
                                {bodyTypes.map((bt) => (
                                  <li key={bt.id}>
                                    <Link
                                      href={`/nova-vozila/kategorije/${bt.slug}`}
                                      onClick={close}
                                      className="text-text-muted hover:text-text block py-1 text-sm"
                                    >
                                      {bt.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      )}
                    </li>
                  ) : (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={close}
                        className="text-text hover:text-brand-accent block py-2 text-base font-medium"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </nav>

            <div className="mt-auto pt-6">
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
