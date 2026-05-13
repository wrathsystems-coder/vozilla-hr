import "dotenv/config";
import postgres from "postgres";

/**
 * One-time setup for the global search infrastructure. Enables the
 * pg_trgm extension and creates GIN trigram indexes on the columns we
 * query with ILIKE %q% from lib/search/. Idempotent (CREATE … IF NOT
 * EXISTS) — safe to re-run.
 *
 * Lives outside the Drizzle / Payload migration runners on purpose:
 * the target tables are Payload-managed and these are infrastructure
 * indexes that neither schema diff engine should ever "fix" away.
 * Run once per environment after the catalog is seeded:
 *
 *     pnpm db:setup-search
 */

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL not set");
  }
  console.log("→ connecting");
  const sql = postgres(url, { prepare: false });
  try {
    console.log("→ enabling pg_trgm extension");
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;

    const indexes: { name: string; table: string; column: string }[] = [
      { name: "brands_name_trgm", table: "brands", column: "name" },
      { name: "models_name_trgm", table: "models", column: "name" },
      { name: "reviews_title_trgm", table: "reviews", column: "title" },
      { name: "articles_title_trgm", table: "articles", column: "title" },
      {
        name: "used_car_listings_description_trgm",
        table: "used_car_listings",
        column: "description_md",
      },
    ];

    for (const ix of indexes) {
      console.log(`  → ${ix.name} on ${ix.table}(${ix.column})`);
      // sql.unsafe used here because CREATE INDEX with dynamic identifiers
      // can't be parameterized — the identifiers are static from our
      // catalogue above, not user input, so injection isn't a concern.
      await sql.unsafe(
        `CREATE INDEX IF NOT EXISTS "${ix.name}" ON "${ix.table}" USING gin ("${ix.column}" gin_trgm_ops)`,
      );
    }

    console.log("✓ done");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("✗ setup-search-indexes failed:", err);
  process.exit(1);
});
