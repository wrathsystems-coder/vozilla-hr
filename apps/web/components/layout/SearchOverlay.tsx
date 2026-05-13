"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, X } from "lucide-react";
import type { SearchGroup, SearchItem, SearchResults } from "@/lib/search";

/**
 * Header-mounted search trigger + fullscreen overlay. Magnifier button
 * opens the overlay, autofocus on the input, ESC closes, click-outside
 * (the dark backdrop) closes. Live results fetched from /api/search
 * with a 300ms debounce per spec; submitting takes you to the full
 * /pretraga results page so deep links share.
 */

const MIN_LEN = 2;
const DEBOUNCE_MS = 300;

const GROUP_LABEL: Record<SearchGroup, string> = {
  brands: "Marke",
  models: "Modeli",
  reviews: "Recenzije",
  articles: "Savjeti",
  used_cars: "Rabljeni oglasi",
};

export default function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startFetch] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Open / close lifecycle: focus the input when opened, restore body scroll.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Debounced fetch. We keep the previous results visible while a new
  // query is in flight so the panel doesn't flash empty between keystrokes.
  useEffect(() => {
    if (!open) return;
    if (q.length < MIN_LEN) {
      setResults(null);
      setError(null);
      return;
    }
    const handle = window.setTimeout(() => {
      const controller = new AbortController();
      startFetch(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
            signal: controller.signal,
          });
          if (!res.ok) {
            setError("Pretraga trenutno nije dostupna.");
            return;
          }
          const data = (await res.json()) as SearchResults;
          setError(null);
          setResults(data);
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          setError("Mreža nije dostupna.");
        }
      });
      return () => controller.abort();
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [q, open]);

  function close() {
    setOpen(false);
    setQ("");
    setResults(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (q.length < MIN_LEN) return;
    close();
    router.push(`/pretraga?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Otvori pretragu"
        className="text-text-muted hover:text-text focus-visible:outline-brand-accent rounded-md p-2 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <SearchIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pretraga"
          className="fixed inset-0 z-[60] bg-black/60"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="bg-surface absolute inset-x-0 top-0 max-h-[85vh] overflow-y-auto rounded-b-md shadow-2xl">
            <div className="border-surface-border flex items-center gap-2 border-b px-4 py-3">
              <SearchIcon className="text-text-muted h-5 w-5 shrink-0" aria-hidden="true" />
              <form onSubmit={submit} className="flex-1">
                <input
                  ref={inputRef}
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Pretraži marke, modele, recenzije..."
                  aria-label="Pretraga"
                  className="text-text w-full bg-transparent text-base focus:outline-none"
                />
              </form>
              <button
                type="button"
                onClick={close}
                aria-label="Zatvori pretragu"
                className="text-text-muted hover:text-text rounded-md p-1"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="px-4 py-4">
              {q.length < MIN_LEN ? (
                <p className="text-text-muted text-sm">
                  Unesi barem {MIN_LEN} znakova za početak pretrage.
                </p>
              ) : error ? (
                <p className="text-text-muted text-sm" role="alert">
                  {error}
                </p>
              ) : !results ? (
                <p className="text-text-muted text-sm">Tražim…</p>
              ) : results.total === 0 ? (
                <p className="text-text-muted text-sm">Nema rezultata za &ldquo;{q}&rdquo;.</p>
              ) : (
                <ResultsList results={results} onPick={close} />
              )}
              {results && results.total > 0 ? (
                <Link
                  href={`/pretraga?q=${encodeURIComponent(q)}`}
                  onClick={close}
                  className="bg-surface-muted text-text hover:bg-surface-border mt-4 block rounded-md px-3 py-2 text-center text-sm font-medium"
                >
                  Vidi sve rezultate za &ldquo;{q}&rdquo;
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ResultsList({ results, onPick }: { results: SearchResults; onPick: () => void }) {
  return (
    <div className="space-y-5">
      {(Object.keys(results.byGroup) as SearchGroup[]).map((group) => {
        const items = results.byGroup[group];
        if (items.length === 0) return null;
        return (
          <section key={group}>
            <p className="text-text-muted mb-2 text-xs uppercase tracking-wide">
              {GROUP_LABEL[group]}
            </p>
            <ul className="space-y-1">
              {items.map((item, i) => (
                <li key={`${group}-${i}`}>
                  <OverlayItem item={item} onPick={onPick} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function OverlayItem({ item, onPick }: { item: SearchItem; onPick: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onPick}
      className="hover:bg-surface-muted block rounded-md px-2 py-2"
    >
      <p className="text-text text-sm">{item.title}</p>
      {item.subtitle ? <p className="text-text-muted text-xs">{item.subtitle}</p> : null}
    </Link>
  );
}
