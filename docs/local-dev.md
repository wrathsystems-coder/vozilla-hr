# Local development

## Prerequisites

- Node 22 (`.nvmrc` provided — `nvm use` if you have nvm)
- pnpm 9.15.0 (`corepack enable && corepack use pnpm@9.15.0`)
- Docker (for local Postgres via `docker-compose.yml`)

## First-time setup

```bash
git clone https://github.com/wrathsystems-coder/vozilla-hr.git
cd vozilla-hr
nvm use            # if using nvm
pnpm install
docker compose up -d
cp .env.example .env.local
# Edit .env.local:
#   DATABASE_URL=postgresql://vozilla:vozilla@localhost:5432/vozilla_hr_dev
#   PAYLOAD_SECRET=<32+ random characters>
pnpm dev
```

Open <http://localhost:3000> for the public site, <http://localhost:3000/admin>
for Payload admin (first visit prompts you to create the super-admin account).

## Common commands

| Command                       | What it does                              |
| ----------------------------- | ----------------------------------------- |
| `pnpm dev`                    | Next + Payload dev server                 |
| `pnpm build`                  | Production build (runs placeholder check) |
| `pnpm start`                  | Run production build locally              |
| `pnpm lint`                   | ESLint via Next                           |
| `pnpm type-check`             | TS without emit                           |
| `pnpm test`                   | Vitest unit + integration                 |
| `pnpm test:watch`             | Vitest watch mode                         |
| `pnpm placeholders:check`     | Scan repo for XXX\_ placeholders          |
| `pnpm db:generate`            | Generate Drizzle migration                |
| `pnpm db:migrate`             | Apply Drizzle migrations                  |
| `pnpm db:studio`              | Drizzle Studio (DB GUI)                   |
| `pnpm payload generate:types` | Regenerate Payload TS types               |

## Running migrations

```bash
docker compose up -d                  # ensure Postgres is up
pnpm db:generate                      # creates SQL migration in lib/db/migrations
pnpm db:migrate                       # applies pending migrations
pnpm payload migrate                  # Payload-specific migrations (Sprint 1+)
```

## Running tests

```bash
pnpm test                             # all unit/integration
pnpm test:watch                       # watch mode
pnpm --filter web exec vitest run apps/web/tests/unit/slug.test.ts  # single file
```

## TODO

- [ ] Document common errors and fixes
- [ ] Document recommended VS Code extensions
- [ ] Document how to reset local DB (drop volume + re-migrate + re-seed)
