import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { fileURLToPath } from "url";
import path from "path";
import { AdminUsers } from "./collections/AdminUsers";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: "admin_users",
    meta: {
      titleSuffix: " — vozilla.hr admin",
    },
  },
  collections: [AdminUsers],
  editor: lexicalEditor(),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
  }),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "../payload-types.ts"),
  },
});
