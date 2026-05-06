"use client";

import { useMemo, useState } from "react";
import ModelCard from "./ModelCard";
import type { ModelWithRefs } from "@/lib/catalog/fetch";

type BodyTypeOption = { slug: string; name: string };

type Props = {
  models: ModelWithRefs[];
  /** Whether to show the brand name on each card; off on brand pages. */
  showBrandOnCards?: boolean;
  /** Filter dimension: by body_type (default) or by brand. */
  filterBy?: "body_type" | "brand";
};

export default function ModelsByBodyTypeFilter({
  models,
  showBrandOnCards = true,
  filterBy = "body_type",
}: Props) {
  const [selected, setSelected] = useState<string>("all");

  const options: BodyTypeOption[] = useMemo(() => {
    const seen = new Map<string, string>();
    for (const m of models) {
      const key = filterBy === "body_type" ? m.body_type.slug : m.brand.slug;
      const label = filterBy === "body_type" ? m.body_type.name : m.brand.name;
      if (!seen.has(key)) seen.set(key, label);
    }
    return Array.from(seen.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "hr"));
  }, [models, filterBy]);

  const filtered = useMemo(() => {
    if (selected === "all") return models;
    return models.filter((m) =>
      filterBy === "body_type" ? m.body_type.slug === selected : m.brand.slug === selected,
    );
  }, [models, selected, filterBy]);

  if (models.length === 0) {
    return (
      <p className="text-text-muted py-8 text-center text-sm">Trenutno nema dostupnih modela.</p>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label htmlFor="model-filter" className="text-text-muted text-sm font-medium">
          Filter po {filterBy === "body_type" ? "kategoriji" : "marki"}
        </label>
        <select
          id="model-filter"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="border-surface-border bg-surface text-text focus-visible:outline-brand-accent rounded-md border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <option value="all">Sve ({models.length})</option>
          {options.map((opt) => (
            <option key={opt.slug} value={opt.slug}>
              {opt.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-text-muted py-8 text-center text-sm">
          Nema modela u odabranoj {filterBy === "body_type" ? "kategoriji" : "marki"}.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((model) => (
            <li key={model.id}>
              <ModelCard model={model} showBrand={showBrandOnCards} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
