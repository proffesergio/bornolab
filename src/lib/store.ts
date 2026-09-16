import { promises as fs } from "fs";
import path from "path";

/** Tiny JSON store: file-backed with in-memory fallback (serverless-safe). */
const mem = new Map<string, unknown>();

function filePath(file: string) {
  return path.join(process.cwd(), "data", file);
}

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath(file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return (mem.get(file) as T) ?? fallback;
  }
}

export async function writeJson(file: string, value: unknown): Promise<void> {
  mem.set(file, value);
  try {
    await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
    await fs.writeFile(filePath(file), JSON.stringify(value, null, 2), "utf8");
  } catch {
    // read-only FS (serverless) — memory fallback keeps it working per-instance
  }
}
