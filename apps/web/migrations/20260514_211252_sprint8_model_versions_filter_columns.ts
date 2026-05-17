import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

// Sprint 8 catalog faza — extends `model_versions` so it can power the
// faceted multi-select filter system (see docs/filter-architecture.md).
//
// Payload migrate:create generated a draft that included spurious
// re-additions of enum values and columns that were already shipped
// in prior migrations (oglas source enum, admin-new-gdpr template key,
// customer_feedback_emails_* columns). Removed those — they'd throw
// "value/column already exists" on the next migrate run.
//
// New work in this migration:
//   - 3 new enum types (equipment, colors_available, drivetrain)
//   - 10 typed numeric columns on model_versions (max_speed_kmh,
//     acceleration_0_100_s, boot_capacity_l, weight_kg, dimensions,
//     doors/seats counts)
//   - 1 enum column (drivetrain)
//   - 2 Payload-style join tables for hasMany select (equipment +
//     colors_available)
//   - 10 filter-performance B-tree indexes on the range columns

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_model_versions_equipment" AS ENUM('panorama', 'hud', 'heated_seats', 'ventilated_seats', 'leather_seats', 'electric_seats', 'adaptive_cruise', 'lane_assist', 'blind_spot', 'camera_360', 'parking_sensors', 'led_matrix', 'wireless_charging', 'apple_carplay', 'android_auto', 'premium_audio');
    CREATE TYPE "public"."enum_model_versions_colors_available" AS ENUM('white', 'black', 'grey', 'silver', 'blue', 'red', 'green', 'brown', 'yellow', 'orange', 'beige');
    CREATE TYPE "public"."enum_model_versions_drivetrain" AS ENUM('fwd', 'rwd', 'awd', '4x4');

    CREATE TABLE IF NOT EXISTS "model_versions_equipment" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_model_versions_equipment",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "model_versions_colors_available" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_model_versions_colors_available",
      "id" serial PRIMARY KEY NOT NULL
    );

    ALTER TABLE "model_versions" ADD COLUMN "max_speed_kmh" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "acceleration_0_100_s" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "boot_capacity_l" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "weight_kg" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "length_mm" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "width_mm" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "height_mm" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "wheelbase_mm" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "doors_count" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "seats_count" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "drivetrain" "enum_model_versions_drivetrain";

    DO $$ BEGIN
      ALTER TABLE "model_versions_equipment" ADD CONSTRAINT "model_versions_equipment_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."model_versions"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "model_versions_colors_available" ADD CONSTRAINT "model_versions_colors_available_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "public"."model_versions"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    -- Join-table standard Payload indexes.
    CREATE INDEX IF NOT EXISTS "model_versions_equipment_order_idx" ON "model_versions_equipment" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "model_versions_equipment_parent_idx" ON "model_versions_equipment" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "model_versions_equipment_value_idx" ON "model_versions_equipment" USING btree ("value");
    CREATE INDEX IF NOT EXISTS "model_versions_colors_available_order_idx" ON "model_versions_colors_available" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "model_versions_colors_available_parent_idx" ON "model_versions_colors_available" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "model_versions_colors_available_value_idx" ON "model_versions_colors_available" USING btree ("value");

    -- Sprint 8: filter-performance B-tree indexes on range columns.
    -- Catalog scales to 20k+ ModelVersion rows; range scans must be
    -- index-friendly (docs/filter-architecture.md).
    CREATE INDEX IF NOT EXISTS "model_versions_price_idx" ON "model_versions" USING btree ("price_eur");
    CREATE INDEX IF NOT EXISTS "model_versions_year_idx" ON "model_versions" USING btree ("year");
    CREATE INDEX IF NOT EXISTS "model_versions_power_hp_idx" ON "model_versions" USING btree ("power_hp");
    CREATE INDEX IF NOT EXISTS "model_versions_max_speed_idx" ON "model_versions" USING btree ("max_speed_kmh");
    CREATE INDEX IF NOT EXISTS "model_versions_boot_idx" ON "model_versions" USING btree ("boot_capacity_l");
    CREATE INDEX IF NOT EXISTS "model_versions_weight_idx" ON "model_versions" USING btree ("weight_kg");
    CREATE INDEX IF NOT EXISTS "model_versions_accel_idx" ON "model_versions" USING btree ("acceleration_0_100_s");
    CREATE INDEX IF NOT EXISTS "model_versions_consumption_idx" ON "model_versions" USING btree ("fuel_consumption_combined_l");
    CREATE INDEX IF NOT EXISTS "model_versions_co2_idx" ON "model_versions" USING btree ("co2_emission_g_km");
    CREATE INDEX IF NOT EXISTS "model_versions_engine_trans_idx" ON "model_versions" USING btree ("engine_type", "transmission");
    CREATE INDEX IF NOT EXISTS "model_versions_drivetrain_idx" ON "model_versions" USING btree ("drivetrain");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "model_versions_price_idx";
    DROP INDEX IF EXISTS "model_versions_year_idx";
    DROP INDEX IF EXISTS "model_versions_power_hp_idx";
    DROP INDEX IF EXISTS "model_versions_max_speed_idx";
    DROP INDEX IF EXISTS "model_versions_boot_idx";
    DROP INDEX IF EXISTS "model_versions_weight_idx";
    DROP INDEX IF EXISTS "model_versions_accel_idx";
    DROP INDEX IF EXISTS "model_versions_consumption_idx";
    DROP INDEX IF EXISTS "model_versions_co2_idx";
    DROP INDEX IF EXISTS "model_versions_engine_trans_idx";
    DROP INDEX IF EXISTS "model_versions_drivetrain_idx";

    DROP TABLE IF EXISTS "model_versions_equipment" CASCADE;
    DROP TABLE IF EXISTS "model_versions_colors_available" CASCADE;

    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "max_speed_kmh";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "acceleration_0_100_s";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "boot_capacity_l";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "weight_kg";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "length_mm";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "width_mm";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "height_mm";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "wheelbase_mm";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "doors_count";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "seats_count";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "drivetrain";

    DROP TYPE IF EXISTS "public"."enum_model_versions_equipment";
    DROP TYPE IF EXISTS "public"."enum_model_versions_colors_available";
    DROP TYPE IF EXISTS "public"."enum_model_versions_drivetrain";
  `);
}
