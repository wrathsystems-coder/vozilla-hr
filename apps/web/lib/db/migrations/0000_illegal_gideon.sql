CREATE TYPE "public"."consent_type" AS ENUM('oup', 'marketing', 'cookies_functional', 'cookies_analytics', 'cookies_marketing');--> statement-breakpoint
CREATE TYPE "public"."actor_type" AS ENUM('admin', 'system', 'dealer', 'customer');--> statement-breakpoint
CREATE TYPE "public"."magic_link_purpose" AS ENUM('lead_tracker', 'password_reset', 'quiz_save', 'draft_resume');--> statement-breakpoint
CREATE TYPE "public"."subscriber_status" AS ENUM('pending_confirmation', 'active', 'unsubscribed', 'bounced');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('pending', 'sent', 'failed', 'bounced');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "counties" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "counties_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consent_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_email" text NOT NULL,
	"consent_type" "consent_type" NOT NULL,
	"granted" boolean NOT NULL,
	"source_form" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_id" text,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"before" jsonb,
	"after" jsonb,
	"ip_address" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "magic_link_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"purpose" "magic_link_purpose" NOT NULL,
	"related_entity_type" text,
	"related_entity_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "magic_link_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"endpoint" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"status" "subscriber_status" DEFAULT 'pending_confirmation' NOT NULL,
	"confirmation_token" text,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"source_form" text,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quiz_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"answers" jsonb NOT NULL,
	"recommended_models" jsonb,
	"customer_email" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_results_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_name" text NOT NULL,
	"recipient_email" text NOT NULL,
	"subject" text NOT NULL,
	"payload" jsonb,
	"status" "email_status" DEFAULT 'pending' NOT NULL,
	"provider_message_id" text,
	"error_message" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consent_log_email_idx" ON "consent_log" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "consent_log_timestamp_idx" ON "consent_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_log_timestamp_idx" ON "audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magic_link_tokens_expires_idx" ON "magic_link_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magic_link_tokens_purpose_idx" ON "magic_link_tokens" USING btree ("purpose");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rate_limit_buckets_key_endpoint_idx" ON "rate_limit_buckets" USING btree ("key","endpoint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rate_limit_buckets_expires_idx" ON "rate_limit_buckets" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_results_expires_idx" ON "quiz_results" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_log_recipient_idx" ON "email_log" USING btree ("recipient_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_log_template_idx" ON "email_log" USING btree ("template_name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_log_status_idx" ON "email_log" USING btree ("status");