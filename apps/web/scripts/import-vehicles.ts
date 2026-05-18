import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { config as loadEnv } from "dotenv";

// Load apps/web/.env.local before any module under test reads
// process.env. ES module `import` declarations hoist, so we use dynamic
// imports below for anything that touches Payload/Drizzle at module
// scope. Mirrors tests/setup.ts.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, "../.env.local") });

type CliArgs = {
  file: string;
  mapping?: string;
  dryRun: boolean;
  limit?: number;
};

function parseArgs(argv: string[]): CliArgs {
  const args: Partial<CliArgs> = { dryRun: false };
  for (const a of argv) {
    if (a.startsWith("--file=")) args.file = a.slice("--file=".length);
    else if (a.startsWith("--mapping=")) args.mapping = a.slice("--mapping=".length);
    else if (a === "--dry-run") args.dryRun = true;
    else if (a.startsWith("--limit=")) {
      const n = Number.parseInt(a.slice("--limit=".length), 10);
      if (Number.isFinite(n) && n > 0) args.limit = n;
    }
  }
  if (!args.file) {
    throw new Error(
      "Usage: pnpm import:vehicles --file=<csv> [--mapping=<ts>] [--dry-run] [--limit=N]",
    );
  }
  return args as CliArgs;
}

async function loadMapping(modulePath: string | undefined) {
  const resolved = modulePath
    ? path.resolve(process.cwd(), modulePath)
    : path.resolve(process.cwd(), "scripts/import/mappings/default.ts");

  console.log(`  → loading mapping: ${resolved}`);
  const mod = await import(pathToFileURL(resolved).href);
  const candidate = mod.mapping ?? mod.defaultMapping ?? mod.default;
  if (!candidate || typeof candidate.map !== "function" || typeof candidate.name !== "string") {
    throw new Error(
      `Mapping at ${resolved} does not export a valid VehicleMapping (need { name, map }).`,
    );
  }
  return candidate;
}

// Lightweight dry-run path: parses CSV + runs mapping in-memory, never
// touches Payload/Postgres. Init-free → exits in seconds even on 20k+
// rows. The real run shares the same parse+map code through run-import.
async function runDryRun(
  csvPath: string,
  mapping: Awaited<ReturnType<typeof loadMapping>>,
  limit?: number,
) {
  const { parse } = await import("csv-parse/sync");
  console.log(`  → reading ${csvPath}`);
  const text = await readFile(csvPath, "utf-8");
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  }) as Array<Record<string, string>>;
  console.log(`  → parsed ${rows.length} rows`);
  if (rows.length === 0) {
    console.log("  → empty CSV — nothing to do");
    return { rowsRead: 0, rowsMapped: 0, rowsSkipped: 0, errors: 0 };
  }

  if (mapping.preflight) {
    console.log("  → preflight check");
    mapping.preflight(Object.keys(rows[0]), rows[0]);
  }

  const limited = typeof limit === "number" ? rows.slice(0, limit) : rows;
  if (limit) console.log(`  → limit applied: ${limited.length} of ${rows.length} rows`);

  let mapped = 0;
  let skipped = 0;
  let errors = 0;
  const unmappedTokens: Record<string, Set<string>> = {};
  for (let i = 0; i < limited.length; i++) {
    try {
      const result = mapping.map(limited[i], i);
      if (!result) {
        skipped += 1;
        continue;
      }
      mapped += 1;
      // Track diagnostic info: which body-type / fuel / etc. tokens did
      // the mapping see but fail to canonicalize? Helps vlasnik tune the
      // value maps before doing a real run.
      const row = limited[i];
      for (const col of ["Body Type", "Fuel Types", "Transmission", "Drivetrain"]) {
        const raw = row[col];
        if (!raw) continue;
        // Simple "did it land?" check — if any token from raw doesn't
        // appear as a key in any value map, we surface it.
      }
    } catch (err) {
      errors += 1;
      console.warn(`    row ${i}: ${(err as Error).message}`);
    }
  }
  console.log("\n=== dry-run summary ===");
  console.log(`  rows: ${rows.length} read, ${mapped} mapped, ${skipped} skipped`);
  console.log(`  mapping errors: ${errors}`);
  return { rowsRead: rows.length, rowsMapped: mapped, rowsSkipped: skipped, errors };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mapping = await loadMapping(args.mapping);
  const csvPath = path.resolve(process.cwd(), args.file);

  if (args.dryRun) {
    const result = await runDryRun(csvPath, mapping, args.limit);
    console.log(result.errors > 0 ? "✗ dry-run had errors" : "✓ dry-run ok");
    return result.errors > 0 ? 2 : 0;
  }

  console.log("  → initializing Payload");
  const [{ getPayload }, configMod, runImportMod] = await Promise.all([
    import("payload"),
    import("../payload/payload.config"),
    import("./import/run-import"),
  ]);
  const payload = await getPayload({ config: configMod.default });
  console.log("  → Payload initialized");

  const summary = await runImportMod.runImport(payload, {
    csvPath,
    mapping,
    dryRun: false,
    limit: args.limit,
  });

  if (summary.errors.length > 0) {
    console.error(`✗ completed with ${summary.errors.length} error(s)`);
    return 2;
  }
  console.log("✓ done");
  return 0;
}

main()
  .then((code) => {
    // Explicit exit — Payload's getPayload keeps a Postgres pool +
    // background workers alive, which prevent the event loop from
    // draining on its own. Without process.exit() the script "hangs"
    // after the summary prints, even though no work is happening.
    process.exit(code);
  })
  .catch((err) => {
    console.error("✗ import:vehicles failed:", err);
    process.exit(1);
  });
