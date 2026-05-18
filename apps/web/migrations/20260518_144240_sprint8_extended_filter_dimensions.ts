import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

// Sprint 8 — extended filter dimensions for new automotive spec columns
// surfaced by user's catalog CSV (Torque, EV Range, Load Capacity, Climate
// Zones, Infotainment Screen, USB Ports, Euro NCAP, Airbags, Eco Norm,
// Engine Config, Seat/Steering Materials) plus 21 new equipment enum
// values (AEB, massage_seats, memory_seats, alcantara_seats, vegan_leather,
// Harman/Burmester/Bose, night_vision, auto_parking, sport_chrono, PASM,
// travel_assist, led_lights, touchscreen, voice_assistant, etc).
//
// Each ALTER TYPE ADD VALUE runs in its own db.execute() — Postgres
// requires ADD VALUE outside the tx that later references it (otherwise
// "unsafe use of new value of enum type" errors when later statements
// in the same tx insert/update with the new value). Same fragile pattern
// CLAUDE.md flags for prior `oglas` enum migration.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // --- New enum types ---
  await db.execute(sql`
    CREATE TYPE "public"."enum_model_versions_seat_materials" AS ENUM('fabric', 'leather', 'vegan_leather', 'alcantara', 'synthetic_leather', 'microfiber');
    CREATE TYPE "public"."enum_model_versions_steering_materials" AS ENUM('leather', 'alcantara', 'fabric', 'synthetic_leather', 'plastic');
    CREATE TYPE "public"."enum_model_versions_engine_config" AS ENUM('inline_3', 'inline_4', 'inline_5', 'inline_6', 'v6', 'v8', 'v10', 'v12', 'boxer_4', 'boxer_6', 'rotary', 'electric_motor', 'hybrid_motor', 'other');
    CREATE TYPE "public"."enum_model_versions_eco_norm" AS ENUM('euro_4', 'euro_5', 'euro_6', 'euro_6d', 'bev');
  `);

  // --- Equipment enum extensions — each in its own tx ---
  const newEquipmentValues: Array<{ value: string; before?: string }> = [
    { value: "massage_seats", before: "leather_seats" },
    { value: "memory_seats", before: "leather_seats" },
    { value: "alcantara_seats", before: "electric_seats" },
    { value: "vegan_leather_seats", before: "electric_seats" },
    { value: "rear_camera", before: "parking_sensors" },
    { value: "auto_parking", before: "led_matrix" },
    { value: "aeb", before: "led_matrix" },
    { value: "led_lights", before: "wireless_charging" },
    { value: "night_vision", before: "wireless_charging" },
    { value: "travel_assist", before: "wireless_charging" },
    { value: "sport_chrono", before: "wireless_charging" },
    { value: "pasm", before: "wireless_charging" },
    { value: "harman_kardon" },
    { value: "burmester_audio" },
    { value: "bose_audio" },
    { value: "touchscreen" },
    { value: "voice_assistant" },
    { value: "physical_buttons" },
    { value: "rotary_controller" },
    { value: "touch_sliders" },
  ];
  for (const v of newEquipmentValues) {
    const clause = v.before ? sql`BEFORE ${sql.raw(`'${v.before}'`)}` : sql``;
    await db.execute(
      sql`ALTER TYPE "public"."enum_model_versions_equipment" ADD VALUE ${sql.raw(`'${v.value}'`)} ${clause};`,
    );
  }

  // --- New typed columns on model_versions ---
  await db.execute(sql`
    ALTER TABLE "model_versions" ADD COLUMN "torque_nm" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "engine_config" "enum_model_versions_engine_config";
    ALTER TABLE "model_versions" ADD COLUMN "engine_config_notes" varchar;
    ALTER TABLE "model_versions" ADD COLUMN "eco_norm" "enum_model_versions_eco_norm";
    ALTER TABLE "model_versions" ADD COLUMN "ev_range_km" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "load_capacity_kg" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "climate_zones" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "infotainment_screen_in" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "usb_ports" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "euro_ncap_stars" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "airbags_count" numeric;
    ALTER TABLE "model_versions" ADD COLUMN "seat_material_notes" varchar;
    ALTER TABLE "model_versions" ADD COLUMN "steering_material_notes" varchar;
  `);

  // --- Many-to-many join tables for hasMany select fields ---
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "model_versions_seat_materials" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_model_versions_seat_materials",
      "id" serial PRIMARY KEY NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "model_versions_steering_materials" (
      "order" integer NOT NULL,
      "parent_id" integer NOT NULL,
      "value" "enum_model_versions_steering_materials",
      "id" serial PRIMARY KEY NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "model_versions_seat_materials" ADD CONSTRAINT "model_versions_seat_materials_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."model_versions"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "model_versions_steering_materials" ADD CONSTRAINT "model_versions_steering_materials_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."model_versions"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "model_versions_seat_materials_order_idx" ON "model_versions_seat_materials" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "model_versions_seat_materials_parent_idx" ON "model_versions_seat_materials" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "model_versions_steering_materials_order_idx" ON "model_versions_steering_materials" USING btree ("order");
    CREATE INDEX IF NOT EXISTS "model_versions_steering_materials_parent_idx" ON "model_versions_steering_materials" USING btree ("parent_id");
  `);

  // --- B-tree indexes on new range columns per filter-architecture.md ---
  // Same pattern as the existing power_hp/max_speed_kmh/boot_capacity_l
  // indexes from 20260514_211252. ev_range_km is partial (null for non-EV
  // means most rows skip the index entirely).
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "model_versions_torque_idx" ON "model_versions" USING btree ("torque_nm");
    CREATE INDEX IF NOT EXISTS "model_versions_ev_range_idx" ON "model_versions" USING btree ("ev_range_km") WHERE "ev_range_km" IS NOT NULL;
    CREATE INDEX IF NOT EXISTS "model_versions_load_capacity_idx" ON "model_versions" USING btree ("load_capacity_kg");
    CREATE INDEX IF NOT EXISTS "model_versions_climate_zones_idx" ON "model_versions" USING btree ("climate_zones");
    CREATE INDEX IF NOT EXISTS "model_versions_infotainment_idx" ON "model_versions" USING btree ("infotainment_screen_in");
    CREATE INDEX IF NOT EXISTS "model_versions_usb_idx" ON "model_versions" USING btree ("usb_ports");
    CREATE INDEX IF NOT EXISTS "model_versions_ncap_idx" ON "model_versions" USING btree ("euro_ncap_stars");
    CREATE INDEX IF NOT EXISTS "model_versions_airbags_idx" ON "model_versions" USING btree ("airbags_count");
    CREATE INDEX IF NOT EXISTS "model_versions_engine_config_idx" ON "model_versions" USING btree ("engine_config");
    CREATE INDEX IF NOT EXISTS "model_versions_eco_norm_idx" ON "model_versions" USING btree ("eco_norm");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Reverse order: drop indexes, drop tables, drop columns, recreate
  // equipment enum without new values (rows with new values cast back to
  // nullable text and re-typed — Postgres requires this dance for ENUM
  // value removal).
  await db.execute(sql`
    DROP INDEX IF EXISTS "model_versions_torque_idx";
    DROP INDEX IF EXISTS "model_versions_ev_range_idx";
    DROP INDEX IF EXISTS "model_versions_load_capacity_idx";
    DROP INDEX IF EXISTS "model_versions_climate_zones_idx";
    DROP INDEX IF EXISTS "model_versions_infotainment_idx";
    DROP INDEX IF EXISTS "model_versions_usb_idx";
    DROP INDEX IF EXISTS "model_versions_ncap_idx";
    DROP INDEX IF EXISTS "model_versions_airbags_idx";
    DROP INDEX IF EXISTS "model_versions_engine_config_idx";
    DROP INDEX IF EXISTS "model_versions_eco_norm_idx";

    DROP TABLE IF EXISTS "model_versions_seat_materials" CASCADE;
    DROP TABLE IF EXISTS "model_versions_steering_materials" CASCADE;

    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "torque_nm";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "engine_config";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "engine_config_notes";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "eco_norm";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "ev_range_km";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "load_capacity_kg";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "climate_zones";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "infotainment_screen_in";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "usb_ports";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "euro_ncap_stars";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "airbags_count";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "seat_material_notes";
    ALTER TABLE "model_versions" DROP COLUMN IF EXISTS "steering_material_notes";

    ALTER TABLE "public"."model_versions_equipment" ALTER COLUMN "value" SET DATA TYPE text;
    DROP TYPE "public"."enum_model_versions_equipment";
    CREATE TYPE "public"."enum_model_versions_equipment" AS ENUM('panorama', 'hud', 'heated_seats', 'ventilated_seats', 'leather_seats', 'electric_seats', 'adaptive_cruise', 'lane_assist', 'blind_spot', 'camera_360', 'parking_sensors', 'led_matrix', 'wireless_charging', 'apple_carplay', 'android_auto', 'premium_audio');
    ALTER TABLE "public"."model_versions_equipment" ALTER COLUMN "value" SET DATA TYPE "public"."enum_model_versions_equipment" USING "value"::"public"."enum_model_versions_equipment";

    DROP TYPE "public"."enum_model_versions_seat_materials";
    DROP TYPE "public"."enum_model_versions_steering_materials";
    DROP TYPE "public"."enum_model_versions_engine_config";
    DROP TYPE "public"."enum_model_versions_eco_norm";
  `);
}
