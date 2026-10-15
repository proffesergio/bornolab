import postgres from "postgres";
import { promises as fs } from "node:fs";
import path from "node:path";
import { dbUrl, isDbConfigured } from "../db";
import { seedPrinting } from "./seed";
import type { PrintData } from "./domain";

let sql: postgres.Sql | undefined;
let queue: Promise<unknown> = Promise.resolve();
const file = path.join(process.cwd(), "data", "printing.json");
function database() { return sql ??= postgres(dbUrl(), { max: 1 }); }
function hydrate(value:unknown):PrintData {
  const data=(typeof value==="string"?JSON.parse(value):value) as Partial<PrintData>;
  if(!data||!data.config||!Array.isArray(data.services)||!Array.isArray(data.orders))throw new Error("Printing records need a verified restore.");
  const defaults=seedPrinting();
  return {...defaults,...data,config:{...defaults.config,...data.config},services:data.services.map(service=>({...service,options:service.options.map(option=>({...option,type:option.type??"select"}))})),tickets:data.tickets??[],templates:data.templates??[],partners:data.partners??defaults.partners,designers:data.designers??defaults.designers};
}
async function localRead(): Promise<PrintData> {
  try { return hydrate(JSON.parse(await fs.readFile(file, "utf8"))); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return seedPrinting(); throw error; }
}
export async function readPrinting(): Promise<PrintData> {
  if (isDbConfigured()) {
    const rows = await database()`SELECT value FROM bornolab_printing WHERE id = 'main'`;
    return rows.length ? hydrate(rows[0].value) : seedPrinting();
  }
  if (process.env.NODE_ENV === "production" && process.env.PRINTING_LOCAL_STORAGE !== "true") throw new Error("Printing storage is not configured. Apply the migration and configure DATABASE_URL.");
  return localRead();
}
export async function mutatePrinting<T>(change: (data: PrintData) => T): Promise<T> {
  if (isDbConfigured()) {
    const result = await database().begin(async tx => {
      await tx`INSERT INTO bornolab_printing (id, value) VALUES ('main', ${JSON.stringify(seedPrinting())}::jsonb) ON CONFLICT DO NOTHING`;
      const rows = await tx`SELECT value FROM bornolab_printing WHERE id = 'main' FOR UPDATE`;
      const data = hydrate(rows[0].value);
      const value = change(data);
      await tx`UPDATE bornolab_printing SET value = ${JSON.stringify(data)}::jsonb, updated_at = now() WHERE id = 'main'`;
      return { value };
    });
    return result.value;
  }
  if (process.env.NODE_ENV === "production" && process.env.PRINTING_LOCAL_STORAGE !== "true") throw new Error("Printing requires durable storage.");
  const operation = queue.then(async () => {
    const data = await localRead(); const result = change(data);
    await fs.mkdir(path.dirname(file), { recursive: true });
    const temporary = `${file}.${crypto.randomUUID()}.tmp`;
    try { await fs.writeFile(temporary, JSON.stringify(data), "utf8"); await fs.rename(temporary, file); }
    catch(error){await fs.unlink(temporary).catch(()=>undefined);throw error;}
    return result;
  });
  queue = operation.catch(() => undefined);
  return operation;
}
