import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

// Load .env.local before any test file (and therefore any module under test)
// reads process.env. getDb() throws on missing DATABASE_URL; this lets unit
// tests that never touch DB stay env-agnostic while integration tests get
// a working connection string.

const dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(dirname, "../.env.local") });
