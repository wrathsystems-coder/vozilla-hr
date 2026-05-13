import "dotenv/config";
import { getPayload } from "payload";
import config from "../payload/payload.config";
import { seedComparisons } from "./lib/seed-comparisons";

async function main() {
  console.log("→ seed:comparisons starting");
  console.log("  → initializing Payload");
  const payload = await getPayload({ config });
  console.log("  → Payload initialized");

  const csvArg = process.argv[2];
  await seedComparisons(payload, csvArg);
}

main()
  .then(() => {
    console.log("✓ done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ seed:comparisons failed:", err);
    process.exit(1);
  });
