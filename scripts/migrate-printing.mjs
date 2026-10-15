import env from "@next/env";
import postgres from "postgres";
import { readFile } from "node:fs/promises";

// Explicit operations command. Never called by app requests or the build.
const args = process.argv.slice(2);
if (args.some(arg => arg !== "--check")) {
  console.error("Usage: npm run db:migrate:printing -- [--check]");
  process.exitCode = 1;
} else {
  await main(args.includes("--check"));
}

async function verify(sql) {
  const columns = await sql`
    SELECT attname AS name, format_type(atttypid, atttypmod) AS type,
           attnotnull AS required
    FROM pg_attribute
    WHERE attrelid = to_regclass('bornolab_printing')
      AND attnum > 0 AND NOT attisdropped
    ORDER BY attnum
  `;
  const expected = [["id", "text"], ["value", "jsonb"], ["updated_at", "timestamp with time zone"]];
  if (columns.length !== expected.length || expected.some(([name, type], i) =>
    columns[i].name !== name || columns[i].type !== type || !columns[i].required)) {
    throw new Error("schema_mismatch");
  }
  const constraints = await sql`
    SELECT contype AS type, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint WHERE conrelid = to_regclass('bornolab_printing')
  `;
  if (!constraints.some(c => c.type === "p" && c.definition === "PRIMARY KEY (id)") ||
      !constraints.some(c => c.type === "c" && /id\s*=\s*'main'::text/.test(c.definition))) {
    throw new Error("schema_mismatch");
  }
}

async function main(checkOnly) {
  env.loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
  const connection = (process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "").trim();
  if (!connection) {
    console.error("No database configured. Set POSTGRES_URL or DATABASE_URL in the process environment or ignored .env.local, then retry.");
    process.exitCode = 1;
    return;
  }
  let target;
  try {
    target = new URL(connection);
    if (!["postgres:", "postgresql:"].includes(target.protocol)) throw new Error("invalid_url");
  } catch {
    console.error("The configured database URL is invalid. Its value has not been printed.");
    process.exitCode = 1;
    return;
  }
  console.log(`${checkOnly ? "Checking" : "Migrating"} Printing Services on ${target.hostname}.`);
  const sql = postgres(connection, { max: 1, connect_timeout: 10, idle_timeout: 5,
    onnotice() {}, connection: { application_name: "bornolab-printing-migration" } });
  try {
    await sql.begin(async tx => {
      await tx`SET LOCAL lock_timeout = '10s'`;
      await tx`SET LOCAL statement_timeout = '30s'`;
      if (!checkOnly) {
        const migration = await readFile(new URL("../docs/migrations/001-printing.sql", import.meta.url), "utf8");
        // Use this transaction so verification can roll back an unexpected schema.
        const statement = migration.replace(/^\s*(BEGIN|COMMIT);\s*$/gmi, "");
        await tx.unsafe(statement).simple();
      }
      await verify(tx);
    });
    console.log(checkOnly ? "Printing schema verified. No changes made." : "Printing migration committed and schema verified. Existing application data was preserved.");
  } catch (error) {
    const code = typeof error?.code === "string" && /^[A-Z0-9_]{1,32}$/.test(error.code) ? ` (${error.code})` : "";
    console.error(error?.message === "schema_mismatch"
      ? "Printing schema does not match migration 001. No migration changes committed; review the existing table before retrying."
      : `Printing database operation failed${code}. No migration changes committed. Check database access, TLS and schema permissions. Credentials and server error details are not printed.`);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 5 });
  }
}
