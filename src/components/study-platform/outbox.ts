"use client";
/** Offline outbox for exam autosaves: queue PATCH ops in localStorage, flush on reconnect. */

export interface OutboxOp {
  questionId: string;
  optionId: string | null;
  markedForReview: boolean;
  at: number;
}

function key(attemptId: string): string {
  return `study-outbox:${attemptId}`;
}

function readRaw(attemptId: string): OutboxOp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(attemptId));
    const arr = raw ? (JSON.parse(raw) as OutboxOp[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Latest op per question wins (coalesce). */
export function enqueue(attemptId: string, op: OutboxOp): number {
  if (typeof window === "undefined") return 0;
  const cur = readRaw(attemptId).filter((o) => o.questionId !== op.questionId);
  cur.push(op);
  try {
    window.localStorage.setItem(key(attemptId), JSON.stringify(cur.slice(-200)));
  } catch { /* private mode */ }
  return cur.length;
}

export function pendingCount(attemptId: string): number {
  return readRaw(attemptId).length;
}

export function clear(attemptId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(attemptId));
  } catch { /* ignore */ }
}

/** Flush queued ops in order; returns remaining count. Stops at first failure. */
export async function flush(attemptId: string): Promise<number> {
  const ops = readRaw(attemptId);
  let remaining = ops.length;
  for (const op of ops) {
    try {
      const res = await fetch("/api/study-platform/attempts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, questionId: op.questionId, optionId: op.optionId, markedForReview: op.markedForReview }),
      });
      if (!res.ok && res.status !== 409 && res.status !== 410) break;
      remaining -= 1;
    } catch {
      break;
    }
  }
  if (typeof window !== "undefined") {
    try {
      if (remaining <= 0) window.localStorage.removeItem(key(attemptId));
      else window.localStorage.setItem(key(attemptId), JSON.stringify(readRaw(attemptId).slice(-remaining)));
    } catch { /* ignore */ }
  }
  return Math.max(0, remaining);
}
