import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import type { Payload } from "payload";

/**
 * Imports comparison pairs from a CSV. Idempotent UPSERT on `slug`:
 * re-runs simply update the pair (sort_order, title, model FKs).
 *
 * CSV columns (per spec 05-data-and-systems.md):
 *   slug, title,
 *   model_a_brand_slug, model_a_model_slug,
 *   model_b_brand_slug, model_b_model_slug,
 *   sort_order
 *
 * Rich content (Lexical body, "Naša preporuka") is authored in Payload
 * after the row exists — the CSV strictly structures pairs.
 */

type CsvRow = {
  slug: string;
  title: string;
  model_a_brand_slug: string;
  model_a_model_slug: string;
  model_b_brand_slug: string;
  model_b_model_slug: string;
  sort_order: string;
};

export async function seedComparisons(payload: Payload, csvPath?: string) {
  const filePath = csvPath ?? path.resolve(process.cwd(), "../../seeds/template-comparisons.csv");
  console.log(`  → reading ${filePath}`);
  const csv = await readFile(filePath, "utf-8");
  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];
  console.log(`  → parsed ${rows.length} rows`);

  // One pass over models — comparison pairs are FK-heavy. We resolve all
  // referenced models up-front and bail with a clear error on misses
  // rather than per-row lookups.
  console.log("  → loading all models");
  const models = await payload.find({
    collection: "models",
    limit: 1000,
    depth: 1,
  });
  const modelIdByKey = new Map<string, number>();
  for (const m of models.docs) {
    const brandSlug =
      typeof m.brand === "number" ? null : ((m.brand as { slug?: string })?.slug ?? null);
    if (brandSlug) {
      modelIdByKey.set(`${brandSlug}/${m.slug as string}`, m.id as number);
    }
  }
  console.log(`  → ${modelIdByKey.size} model(s) loaded`);

  console.log("  → upserting comparison pairs");
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const row of rows) {
    try {
      const keyA = `${row.model_a_brand_slug}/${row.model_a_model_slug}`;
      const keyB = `${row.model_b_brand_slug}/${row.model_b_model_slug}`;
      const modelAId = modelIdByKey.get(keyA);
      const modelBId = modelIdByKey.get(keyB);

      if (!modelAId) {
        console.error(`  ✗ ${row.slug}: model_a "${keyA}" not found`);
        errors++;
        continue;
      }
      if (!modelBId) {
        console.error(`  ✗ ${row.slug}: model_b "${keyB}" not found`);
        errors++;
        continue;
      }
      if (modelAId === modelBId) {
        console.error(`  ✗ ${row.slug}: model_a and model_b are the same`);
        errors++;
        continue;
      }

      const sortOrder = Number.parseInt(row.sort_order, 10);

      const existing = await payload.find({
        collection: "comparison_pairs",
        where: { slug: { equals: row.slug } },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        await payload.update({
          collection: "comparison_pairs",
          id: existing.docs[0].id,
          data: {
            title: row.title,
            model_a: modelAId,
            model_b: modelBId,
            sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
          },
        });
        updated++;
      } else {
        await payload.create({
          collection: "comparison_pairs",
          data: {
            slug: row.slug,
            title: row.title,
            model_a: modelAId,
            model_b: modelBId,
            sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
            is_published: false, // editor publishes after authoring rich content
          },
        });
        created++;
      }
    } catch (err) {
      console.error(`  ✗ ${row.slug}: ${(err as Error).message}`);
      errors++;
    }
  }

  console.log(`  → done: ${created} created, ${updated} updated, ${errors} errors`);
  if (errors > 0) {
    throw new Error(`seed-comparisons completed with ${errors} error(s)`);
  }
}
