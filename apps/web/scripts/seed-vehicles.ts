import "dotenv/config";
import { getPayload } from "payload";
import config from "../payload/payload.config";
import { seedVehicles } from "./lib/seed-vehicles";

async function main() {
  console.log("→ seed:vehicles starting");
  console.log("  → initializing Payload");
  const payload = await getPayload({ config });
  console.log("  → Payload initialized");

  const csvArg = process.argv[2];
  await seedVehicles(payload, csvArg);
}

main()
  .then(() => {
    console.log("✓ done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ seed:vehicles failed:", err);
    process.exit(1);
  });
