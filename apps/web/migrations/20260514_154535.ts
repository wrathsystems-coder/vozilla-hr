import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Add the new admin-new-gdpr-notification key so EmailSettings can
  // toggle/override it. ADD VALUE must run outside any tx that later
  // references the new value, so we issue it in its own db.execute.
  await db.execute(
    sql`ALTER TYPE "public"."enum_email_settings_templates_key" ADD VALUE 'admin-new-gdpr-notification' AFTER 'admin-new-lead-notification';`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Cast → text, drop, recreate without the new value, remap rows that
  // hold it back to admin-new-lead-notification, cast back. The admin-
  // notification fallback is acceptable since both target the same admin
  // inbox; a manual cleanup in EmailSettings is still suggested after a
  // downgrade.
  await db.execute(sql`
    ALTER TABLE "public"."email_settings_templates" ALTER COLUMN "key" SET DATA TYPE text;
    DROP TYPE "public"."enum_email_settings_templates_key";
    CREATE TYPE "public"."enum_email_settings_templates_key" AS ENUM('lead-confirmation', 'lead-to-dealer', 'magic-link', 'gdpr-request-received', 'gdpr-request-resolved', 'dealer-password-reset', 'admin-new-lead-notification', 'dealer-reminder-1', 'dealer-reminder-2', 'customer-feedback-3d', 'customer-feedback-14d', 'customer-feedback-30d', 'newsletter-confirm');
    UPDATE "public"."email_settings_templates" SET "key" = 'admin-new-lead-notification' WHERE "key" = 'admin-new-gdpr-notification';
    ALTER TABLE "public"."email_settings_templates" ALTER COLUMN "key" SET DATA TYPE "public"."enum_email_settings_templates_key" USING "key"::"public"."enum_email_settings_templates_key";
  `);
}
