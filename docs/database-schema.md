# Database schema — vozilla.hr

> Auto-generated from Drizzle schema (`apps/web/lib/db/schema/`) and Payload config. Run `pnpm generate:docs` to refresh.

## Drizzle raw tables

Operacijske tablice managed by Drizzle ORM. Migracije u `apps/web/lib/db/migrations/`.

### `audit_log`

| Column | Type | Constraints |
|---|---|---|
| `id` | serial | PK, default |
| `actor_type` | enumcolumn | NOT NULL |
| `actor_id` | text | — |
| `action` | text | NOT NULL |
| `entity_type` | text | — |
| `entity_id` | text | — |
| `before` | jsonb | — |
| `after` | jsonb | — |
| `ip_address` | text | — |
| `timestamp` | timestamp | NOT NULL, default |

**Indexes:**

- `audit_log_action_idx` on (action)
- `audit_log_entity_idx` on (entity_type, entity_id)
- `audit_log_timestamp_idx` on (timestamp)

### `consent_log`

| Column | Type | Constraints |
|---|---|---|
| `id` | serial | PK, default |
| `customer_email` | text | NOT NULL |
| `consent_type` | enumcolumn | NOT NULL |
| `granted` | boolean | NOT NULL |
| `source_form` | text | NOT NULL |
| `ip_address` | text | — |
| `user_agent` | text | — |
| `timestamp` | timestamp | NOT NULL, default |

**Indexes:**

- `consent_log_email_idx` on (customer_email)
- `consent_log_timestamp_idx` on (timestamp)

### `counties`

| Column | Type | Constraints |
|---|---|---|
| `id` | serial | PK, default |
| `slug` | text | NOT NULL, UNIQUE |
| `name` | text | NOT NULL |
| `sort_order` | integer | NOT NULL, default |

### `email_log`

| Column | Type | Constraints |
|---|---|---|
| `id` | serial | PK, default |
| `template_name` | text | NOT NULL |
| `recipient_email` | text | NOT NULL |
| `subject` | text | NOT NULL |
| `payload` | jsonb | — |
| `status` | enumcolumn | NOT NULL, default |
| `provider_message_id` | text | — |
| `error_message` | text | — |
| `sent_at` | timestamp | — |
| `created_at` | timestamp | NOT NULL, default |

**Indexes:**

- `email_log_recipient_idx` on (recipient_email)
- `email_log_template_idx` on (template_name)
- `email_log_status_idx` on (status)

### `idempotency_keys`

| Column | Type | Constraints |
|---|---|---|
| `id` | serial | PK, default |
| `key` | text | NOT NULL |
| `endpoint` | text | NOT NULL |
| `response_status` | integer | NOT NULL |
| `response_body` | jsonb | — |
| `created_at` | timestamp | NOT NULL, default |
| `expires_at` | timestamp | NOT NULL |

**Indexes:**

- `idempotency_keys_key_endpoint_idx` on (key, endpoint)
- `idempotency_keys_expires_idx` on (expires_at)

### `magic_link_tokens`

| Column | Type | Constraints |
|---|---|---|
| `id` | serial | PK, default |
| `token` | text | NOT NULL, UNIQUE |
| `purpose` | enumcolumn | NOT NULL |
| `related_entity_type` | text | — |
| `related_entity_id` | text | — |
| `expires_at` | timestamp | NOT NULL |
| `used_at` | timestamp | — |
| `created_at` | timestamp | NOT NULL, default |

**Indexes:**

- `magic_link_tokens_expires_idx` on (expires_at)
- `magic_link_tokens_purpose_idx` on (purpose)

### `newsletter_subscribers`

| Column | Type | Constraints |
|---|---|---|
| `id` | serial | PK, default |
| `email` | text | NOT NULL, UNIQUE |
| `status` | enumcolumn | NOT NULL, default |
| `confirmation_token` | text | — |
| `confirmed_at` | timestamp | — |
| `unsubscribed_at` | timestamp | — |
| `source_form` | text | — |
| `ip_address` | text | — |
| `created_at` | timestamp | NOT NULL, default |
| `updated_at` | timestamp | NOT NULL, default |

### `quiz_results`

| Column | Type | Constraints |
|---|---|---|
| `id` | serial | PK, default |
| `token` | text | NOT NULL, UNIQUE |
| `answers` | jsonb | NOT NULL |
| `recommended_models` | jsonb | — |
| `customer_email` | text | — |
| `expires_at` | timestamp | NOT NULL |
| `created_at` | timestamp | NOT NULL, default |

**Indexes:**

- `quiz_results_expires_idx` on (expires_at)

### `rate_limit_buckets`

| Column | Type | Constraints |
|---|---|---|
| `id` | serial | PK, default |
| `key` | text | NOT NULL |
| `endpoint` | text | NOT NULL |
| `count` | integer | NOT NULL, default |
| `window_start_at` | timestamp | NOT NULL |
| `expires_at` | timestamp | NOT NULL |

**Indexes:**

- `rate_limit_buckets_key_endpoint_idx` on (key, endpoint)
- `rate_limit_buckets_expires_idx` on (expires_at)

## Payload collections

Content + entiteti managed by Payload CMS 3. Tablice se kreiraju kroz Payload migracije (`apps/web/migrations/`).

### `admin_users`

**Auth collection** — login enabled.

| Field | Type | Required |
|---|---|---|
| `name` | text | ✓ |
| `role` | select | ✓ |
| `two_factor_enabled` | checkbox |  |
| `last_login_at` | date |  |
| `last_login_ip` | text |  |
| `is_active` | checkbox |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |
| `email` | email | ✓ |
| `resetPasswordToken` | text |  |
| `resetPasswordExpiration` | date |  |
| `salt` | text |  |
| `hash` | text |  |
| `loginAttempts` | number |  |
| `lockUntil` | date |  |
| `sessions[]` | array |  |
| `sessions[].id` | text | ✓ |
| `sessions[].createdAt` | date |  |
| `sessions[].expiresAt` | date | ✓ |

### `media`

**Upload collection** — file uploads enabled.

| Field | Type | Required |
|---|---|---|
| `alt` | text | ✓ |
| `source` | select | ✓ |
| `credit_text` | text |  |
| `license_url` | text |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |
| `url` | text |  |
| `thumbnailURL` | text |  |
| `filename` | text |  |
| `mimeType` | text |  |
| `filesize` | number |  |
| `width` | number |  |
| `height` | number |  |
| `focalX` | number |  |
| `focalY` | number |  |
| `sizes.thumbnail.url` | text |  |
| `sizes.thumbnail.width` | number |  |
| `sizes.thumbnail.height` | number |  |
| `sizes.thumbnail.mimeType` | text |  |
| `sizes.thumbnail.filesize` | number |  |
| `sizes.thumbnail.filename` | text |  |
| `sizes.card.url` | text |  |
| `sizes.card.width` | number |  |
| `sizes.card.height` | number |  |
| `sizes.card.mimeType` | text |  |
| `sizes.card.filesize` | number |  |
| `sizes.card.filename` | text |  |
| `sizes.feature.url` | text |  |
| `sizes.feature.width` | number |  |
| `sizes.feature.height` | number |  |
| `sizes.feature.mimeType` | text |  |
| `sizes.feature.filesize` | number |  |
| `sizes.feature.filename` | text |  |
| `sizes.hero.url` | text |  |
| `sizes.hero.width` | number |  |
| `sizes.hero.height` | number |  |
| `sizes.hero.mimeType` | text |  |
| `sizes.hero.filesize` | number |  |
| `sizes.hero.filename` | text |  |

### `body_types`

| Field | Type | Required |
|---|---|---|
| `slug` | text | ✓ |
| `name` | text | ✓ |
| `description` | textarea |  |
| `icon_svg_path` | text |  |
| `sort_order` | number |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `brands`

| Field | Type | Required |
|---|---|---|
| `slug` | text | ✓ |
| `name` | text | ✓ |
| `country_origin` | text |  |
| `founded_year` | number |  |
| `logo_path` | text |  |
| `hero_image_path` | text |  |
| `description_md` | textarea |  |
| `is_active` | checkbox |  |
| `sort_order` | number |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `models`

| Field | Type | Required |
|---|---|---|
| `brand` | relationship | ✓ |
| `slug` | text | ✓ |
| `name` | text | ✓ |
| `body_type` | relationship | ✓ |
| `segment` | select |  |
| `generation` | text |  |
| `year_from` | number |  |
| `year_to` | number |  |
| `base_price_eur` | number |  |
| `fuel_types` | select |  |
| `transmissions` | select |  |
| `description_md` | textarea |  |
| `hero_image_path` | text |  |
| `is_active` | checkbox |  |
| `sort_order` | number |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `model_versions`

| Field | Type | Required |
|---|---|---|
| `model` | relationship | ✓ |
| `name` | text | ✓ |
| `engine_type` | select |  |
| `engine_displacement_cc` | number |  |
| `power_kw` | number |  |
| `power_hp` | number |  |
| `transmission` | select |  |
| `fuel_consumption_combined_l` | number |  |
| `co2_emission_g_km` | number |  |
| `price_eur` | number |  |
| `year` | number |  |
| `is_current` | checkbox |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `vehicle_attributes`

| Field | Type | Required |
|---|---|---|
| `model` | relationship | ✓ |
| `attr_key` | text | ✓ |
| `attr_value` | text | ✓ |
| `attr_unit` | text |  |
| `display_order` | number |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `reviews`

| Field | Type | Required |
|---|---|---|
| `slug` | text | ✓ |
| `title` | text | ✓ |
| `model` | relationship |  |
| `author` | relationship |  |
| `content` | richText |  |
| `scores.overall` | number |  |
| `scores.design` | number |  |
| `scores.comfort` | number |  |
| `scores.drive` | number |  |
| `scores.economy` | number |  |
| `scores.value` | number |  |
| `pros[]` | array |  |
| `pros[].text` | text | ✓ |
| `pros[].id` | text |  |
| `cons[]` | array |  |
| `cons[].text` | text | ✓ |
| `cons[].id` | text |  |
| `hero_image_path` | text |  |
| `gallery[]` | array |  |
| `gallery[].image_path` | text | ✓ |
| `gallery[].alt` | text | ✓ |
| `gallery[].caption` | text |  |
| `gallery[].id` | text |  |
| `seo.title` | text |  |
| `seo.description` | textarea |  |
| `seo.og_image_path` | text |  |
| `is_published` | checkbox |  |
| `published_at` | date |  |
| `view_count` | number |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `articles`

| Field | Type | Required |
|---|---|---|
| `slug` | text | ✓ |
| `title` | text | ✓ |
| `category_slug` | select |  |
| `author` | relationship |  |
| `excerpt` | textarea |  |
| `content` | richText |  |
| `hero_image_path` | text |  |
| `seo.title` | text |  |
| `seo.description` | textarea |  |
| `seo.og_image_path` | text |  |
| `is_published` | checkbox |  |
| `published_at` | date |  |
| `view_count` | number |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `pages`

| Field | Type | Required |
|---|---|---|
| `slug` | text | ✓ |
| `title` | text | ✓ |
| `content` | richText |  |
| `seo.title` | text |  |
| `seo.description` | textarea |  |
| `seo.og_image_path` | text |  |
| `is_published` | checkbox |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `comparison_pairs`

| Field | Type | Required |
|---|---|---|
| `slug` | text | ✓ |
| `title` | text | ✓ |
| `model_a` | relationship | ✓ |
| `model_b` | relationship | ✓ |
| `content` | richText |  |
| `seo.title` | text |  |
| `seo.description` | textarea |  |
| `seo.og_image_path` | text |  |
| `is_published` | checkbox |  |
| `sort_order` | number |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `dealers`

**Auth collection** — login enabled.

| Field | Type | Required |
|---|---|---|
| `slug` | text | ✓ |
| `legal_name` | text | ✓ |
| `oib` | text | ✓ |
| `phone` | text | ✓ |
| `address.street` | text | ✓ |
| `address.city` | text | ✓ |
| `address.postcode` | text | ✓ |
| `address.county_id` | number | ✓ |
| `address.lat` | number |  |
| `address.lng` | number |  |
| `brands` | relationship |  |
| `scoring.monthly_lead_cap` | number |  |
| `scoring.current_month_leads` | number |  |
| `scoring.avg_rating` | number |  |
| `scoring.avg_response_time_hours` | number |  |
| `scoring.conversion_rate` | number |  |
| `scoring.throttle_factor` | number |  |
| `is_active` | checkbox |  |
| `is_verified` | checkbox |  |
| `is_demo` | checkbox |  |
| `suspended_reason` | text |  |
| `last_login_at` | date |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |
| `email` | email | ✓ |
| `resetPasswordToken` | text |  |
| `resetPasswordExpiration` | date |  |
| `salt` | text |  |
| `hash` | text |  |
| `loginAttempts` | number |  |
| `lockUntil` | date |  |
| `sessions[]` | array |  |
| `sessions[].id` | text | ✓ |
| `sessions[].createdAt` | date |  |
| `sessions[].expiresAt` | date | ✓ |

### `dealer_users`

| Field | Type | Required |
|---|---|---|
| `dealer` | relationship | ✓ |
| `name` | text | ✓ |
| `email` | email | ✓ |
| `phone` | text |  |
| `role` | select | ✓ |
| `is_active` | checkbox |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `used_car_listings`

| Field | Type | Required |
|---|---|---|
| `public_id` | text | ✓ |
| `model` | relationship | ✓ |
| `dealer` | relationship |  |
| `private_seller_data.name` | text |  |
| `private_seller_data.phone` | text |  |
| `private_seller_data.email` | email |  |
| `private_seller_data.city` | text |  |
| `year` | number | ✓ |
| `mileage_km` | number | ✓ |
| `price_eur` | number | ✓ |
| `color` | text |  |
| `vin` | text |  |
| `condition` | select | ✓ |
| `description_md` | textarea |  |
| `location.county_id` | number | ✓ |
| `location.city` | text | ✓ |
| `status` | select | ✓ |
| `sold_at` | date |  |
| `expires_at` | date |  |
| `view_count` | number |  |
| `is_demo` | checkbox |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `used_car_images`

| Field | Type | Required |
|---|---|---|
| `listing` | relationship | ✓ |
| `media` | relationship | ✓ |
| `is_hero` | checkbox |  |
| `sort_order` | number |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `lead_requests`

| Field | Type | Required |
|---|---|---|
| `public_token` | text | ✓ |
| `display_id` | text | ✓ |
| `customer_name` | text | ✓ |
| `customer_email` | email | ✓ |
| `customer_phone` | text | ✓ |
| `customer_county_id` | number | ✓ |
| `customer_postcode` | text | ✓ |
| `preferred_contact_method` | select |  |
| `best_contact_time` | text |  |
| `request_type` | select | ✓ |
| `brand` | relationship |  |
| `model` | relationship |  |
| `version_text` | text |  |
| `year_from` | number |  |
| `year_to` | number |  |
| `color_preferences[]` | array |  |
| `color_preferences[].color` | text |  |
| `color_preferences[].id` | text |  |
| `comments` | textarea |  |
| `price_min` | number |  |
| `price_max` | number |  |
| `financing_type` | select |  |
| `leasing_type` | select |  |
| `deposit` | number |  |
| `period_months` | number |  |
| `time_frame` | select |  |
| `has_trade_in` | checkbox |  |
| `trade_in_data.brand` | text |  |
| `trade_in_data.model` | text |  |
| `trade_in_data.year` | number |  |
| `trade_in_data.mileage_km` | number |  |
| `trade_in_data.condition` | select |  |
| `trade_in_data.estimated_value_eur` | number |  |
| `gdpr_consent_at` | date | ✓ |
| `marketing_consent` | checkbox |  |
| `source` | select |  |
| `recaptcha_score` | number |  |
| `recaptcha_action` | text |  |
| `ip_address` | text |  |
| `user_agent` | text |  |
| `status` | select | ✓ |
| `internal_notes` | textarea |  |
| `customer_feedback_emails.disabled` | checkbox |  |
| `customer_feedback_emails.day3_sent_at` | date |  |
| `customer_feedback_emails.day14_sent_at` | date |  |
| `customer_feedback_emails.day30_sent_at` | date |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `lead_assignments`

| Field | Type | Required |
|---|---|---|
| `lead` | relationship | ✓ |
| `dealer` | relationship | ✓ |
| `quality_score_at_dispatch` | number |  |
| `status` | select | ✓ |
| `sent_at` | date |  |
| `viewed_at` | date |  |
| `contacted_at` | date |  |
| `closed_at` | date |  |
| `outcome` | select |  |
| `outcome_reason` | textarea |  |
| `dealer_notes` | textarea |  |
| `customer_feedback.marked_interested` | checkbox |  |
| `customer_feedback.marked_not_interested` | checkbox |  |
| `customer_feedback.rating_for_dealer` | number |  |
| `customer_feedback.feedback_text` | textarea |  |
| `reminders.first_reminder_sent_at` | date |  |
| `reminders.second_reminder_sent_at` | date |  |
| `reminders.expired_no_response` | checkbox |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `gdpr_requests`

| Field | Type | Required |
|---|---|---|
| `display_id` | text | ✓ |
| `customer_email` | email | ✓ |
| `customer_name` | text | ✓ |
| `customer_oib` | text |  |
| `request_type` | select | ✓ |
| `lead_request` | relationship |  |
| `description` | textarea |  |
| `status` | select | ✓ |
| `admin_notes` | textarea |  |
| `resolved_at` | date |  |
| `resolved_by` | relationship |  |
| `ip_address` | text |  |
| `recaptcha_score` | number |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `payload-kv`

| Field | Type | Required |
|---|---|---|
| `key` | text | ✓ |
| `data` | json | ✓ |

### `payload-locked-documents`

| Field | Type | Required |
|---|---|---|
| `document` | relationship |  |
| `globalSlug` | text |  |
| `user` | relationship | ✓ |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `payload-preferences`

| Field | Type | Required |
|---|---|---|
| `user` | relationship | ✓ |
| `key` | text |  |
| `value` | json |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

### `payload-migrations`

| Field | Type | Required |
|---|---|---|
| `name` | text |  |
| `batch` | number |  |
| `updatedAt` | date |  |
| `createdAt` | date |  |

## Payload globals

Singleton config držan u DB-u, izložen kroz Payload admin za runtime override.

### `settings`

| Field | Type |
|---|---|
| `brand.site_name` | text |
| `brand.tagline` | text |
| `brand.logo_path` | text |
| `brand.logo_dark_path` | text |
| `brand.favicon_path` | text |
| `contact.email_general` | email |
| `contact.email_dpo` | email |
| `contact.email_dealers` | email |
| `contact.phone` | text |
| `contact.address_line` | text |
| `social.facebook_url` | text |
| `social.instagram_url` | text |
| `social.linkedin_url` | text |
| `social.youtube_url` | text |
| `seo_defaults.title_template` | text |
| `seo_defaults.description` | textarea |
| `seo_defaults.og_image_path` | text |
| `updatedAt` | date |
| `createdAt` | date |

### `marketing_copy`

| Field | Type |
|---|---|
| `hero.headline` | text |
| `hero.subheadline` | text |
| `hero.primary_cta_label` | text |
| `hero.primary_cta_href` | text |
| `hero.hero_image_path` | text |
| `value_props[]` | array |
| `value_props[].title` | text |
| `value_props[].description` | textarea |
| `value_props[].icon_name` | text |
| `value_props[].id` | text |
| `how_it_works[]` | array |
| `how_it_works[].step_number` | number |
| `how_it_works[].title` | text |
| `how_it_works[].description` | textarea |
| `how_it_works[].id` | text |
| `testimonials[]` | array |
| `testimonials[].quote` | textarea |
| `testimonials[].author_name` | text |
| `testimonials[].author_role` | text |
| `testimonials[].id` | text |
| `updatedAt` | date |
| `createdAt` | date |

### `email_settings`

| Field | Type |
|---|---|
| `from_email` | email |
| `reply_to` | email |
| `templates[]` | array |
| `templates[].key` | select |
| `templates[].enabled` | checkbox |
| `templates[].subject_override` | text |
| `templates[].id` | text |
| `updatedAt` | date |
| `createdAt` | date |

### `lead_distribution`

| Field | Type |
|---|---|
| `weights.w_response` | number |
| `weights.w_conversion` | number |
| `weights.w_rating` | number |
| `weights.w_capacity` | number |
| `rules.closest_dealer_always_included` | checkbox |
| `rules.max_dealers_per_lead` | number |
| `rules.default_dealers_per_lead` | number |
| `rules.min_dealers_per_lead` | number |
| `throttling.max_leads_per_dealer_per_day` | number |
| `throttling.max_leads_per_dealer_per_week` | number |
| `reminders.first_reminder_hours` | number |
| `reminders.second_reminder_hours` | number |
| `reminders.expire_no_response_hours` | number |
| `score_thresholds.warn_below` | number |
| `score_thresholds.suspend_below` | number |
| `updatedAt` | date |
| `createdAt` | date |

### `leasing_defaults`

| Field | Type |
|---|---|
| `interest_rates.default_rate_percent` | number |
| `interest_rates.min_rate_percent` | number |
| `interest_rates.max_rate_percent` | number |
| `term_months.default` | number |
| `term_months.min` | number |
| `term_months.max` | number |
| `deposit_percent.default` | number |
| `deposit_percent.min` | number |
| `deposit_percent.max` | number |
| `residual_value_percent.default` | number |
| `disclaimer` | textarea |
| `updatedAt` | date |
| `createdAt` | date |

### `widget_settings`

| Field | Type |
|---|---|
| `sticky_widget.enabled` | checkbox |
| `sticky_widget.position` | select |
| `sticky_widget.triggers.delay_seconds` | number |
| `sticky_widget.triggers.scroll_percent` | number |
| `sticky_widget.dismissal.remember_for_hours` | number |
| `sticky_widget.excluded_paths[]` | array |
| `sticky_widget.excluded_paths[].path` | text |
| `sticky_widget.excluded_paths[].id` | text |
| `updatedAt` | date |
| `createdAt` | date |

