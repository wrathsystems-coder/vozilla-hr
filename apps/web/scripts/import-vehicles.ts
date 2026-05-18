import path from "node:path";
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mapping = await loadMapping(args.mapping);

  const csvPath = path.resolve(process.cwd(), args.file);

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
    dryRun: args.dryRun,
    limit: args.limit,
  });

  if (summary.errors.length > 0) {
    console.error(`✗ completed with ${summary.errors.length} error(s)`);
    process.exit(2);
  }
  console.log("✓ done");
}

main().catch((err) => {
  console.error("✗ import:vehicles failed:", err);
  process.exit(1);
});
