import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor, BlocksFeature } from "@payloadcms/richtext-lexical";
import { fileURLToPath } from "url";
import path from "path";
import { AdminUsers } from "./collections/AdminUsers";
import { BodyTypes } from "./collections/BodyTypes";
import { Brands } from "./collections/Brands";
import { Models } from "./collections/Models";
import { ModelVersions } from "./collections/ModelVersions";
import { VehicleAttributes } from "./collections/VehicleAttributes";
import { Reviews } from "./collections/Reviews";
import { Articles } from "./collections/Articles";
import { Pages } from "./collections/Pages";
import { ComparisonPairs } from "./collections/ComparisonPairs";
import { HeroImage, SpecsTable, ProsCons, CtaButton, DisclaimerBox } from "./blocks";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: "admin_users",
    meta: {
      titleSuffix: " — vozilla.hr admin",
    },
  },
  collections: [
    AdminUsers,
    BodyTypes,
    Brands,
    Models,
    ModelVersions,
    VehicleAttributes,
    Reviews,
    Articles,
    Pages,
    ComparisonPairs,
  ],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      BlocksFeature({
        blocks: [HeroImage, SpecsTable, ProsCons, CtaButton, DisclaimerBox],
      }),
    ],
  }),
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
  }),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "../payload-types.ts"),
  },
});
