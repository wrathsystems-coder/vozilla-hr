import "dotenv/config";
import { writeFile, readFile } from "node:fs/promises";
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
  const collections = config.collections ?? [];
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
  const globals = config.globals ?? [];
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

async function main() {
  console.log("→ generate:docs starting");

  console.log("\n→ feature-flags.md");
  await generateFeatureFlagsDoc();

  console.log("\n→ database-schema.md");
  await generateDatabaseSchemaDoc();

  console.log("\n✓ done");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ generate:docs failed:", err);
    process.exit(1);
  });
