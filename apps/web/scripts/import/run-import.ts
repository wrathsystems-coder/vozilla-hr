import { readFile } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import type { Payload } from "payload";
import type {
  BrandPayload,
  ImportSummary,
  MappedRow,
  ModelPayload,
  ModelVersionPayload,
  RawRow,
  VehicleMapping,
} from "./types";

// Orchestrates the actual UPSERT pipeline. Mapping translates rows
// into typed payloads; this module dedupes by slug + writes to Payload.

type Options = {
  csvPath: string;
  mapping: VehicleMapping;
  dryRun?: boolean;
  /** Stop after this many rows. Useful for spot-checking a large file. */
  limit?: number;
};

export async function runImport(payload: Payload, opts: Options): Promise<ImportSummary> {
  console.log(`→ import:vehicles starting (mapping: ${opts.mapping.name})`);
  console.log(`  → reading ${opts.csvPath}`);

  const text = await readFile(opts.csvPath, "utf-8");
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  }) as RawRow[];

  console.log(`  → parsed ${rows.length} rows`);
  if (rows.length === 0) {
    return emptySummary();
  }

  if (opts.mapping.preflight) {
    console.log("  → preflight check");
    opts.mapping.preflight(Object.keys(rows[0]), rows[0]);
  }

  const limited = typeof opts.limit === "number" ? rows.slice(0, opts.limit) : rows;
  if (opts.limit) {
    console.log(`  → limit applied: processing first ${limited.length} of ${rows.length} rows`);
  }

  // Pass 1: map all rows, collect unique payloads keyed by slug
  // so we don't re-create the same Brand or Model on every trim row.
  console.log("  → mapping rows");
  const mapped: Array<{ row: number; payload: NonNullable<MappedRow> }> = [];
  const summary: ImportSummary = emptySummary();
  summary.rowsRead = rows.length;

  for (let i = 0; i < limited.length; i++) {
    const row = limited[i];
    try {
      const result = opts.mapping.map(row, i);
      if (!result) {
        summary.rowsSkipped += 1;
        continue;
      }
      mapped.push({ row: i, payload: result });
      summary.rowsMapped += 1;
    } catch (err) {
      summary.errors.push({ row: i, reason: `mapping: ${(err as Error).message}` });
    }
  }
  console.log(`  → ${summary.rowsMapped} mapped, ${summary.rowsSkipped} skipped`);

  if (opts.dryRun) {
    console.log("  → dry-run mode: no DB writes");
    summarize(summary);
    return summary;
  }

  // Pass 2: UPSERT brands (unique by slug).
  console.log("  → upserting brands");
  const brandIdsBySlug = new Map<string, number>();
  const seenBrands = new Map<string, BrandPayload>();
  for (const { payload: m } of mapped) {
    if (!seenBrands.has(m.brand.slug)) seenBrands.set(m.brand.slug, m.brand);
  }
  for (const brand of seenBrands.values()) {
    const existing = await payload.find({
      collection: "brands",
      where: { slug: { equals: brand.slug } },
      limit: 1,
    });
    if (existing.docs.length > 0) {
      const id = existing.docs[0].id as number;
      brandIdsBySlug.set(brand.slug, id);
      summary.brandsUpdated += 1;
    } else {
      const created = await payload.create({
        collection: "brands",
        data: { slug: brand.slug, name: brand.name, is_active: brand.is_active ?? true },
      });
      brandIdsBySlug.set(brand.slug, created.id as number);
      summary.brandsCreated += 1;
    }
  }
  console.log(`  → brands: ${summary.brandsCreated} created, ${summary.brandsUpdated} reused`);

  // Pass 3: Body types — auto-create from any slug referenced by a
  // model whose body_type isn't already in DB.
  console.log("  → loading body_types");
  const bodyTypeIdsBySlug = new Map<string, number>();
  const bodyTypes = await payload.find({ collection: "body_types", limit: 100 });
  for (const bt of bodyTypes.docs) {
    bodyTypeIdsBySlug.set(bt.slug as string, bt.id as number);
  }
  const neededBodyTypes = new Set<string>();
  for (const { payload: m } of mapped) {
    if (m.model.bodyTypeSlug && !bodyTypeIdsBySlug.has(m.model.bodyTypeSlug)) {
      neededBodyTypes.add(m.model.bodyTypeSlug);
    }
  }
  for (const slug of neededBodyTypes) {
    const created = await payload.create({
      collection: "body_types",
      data: {
        slug,
        name: humanize(slug),
        sort_order: 99,
      },
    });
    bodyTypeIdsBySlug.set(slug, created.id as number);
    summary.bodyTypesCreated += 1;
  }
  console.log(
    `  → body_types: ${bodyTypeIdsBySlug.size} ready (${summary.bodyTypesCreated} auto-created)`,
  );

  // Pass 4: Models (unique per (brand, slug)).
  console.log("  → upserting models");
  const modelIdsByKey = new Map<string, number>(); // key = `${brandSlug}::${modelSlug}`
  const seenModels = new Map<string, ModelPayload>();
  for (const { payload: m } of mapped) {
    const key = `${m.model.brandSlug}::${m.model.slug}`;
    if (!seenModels.has(key)) seenModels.set(key, m.model);
  }
  for (const [key, model] of seenModels.entries()) {
    const brandId = brandIdsBySlug.get(model.brandSlug);
    if (!brandId) {
      summary.errors.push({ row: -1, reason: `model ${key}: brand ${model.brandSlug} missing` });
      continue;
    }
    const bodyTypeId = model.bodyTypeSlug ? bodyTypeIdsBySlug.get(model.bodyTypeSlug) : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      brand: brandId,
      slug: model.slug,
      name: model.name,
      body_type: bodyTypeId,
      segment: model.segment,
      generation: model.generation,
      year_from: model.year_from,
      year_to: model.year_to,
      base_price_eur: model.base_price_eur,
      fuel_types: model.fuel_types ?? [],
      transmissions: model.transmissions ?? [],
      description_md: model.description_md,
      is_active: model.is_active ?? true,
    };

    const existing = await payload.find({
      collection: "models",
      where: { and: [{ brand: { equals: brandId } }, { slug: { equals: model.slug } }] },
      limit: 1,
    });
    if (existing.docs.length > 0) {
      const id = existing.docs[0].id as number;
      await payload.update({ collection: "models", id, data });
      modelIdsByKey.set(key, id);
      summary.modelsUpdated += 1;
    } else {
      const created = await payload.create({ collection: "models", data });
      modelIdsByKey.set(key, created.id as number);
      summary.modelsCreated += 1;
    }
  }
  console.log(`  → models: ${summary.modelsCreated} created, ${summary.modelsUpdated} updated`);

  // Pass 5: Model versions. Each mapped row may have a version. UPSERT
  // by (model_id, name) since version label is the trim identifier.
  console.log("  → upserting model_versions");
  for (const { row, payload: m } of mapped) {
    if (!m.version) continue;
    const modelKey = `${m.version.brandSlug}::${m.version.modelSlug}`;
    const modelId = modelIdsByKey.get(modelKey);
    if (!modelId) {
      summary.errors.push({ row, reason: `version ${m.version.name}: model ${modelKey} missing` });
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      model: modelId,
      name: m.version.name,
      engine_type: m.version.engine_type,
      engine_displacement_cc: m.version.engine_displacement_cc,
      engine_config: m.version.engine_config,
      engine_config_notes: m.version.engine_config_notes,
      eco_norm: m.version.eco_norm,
      power_kw: m.version.power_kw,
      power_hp: m.version.power_hp,
      torque_nm: m.version.torque_nm,
      transmission: m.version.transmission,
      fuel_consumption_combined_l: m.version.fuel_consumption_combined_l,
      co2_emission_g_km: m.version.co2_emission_g_km,
      ev_range_km: m.version.ev_range_km,
      price_eur: m.version.price_eur,
      year: m.version.year,
      max_speed_kmh: m.version.max_speed_kmh,
      acceleration_0_100_s: m.version.acceleration_0_100_s,
      boot_capacity_l: m.version.boot_capacity_l,
      load_capacity_kg: m.version.load_capacity_kg,
      weight_kg: m.version.weight_kg,
      length_mm: m.version.length_mm,
      width_mm: m.version.width_mm,
      height_mm: m.version.height_mm,
      wheelbase_mm: m.version.wheelbase_mm,
      doors_count: m.version.doors_count,
      seats_count: m.version.seats_count,
      climate_zones: m.version.climate_zones,
      infotainment_screen_in: m.version.infotainment_screen_in,
      usb_ports: m.version.usb_ports,
      euro_ncap_stars: m.version.euro_ncap_stars,
      airbags_count: m.version.airbags_count,
      drivetrain: m.version.drivetrain,
      equipment: m.version.equipment ?? [],
      seat_materials: m.version.seat_materials ?? [],
      seat_material_notes: m.version.seat_material_notes,
      steering_materials: m.version.steering_materials ?? [],
      steering_material_notes: m.version.steering_material_notes,
      colors_available: m.version.colors_available ?? [],
      is_current: m.version.is_current ?? true,
    };

    try {
      const existing = await payload.find({
        collection: "model_versions",
        where: { and: [{ model: { equals: modelId } }, { name: { equals: m.version.name } }] },
        limit: 1,
      });
      if (existing.docs.length > 0) {
        await payload.update({
          collection: "model_versions",
          id: existing.docs[0].id as number,
          data,
        });
        summary.versionsUpdated += 1;
      } else {
        await payload.create({ collection: "model_versions", data });
        summary.versionsCreated += 1;
      }
    } catch (err) {
      summary.errors.push({ row, reason: `version: ${(err as Error).message}` });
    }
  }
  console.log(
    `  → versions: ${summary.versionsCreated} created, ${summary.versionsUpdated} updated`,
  );

  summarize(summary);
  return summary;
}

function humanize(slug: string): string {
  return slug
    .split(/[-_]/)
    .filter((s) => s.length > 0)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function emptySummary(): ImportSummary {
  return {
    rowsRead: 0,
    rowsMapped: 0,
    rowsSkipped: 0,
    brandsCreated: 0,
    brandsUpdated: 0,
    modelsCreated: 0,
    modelsUpdated: 0,
    versionsCreated: 0,
    versionsUpdated: 0,
    bodyTypesCreated: 0,
    errors: [],
  };
}

function summarize(s: ImportSummary): void {
  console.log("\n=== import:vehicles summary ===");
  console.log(`  rows: ${s.rowsRead} read, ${s.rowsMapped} mapped, ${s.rowsSkipped} skipped`);
  console.log(`  brands: +${s.brandsCreated} new, ${s.brandsUpdated} reused`);
  console.log(`  body_types: +${s.bodyTypesCreated} auto-created`);
  console.log(`  models: +${s.modelsCreated} new, ${s.modelsUpdated} updated`);
  console.log(`  versions: +${s.versionsCreated} new, ${s.versionsUpdated} updated`);
  console.log(`  errors: ${s.errors.length}`);
  if (s.errors.length > 0) {
    for (const e of s.errors.slice(0, 10)) {
      console.log(`    row ${e.row}: ${e.reason}`);
    }
    if (s.errors.length > 10) console.log(`    … and ${s.errors.length - 10} more`);
  }
}
