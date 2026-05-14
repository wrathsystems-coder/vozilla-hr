import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // customer_feedback_emails group on lead_requests — Payload flattens
  // groups into prefixed columns (customer_feedback_emails_<field>).
  // Boolean default false so older rows stop the cron from firing on
  // pre-Sprint-7 leads that pre-date the feedback flow.
  await db.execute(sql`
    ALTER TABLE "lead_requests"
      ADD COLUMN "customer_feedback_emails_disabled" boolean DEFAULT false,
      ADD COLUMN "customer_feedback_emails_day3_sent_at" timestamp(3) with time zone,
      ADD COLUMN "customer_feedback_emails_day14_sent_at" timestamp(3) with time zone,
      ADD COLUMN "customer_feedback_emails_day30_sent_at" timestamp(3) with time zone;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "lead_requests"
      DROP COLUMN IF EXISTS "customer_feedback_emails_disabled",
      DROP COLUMN IF EXISTS "customer_feedback_emails_day3_sent_at",
      DROP COLUMN IF EXISTS "customer_feedback_emails_day14_sent_at",
      DROP COLUMN IF EXISTS "customer_feedback_emails_day30_sent_at";
  `);
}
