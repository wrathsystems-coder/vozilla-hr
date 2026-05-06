"use client";

import { useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import BrandCard from "./BrandCard";
import type { Brand } from "@/payload-types";

type Props = {
  brands: Brand[];
};

// Combining diacritic marks block: U+0300–U+036F.
const COMBINING_MARKS = /[̀-ͯ]/g;

function normalize(value: string): string {
  // Lowercase + strip combining diacritic marks so "skoda" matches "Škoda".
  return value.toLowerCase().normalize("NFD").replace(COMBINING_MARKS, "");
}

export default function BrandsFilteredGrid({ brands }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (q.length === 0) return brands;
    return brands.filter((brand) => normalize(brand.name).includes(q));
  }, [brands, query]);

  return (
    <div>
      <div className="mb-6 max-w-md">
        <label htmlFor="brand-search" className="text-text-muted block text-sm font-medium">
          Filtriraj marke
        </label>
        <Input
          id="brand-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="npr. Audi"
          className="mt-2"
          aria-describedby="brand-search-count"
        />
        <p id="brand-search-count" className="text-text-muted mt-2 text-xs" aria-live="polite">
          Prikazano {filtered.length} od {brands.length} marki
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="text-text-muted py-8 text-center text-sm">
          Nema marke koja odgovara unesenoj pretrazi.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((brand) => (
            <li key={brand.id}>
              <BrandCard brand={brand} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
