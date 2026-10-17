import postgres from "postgres";
import { promises as fs } from "node:fs";
import path from "node:path";
import { dbUrl, isDbConfigured, ensureSchema } from "./db";
import { MEDIA_MAX_ASSETS, MEDIA_MAX_TOTAL, type MediaAsset, type MediaIndex } from "./media";

const indexKey = "public-media:index";
const empty = (): MediaIndex => ({ assets: [], audit: [] });
let client: postgres.Sql | undefined;
let queue: Promise<unknown> = Promise.resolve();
function database() { return client ??= postgres(dbUrl(), { max: 1, connect_timeout: 10, idle_timeout: 10 }); }
function unpack<T>(value: T | string): T { return typeof value === "string" ? JSON.parse(value) : value; }
const directory = () => path.join(process.cwd(), "data", "showcase-media");
async function localIndex(): Promise<MediaIndex> {
  if (process.env.NODE_ENV === "production") throw new Error("Durable media storage requires PostgreSQL.");
  try { return JSON.parse(await fs.readFile(path.join(directory(), "index.json"), "utf8")); }
  catch (e) { if ((e as NodeJS.ErrnoException).code === "ENOENT") return empty(); throw e; }
}
export async function readMediaIndex(): Promise<MediaIndex> {
  if (!isDbConfigured()) return localIndex();
  await ensureSchema();
  const rows = await database()`SELECT value FROM bornolab_kv WHERE key = ${indexKey}`;
  return rows.length ? unpack<MediaIndex>(rows[0].value) : empty();
}
export async function readMediaFile(id: string): Promise<string | undefined> {
  if (!isDbConfigured()) { await localIndex(); try { return await fs.readFile(path.join(directory(), `${id}.txt`), "utf8"); } catch (e) { if ((e as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw e; } }
  await ensureSchema();
  const rows = await database()`SELECT value FROM bornolab_kv WHERE key = ${`public-media:file:${id}`}`;
  return rows.length ? unpack<{content:string}>(rows[0].value).content : undefined;
}
/** Index, bounded quota, bytes and primary audit commit together. No ephemeral production fallback. */
export async function writeMedia(asset: MediaAsset, actor: string, content?: string, expectedUpdatedAt?:number): Promise<void> {
  function update(index: MediaIndex) {
    const previous = index.assets.find(a => a.id === asset.id);
    if(previous&&expectedUpdatedAt!==undefined&&previous.updatedAt!==expectedUpdatedAt)throw new Error("Media changed in another session. Reload before saving.");
    if (!previous && content === undefined) throw new Error("Media not found.");
    if (!previous && index.assets.length >= MEDIA_MAX_ASSETS) throw new Error("Media library limit reached. Contact support to expand storage.");
    if (index.assets.reduce((sum,a) => sum + a.bytes, 0) - (previous?.bytes ?? 0) + asset.bytes > MEDIA_MAX_TOTAL) throw new Error("Media storage quota reached.");
    if (previous) index.assets[index.assets.indexOf(previous)] = asset; else index.assets.push(asset);
    index.audit.push({ actor, action: content ? "media.uploaded" : "media.updated", id: asset.id, at: Date.now() });
    index.audit = index.audit.slice(-1000);
  }
  if (isDbConfigured()) {
    await ensureSchema();
    await database().begin(async tx => {
      await tx`INSERT INTO bornolab_kv (key,value) VALUES (${indexKey}, ${JSON.stringify(empty())}::jsonb) ON CONFLICT DO NOTHING`;
      const rows = await tx`SELECT value FROM bornolab_kv WHERE key = ${indexKey} FOR UPDATE`;
      const index = unpack<MediaIndex>(rows[0].value); update(index);
      if (content !== undefined) await tx`INSERT INTO bornolab_kv (key,value) VALUES (${`public-media:file:${asset.id}`}, ${JSON.stringify({content})}::jsonb)`;
      await tx`UPDATE bornolab_kv SET value = ${JSON.stringify(index)}::jsonb, updated_at = now() WHERE key = ${indexKey}`;
    }); return;
  }
  const operation = queue.then(async () => {
    const index = await localIndex(); update(index); await fs.mkdir(directory(), { recursive: true });
    if (content !== undefined) await fs.writeFile(path.join(directory(), `${asset.id}.txt`), content, {flag:"wx"});
    const temporary = path.join(directory(), `${crypto.randomUUID()}.tmp`);
    await fs.writeFile(temporary, JSON.stringify(index)); await fs.rename(temporary, path.join(directory(), "index.json"));
  }); queue = operation.catch(() => undefined); await operation;
}
