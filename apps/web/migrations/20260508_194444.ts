import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // ALTER TYPE ... ADD VALUE cannot run in the same transaction that later
  // references the new value. Payload's runner wraps `db.execute` in a tx,
  // so we issue ADD VALUE separately first.
  await db.execute(
    sql`ALTER TYPE "public"."enum_lead_requests_preferred_contact_method" ADD VALUE 'whatsapp' BEFORE 'any';`,
  );

  await db.execute(sql`
    CREATE TYPE "public"."enum_lead_requests_leasing_type" AS ENUM('operating', 'financial');
    ALTER TABLE "lead_requests" ADD COLUMN "leasing_type" "enum_lead_requests_leasing_type";
    ALTER TABLE "lead_assignments" ADD COLUMN "quality_score_at_dispatch" numeric;

    -- source enum: drop-and-recreate is unavoidable (old values 'home',
    -- 'model_page', 'sticky_widget' are removed). Convert column to text,
    -- remap legacy values to new enum members, then cast back.
    ALTER TABLE "public"."lead_requests" ALTER COLUMN "source" SET DATA TYPE text;
    DROP TYPE "public"."enum_lead_requests_source";
    CREATE TYPE "public"."enum_lead_requests_source" AS ENUM('header', 'hub', 'brand', 'category', 'detail', 'recenzija', 'usporedba', 'quiz', 'leasing', 'sticky', 'other');
    UPDATE "public"."lead_requests" SET "source" = 'header' WHERE "source" = 'home';
    UPDATE "public"."lead_requests" SET "source" = 'detail' WHERE "source" = 'model_page';
    UPDATE "public"."lead_requests" SET "source" = 'sticky' WHERE "source" = 'sticky_widget';
    ALTER TABLE "public"."lead_requests" ALTER COLUMN "source" SET DATA TYPE "public"."enum_lead_requests_source" USING "source"::"public"."enum_lead_requests_source";
  `);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "lead_requests" DROP COLUMN IF EXISTS "leasing_type";
    ALTER TABLE "lead_assignments" DROP COLUMN IF EXISTS "quality_score_at_dispatch";

    -- preferred_contact_method: rows holding 'whatsapp' get coerced to 'any'
    -- so the cast back to the legacy enum doesn't fail.
    ALTER TABLE "public"."lead_requests" ALTER COLUMN "preferred_contact_method" SET DATA TYPE text;
    DROP TYPE "public"."enum_lead_requests_preferred_contact_method";
    CREATE TYPE "public"."enum_lead_requests_preferred_contact_method" AS ENUM('phone', 'email', 'any');
    UPDATE "public"."lead_requests" SET "preferred_contact_method" = 'any' WHERE "preferred_contact_method" = 'whatsapp';
    ALTER TABLE "public"."lead_requests" ALTER COLUMN "preferred_contact_method" SET DATA TYPE "public"."enum_lead_requests_preferred_contact_method" USING "preferred_contact_method"::"public"."enum_lead_requests_preferred_contact_method";

    -- source: reverse remap to legacy values. New-only values (hub/brand/
    -- category/recenzija/usporedba/leasing) collapse to 'other'.
    ALTER TABLE "public"."lead_requests" ALTER COLUMN "source" SET DATA TYPE text;
    DROP TYPE "public"."enum_lead_requests_source";
    CREATE TYPE "public"."enum_lead_requests_source" AS ENUM('home', 'model_page', 'sticky_widget', 'quiz', 'other');
    UPDATE "public"."lead_requests" SET "source" = 'home' WHERE "source" = 'header';
    UPDATE "public"."lead_requests" SET "source" = 'model_page' WHERE "source" = 'detail';
    UPDATE "public"."lead_requests" SET "source" = 'sticky_widget' WHERE "source" = 'sticky';
    UPDATE "public"."lead_requests" SET "source" = 'other' WHERE "source" IN ('hub', 'brand', 'category', 'recenzija', 'usporedba', 'leasing');
    ALTER TABLE "public"."lead_requests" ALTER COLUMN "source" SET DATA TYPE "public"."enum_lead_requests_source" USING "source"::"public"."enum_lead_requests_source";

    DROP TYPE "public"."enum_lead_requests_leasing_type";
  `);
}
