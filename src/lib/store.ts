import { promises as fs } from "fs";
import path from "path";
import { isDbConfigured, kvGet, kvSet } from "./db";

/**
 * JSON store with two backends:
 * - Postgres KV table when POSTGRES_URL/DATABASE_URL is set (durable —
 *   required on serverless hosts like Vercel where the filesystem is
 *   ephemeral and per-instance).
 * - Local data/*.json files with in-memory fallback otherwise (dev / self-host).
 *
 * Callers are backend-agnostic: same readJson/writeJson API. Any Postgres
 * failure falls back to the file store so a DB outage never hard-crashes
 * a request (it just risks ephemeral data until the DB recovers).
 */
const mem = new Map<string, unknown>();

function filePath(file: string) {
  return path.join(process.cwd(), "data", file);
}

async function readFileStore<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath(file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return (mem.get(file) as T) ?? fallback;
  }
}

async function writeFileStore(file: string, value: unknown): Promise<void> {
  mem.set(file, value);
  try {
    await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
    await fs.writeFile(filePath(file), JSON.stringify(value, null, 2), "utf8");
  } catch {
    // read-only FS (serverless) — memory fallback keeps it working per-instance
  }
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  if (isDbConfigured()) {
    try {
      const v = await kvGet(`json:${file}`);
      if (v !== undefined) return v as T;
    } catch {
      /* fall through to file store */
    }
  }
  return readFileStore(file, fallback);
}

export async function writeJson(file: string, value: unknown): Promise<void> {
  if (isDbConfigured()) {
    try {
      await kvSet(`json:${file}`, value);
      return;
    } catch {
      /* fall through to file store */
    }
  }
  await writeFileStore(file, value);
}
