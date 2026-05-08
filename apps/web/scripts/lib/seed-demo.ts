import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import type { Payload } from "payload";
import { validateOIB } from "../../lib/utils/oib";

type DealerRow = {
  slug: string;
  legal_name: string;
  oib: string;
  email: string;
  password: string;
  phone: string;
  street: string;
  city: string;
  postcode: string;
  county_id: string;
  lat: string;
  lng: string;
  brands: string;
  monthly_lead_cap: string;
};

export async function seedDemo(payload: Payload) {
  const dealersPath = path.resolve(process.cwd(), "../../seeds/sample-dealers.csv");
  const leadsPath = path.resolve(process.cwd(), "../../seeds/sample-leads.json");

  console.log(`  → reading ${dealersPath}`);
  const dealersCsv = await readFile(dealersPath, "utf-8");
  const dealersRows = parse(dealersCsv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as DealerRow[];
  console.log(`  → parsed ${dealersRows.length} dealer rows`);

  console.log("  → loading brands lookup");
  const brandIdsBySlug = new Map<string, number>();
  const brands = await payload.find({ collection: "brands", limit: 100 });
  for (const b of brands.docs) {
    brandIdsBySlug.set(b.slug as string, b.id as number);
  }
  console.log(`  → ${brandIdsBySlug.size} brand(s) loaded`);

  console.log("  → seeding demo dealers");
  let dealersCreated = 0;
  let dealersSkipped = 0;
  for (const row of dealersRows) {
    if (!validateOIB(row.oib)) {
      console.error(`  ✗ ${row.slug}: invalid OIB ${row.oib}`);
      continue;
    }
    const existing = await payload.find({
      collection: "dealers",
      where: { slug: { equals: row.slug } },
      limit: 1,
    });
    if (existing.docs.length > 0) {
      console.log(`  → ${row.slug}: already exists, skipping`);
      dealersSkipped++;
      continue;
    }
    const brandIds = row.brands
      .split("|")
      .map((s) => brandIdsBySlug.get(s.trim()))
      .filter((id): id is number => typeof id === "number");

    await payload.create({
      collection: "dealers",
      // CSV-derived; Payload validates at create.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        slug: row.slug,
        legal_name: row.legal_name,
        oib: row.oib,
        email: row.email,
        password: row.password,
        phone: row.phone,
        address: {
          street: row.street,
          city: row.city,
          postcode: row.postcode,
          county_id: parseInt(row.county_id, 10),
          lat: parseFloat(row.lat),
          lng: parseFloat(row.lng),
        },
        brands: brandIds,
        scoring: { monthly_lead_cap: parseInt(row.monthly_lead_cap, 10) },
        is_active: true,
        is_verified: true,
        is_demo: true,
      } as any,
    });
    console.log(`  + ${row.slug}: created`);
    dealersCreated++;
  }
  console.log(`  ✓ demo dealers: ${dealersCreated} created, ${dealersSkipped} skipped`);

  console.log(`  → reading ${leadsPath}`);
  const leadsData = JSON.parse(await readFile(leadsPath, "utf-8")) as Array<
    Record<string, unknown>
  >;
  console.log(`  → parsed ${leadsData.length} lead rows`);

  let leadsCreated = 0;
  let leadsSkipped = 0;
  for (const lead of leadsData) {
    const existing = await payload.find({
      collection: "lead_requests",
      where: { display_id: { equals: lead.display_id } },
      limit: 1,
    });
    if (existing.docs.length > 0) {
      leadsSkipped++;
      continue;
    }
    // JSON-derived; Payload validates at create.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.create({ collection: "lead_requests", data: lead as any });
    leadsCreated++;
  }
  console.log(`  ✓ demo leads: ${leadsCreated} created, ${leadsSkipped} skipped`);
}
