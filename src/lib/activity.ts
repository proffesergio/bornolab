/** Server-only: per-user activity aggregation for the admin panel. */
import { readJson } from "./store";
import { readAudit, type AuditEntry } from "./users";
import type { MemberUser } from "./members-shared";

export interface UserActivityItem {
  at: number;
  kind: "view" | "pdf" | "download" | "login" | "admin";
  label: string;
  detail?: string;
}

export interface UserActivity {
  user: MemberUser | null;
  views: number;
  pdfJobs: number;
  downloads: number;
  logins: number;
  lastActive: number | null;
  /** Newest-first, capped. */
  timeline: UserActivityItem[];
}

interface ViewEvent {
  t: number;
  path: string;
  uid?: string;
}

interface PdfOpEvent {
  at: number;
  tool: string;
  files: number;
  pages: number;
  ms: number;
  ok: boolean;
  err?: string;
  uid?: string;
}

const TIMELINE_LIMIT = 100;

/** Aggregate every stored signal for one user id (newest-first timeline). */
export async function getUserActivity(userId: string): Promise<UserActivity> {
  const { listUsers } = await import("./users");
  const user = (await listUsers()).find((u) => u.id === userId) ?? null;

  const [views, ops, audit] = await Promise.all([
    readJson<ViewEvent[]>("analytics.json", []),
    readJson<PdfOpEvent[]>("pdf-ops.json", []),
    readAudit(500),
  ]);

  const items: UserActivityItem[] = [];
  for (const v of views) {
    if (v.uid === userId) items.push({ at: v.t, kind: "view", label: `Visited ${v.path}` });
  }
  let pdfJobs = 0;
  for (const o of ops) {
    if (o.uid === userId) {
      pdfJobs++;
      items.push({
        at: o.at,
        kind: "pdf",
        label: `${o.tool} — ${o.files} file(s), ${o.pages} page(s)${o.ok ? "" : " (failed)"}`,
        detail: o.err,
      });
    }
  }
  let downloads = 0;
  let logins = 0;
  const actor = `user:${userId}`;
  for (const a of audit as AuditEntry[]) {
    if (a.actor !== actor) continue;
    if (a.action === "auth.login") {
      logins++;
      items.push({ at: a.at, kind: "login", label: `Logged in (${a.detail ?? "email"})` });
    } else if (a.action === "study.download") {
      downloads++;
      items.push({ at: a.at, kind: "download", label: "Downloaded study file", detail: a.detail });
    } else {
      items.push({ at: a.at, kind: "admin", label: a.action, detail: a.detail });
    }
  }

  items.sort((a, b) => b.at - a.at);
  const timeline = items.slice(0, TIMELINE_LIMIT);
  return {
    user,
    views: items.filter((i) => i.kind === "view").length,
    pdfJobs,
    downloads,
    logins,
    lastActive: timeline.length > 0 ? timeline[0].at : null,
    timeline,
  };
}
