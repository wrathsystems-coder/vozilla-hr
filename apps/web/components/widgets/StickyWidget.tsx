"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { FieldLabel } from "@/components/forms/LeadWizard/controls";
import {
  DISMISS_STORAGE_KEY,
  PREFILL_SESSION_KEY,
  STICKY_CONFIG,
  dismissUntil,
  isDismissed,
  isExcludedPath,
  type WizardPrefill,
} from "./sticky-config";

// Spec: docs/spec/03-information-architecture.md "Sticky widget".
// Trigger after EITHER 8s elapsed OR 40% scroll. Dismiss persists 24h.
//
// Widget itself doesn't POST — captures email + phone, stashes them in
// sessionStorage as `vozilla:wizard-prefill`, and routes to the full
// wizard with ?izvor=sticky. The wizard reads the prefill on mount.

export default function StickyWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const triggered = useRef(false);

  // Decide visibility: respect path exclusions + dismissed-until cookie.
  useEffect(() => {
    if (isExcludedPath(pathname)) {
      setVisible(false);
      return;
    }
    if (isDismissed(Date.now(), localStorage.getItem(DISMISS_STORAGE_KEY))) {
      setVisible(false);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | null = null;
    function show() {
      if (triggered.current) return;
      triggered.current = true;
      setVisible(true);
    }
    function onScroll() {
      const doc = document.documentElement;
      const scrolled = (window.scrollY + window.innerHeight) / doc.scrollHeight;
      if (scrolled * 100 >= STICKY_CONFIG.triggerScrollPercent) show();
    }

    timer = setTimeout(show, STICKY_CONFIG.triggerDelaySec * 1000);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // catch case where page is already scrolled past threshold

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISS_STORAGE_KEY, String(dismissUntil(Date.now())));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prefill: WizardPrefill = {
      customer_email: email.trim() || undefined,
      customer_phone: phone.trim() || undefined,
    };
    sessionStorage.setItem(PREFILL_SESSION_KEY, JSON.stringify(prefill));
    router.push("/zatrazi-ponudu?izvor=sticky");
  }

  if (!visible) return null;

  return (
    <aside
      role="complementary"
      aria-label="Brzi upit"
      className="fixed bottom-4 right-4 z-40 w-[min(360px,calc(100vw-2rem))]"
    >
      <div className="border-surface-border bg-surface rounded-lg border p-4 shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <p className="text-text text-sm font-semibold">Dobij najbolju cijenu</p>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Zatvori widget"
            className="text-text-muted hover:text-text focus-visible:outline-brand-accent rounded p-1 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {!expanded ? (
          <>
            <p className="text-text-muted mt-1 text-xs">
              Ostavi email/telefon i mi šaljemo upit dilerima.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-3 w-full"
              onClick={() => setExpanded(true)}
            >
              Zatraži ponudu
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-3 space-y-3" noValidate>
            <div>
              <FieldLabel id="sticky_email">Email</FieldLabel>
              <Input
                id="sticky_email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ti@example.com"
              />
            </div>
            <div>
              <FieldLabel id="sticky_phone">Telefon</FieldLabel>
              <Input
                id="sticky_phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+385 ili 0..."
              />
            </div>
            <Button type="submit" size="sm" className="w-full">
              Nastavi
            </Button>
            <p className="text-text-muted text-[11px]">
              Otvara se 4-koračna forma za pošiljanje upita.
            </p>
          </form>
        )}
      </div>
    </aside>
  );
}
