CREATE TABLE IF NOT EXISTS "idempotency_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"endpoint" text NOT NULL,
	"response_status" integer NOT NULL,
	"response_body" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idempotency_keys_key_endpoint_idx" ON "idempotency_keys" USING btree ("key","endpoint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idempotency_keys_expires_idx" ON "idempotency_keys" USING btree ("expires_at");