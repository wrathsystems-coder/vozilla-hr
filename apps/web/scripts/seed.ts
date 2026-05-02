import "dotenv/config";
import { getPayload } from "payload";
import config from "../payload/payload.config";
import { seedCounties } from "./lib/seed-counties";
import { seedBodyTypes } from "./lib/seed-body-types";

async function main() {
  console.log("→ Sprint 1 base seed starting");

  console.log("\n→ counties (Drizzle)");
  await seedCounties();

  console.log("\n→ body_types (Payload)");
  console.log("  → initializing Payload (this can take 30-60s on first run)");
  const payload = await getPayload({ config });
  console.log("  → Payload initialized");
  await seedBodyTypes(payload);

  console.log("\n✓ Base seed complete.");
  console.log("  Run `pnpm seed:vehicles` to import models from CSV.");
  console.log("  Run `pnpm seed:demo` for demo dealers + leads (dev only).");
}

main()
  .then(() => {
    console.log("✓ done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ seed failed:", err);
    process.exit(1);
  });
