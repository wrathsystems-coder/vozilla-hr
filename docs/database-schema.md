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

## Payload globals

Singleton config držan u DB-u, izložen kroz Payload admin za runtime override.

