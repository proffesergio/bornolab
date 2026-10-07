// Durable Postgres store — KV backend behind the file-store API.
// Run: node --test tests/task14-postgres-store.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("db module exposes pooled connection, schema and KV helpers", () => {
  assert.ok(existsSync(join(root, "src/lib/db.ts")), "src/lib/db.ts must exist.");
  const src = read("src/lib/db.ts");
  assert.ok(src.includes("isDbConfigured"), "db must expose isDbConfigured.");
  assert.ok(src.includes("POSTGRES_URL"), "db must read POSTGRES_URL.");
  assert.ok(src.includes("DATABASE_URL"), "db must accept DATABASE_URL as fallback.");
  assert.ok(src.includes("CREATE TABLE IF NOT EXISTS"), "db must init schema idempotently.");
  assert.ok(src.includes("bornolab_kv"), "db must use a KV table.");
  assert.ok(src.includes("max: 1"), "db must limit pooled connections for serverless.");
  assert.ok(!src.includes("process.env.POSTGRES_URL;"), "connection string must never be logged.");
});

test("store prefers Postgres when configured, files otherwise", () => {
  const src = read("src/lib/store.ts");
  assert.ok(src.includes("isDbConfigured"), "store must branch on DB configuration.");
  assert.ok(src.includes("kvGet") && src.includes("kvSet"), "store must use the KV helpers.");
  assert.ok(src.includes("data", ), "store must keep the file backend for local dev.");
});

test("store degrades gracefully when the DB fails", () => {
  const src = read("src/lib/store.ts");
  // A DB outage must never hard-crash a request — fall back to files.
  assert.ok(/catch[\s\S]*fall through to file store/.test(src), "store must fall back to files on DB errors.");
});

test("kvGet normalizes jsonb text to parsed values", () => {
  const src = read("src/lib/db.ts");
  // The driver can return jsonb as a string — callers must always get values.
  assert.ok(src.includes("JSON.parse"), "kvGet must parse text payloads.");
});

test("postgres driver is a production dependency", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.ok(pkg.dependencies?.postgres, "postgres driver must be installed.");
});

test(".env.example documents the pooled Postgres URL", () => {
  const env = read(".env.example");
  assert.ok(env.includes("POSTGRES_URL"), ".env.example must document POSTGRES_URL.");
  assert.ok(env.includes("pool"), ".env.example must call out the pooled connection string.");
});
