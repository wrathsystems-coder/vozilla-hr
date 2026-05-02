import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor, BlocksFeature } from "@payloadcms/richtext-lexical";
import { fileURLToPath } from "url";
import path from "path";
import { AdminUsers } from "./collections/AdminUsers";
import { Media } from "./collections/Media";
import { BodyTypes } from "./collections/BodyTypes";
import { Brands } from "./collections/Brands";
import { Models } from "./collections/Models";
import { ModelVersions } from "./collections/ModelVersions";
import { VehicleAttributes } from "./collections/VehicleAttributes";
import { Reviews } from "./collections/Reviews";
import { Articles } from "./collections/Articles";
import { Pages } from "./collections/Pages";
import { ComparisonPairs } from "./collections/ComparisonPairs";
import { Dealers } from "./collections/Dealers";
import { DealerUsers } from "./collections/DealerUsers";
import { UsedCarListings } from "./collections/UsedCarListings";
import { UsedCarImages } from "./collections/UsedCarImages";
import { LeadRequests } from "./collections/LeadRequests";
import { LeadAssignments } from "./collections/LeadAssignments";
import { GdprRequests } from "./collections/GdprRequests";
import { HeroImage, SpecsTable, ProsCons, CtaButton, DisclaimerBox } from "./blocks";
import {
  Settings,
  MarketingCopy,
  EmailSettings,
  LeadDistribution,
  LeasingDefaults,
  WidgetSettings,
} from "./globals";

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
    Media,
    BodyTypes,
    Brands,
    Models,
    ModelVersions,
    VehicleAttributes,
    Reviews,
    Articles,
    Pages,
    ComparisonPairs,
    Dealers,
    DealerUsers,
    UsedCarListings,
    UsedCarImages,
    LeadRequests,
    LeadAssignments,
    GdprRequests,
  ],
  globals: [
    Settings,
    MarketingCopy,
    EmailSettings,
    LeadDistribution,
    LeasingDefaults,
    WidgetSettings,
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
