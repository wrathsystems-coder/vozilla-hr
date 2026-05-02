import "dotenv/config";
import { getPayload } from "payload";
import config from "../payload/payload.config";
import { seedDemo } from "./lib/seed-demo";

async function main() {
  console.log("→ seed:demo starting");
  console.log("  → initializing Payload");
  const payload = await getPayload({ config });
  console.log("  → Payload initialized");

  await seedDemo(payload);
}

main()
  .then(() => {
    console.log("✓ done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ seed:demo failed:", err);
    process.exit(1);
  });
