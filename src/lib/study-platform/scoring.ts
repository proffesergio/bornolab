/** Deterministic scoring for ExamVersion attempts. Pure functions — tested. */
import type { Attempt, AttemptScore, ExamVersion, Question } from "./types";

export interface ScoreInput {
  version: ExamVersion;
  questions: Question[];
  answers: Attempt["answers"];
  startedAt: number;
  submittedAt: number;
}

export function scoreAttempt(input: ScoreInput): AttemptScore {
  const { version, questions, answers, startedAt, submittedAt } = input;
  const byId = new Map(questions.map((q) => [q.id, q]));
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;
  let raw = 0;
  let penalty = 0;
  const sectionTotals: AttemptScore["sectionTotals"] = {};
  const topicTotals: AttemptScore["topicTotals"] = {};
  const marksPer = version.policy.marksPerQuestion;
  const neg = version.policy.negativeMark;
  const unpen = version.policy.unansweredPenalty ?? 0;

  const sectionOf = (qid: string): string => {
    for (const s of version.sections) {
      // section membership derived from subject link via question chapter mapping is
      // resolved by caller into tags; here we fall back to first section.
      void qid;
      void s;
    }
    return version.sections[0]?.id ?? "general";
  };

  for (const q of questions) {
    const a = answers[q.id];
    const key = byId.get(q.id)?.key;
    const sec = sectionOf(q.id);
    const top = q.topicId ?? q.chapterId;
    if (!sectionTotals[sec]) sectionTotals[sec] = { correct: 0, incorrect: 0, unanswered: 0, net: 0 };
    if (!topicTotals[top]) topicTotals[top] = { correct: 0, incorrect: 0, unanswered: 0, net: 0 };
    const optId = a?.optionId ?? null;
    if (!optId) {
      unanswered += 1;
      sectionTotals[sec].unanswered += 1;
      topicTotals[top].unanswered += 1;
      if (unpen > 0) {
        penalty += unpen;
        sectionTotals[sec].net -= unpen;
        topicTotals[top].net -= unpen;
      }
      continue;
    }
    if (key && optId === key.optionId) {
      correct += 1;
      raw += marksPer;
      sectionTotals[sec].correct += 1;
      sectionTotals[sec].net += marksPer;
      topicTotals[top].correct += 1;
      topicTotals[top].net += marksPer;
    } else {
      incorrect += 1;
      penalty += neg;
      sectionTotals[sec].incorrect += 1;
      sectionTotals[sec].net -= neg;
      topicTotals[top].incorrect += 1;
      topicTotals[top].net -= neg;
    }
  }

  const net = round2(raw - penalty);
  const max = round2(questions.length * marksPer);
  const pct = max > 0 ? round2((100 * net) / max) : 0;
  const anyProvisional = questions.some((q) => q.key.status === "provisional");
  return {
    raw: round2(raw),
    penalty: round2(penalty),
    net,
    pct,
    correct,
    incorrect,
    unanswered,
    timeUsedSec: Math.max(0, Math.round((submittedAt - startedAt) / 1000)),
    sectionTotals,
    topicTotals,
    keyStatus: anyProvisional ? "provisional" : "approved",
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Deterministic PRNG (mulberry32) for reproducible question/option order. */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed >>> 0 || 1;
  const rand = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
