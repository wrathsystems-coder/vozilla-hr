import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL nije postavljen. Pokreni `docker compose up -d` i kopiraj .env.example u .env.local.",
    );
  }

  // `prepare: false` is required when connecting through Supabase's transaction
  // pooler (pgbouncer) and harmless on direct connections.
  _client = postgres(connectionString, { prepare: false });
  _db = drizzle(_client, { schema });
  return _db;
}

export type Database = ReturnType<typeof getDb>;
