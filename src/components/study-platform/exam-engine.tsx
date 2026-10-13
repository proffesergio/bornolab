"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { CodeText } from "./code-text";
import { clear as clearOutbox, enqueue as enqueueOutbox, flush as flushOutbox, pendingCount as outboxCount } from "./outbox";
import { cn } from "@/lib/cn";
import type { ExamVersion, Question } from "@/lib/study-platform/types";

interface Props {
  version: ExamVersion;
  questions: Question[];
  attemptId: string;
  deadline: number;
  lang: "bn" | "en";
}

/** Timed exam engine — server deadline is authoritative; client timer is display only. */
export function ExamEngine({ version, questions, attemptId, deadline, lang }: Props) {
  const router = useRouter();
  const [order] = useState<string[]>(questions.map((q) => q.id));
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.round((deadline - Date.now()) / 1000)));
  const [saving, setSaving] = useState<"saved" | "saving" | "error" | "offline">("saved");
  const [queued, setQueued] = useState(() => outboxCount(attemptId));
  const [reviewMode, setReviewMode] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  const byId = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const card = byId.get(order[idx]);

  const submit = useCallback(async (auto: boolean) => {
    if (submittedRef.current || submitting) return;
    // Submit needs the server (authoritative deadline) — queue notice if offline.
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setSaving("offline");
      return;
    }
    submittedRef.current = true;
    setSubmitting(true);
    try {
      // Flush any queued autosaves first so the final score sees every answer.
      await flushOutbox(attemptId).catch(() => {});
      setQueued(outboxCount(attemptId));
      await fetch("/api/study-platform/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", attemptId, auto }),
      });
      clearOutbox(attemptId);
      router.push(`/study/results/${attemptId}`);
    } catch {
      submittedRef.current = false;
      setSubmitting(false);
      setSaving("error");
    }
  }, [attemptId, router, submitting]);

  // Flush the offline outbox on reconnect + on mount (resume path).
  // Initial count comes from lazy state init above — no sync setState here.
  useEffect(() => {
    const onOnline = () => {
      void flushOutbox(attemptId).then((left) => {
        setQueued(left);
        setSaving(left > 0 ? "error" : "saved");
      });
    };
    window.addEventListener("online", onOnline);
    void flushOutbox(attemptId).then((left) => setQueued(left)).catch(() => {});
    return () => window.removeEventListener("online", onOnline);
  }, [attemptId]);

  // Countdown (display) + idempotent auto-submit at expiry.
  useEffect(() => {
    const t = setInterval(() => {
      const r = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) void submit(true);
    }, 1000);
    return () => clearInterval(t);
  }, [deadline, submit]);

  // Leave policy: warn (timer keeps running; resume never extends deadline).
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (version.leave.leaveAction === "warn" && !submittedRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [version]);

  const pick = async (qid: string, optId: string) => {
    setAnswers((a) => ({ ...a, [qid]: optId }));
    setSaving("saving");
    try {
      await fetch("/api/study-platform/attempts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, questionId: qid, optionId: optId, markedForReview: !!flags[qid] }),
      });
      setSaving("saved");
    } catch {
      // Offline: queue locally, sync on reconnect. Answers are never lost.
      setQueued(enqueueOutbox(attemptId, { questionId: qid, optionId: optId, markedForReview: !!flags[qid], at: Date.now() }));
      setSaving("offline");
    }
  };

  // Keyboard: ←/→ navigate, 1-4 pick, F flag.
  // pick is declared above so the closure always sees the latest state.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (reviewMode || confirm) return;
      if (e.key === "ArrowRight") setIdx((i) => Math.min(order.length - 1, i + 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
      else if (e.key.toLowerCase() === "f" && card) setFlags((f) => ({ ...f, [card.id]: !f[card.id] }));
      else if (["1", "2", "3", "4"].includes(e.key) && card) {
        const i = Number(e.key) - 1;
        const opt = card.options[i];
        if (opt) void pick(card.id, opt.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const toggleFlag = async (qid: string) => {
    const next = !flags[qid];
    setFlags((f) => ({ ...f, [qid]: next }));
    try {
      await fetch("/api/study-platform/attempts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, questionId: qid, optionId: answers[qid] ?? null, markedForReview: next }),
      });
    } catch {
      setQueued(enqueueOutbox(attemptId, { questionId: qid, optionId: answers[qid] ?? null, markedForReview: next, at: Date.now() }));
    }
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const urgent = remaining < 120;
  const answered = Object.values(answers).filter(Boolean).length;
  const flagged = Object.values(flags).filter(Boolean).length;

  if (reviewMode && !confirm) {
    const unanswered = order.filter((id) => !answers[id]);
    const flaggedIds = order.filter((id) => flags[id]);
    return (
      <GlassCard>
        <h2 className="font-extrabold">🔍 চূড়ান্ত রিভিউ</h2>
        <p className="mt-1 text-[13px] text-slate-500">উত্তর: {answered}/{order.length} • অনুত্তরিত: {unanswered.length} • ফ্ল্যাগড: {flaggedIds.length} • বাকি: {mm}:{ss}</p>
        <div className="mt-3 grid gap-1.5">
          {order.map((id, i) => (
            <button key={id} onClick={() => { setReviewMode(false); setIdx(i); }} className="flex items-center justify-between rounded-xl bg-slate-900/[.04] px-3 py-2 text-left text-[13px] dark:bg-white/5">
              <span>Q{i + 1} — {(byId.get(id)?.locale[lang].stem ?? "").slice(0, 60)}…</span>
              <span className="font-bold">{answers[id] ? "✓" : "○"}{flags[id] ? " ⚑" : ""}</span>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setReviewMode(false)} className="glass rounded-full px-5 py-2.5 text-[13px] font-bold">← ফিরে যান</button>
          <button onClick={() => setConfirm(true)} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-[13px] font-bold text-white">জমা দিন →</button>
          <button
            onClick={async () => {
              if (!window.confirm("Attempt বাতিল করবেন? সংরক্ষিত উত্তর মুছে যাবে।")) return;
              await fetch("/api/study-platform/attempts", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ attemptId }),
              }).catch(() => {});
              router.push("/study/posts");
            }}
            className="rounded-full px-4 py-2.5 text-[12.5px] font-bold text-rose-500 hover:bg-rose-500/10"
          >
            ✕ বাতিল
          </button>
        </div>
      </GlassCard>
    );
  }

  if (confirm) {
    return (
      <GlassCard>
        <h2 className="font-extrabold">জমা নিশ্চিত করুন?</h2>
        <p className="mt-1 text-[13px] text-slate-500">জমার পর উত্তর বদলানো যাবে না। ভুল উত্তরে −{version.policy.negativeMark} (অনুত্তরিতে পেনাল্টি {version.policy.unansweredPenalty})।</p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setConfirm(false)} className="glass rounded-full px-5 py-2.5 text-[13px] font-bold">বাতিল</button>
          <button onClick={() => submit(false)} disabled={submitting} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-2.5 text-[13px] font-bold text-white disabled:opacity-60">
            {submitting ? "জমা হচ্ছে…" : "হ্যাঁ, জমা দিন"}
          </button>
        </div>
      </GlassCard>
    );
  }

  if (!card) return <GlassCard className="p-8 text-center text-sm text-slate-500">প্রশ্ন লোড হচ্ছে…</GlassCard>;

  const opts = lang === "en" ? card.locale.en.options : card.locale.bn.options;

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
      <div>
        <div className="glass flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3" role="timer" aria-live="polite" aria-label={`Remaining ${mm} minutes ${ss} seconds`}>
          <p className={cn("text-xl font-black tabular-nums", urgent ? "text-rose-600" : "text-slate-900 dark:text-white")}>⏱ {mm}:{ss}</p>
          <p className="text-[12px] font-bold text-slate-500">{saving === "saved" ? "✓ সংরক্ষিত" : saving === "saving" ? "…সংরক্ষণ" : saving === "offline" ? `📴 অফলাইন — ${queued}টি sync বাকি` : "⚠ সংরক্ষণ ব্যর্থ — আবার চেষ্টা হচ্ছে"}</p>
          <p className="text-[12px] font-bold text-slate-500">Q{idx + 1}/{order.length}</p>
        </div>
        <GlassCard className="mt-3">
          <p className="text-[15px] font-bold leading-8"><CodeText text={card.locale[lang].stem} /></p>
          <div className="mt-3 grid gap-2" role="radiogroup" aria-label={`Question ${idx + 1} options`}>
            {opts.map((text, i) => {
              const optId = card.options[i]?.id ?? "";
              const sel = answers[card.id] === optId;
              return (
                <button key={i} role="radio" aria-checked={sel} onClick={() => pick(card.id, optId)}
                  className={cn("rounded-xl border p-3 text-left text-[14px] leading-7", sel ? "border-cyan-500 bg-cyan-500/10 font-bold" : "hover:border-cyan-500/50")}>
                  <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-slate-900/[.06] text-[12px] font-black dark:bg-white/10">{i + 1}</span>
                  <CodeText text={text} />
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[12px] text-slate-500">কীবোর্ড: ←/→ ঘোরা • 1–4 উত্তর • F ফ্ল্যাগ</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0} className="glass rounded-full px-4 py-2 text-[13px] font-bold disabled:opacity-40">← আগের</button>
            <button onClick={() => setIdx((i) => Math.min(order.length - 1, i + 1))} disabled={idx === order.length - 1} className="glass rounded-full px-4 py-2 text-[13px] font-bold disabled:opacity-40">পরের →</button>
            <button onClick={() => toggleFlag(card.id)} aria-pressed={!!flags[card.id]} className={cn("rounded-full px-4 py-2 text-[13px] font-bold", flags[card.id] ? "bg-amber-500 text-white" : "glass")}>
              {flags[card.id] ? "⚑ ফ্ল্যাগড" : "⚐ ফ্ল্যাগ"}
            </button>
            <button onClick={() => setReviewMode(true)} className="ml-auto rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2 text-[13px] font-bold text-white">রিভিউ ও জমা →</button>
          </div>
        </GlassCard>
      </div>
      <aside>
        <GlassCard className="p-4">
          <h3 className="text-[13px] font-extrabold">🧭 প্রশ্ন-তালিকা</h3>
          <p className="mt-0.5 text-[11.5px] text-slate-500">✓ উত্তর • ○ বাকি • ⚑ ফ্ল্যাগ (রঙ ছাড়াও চিহ্ন আছে)</p>
          <div className="mt-2 grid grid-cols-5 gap-1.5" role="list" aria-label="Question palette">
            {order.map((id, i) => {
              const a = !!answers[id];
              const fl = !!flags[id];
              return (
                <button key={id} role="listitem" onClick={() => setIdx(i)} aria-label={`Question ${i + 1} ${a ? "answered" : "unanswered"}${fl ? " flagged" : ""}`}
                  className={cn("grid h-9 place-items-center rounded-lg text-[12px] font-black",
                    i === idx ? "ring-2 ring-cyan-500" : "",
                    a ? "bg-emerald-500 text-white" : "bg-slate-900/[.06] dark:bg-white/10",
                    fl && "underline decoration-amber-500 decoration-2")}>
                  {i + 1}{fl ? "⚑" : ""}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[12px] font-bold text-slate-500">উত্তর {answered}/{order.length} • ফ্ল্যাগ {flagged}</p>
        </GlassCard>
      </aside>
    </div>
  );
}
