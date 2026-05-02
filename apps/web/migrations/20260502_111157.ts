import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_admin_users_role" AS ENUM('super_admin', 'admin', 'operator', 'viewer');
  CREATE TYPE "public"."enum_media_source" AS ENUM('vlastite', 'press_kit', 'dealer_uploaded', 'stock_photo');
  CREATE TYPE "public"."enum_models_fuel_types" AS ENUM('benzin', 'dizel', 'hibrid', 'phev', 'ev', 'lpg', 'cng');
  CREATE TYPE "public"."enum_models_transmissions" AS ENUM('manual', 'automatic', 'dct', 'cvt');
  CREATE TYPE "public"."enum_models_segment" AS ENUM('A', 'B', 'C', 'D', 'E', 'F', 'J', 'M', 'S');
  CREATE TYPE "public"."enum_model_versions_engine_type" AS ENUM('benzin', 'dizel', 'hibrid', 'phev', 'ev');
  CREATE TYPE "public"."enum_model_versions_transmission" AS ENUM('manual', 'automatic', 'dct', 'cvt');
  CREATE TYPE "public"."enum_articles_category_slug" AS ENUM('vodici', 'savjeti', 'vijesti', 'tehnologija');
  CREATE TYPE "public"."enum_dealer_users_role" AS ENUM('manager', 'agent');
  CREATE TYPE "public"."enum_used_car_listings_condition" AS ENUM('excellent', 'good', 'fair', 'poor');
  CREATE TYPE "public"."enum_used_car_listings_status" AS ENUM('draft', 'active', 'sold', 'expired');
  CREATE TYPE "public"."enum_lead_requests_preferred_contact_method" AS ENUM('phone', 'email', 'any');
  CREATE TYPE "public"."enum_lead_requests_request_type" AS ENUM('new', 'used', 'leasing', 'unsure');
  CREATE TYPE "public"."enum_lead_requests_financing_type" AS ENUM('cash', 'bank_loan', 'leasing', 'undecided');
  CREATE TYPE "public"."enum_lead_requests_time_frame" AS ENUM('immediate', '1m', '3m', '6m', 'later');
  CREATE TYPE "public"."enum_lead_requests_trade_in_data_condition" AS ENUM('excellent', 'good', 'fair', 'poor');
  CREATE TYPE "public"."enum_lead_requests_source" AS ENUM('home', 'model_page', 'sticky_widget', 'quiz', 'other');
  CREATE TYPE "public"."enum_lead_requests_status" AS ENUM('new', 'under_review', 'in_progress', 'sent', 'closed', 'spam');
  CREATE TYPE "public"."enum_lead_assignments_status" AS ENUM('sent', 'viewed', 'contacted', 'closed');
  CREATE TYPE "public"."enum_lead_assignments_outcome" AS ENUM('sold', 'not_sold', 'customer_unresponsive', 'other');
  CREATE TYPE "public"."enum_gdpr_requests_request_type" AS ENUM('access', 'erasure', 'rectification', 'portability', 'objection');
  CREATE TYPE "public"."enum_gdpr_requests_status" AS ENUM('pending', 'in_progress', 'resolved', 'rejected');
  CREATE TYPE "public"."enum_email_settings_templates_key" AS ENUM('lead-confirmation', 'lead-to-dealer', 'magic-link', 'gdpr-request-received', 'gdpr-request-resolved', 'dealer-password-reset', 'admin-new-lead-notification', 'dealer-reminder-1', 'dealer-reminder-2', 'customer-feedback-3d', 'customer-feedback-14d', 'customer-feedback-30d', 'newsletter-confirm');
  CREATE TYPE "public"."enum_widget_settings_sticky_widget_position" AS ENUM('bottom-right', 'bottom-left');
  CREATE TABLE IF NOT EXISTS "admin_users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "admin_users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"role" "enum_admin_users_role" DEFAULT 'operator' NOT NULL,
  	"two_factor_enabled" boolean DEFAULT false,
  	"last_login_at" timestamp(3) with time zone,
  	"last_login_ip" varchar,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"source" "enum_media_source" DEFAULT 'vlastite' NOT NULL,
  	"credit_text" varchar,
  	"license_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_feature_url" varchar,
  	"sizes_feature_width" numeric,
  	"sizes_feature_height" numeric,
  	"sizes_feature_mime_type" varchar,
  	"sizes_feature_filesize" numeric,
  	"sizes_feature_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "body_types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"icon_svg_path" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "brands" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"country_origin" varchar,
  	"founded_year" numeric,
  	"logo_path" varchar,
  	"hero_image_path" varchar,
  	"description_md" varchar,
  	"is_active" boolean DEFAULT true,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "models_fuel_types" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_models_fuel_types",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "models_transmissions" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_models_transmissions",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "models" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_id" integer NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"body_type_id" integer NOT NULL,
  	"segment" "enum_models_segment",
  	"generation" varchar,
  	"year_from" numeric,
  	"year_to" numeric,
  	"base_price_eur" numeric,
  	"description_md" varchar,
  	"hero_image_path" varchar,
  	"is_active" boolean DEFAULT true,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "model_versions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"model_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"engine_type" "enum_model_versions_engine_type",
  	"engine_displacement_cc" numeric,
  	"power_kw" numeric,
  	"power_hp" numeric,
  	"transmission" "enum_model_versions_transmission",
  	"fuel_consumption_combined_l" numeric,
  	"co2_emission_g_km" numeric,
  	"price_eur" numeric,
  	"year" numeric,
  	"is_current" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "vehicle_attributes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"model_id" integer NOT NULL,
  	"attr_key" varchar NOT NULL,
  	"attr_value" varchar NOT NULL,
  	"attr_unit" varchar,
  	"display_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "reviews_pros" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "reviews_cons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "reviews_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_path" varchar NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"model_id" integer,
  	"author_id" integer,
  	"content" jsonb,
  	"scores_overall" numeric,
  	"scores_design" numeric,
  	"scores_comfort" numeric,
  	"scores_drive" numeric,
  	"scores_economy" numeric,
  	"scores_value" numeric,
  	"hero_image_path" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_og_image_path" varchar,
  	"is_published" boolean DEFAULT false,
  	"published_at" timestamp(3) with time zone,
  	"view_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"category_slug" "enum_articles_category_slug",
  	"author_id" integer,
  	"excerpt" varchar,
  	"content" jsonb,
  	"hero_image_path" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_og_image_path" varchar,
  	"is_published" boolean DEFAULT false,
  	"published_at" timestamp(3) with time zone,
  	"view_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"content" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_og_image_path" varchar,
  	"is_published" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "comparison_pairs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"model_a_id" integer NOT NULL,
  	"model_b_id" integer NOT NULL,
  	"content" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_og_image_path" varchar,
  	"is_published" boolean DEFAULT false,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "dealers_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "dealers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"legal_name" varchar NOT NULL,
  	"oib" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"address_street" varchar NOT NULL,
  	"address_city" varchar NOT NULL,
  	"address_postcode" varchar NOT NULL,
  	"address_county_id" numeric NOT NULL,
  	"address_lat" numeric,
  	"address_lng" numeric,
  	"scoring_monthly_lead_cap" numeric DEFAULT 20,
  	"scoring_current_month_leads" numeric DEFAULT 0,
  	"scoring_avg_rating" numeric DEFAULT 0,
  	"scoring_avg_response_time_hours" numeric DEFAULT 0,
  	"scoring_conversion_rate" numeric DEFAULT 0,
  	"scoring_throttle_factor" numeric DEFAULT 1,
  	"is_active" boolean DEFAULT true,
  	"is_verified" boolean DEFAULT false,
  	"is_demo" boolean DEFAULT false,
  	"suspended_reason" varchar,
  	"last_login_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "dealers_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"brands_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "dealer_users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"dealer_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"role" "enum_dealer_users_role" DEFAULT 'agent' NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "used_car_listings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"public_id" varchar NOT NULL,
  	"model_id" integer NOT NULL,
  	"dealer_id" integer,
  	"private_seller_data_name" varchar,
  	"private_seller_data_phone" varchar,
  	"private_seller_data_email" varchar,
  	"private_seller_data_city" varchar,
  	"year" numeric NOT NULL,
  	"mileage_km" numeric NOT NULL,
  	"price_eur" numeric NOT NULL,
  	"color" varchar,
  	"vin" varchar,
  	"condition" "enum_used_car_listings_condition" DEFAULT 'good' NOT NULL,
  	"description_md" varchar,
  	"location_county_id" numeric NOT NULL,
  	"location_city" varchar NOT NULL,
  	"status" "enum_used_car_listings_status" DEFAULT 'draft' NOT NULL,
  	"sold_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone,
  	"view_count" numeric DEFAULT 0,
  	"is_demo" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "used_car_images" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"listing_id" integer NOT NULL,
  	"media_id" integer NOT NULL,
  	"is_hero" boolean DEFAULT false,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "lead_requests_color_preferences" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"color" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "lead_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"public_token" varchar NOT NULL,
  	"display_id" varchar NOT NULL,
  	"customer_name" varchar NOT NULL,
  	"customer_email" varchar NOT NULL,
  	"customer_phone" varchar NOT NULL,
  	"customer_county_id" numeric NOT NULL,
  	"customer_postcode" varchar NOT NULL,
  	"preferred_contact_method" "enum_lead_requests_preferred_contact_method",
  	"best_contact_time" varchar,
  	"request_type" "enum_lead_requests_request_type" NOT NULL,
  	"brand_id" integer,
  	"model_id" integer,
  	"version_text" varchar,
  	"year_from" numeric,
  	"year_to" numeric,
  	"comments" varchar,
  	"price_min" numeric,
  	"price_max" numeric,
  	"financing_type" "enum_lead_requests_financing_type",
  	"deposit" numeric,
  	"period_months" numeric,
  	"time_frame" "enum_lead_requests_time_frame",
  	"has_trade_in" boolean DEFAULT false,
  	"trade_in_data_brand" varchar,
  	"trade_in_data_model" varchar,
  	"trade_in_data_year" numeric,
  	"trade_in_data_mileage_km" numeric,
  	"trade_in_data_condition" "enum_lead_requests_trade_in_data_condition",
  	"trade_in_data_estimated_value_eur" numeric,
  	"gdpr_consent_at" timestamp(3) with time zone NOT NULL,
  	"marketing_consent" boolean DEFAULT false,
  	"source" "enum_lead_requests_source",
  	"recaptcha_score" numeric,
  	"recaptcha_action" varchar,
  	"ip_address" varchar,
  	"user_agent" varchar,
  	"status" "enum_lead_requests_status" DEFAULT 'new' NOT NULL,
  	"internal_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "lead_assignments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lead_id" integer NOT NULL,
  	"dealer_id" integer NOT NULL,
  	"status" "enum_lead_assignments_status" DEFAULT 'sent' NOT NULL,
  	"sent_at" timestamp(3) with time zone,
  	"viewed_at" timestamp(3) with time zone,
  	"contacted_at" timestamp(3) with time zone,
  	"closed_at" timestamp(3) with time zone,
  	"outcome" "enum_lead_assignments_outcome",
  	"outcome_reason" varchar,
  	"dealer_notes" varchar,
  	"customer_feedback_marked_interested" boolean DEFAULT false,
  	"customer_feedback_marked_not_interested" boolean DEFAULT false,
  	"customer_feedback_rating_for_dealer" numeric,
  	"customer_feedback_feedback_text" varchar,
  	"reminders_first_reminder_sent_at" timestamp(3) with time zone,
  	"reminders_second_reminder_sent_at" timestamp(3) with time zone,
  	"reminders_expired_no_response" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "gdpr_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_id" varchar NOT NULL,
  	"customer_email" varchar NOT NULL,
  	"customer_name" varchar NOT NULL,
  	"customer_oib" varchar,
  	"request_type" "enum_gdpr_requests_request_type" NOT NULL,
  	"lead_request_id" integer,
  	"description" varchar,
  	"status" "enum_gdpr_requests_status" DEFAULT 'pending' NOT NULL,
  	"admin_notes" varchar,
  	"resolved_at" timestamp(3) with time zone,
  	"resolved_by_id" integer,
  	"ip_address" varchar,
  	"recaptcha_score" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_users_id" integer,
  	"media_id" integer,
  	"body_types_id" integer,
  	"brands_id" integer,
  	"models_id" integer,
  	"model_versions_id" integer,
  	"vehicle_attributes_id" integer,
  	"reviews_id" integer,
  	"articles_id" integer,
  	"pages_id" integer,
  	"comparison_pairs_id" integer,
  	"dealers_id" integer,
  	"dealer_users_id" integer,
  	"used_car_listings_id" integer,
  	"used_car_images_id" integer,
  	"lead_requests_id" integer,
  	"lead_assignments_id" integer,
  	"gdpr_requests_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_users_id" integer,
  	"dealers_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_site_name" varchar DEFAULT 'vozilla.hr' NOT NULL,
  	"brand_tagline" varchar,
  	"brand_logo_path" varchar,
  	"brand_logo_dark_path" varchar,
  	"brand_favicon_path" varchar,
  	"contact_email_general" varchar,
  	"contact_email_dpo" varchar,
  	"contact_email_dealers" varchar,
  	"contact_phone" varchar,
  	"contact_address_line" varchar,
  	"social_facebook_url" varchar,
  	"social_instagram_url" varchar,
  	"social_linkedin_url" varchar,
  	"social_youtube_url" varchar,
  	"seo_defaults_title_template" varchar DEFAULT '%s — vozilla.hr',
  	"seo_defaults_description" varchar,
  	"seo_defaults_og_image_path" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "marketing_copy_value_props" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"icon_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "marketing_copy_how_it_works" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"step_number" numeric NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "marketing_copy_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quote" varchar NOT NULL,
  	"author_name" varchar NOT NULL,
  	"author_role" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "marketing_copy" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_headline" varchar,
  	"hero_subheadline" varchar,
  	"hero_primary_cta_label" varchar DEFAULT 'Zatraži ponudu',
  	"hero_primary_cta_href" varchar DEFAULT '/zatrazi-ponudu',
  	"hero_hero_image_path" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "email_settings_templates" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" "enum_email_settings_templates_key" NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"subject_override" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "email_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from_email" varchar,
  	"reply_to" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "lead_distribution" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"weights_w_response" numeric DEFAULT 0.4,
  	"weights_w_conversion" numeric DEFAULT 0.3,
  	"weights_w_rating" numeric DEFAULT 0.2,
  	"weights_w_capacity" numeric DEFAULT 0.1,
  	"rules_closest_dealer_always_included" boolean DEFAULT true,
  	"rules_max_dealers_per_lead" numeric DEFAULT 5,
  	"rules_default_dealers_per_lead" numeric DEFAULT 5,
  	"rules_min_dealers_per_lead" numeric DEFAULT 3,
  	"throttling_max_leads_per_dealer_per_day" numeric DEFAULT 20,
  	"throttling_max_leads_per_dealer_per_week" numeric DEFAULT 80,
  	"reminders_first_reminder_hours" numeric DEFAULT 24,
  	"reminders_second_reminder_hours" numeric DEFAULT 48,
  	"reminders_expire_no_response_hours" numeric DEFAULT 72,
  	"score_thresholds_warn_below" numeric DEFAULT 0.3,
  	"score_thresholds_suspend_below" numeric DEFAULT 0.15,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "leasing_defaults" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"interest_rates_default_rate_percent" numeric DEFAULT 5.5,
  	"interest_rates_min_rate_percent" numeric DEFAULT 3,
  	"interest_rates_max_rate_percent" numeric DEFAULT 12,
  	"term_months_default" numeric DEFAULT 60,
  	"term_months_min" numeric DEFAULT 12,
  	"term_months_max" numeric DEFAULT 84,
  	"deposit_percent_default" numeric DEFAULT 20,
  	"deposit_percent_min" numeric DEFAULT 0,
  	"deposit_percent_max" numeric DEFAULT 50,
  	"residual_value_percent_default" numeric DEFAULT 30,
  	"disclaimer" varchar DEFAULT 'Informativni izračun. Konačnu ponudu radi banka/leasing kuća na temelju vaše kreditne sposobnosti.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "widget_settings_sticky_widget_excluded_paths" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"path" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "widget_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"sticky_widget_enabled" boolean DEFAULT true,
  	"sticky_widget_position" "enum_widget_settings_sticky_widget_position" DEFAULT 'bottom-right',
  	"sticky_widget_triggers_delay_seconds" numeric DEFAULT 8,
  	"sticky_widget_triggers_scroll_percent" numeric DEFAULT 40,
  	"sticky_widget_dismissal_remember_for_hours" numeric DEFAULT 24,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  DO $$ BEGIN
   ALTER TABLE "admin_users_sessions" ADD CONSTRAINT "admin_users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "models_fuel_types" ADD CONSTRAINT "models_fuel_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "models_transmissions" ADD CONSTRAINT "models_transmissions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "models" ADD CONSTRAINT "models_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "models" ADD CONSTRAINT "models_body_type_id_body_types_id_fk" FOREIGN KEY ("body_type_id") REFERENCES "public"."body_types"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "model_versions" ADD CONSTRAINT "model_versions_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "vehicle_attributes" ADD CONSTRAINT "vehicle_attributes_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reviews_pros" ADD CONSTRAINT "reviews_pros_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reviews_cons" ADD CONSTRAINT "reviews_cons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reviews_gallery" ADD CONSTRAINT "reviews_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reviews" ADD CONSTRAINT "reviews_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_admin_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_admin_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "comparison_pairs" ADD CONSTRAINT "comparison_pairs_model_a_id_models_id_fk" FOREIGN KEY ("model_a_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "comparison_pairs" ADD CONSTRAINT "comparison_pairs_model_b_id_models_id_fk" FOREIGN KEY ("model_b_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "dealers_sessions" ADD CONSTRAINT "dealers_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "dealers_rels" ADD CONSTRAINT "dealers_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "dealers_rels" ADD CONSTRAINT "dealers_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "dealer_users" ADD CONSTRAINT "dealer_users_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "used_car_listings" ADD CONSTRAINT "used_car_listings_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "used_car_listings" ADD CONSTRAINT "used_car_listings_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "used_car_images" ADD CONSTRAINT "used_car_images_listing_id_used_car_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."used_car_listings"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "used_car_images" ADD CONSTRAINT "used_car_images_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "lead_requests_color_preferences" ADD CONSTRAINT "lead_requests_color_preferences_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lead_requests"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "lead_requests" ADD CONSTRAINT "lead_requests_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "lead_requests" ADD CONSTRAINT "lead_requests_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_lead_id_lead_requests_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."lead_requests"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "lead_assignments" ADD CONSTRAINT "lead_assignments_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "gdpr_requests" ADD CONSTRAINT "gdpr_requests_lead_request_id_lead_requests_id_fk" FOREIGN KEY ("lead_request_id") REFERENCES "public"."lead_requests"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "gdpr_requests" ADD CONSTRAINT "gdpr_requests_resolved_by_id_admin_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admin_users_fk" FOREIGN KEY ("admin_users_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_body_types_fk" FOREIGN KEY ("body_types_id") REFERENCES "public"."body_types"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_models_fk" FOREIGN KEY ("models_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_model_versions_fk" FOREIGN KEY ("model_versions_id") REFERENCES "public"."model_versions"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vehicle_attributes_fk" FOREIGN KEY ("vehicle_attributes_id") REFERENCES "public"."vehicle_attributes"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_comparison_pairs_fk" FOREIGN KEY ("comparison_pairs_id") REFERENCES "public"."comparison_pairs"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dealers_fk" FOREIGN KEY ("dealers_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dealer_users_fk" FOREIGN KEY ("dealer_users_id") REFERENCES "public"."dealer_users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_used_car_listings_fk" FOREIGN KEY ("used_car_listings_id") REFERENCES "public"."used_car_listings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_used_car_images_fk" FOREIGN KEY ("used_car_images_id") REFERENCES "public"."used_car_images"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lead_requests_fk" FOREIGN KEY ("lead_requests_id") REFERENCES "public"."lead_requests"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lead_assignments_fk" FOREIGN KEY ("lead_assignments_id") REFERENCES "public"."lead_assignments"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gdpr_requests_fk" FOREIGN KEY ("gdpr_requests_id") REFERENCES "public"."gdpr_requests"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_admin_users_fk" FOREIGN KEY ("admin_users_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_dealers_fk" FOREIGN KEY ("dealers_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "marketing_copy_value_props" ADD CONSTRAINT "marketing_copy_value_props_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_copy"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "marketing_copy_how_it_works" ADD CONSTRAINT "marketing_copy_how_it_works_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_copy"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "marketing_copy_testimonials" ADD CONSTRAINT "marketing_copy_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_copy"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "email_settings_templates" ADD CONSTRAINT "email_settings_templates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."email_settings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "widget_settings_sticky_widget_excluded_paths" ADD CONSTRAINT "widget_settings_sticky_widget_excluded_paths_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."widget_settings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "admin_users_sessions_order_idx" ON "admin_users_sessions" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "admin_users_sessions_parent_id_idx" ON "admin_users_sessions" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "admin_users_updated_at_idx" ON "admin_users" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "admin_users_created_at_idx" ON "admin_users" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_email_idx" ON "admin_users" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_feature_sizes_feature_filename_idx" ON "media" USING btree ("sizes_feature_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE UNIQUE INDEX IF NOT EXISTS "body_types_slug_idx" ON "body_types" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "body_types_updated_at_idx" ON "body_types" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "body_types_created_at_idx" ON "body_types" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "brands_slug_idx" ON "brands" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "brands_updated_at_idx" ON "brands" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "brands_created_at_idx" ON "brands" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "models_fuel_types_order_idx" ON "models_fuel_types" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "models_fuel_types_parent_idx" ON "models_fuel_types" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "models_transmissions_order_idx" ON "models_transmissions" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "models_transmissions_parent_idx" ON "models_transmissions" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "models_brand_idx" ON "models" USING btree ("brand_id");
  CREATE INDEX IF NOT EXISTS "models_body_type_idx" ON "models" USING btree ("body_type_id");
  CREATE INDEX IF NOT EXISTS "models_updated_at_idx" ON "models" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "models_created_at_idx" ON "models" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "model_versions_model_idx" ON "model_versions" USING btree ("model_id");
  CREATE INDEX IF NOT EXISTS "model_versions_updated_at_idx" ON "model_versions" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "model_versions_created_at_idx" ON "model_versions" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "vehicle_attributes_model_idx" ON "vehicle_attributes" USING btree ("model_id");
  CREATE INDEX IF NOT EXISTS "vehicle_attributes_updated_at_idx" ON "vehicle_attributes" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "vehicle_attributes_created_at_idx" ON "vehicle_attributes" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "reviews_pros_order_idx" ON "reviews_pros" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reviews_pros_parent_id_idx" ON "reviews_pros" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reviews_cons_order_idx" ON "reviews_cons" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reviews_cons_parent_id_idx" ON "reviews_cons" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "reviews_gallery_order_idx" ON "reviews_gallery" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "reviews_gallery_parent_id_idx" ON "reviews_gallery" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "reviews_slug_idx" ON "reviews" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "reviews_model_idx" ON "reviews" USING btree ("model_id");
  CREATE INDEX IF NOT EXISTS "reviews_author_idx" ON "reviews" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "articles_author_idx" ON "articles" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "comparison_pairs_slug_idx" ON "comparison_pairs" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "comparison_pairs_model_a_idx" ON "comparison_pairs" USING btree ("model_a_id");
  CREATE INDEX IF NOT EXISTS "comparison_pairs_model_b_idx" ON "comparison_pairs" USING btree ("model_b_id");
  CREATE INDEX IF NOT EXISTS "comparison_pairs_updated_at_idx" ON "comparison_pairs" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "comparison_pairs_created_at_idx" ON "comparison_pairs" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "dealers_sessions_order_idx" ON "dealers_sessions" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "dealers_sessions_parent_id_idx" ON "dealers_sessions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "dealers_slug_idx" ON "dealers" USING btree ("slug");
  CREATE UNIQUE INDEX IF NOT EXISTS "dealers_oib_idx" ON "dealers" USING btree ("oib");
  CREATE INDEX IF NOT EXISTS "dealers_updated_at_idx" ON "dealers" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "dealers_created_at_idx" ON "dealers" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "dealers_email_idx" ON "dealers" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "dealers_rels_order_idx" ON "dealers_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "dealers_rels_parent_idx" ON "dealers_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "dealers_rels_path_idx" ON "dealers_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "dealers_rels_brands_id_idx" ON "dealers_rels" USING btree ("brands_id");
  CREATE INDEX IF NOT EXISTS "dealer_users_dealer_idx" ON "dealer_users" USING btree ("dealer_id");
  CREATE INDEX IF NOT EXISTS "dealer_users_updated_at_idx" ON "dealer_users" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "dealer_users_created_at_idx" ON "dealer_users" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "used_car_listings_public_id_idx" ON "used_car_listings" USING btree ("public_id");
  CREATE INDEX IF NOT EXISTS "used_car_listings_model_idx" ON "used_car_listings" USING btree ("model_id");
  CREATE INDEX IF NOT EXISTS "used_car_listings_dealer_idx" ON "used_car_listings" USING btree ("dealer_id");
  CREATE INDEX IF NOT EXISTS "used_car_listings_updated_at_idx" ON "used_car_listings" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "used_car_listings_created_at_idx" ON "used_car_listings" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "used_car_images_listing_idx" ON "used_car_images" USING btree ("listing_id");
  CREATE INDEX IF NOT EXISTS "used_car_images_media_idx" ON "used_car_images" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "used_car_images_updated_at_idx" ON "used_car_images" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "used_car_images_created_at_idx" ON "used_car_images" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "lead_requests_color_preferences_order_idx" ON "lead_requests_color_preferences" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "lead_requests_color_preferences_parent_id_idx" ON "lead_requests_color_preferences" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "lead_requests_public_token_idx" ON "lead_requests" USING btree ("public_token");
  CREATE UNIQUE INDEX IF NOT EXISTS "lead_requests_display_id_idx" ON "lead_requests" USING btree ("display_id");
  CREATE INDEX IF NOT EXISTS "lead_requests_brand_idx" ON "lead_requests" USING btree ("brand_id");
  CREATE INDEX IF NOT EXISTS "lead_requests_model_idx" ON "lead_requests" USING btree ("model_id");
  CREATE INDEX IF NOT EXISTS "lead_requests_updated_at_idx" ON "lead_requests" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "lead_requests_created_at_idx" ON "lead_requests" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "lead_assignments_lead_idx" ON "lead_assignments" USING btree ("lead_id");
  CREATE INDEX IF NOT EXISTS "lead_assignments_dealer_idx" ON "lead_assignments" USING btree ("dealer_id");
  CREATE INDEX IF NOT EXISTS "lead_assignments_updated_at_idx" ON "lead_assignments" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "lead_assignments_created_at_idx" ON "lead_assignments" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "gdpr_requests_display_id_idx" ON "gdpr_requests" USING btree ("display_id");
  CREATE INDEX IF NOT EXISTS "gdpr_requests_lead_request_idx" ON "gdpr_requests" USING btree ("lead_request_id");
  CREATE INDEX IF NOT EXISTS "gdpr_requests_resolved_by_idx" ON "gdpr_requests" USING btree ("resolved_by_id");
  CREATE INDEX IF NOT EXISTS "gdpr_requests_updated_at_idx" ON "gdpr_requests" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "gdpr_requests_created_at_idx" ON "gdpr_requests" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_admin_users_id_idx" ON "payload_locked_documents_rels" USING btree ("admin_users_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_body_types_id_idx" ON "payload_locked_documents_rels" USING btree ("body_types_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_brands_id_idx" ON "payload_locked_documents_rels" USING btree ("brands_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_models_id_idx" ON "payload_locked_documents_rels" USING btree ("models_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_model_versions_id_idx" ON "payload_locked_documents_rels" USING btree ("model_versions_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_vehicle_attributes_id_idx" ON "payload_locked_documents_rels" USING btree ("vehicle_attributes_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_comparison_pairs_id_idx" ON "payload_locked_documents_rels" USING btree ("comparison_pairs_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_dealers_id_idx" ON "payload_locked_documents_rels" USING btree ("dealers_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_dealer_users_id_idx" ON "payload_locked_documents_rels" USING btree ("dealer_users_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_used_car_listings_id_idx" ON "payload_locked_documents_rels" USING btree ("used_car_listings_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_used_car_images_id_idx" ON "payload_locked_documents_rels" USING btree ("used_car_images_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_lead_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("lead_requests_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_lead_assignments_id_idx" ON "payload_locked_documents_rels" USING btree ("lead_assignments_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_gdpr_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("gdpr_requests_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_admin_users_id_idx" ON "payload_preferences_rels" USING btree ("admin_users_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_dealers_id_idx" ON "payload_preferences_rels" USING btree ("dealers_id");
  CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "marketing_copy_value_props_order_idx" ON "marketing_copy_value_props" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "marketing_copy_value_props_parent_id_idx" ON "marketing_copy_value_props" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "marketing_copy_how_it_works_order_idx" ON "marketing_copy_how_it_works" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "marketing_copy_how_it_works_parent_id_idx" ON "marketing_copy_how_it_works" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "marketing_copy_testimonials_order_idx" ON "marketing_copy_testimonials" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "marketing_copy_testimonials_parent_id_idx" ON "marketing_copy_testimonials" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "email_settings_templates_order_idx" ON "email_settings_templates" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "email_settings_templates_parent_id_idx" ON "email_settings_templates" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "widget_settings_sticky_widget_excluded_paths_order_idx" ON "widget_settings_sticky_widget_excluded_paths" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "widget_settings_sticky_widget_excluded_paths_parent_id_idx" ON "widget_settings_sticky_widget_excluded_paths" USING btree ("_parent_id");`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "admin_users_sessions" CASCADE;
  DROP TABLE "admin_users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "body_types" CASCADE;
  DROP TABLE "brands" CASCADE;
  DROP TABLE "models_fuel_types" CASCADE;
  DROP TABLE "models_transmissions" CASCADE;
  DROP TABLE "models" CASCADE;
  DROP TABLE "model_versions" CASCADE;
  DROP TABLE "vehicle_attributes" CASCADE;
  DROP TABLE "reviews_pros" CASCADE;
  DROP TABLE "reviews_cons" CASCADE;
  DROP TABLE "reviews_gallery" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "comparison_pairs" CASCADE;
  DROP TABLE "dealers_sessions" CASCADE;
  DROP TABLE "dealers" CASCADE;
  DROP TABLE "dealers_rels" CASCADE;
  DROP TABLE "dealer_users" CASCADE;
  DROP TABLE "used_car_listings" CASCADE;
  DROP TABLE "used_car_images" CASCADE;
  DROP TABLE "lead_requests_color_preferences" CASCADE;
  DROP TABLE "lead_requests" CASCADE;
  DROP TABLE "lead_assignments" CASCADE;
  DROP TABLE "gdpr_requests" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "settings" CASCADE;
  DROP TABLE "marketing_copy_value_props" CASCADE;
  DROP TABLE "marketing_copy_how_it_works" CASCADE;
  DROP TABLE "marketing_copy_testimonials" CASCADE;
  DROP TABLE "marketing_copy" CASCADE;
  DROP TABLE "email_settings_templates" CASCADE;
  DROP TABLE "email_settings" CASCADE;
  DROP TABLE "lead_distribution" CASCADE;
  DROP TABLE "leasing_defaults" CASCADE;
  DROP TABLE "widget_settings_sticky_widget_excluded_paths" CASCADE;
  DROP TABLE "widget_settings" CASCADE;
  DROP TYPE "public"."enum_admin_users_role";
  DROP TYPE "public"."enum_media_source";
  DROP TYPE "public"."enum_models_fuel_types";
  DROP TYPE "public"."enum_models_transmissions";
  DROP TYPE "public"."enum_models_segment";
  DROP TYPE "public"."enum_model_versions_engine_type";
  DROP TYPE "public"."enum_model_versions_transmission";
  DROP TYPE "public"."enum_articles_category_slug";
  DROP TYPE "public"."enum_dealer_users_role";
  DROP TYPE "public"."enum_used_car_listings_condition";
  DROP TYPE "public"."enum_used_car_listings_status";
  DROP TYPE "public"."enum_lead_requests_preferred_contact_method";
  DROP TYPE "public"."enum_lead_requests_request_type";
  DROP TYPE "public"."enum_lead_requests_financing_type";
  DROP TYPE "public"."enum_lead_requests_time_frame";
  DROP TYPE "public"."enum_lead_requests_trade_in_data_condition";
  DROP TYPE "public"."enum_lead_requests_source";
  DROP TYPE "public"."enum_lead_requests_status";
  DROP TYPE "public"."enum_lead_assignments_status";
  DROP TYPE "public"."enum_lead_assignments_outcome";
  DROP TYPE "public"."enum_gdpr_requests_request_type";
  DROP TYPE "public"."enum_gdpr_requests_status";
  DROP TYPE "public"."enum_email_settings_templates_key";
  DROP TYPE "public"."enum_widget_settings_sticky_widget_position";`);
}
