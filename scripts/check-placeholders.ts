import { glob } from "glob";
import { readFile } from "node:fs/promises";
import path from "node:path";

const PATTERN = /\[?XXX_[A-Z_]+/g;
const ROOTS = ["apps/web", "config", "docs"];
const EXT = [".ts", ".tsx", ".js", ".jsx", ".md", ".yml", ".yaml", ".json", ".scss", ".css"];
const IGNORE = [
  "**/node_modules/**",
  "**/.next/**",
  "**/.vercel/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/payload-types.ts",
];

async function main() {
  const strict = process.argv.includes("--strict");
  const isProd = process.env.NODE_ENV === "production";
  const shouldFail = strict || isProd;

  const cwd = process.cwd();
  const fileHits: Record<string, number> = {};
  let total = 0;

  for (const root of ROOTS) {
    const pattern = `${root}/**/*{${EXT.join(",")}}`;
    const files = await glob(pattern, { ignore: IGNORE, cwd });
    for (const file of files) {
      const content = await readFile(path.join(cwd, file), "utf-8");
      const matches = content.match(PATTERN);
      if (matches && matches.length > 0) {
        fileHits[file] = matches.length;
        total += matches.length;
      }
    }
  }

  if (total === 0) {
    console.log("✓ Nijedan XXX_ placeholder pronađen.");
    return;
  }

  console.log(`Pronađeno ${total} XXX_ placeholdera u ${Object.keys(fileHits).length} fileova:\n`);
  for (const [file, count] of Object.entries(fileHits).sort()) {
    console.log(`  ${count.toString().padStart(4)}  ${file}`);
  }

  if (shouldFail) {
    console.error(
      `\n✗ XXX_ NIJE dozvoljen u produkcijskom buildu (NODE_ENV=production ili --strict).`,
    );
    process.exit(1);
  } else {
    console.log(`\nDev mode — XXX_ dozvoljen. Koristi --strict za fail-on-hit.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
