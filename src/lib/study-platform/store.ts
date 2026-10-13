/**
 * Server-only: study-platform persistence.
 * Postgres tables (idempotent DDL) + JSON/KV fallback so local dev works with zero setup.
 * Never import from Client Components — use the public APIs instead.
 */
import { readJson, writeJson } from "../store";
import { isDbConfigured } from "../db";
import type { Attempt, AuditEvent, Bookmark, Question, QuestionFlag, UserProgress } from "./types";

const KV_PREFIX = "study-platform:";

async function kvRead<T>(key: string, fallback: T): Promise<T> {
  return readJson<T>(`${KV_PREFIX}${key}.json`, fallback);
}
async function kvWrite(key: string, value: unknown): Promise<void> {
  await writeJson(`${KV_PREFIX}${key}.json`, value);
}

/** Idempotent DDL for the normalized tables. Safe to call per request (cached). */
let ddlDone = false;
export async function ensureStudySchema(): Promise<{ db: boolean }> {
  if (isDbConfigured()) {
    try {
      const { default: postgres } = await import("postgres");
      const url = (process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "").trim();
      const sql = postgres(url, { max: 1, idle_timeout: 20, connect_timeout: 10 });
      await sql`
        CREATE TABLE IF NOT EXISTS study_questions (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS study_attempts (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          version_id TEXT NOT NULL,
          data JSONB NOT NULL,
          submitted_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS study_progress (
          user_id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS study_audit (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS study_evidence (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`;
      await sql`CREATE INDEX IF NOT EXISTS idx_study_questions_status ON study_questions (status)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_study_attempts_user ON study_attempts (user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_study_audit_at ON study_audit (at DESC)`;
      await sql.end({ timeout: 2 }).catch(() => {});
      ddlDone = true;
      return { db: true };
    } catch {
      return { db: false };
    }
  }
  return { db: false };
}

export function studyDdlStatements(): string[] {
  return [
    `CREATE TABLE IF NOT EXISTS study_questions (id TEXT PRIMARY KEY, data JSONB NOT NULL, status TEXT NOT NULL DEFAULT 'draft', updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`,
    `CREATE TABLE IF NOT EXISTS study_attempts (id TEXT PRIMARY KEY, user_id TEXT, version_id TEXT NOT NULL, data JSONB NOT NULL, submitted_at TIMESTAMPTZ, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`,
    `CREATE TABLE IF NOT EXISTS study_progress (user_id TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());`,
    `CREATE TABLE IF NOT EXISTS study_audit (id TEXT PRIMARY KEY, data JSONB NOT NULL, at TIMESTAMPTZ NOT NULL DEFAULT now());`,
    `CREATE TABLE IF NOT EXISTS study_evidence (id TEXT PRIMARY KEY, data JSONB NOT NULL, at TIMESTAMPTZ NOT NULL DEFAULT now());`,
  ];
}

/* ---------- Questions ---------- */
export async function listQuestions(): Promise<Question[]> {
  return kvRead<Question[]>("questions", []);
}
export async function saveQuestions(items: Question[]): Promise<void> {
  await kvWrite("questions", items);
}

/* ---------- Attempts ---------- */
export async function listAttempts(): Promise<Attempt[]> {
  return kvRead<Attempt[]>("attempts", []);
}
export async function saveAttempts(items: Attempt[]): Promise<void> {
  await kvWrite("attempts", items);
}
export async function getAttempt(id: string): Promise<Attempt | null> {
  const all = await listAttempts();
  return all.find((a) => a.id === id) ?? null;
}
export async function upsertAttempt(next: Attempt): Promise<void> {
  const all = await listAttempts();
  const i = all.findIndex((a) => a.id === next.id);
  if (i >= 0) all[i] = next;
  else all.push(next);
  await saveAttempts(all);
}

/* ---------- Progress / bookmarks / flags ---------- */
export async function getProgress(userId: string): Promise<UserProgress | null> {
  const all = await kvRead<UserProgress[]>("progress", []);
  return all.find((p) => p.userId === userId) ?? null;
}
export async function saveProgress(next: UserProgress): Promise<void> {
  const all = await kvRead<UserProgress[]>("progress", []);
  const i = all.findIndex((p) => p.userId === next.userId);
  if (i >= 0) all[i] = next;
  else all.push(next);
  await kvWrite("progress", all);
}
export async function listBookmarks(userId: string): Promise<Bookmark[]> {
  const all = await kvRead<Bookmark[]>("bookmarks", []);
  return all.filter((b) => b.userId === userId);
}
export async function saveBookmark(b: Bookmark): Promise<void> {
  const all = await kvRead<Bookmark[]>("bookmarks", []);
  if (!all.some((x) => x.userId === b.userId && x.kind === b.kind && x.refId === b.refId)) all.push(b);
  await kvWrite("bookmarks", all);
}
export async function removeBookmark(userId: string, kind: Bookmark["kind"], refId: string): Promise<void> {
  const all = await kvRead<Bookmark[]>("bookmarks", []);
  await kvWrite("bookmarks", all.filter((x) => !(x.userId === userId && x.kind === kind && x.refId === refId)));
}
export async function listFlags(): Promise<QuestionFlag[]> {
  return kvRead<QuestionFlag[]>("flags", []);
}
export async function saveFlag(f: QuestionFlag): Promise<void> {
  const all = await listFlags();
  all.push(f);
  await kvWrite("flags", all);
}

/* ---------- Audit / evidence ---------- */
export async function listAudit(limit = 200): Promise<AuditEvent[]> {
  const all = await kvRead<AuditEvent[]>("audit", []);
  return all.slice(-limit).reverse();
}
export async function appendAudit(e: AuditEvent): Promise<void> {
  const all = await kvRead<AuditEvent[]>("audit", []);
  all.push(e);
  await kvWrite("audit", all.slice(-2000));
}
export async function listEvidence(): Promise<Record<string, unknown>[]> {
  return kvRead<Record<string, unknown>[]>("evidence", []);
}
export async function appendEvidence(e: Record<string, unknown>): Promise<void> {
  const all = await listEvidence();
  all.push(e);
  await kvWrite("evidence", all.slice(-2000));
}

export function isDbAvailable(): boolean {
  return ddlDone || isDbConfigured();
}
