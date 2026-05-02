import "dotenv/config";
import { getPayload } from "payload";
import config from "../payload/payload.config";
import { cleanupDemo } from "./lib/seed-cleanup-demo";

async function main() {
  console.log("→ seed:cleanup-demo starting");
  console.log("  → initializing Payload");
  const payload = await getPayload({ config });
  console.log("  → Payload initialized");

  await cleanupDemo(payload);
}

main()
  .then(() => {
    console.log("✓ done");
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ seed:cleanup-demo failed:", err);
    process.exit(1);
  });
