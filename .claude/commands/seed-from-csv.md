---
description: Import a CSV seed file into the database
argument-hint: <file> (e.g. /seed-from-csv seeds/vehicles.csv)
---

# /seed-from-csv

Import a CSV file into the database with idempotent UPSERT:

1. Validate CSV format (header match, required fields present)
2. Parse and validate each row against the target schema
3. UPSERT into the relevant table
4. Report: X created, Y updated, Z errors with row numbers
5. Add an `audit_log` entry summarizing the import

CSV templates live in `seeds/`. Importer scripts are in `apps/web/scripts/seed-*.ts`.
