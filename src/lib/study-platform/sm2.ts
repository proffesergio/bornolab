/** SM-2 (SuperMemo-2) spaced repetition. Pure functions — tested. */
import type { SRCard } from "./types";

export const DAY_MS = 86400000;
export const MIN_EASE = 1.3;
export const START_EASE = 2.5;
export const MAX_INTERVAL_DAYS = 365;

/** UI grades → SM-2 quality (0–5). */
export const GRADES = { again: 0, hard: 3, good: 4, easy: 5 } as const;
export type GradeName = keyof typeof GRADES;

/** Auto-grade from an observed outcome (documented mapping). */
export function autoQuality(result: "correct" | "incorrect" | "unanswered"): number {
  return result === "correct" ? GRADES.good : result === "incorrect" ? 2 : 1;
}

export function newCard(now: number): SRCard {
  return { ease: START_EASE, intervalDays: 0, reps: 0, lapses: 0, dueAt: now, lastGrade: 0, updatedAt: now };
}

/** Classic SM-2 update. intervalDays: fail → 1; reps 0→1; 1→6; else round(prev × ease). */
export function gradeCard(card: SRCard, quality: number, now: number): SRCard {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  if (q < 3) {
    return { ease: Math.max(MIN_EASE, card.ease), intervalDays: 1, reps: 0, lapses: card.lapses + 1, dueAt: now + DAY_MS, lastGrade: q, updatedAt: now };
  }
  const ease = Math.max(MIN_EASE, round2(card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))));
  const reps = card.reps + 1;
  const intervalDays = Math.min(MAX_INTERVAL_DAYS, reps === 1 ? 1 : reps === 2 ? 6 : Math.max(1, Math.round(card.intervalDays * ease)));
  return { ease, intervalDays, reps, lapses: card.lapses, dueAt: now + intervalDays * DAY_MS, lastGrade: q, updatedAt: now };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isDue(card: SRCard, now: number): boolean {
  return card.dueAt <= now;
}

/** Due cards first (oldest dueAt), then new cards, capped. */
export function dueQueue(cards: Record<string, SRCard>, knownIds: string[], now: number, limit = 30): string[] {
  const due: { id: string; at: number }[] = [];
  const fresh: string[] = [];
  for (const id of knownIds) {
    const c = cards[id];
    if (!c) fresh.push(id);
    else if (isDue(c, now)) due.push({ id, at: c.dueAt });
  }
  due.sort((a, b) => a.at - b.at);
  return [...due.map((d) => d.id), ...fresh].slice(0, Math.max(1, limit));
}

export function summarize(cards: Record<string, SRCard>, knownIds: string[], now: number): { due: number; fresh: number; total: number } {
  let due = 0;
  let fresh = 0;
  for (const id of knownIds) {
    const c = cards[id];
    if (!c) fresh += 1;
    else if (isDue(c, now)) due += 1;
  }
  return { due, fresh, total: knownIds.length };
}
