import "dotenv/config";
import { writeFile, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import * as schema from "../lib/db/schema";
import config from "../payload/payload.config";

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  newsletter: "Newsletter signup + double opt-in flow",
  sms_notifications: "SMS notifikacije dilerima",
  whatsapp_notifications: "WhatsApp Business API notifikacije",
  google_analytics_4: "GA4 web tracking",
  posthog: "PostHog product analytics + session replay",
  meta_pixel: "Meta (Facebook) marketing pixel",
  hotjar: "Hotjar session replay",
  dark_mode: "Dark theme UI",
  user_accounts: "Full korisnički računi (umjesto magic link tracker-a)",
  real_time_auction: "Live dealer bidding (Carwow full pattern)",
  dealer_self_upload_listings: "Dealer self-upload rabljenih oglasa",
  public_dealer_profiles: "Public dealer profil + reviews",
  dealer_subscription_billing: "Stripe subscription billing za dilere",
  sell_my_car: "Otkup vozila od korisnika (Wizzle pattern)",
  trade_in_valuation: "AI-based trade-in procjena",
};

async function generateFeatureFlagsDoc() {
  console.log("  → reading config/feature-flags.yml");
  const yamlPath = path.resolve(process.cwd(), "../../config/feature-flags.yml");
  const yaml = await readFile(yamlPath, "utf-8");
  const flags = parseYaml(yaml) as Record<string, boolean>;

  const sortedFlags = Object.entries(flags).sort(([a], [b]) => a.localeCompare(b));

  let md = `# Feature flags — vozilla.hr\n\n`;
  md += `> Auto-generated from \`config/feature-flags.yml\`. Run \`pnpm generate:docs\` to refresh.\n\n`;
  md += `Sve OFF u MVP-u. Aktivacija: flip vrijednosti u YAML-u i deploy, ili (Sprint 4+) admin override kroz Payload.\n\n`;
  md += `| Flag | Status | Opis |\n|---|---|---|\n`;
  for (const [key, value] of sortedFlags) {
    const status = value ? "✅ ON" : "⬜ OFF";
    const desc = FEATURE_DESCRIPTIONS[key] ?? "—";
    md += `| \`${key}\` | ${status} | ${desc} |\n`;
  }

  const outPath = path.resolve(process.cwd(), "../../docs/feature-flags.md");
  await writeFile(outPath, md, "utf-8");
  console.log(`  ✓ docs/feature-flags.md (${sortedFlags.length} flags)`);
}

type FlatField = { name: string; type: string; required: boolean };

function flattenFields(fields: unknown[], prefix = ""): FlatField[] {
  const result: FlatField[] = [];
  for (const raw of fields) {
    const field = raw as Record<string, unknown>;
    if (field.type === "tabs") {
      const tabs = (field.tabs ?? []) as Array<{ fields?: unknown[] }>;
      for (const tab of tabs) {
        result.push(...flattenFields(tab.fields ?? [], prefix));
      }
    } else if (field.type === "group" && typeof field.name === "string") {
      const fullName = prefix ? `${prefix}.${field.name}` : field.name;
      result.push(...flattenFields((field.fields ?? []) as unknown[], fullName));
    } else if (field.type === "array" && typeof field.name === "string") {
      const fullName = prefix ? `${prefix}.${field.name}[]` : `${field.name}[]`;
      result.push({ name: fullName, type: "array", required: !!field.required });
      result.push(...flattenFields((field.fields ?? []) as unknown[], fullName));
    } else if (typeof field.name === "string") {
      const fullName = prefix ? `${prefix}.${field.name}` : field.name;
      result.push({ name: fullName, type: String(field.type), required: !!field.required });
    }
  }
  return result;
}

async function generateDatabaseSchemaDoc() {
  // Payload's buildConfig returns Promise<SanitizedConfig>; resolve once.
  const cfg = await Promise.resolve(config);

  let md = `# Database schema — vozilla.hr\n\n`;
  md += `> Auto-generated from Drizzle schema (\`apps/web/lib/db/schema/\`) and Payload config. Run \`pnpm generate:docs\` to refresh.\n\n`;

  md += `## Drizzle raw tables\n\n`;
  md += `Operacijske tablice managed by Drizzle ORM. Migracije u \`apps/web/lib/db/migrations/\`.\n\n`;

  console.log("  → introspecting Drizzle schema");
  const drizzleEntries = Object.entries(schema)
    .map(([name, value]) => {
      try {
        const cfg = getTableConfig(value as PgTable);
        return { name, cfg };
      } catch {
        return null;
      }
    })
    .filter((x): x is { name: string; cfg: ReturnType<typeof getTableConfig> } => x !== null)
    .sort((a, b) => a.cfg.name.localeCompare(b.cfg.name));

  console.log(`  → found ${drizzleEntries.length} Drizzle tables`);
  for (const { cfg } of drizzleEntries) {
    md += `### \`${cfg.name}\`\n\n`;
    md += `| Column | Type | Constraints |\n|---|---|---|\n`;
    for (const col of cfg.columns) {
      const cons: string[] = [];
      if (col.primary) cons.push("PK");
      if (col.notNull && !col.primary) cons.push("NOT NULL");
      if (col.isUnique) cons.push("UNIQUE");
      if (col.hasDefault) cons.push("default");
      const dataType = col.columnType.replace(/^Pg/, "").toLowerCase();
      md += `| \`${col.name}\` | ${dataType} | ${cons.join(", ") || "—"} |\n`;
    }
    if (cfg.indexes.length > 0) {
      md += `\n**Indexes:**\n\n`;
      for (const idx of cfg.indexes) {
        const idxConfig = (
          idx as unknown as { config: { name: string; columns: Array<{ name: string }> } }
        ).config;
        const cols = idxConfig.columns.map((c) => c.name).join(", ");
        md += `- \`${idxConfig.name}\` on (${cols})\n`;
      }
    }
    md += `\n`;
  }

  md += `## Payload collections\n\n`;
  md += `Content + entiteti managed by Payload CMS 3. Tablice se kreiraju kroz Payload migracije (\`apps/web/migrations/\`).\n\n`;

  console.log("  → introspecting Payload collections");
  const collections = cfg.collections ?? [];
  for (const collection of collections) {
    const slug = (collection as unknown as { slug: string }).slug;
    md += `### \`${slug}\`\n\n`;
    if ((collection as unknown as { auth?: unknown }).auth) {
      md += `**Auth collection** — login enabled.\n\n`;
    }
    if ((collection as unknown as { upload?: unknown }).upload) {
      md += `**Upload collection** — file uploads enabled.\n\n`;
    }
    const fields = (collection as unknown as { fields?: unknown[] }).fields ?? [];
    const flat = flattenFields(fields);
    if (flat.length > 0) {
      md += `| Field | Type | Required |\n|---|---|---|\n`;
      for (const f of flat) {
        md += `| \`${f.name}\` | ${f.type} | ${f.required ? "✓" : ""} |\n`;
      }
    }
    md += `\n`;
  }

  md += `## Payload globals\n\n`;
  md += `Singleton config držan u DB-u, izložen kroz Payload admin za runtime override.\n\n`;

  console.log("  → introspecting Payload globals");
  const globals = cfg.globals ?? [];
  for (const global of globals) {
    const slug = (global as unknown as { slug: string }).slug;
    md += `### \`${slug}\`\n\n`;
    const fields = (global as unknown as { fields?: unknown[] }).fields ?? [];
    const flat = flattenFields(fields);
    if (flat.length > 0) {
      md += `| Field | Type |\n|---|---|\n`;
      for (const f of flat) {
        md += `| \`${f.name}\` | ${f.type} |\n`;
      }
    }
    md += `\n`;
  }

  const outPath = path.resolve(process.cwd(), "../../docs/database-schema.md");
  await writeFile(outPath, md, "utf-8");
  console.log(`  ✓ docs/database-schema.md`);
}

// Walks app/**/route.ts to surface every API endpoint with HTTP methods
// + a route-grouped table. Pulls the first comment in each file as the
// summary so docs stay close to the implementation.

const METHOD_RE = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g;
const SUMMARY_RE = /\/\/\s*(.+?)(?:\n|$)/;

async function walkRoutes(
  dir: string,
  baseSegments: string[] = [],
): Promise<Array<{ urlPath: string; filePath: string; methods: string[]; summary: string }>> {
  const out: Array<{ urlPath: string; filePath: string; methods: string[]; summary: string }> = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith("_")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip route groups — they are organisational, not part of the URL.
      const seg = entry.name.startsWith("(") && entry.name.endsWith(")") ? null : entry.name;
      const next = seg === null ? baseSegments : [...baseSegments, seg];
      out.push(...(await walkRoutes(fullPath, next)));
    } else if (entry.name === "route.ts") {
      const content = await readFile(fullPath, "utf-8");
      const methods = new Set<string>();
      let m: RegExpExecArray | null;
      while ((m = METHOD_RE.exec(content))) methods.add(m[1]);
      METHOD_RE.lastIndex = 0;
      // Skip the "use server" / "import" preamble when scanning for a summary.
      const afterPreamble = content
        .split("\n")
        .filter((line) => !line.startsWith("import") && line.trim() !== "")
        .slice(0, 8)
        .join("\n");
      const summaryMatch = afterPreamble.match(SUMMARY_RE);
      const summary = summaryMatch ? summaryMatch[1].trim() : "";
      const urlPath = "/" + baseSegments.join("/");
      out.push({
        urlPath,
        filePath: path.relative(path.resolve(process.cwd()), fullPath).replaceAll("\\", "/"),
        methods: [...methods].sort(),
        summary,
      });
    }
  }
  return out;
}

async function generateApiRoutesDoc() {
  console.log("  → walking app/**/route.ts");
  const appDir = path.resolve(process.cwd(), "app");
  const routes = await walkRoutes(appDir);
  routes.sort((a, b) => a.urlPath.localeCompare(b.urlPath));

  // Group by top-level path prefix so the table is readable: api/cron/*,
  // api/leads, api/newsletter/*, etc. surface together.
  const groups = new Map<string, typeof routes>();
  for (const r of routes) {
    const segments = r.urlPath.split("/").filter(Boolean);
    const key = segments.length >= 2 ? `/${segments[0]}/${segments[1]}` : `/${segments[0] ?? ""}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  let md = `# API routes — vozilla.hr\n\n`;
  md += `> Auto-generated from \`app/**/route.ts\`. Run \`pnpm generate:docs\` to refresh.\n\n`;
  md += `Total endpoints: ${routes.length}.\n\n`;

  for (const [prefix, list] of [...groups.entries()].sort()) {
    md += `## \`${prefix}\`\n\n`;
    md += `| Path | Methods | File | Summary |\n|---|---|---|---|\n`;
    for (const r of list) {
      const methods = r.methods.join(", ") || "—";
      md += `| \`${r.urlPath}\` | ${methods} | \`${r.filePath}\` | ${r.summary || "—"} |\n`;
    }
    md += `\n`;
  }

  const outPath = path.resolve(process.cwd(), "../../docs/api-routes.md");
  await writeFile(outPath, md, "utf-8");
  console.log(`  ✓ docs/api-routes.md (${routes.length} routes)`);
}

async function main() {
  console.log("→ generate:docs starting");

  console.log("\n→ feature-flags.md");
  await generateFeatureFlagsDoc();

  console.log("\n→ database-schema.md");
  await generateDatabaseSchemaDoc();

  console.log("\n→ api-routes.md");
  await generateApiRoutesDoc();

  console.log("\n✓ done");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ generate:docs failed:", err);
    process.exit(1);
  });
