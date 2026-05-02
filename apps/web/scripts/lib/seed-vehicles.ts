import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import type { Payload } from "payload";

type CsvRow = {
  brand_slug: string;
  brand_name: string;
  model_slug: string;
  model_name: string;
  body_type_slug: string;
  segment: string;
  year_from: string;
  year_to: string;
  base_price_eur: string;
  fuel_types: string;
  transmissions: string;
  hero_image_filename: string;
  description_short: string;
  is_active: string;
};

export async function seedVehicles(payload: Payload, csvPath?: string) {
  const filePath = csvPath ?? path.resolve(process.cwd(), "../../seeds/template-vehicles.csv");
  console.log(`  → reading ${filePath}`);
  const csv = await readFile(filePath, "utf-8");
  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];
  console.log(`  → parsed ${rows.length} rows`);

  console.log("  → upserting brands");
  const brandIdsBySlug = new Map<string, number>();
  for (const row of rows) {
    if (brandIdsBySlug.has(row.brand_slug)) continue;
    const existing = await payload.find({
      collection: "brands",
      where: { slug: { equals: row.brand_slug } },
      limit: 1,
    });
    let brand;
    if (existing.docs.length > 0) {
      brand = existing.docs[0];
    } else {
      brand = await payload.create({
        collection: "brands",
        data: { slug: row.brand_slug, name: row.brand_name, is_active: true },
      });
      console.log(`    + brand created: ${row.brand_slug}`);
    }
    brandIdsBySlug.set(row.brand_slug, brand.id as number);
  }
  console.log(`  → ${brandIdsBySlug.size} brand(s) ready`);

  console.log("  → loading body_types");
  const bodyTypeIdsBySlug = new Map<string, number>();
  const bodyTypes = await payload.find({ collection: "body_types", limit: 100 });
  for (const bt of bodyTypes.docs) {
    bodyTypeIdsBySlug.set(bt.slug as string, bt.id as number);
  }
  console.log(`  → ${bodyTypeIdsBySlug.size} body_type(s) loaded`);

  console.log("  → upserting models");
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const brandId = brandIdsBySlug.get(row.brand_slug);
      const bodyTypeId = bodyTypeIdsBySlug.get(row.body_type_slug);
      if (!brandId) {
        console.error(`  ✗ ${row.model_slug}: brand "${row.brand_slug}" not found`);
        errors++;
        continue;
      }
      if (!bodyTypeId) {
        console.error(`  ✗ ${row.model_slug}: body_type "${row.body_type_slug}" not found`);
        errors++;
        continue;
      }

      const data = {
        brand: brandId,
        slug: row.model_slug,
        name: row.model_name,
        body_type: bodyTypeId,
        segment: row.segment || undefined,
        year_from: row.year_from ? parseInt(row.year_from, 10) : undefined,
        year_to: row.year_to ? parseInt(row.year_to, 10) : undefined,
        base_price_eur: row.base_price_eur ? parseInt(row.base_price_eur, 10) : undefined,
        fuel_types: row.fuel_types ? row.fuel_types.split("|").filter(Boolean) : [],
        transmissions: row.transmissions ? row.transmissions.split("|").filter(Boolean) : [],
        description_md: row.description_short || "",
        is_active: row.is_active === "true",
      };

      const existing = await payload.find({
        collection: "models",
        where: {
          and: [{ brand: { equals: brandId } }, { slug: { equals: row.model_slug } }],
        },
        limit: 1,
      });

      // Cast: CSV values are validated by Payload at create/update; TS strict
      // unions for select fields would require per-field narrowing for trivial gain.
      if (existing.docs.length > 0) {
        await payload.update({
          collection: "models",
          id: existing.docs[0].id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: data as any,
        });
        updated++;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await payload.create({ collection: "models", data: data as any });
        created++;
      }
    } catch (err) {
      console.error(`  ✗ ${row.model_slug}: ${(err as Error).message}`);
      errors++;
    }
  }

  console.log(`  ✓ models: ${created} created, ${updated} updated, ${errors} errors`);
}
