/**
 * Server-only: Postgres connection for durable storage on serverless hosts.
 * Never import from Client Components.
 *
 * Background: Vercel Postgres was discontinued (moved to Neon, Dec 2024) —
 * new projects install a Postgres integration (Neon/Supabase) from the
 * Vercel Marketplace, which injects a pooled connection string. This module
 * accepts any Postgres URL via POSTGRES_URL (preferred) or DATABASE_URL,
 * so it works with Neon, Supabase (pooler), or self-hosted Postgres.
 *
 * Use the POOLED connection string (Neon `-pooler` host / Supabase port
 * 6543) — serverless functions must not hold direct connections.
 */
import postgres from "postgres";

let client: postgres.Sql | null = null;
let schemaReady: Promise<void> | null = null;

export function dbUrl(): string {
  return (process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "").trim();
}

export function isDbConfigured(): boolean {
  return dbUrl().length > 0;
}

function getClient(): postgres.Sql {
  if (!client) {
    client = postgres(dbUrl(), {
      max: 1, // serverless: one pooled connection per instance
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return client;
}

/** Creates the single KV table (idempotent; runs once per instance). */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getClient();
      await sql`
        CREATE TABLE IF NOT EXISTS bornolab_kv (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })().catch((e) => {
      schemaReady = null; // retry next call instead of caching failure
      throw e;
    });
  }
  return schemaReady;
}

export async function kvGet(key: string): Promise<unknown | undefined> {
  await ensureSchema();
  const rows = await getClient()`SELECT value FROM bornolab_kv WHERE key = ${key} LIMIT 1`;
  if (rows.length === 0) return undefined;
  const raw = (rows[0] as { value: unknown }).value;
  // The driver may hand back jsonb as text — normalize to a value so
  // callers always receive parsed JSON (arrays stay arrays).
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return undefined;
    }
  }
  return raw;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await ensureSchema();
  const payload = JSON.stringify(value ?? null);
  await getClient()`
    INSERT INTO bornolab_kv (key, value, updated_at)
    VALUES (${key}, ${payload}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `;
}
