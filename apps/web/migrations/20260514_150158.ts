import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Add 'oglas' to the lead source enum so the /rabljena-vozila/oglas/[id]
  // CTA can attribute leads to the used-car detail page (was previously
  // collapsed into 'other'). ADD VALUE must run outside any tx that later
  // references the new value, so we issue it in its own db.execute.
  await db.execute(
    sql`ALTER TYPE "public"."enum_lead_requests_source" ADD VALUE 'oglas' BEFORE 'other';`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Reverse: cast → text, drop, recreate without 'oglas', remap, cast back.
  // Existing rows with source='oglas' collapse to 'other' (no information
  // loss since the listing id is still recorded in internal_notes / the
  // ?oglas= URL param on the inbound request).
  await db.execute(sql`
    ALTER TABLE "public"."lead_requests" ALTER COLUMN "source" SET DATA TYPE text;
    DROP TYPE "public"."enum_lead_requests_source";
    CREATE TYPE "public"."enum_lead_requests_source" AS ENUM('header', 'hub', 'brand', 'category', 'detail', 'recenzija', 'usporedba', 'quiz', 'leasing', 'sticky', 'other');
    UPDATE "public"."lead_requests" SET "source" = 'other' WHERE "source" = 'oglas';
    ALTER TABLE "public"."lead_requests" ALTER COLUMN "source" SET DATA TYPE "public"."enum_lead_requests_source" USING "source"::"public"."enum_lead_requests_source";
  `);
}
