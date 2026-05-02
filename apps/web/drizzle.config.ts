import { config } from "dotenv";
import type { Config } from "drizzle-kit";

config({ path: ".env.local" });

export default {
  schema: "./lib/db/schema/index.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
} satisfies Config;
