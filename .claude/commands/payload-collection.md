---
description: Scaffold a new Payload collection with project defaults
argument-hint: <name> (e.g. /payload-collection Brands)
---

# /payload-collection

Create a new Payload collection following project conventions:

1. Schema in `apps/web/payload/collections/{name}.ts`
2. Default access control (admin-only in Sprint 1; relax later as needed)
3. Hooks for `audit_log` entries on create / update / delete
4. Update `apps/web/payload/payload.config.ts` to include the new collection
5. Run `pnpm payload generate:types` to regenerate `payload-types.ts`
6. Run `pnpm db:generate && pnpm db:migrate` if the Drizzle schema needs to follow
