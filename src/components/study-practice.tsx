"use client";
import { useEffect, useMemo, useState } from "react";
import { PRACTICE_TOPICS, STUDY_PLAN, type PracticeTopic } from "@/lib/study-data";
import { GlassCard } from "@/components/ui";
import { cn } from "@/lib/cn";

type Mark = "ok" | "review";
type Step = "guide" | "flash" | "exam";

const LS_KEY = "bornolab-study-progress-v1";

function loadMarks(): Record<string, Mark> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}") as Record<string, Mark>;
  } catch {
    return {};
  }
}

/**
 * Step-by-step practice: ① Guide (3-day plan) → ② Flashcards (flip + mark)
 * → ③ Exam mode (timed-feel self-test with score). Progress persists locally.
 */
export function StudyPractice({ topics = PRACTICE_TOPICS }: { topics?: PracticeTopic[] }) {
  const [step, setStep] = useState<Step>("guide");
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [typeFilter, setTypeFilter] = useState<"All" | "MCQ" | "Written">("All");
  const [seenOnly, setSeenOnly] = useState(false);
  // Start empty (matches the server render) and hydrate from localStorage
  // after mount — reading it during render would mismatch on first paint.
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [hydrated, setHydrated] = useState(false);

  // External store sync (localStorage progress) — setState-in-effect is intended here
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMarks(loadMarks());
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!hydrated) return; // skip the mount commit: state is still the server snapshot
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(marks));
    } catch { /* private mode — ignore */ }
  }, [marks, hydrated]);

  const topic = topics.find((t) => t.id === topicId) ?? topics[0];
  const items = useMemo(() => {
    if (!topic) return [];
    return topic.items.filter(
      (i) =>
        (typeFilter === "All" || i.type === typeFilter) &&
        (!seenOnly || (i.seen ?? "").length > 0)
    );
  }, [topic, typeFilter, seenOnly]);

  const total = topics.reduce((n, t) => n + t.items.length, 0);
  const done = Object.values(marks).filter((m) => m === "ok").length;
  const reviewCount = Object.values(marks).filter((m) => m === "review").length;

  const mark = (id: string, m: Mark | null) =>
    setMarks((prev) => {
      const next = { ...prev };
      if (m == null) delete next[id];
      else next[id] = m;
      return next;
    });

  const steps: { id: Step; n: string; label: string; desc: string }[] = [
    { id: "guide", n: "1", label: "Guide", desc: "3-day plan, topic by topic" },
    { id: "flash", n: "2", label: "Flashcards", desc: "flip, recall, mark" },
    { id: "exam", n: "3", label: "Exam mode", desc: "self-test + score" },
  ];

  return (
    <div>
      {/* progress */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-extrabold">Your practice progress</p>
          <p className="text-[12px] text-slate-500 dark:text-slate-400">
            {done}/{total} mastered{reviewCount > 0 ? ` • ${reviewCount} to review` : ""} • saved in this browser
          </p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
            style={{ width: `${total ? Math.round((100 * done) / total) : 0}%` }}
          />
        </div>
      </div>

      {/* stepper */}
      <ol className="mt-4 grid gap-2 sm:grid-cols-3">
        {steps.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => setStep(s.id)}
              aria-current={step === s.id ? "step" : undefined}
              className={cn(
                "w-full rounded-2xl border p-3.5 text-left transition",
                step === s.id
                  ? "border-cyan-500/60 bg-cyan-500/10 dark:bg-cyan-500/10"
                  : "glass hover-glow"
              )}
            >
              <span className={cn(
                "grid h-7 w-7 place-items-center rounded-full text-[13px] font-black text-white",
                step === s.id ? "bg-gradient-to-r from-cyan-500 to-purple-600" : "bg-slate-400 dark:bg-slate-600"
              )}>{s.n}</span>
              <span className="mt-1.5 block font-extrabold">{s.label}</span>
              <span className="block text-[12px] text-slate-500 dark:text-slate-400">{s.desc}</span>
            </button>
          </li>
        ))}
      </ol>

      {step === "guide" && <GuideStep onStart={() => setStep("flash")} />}

      {(step === "flash" || step === "exam") && (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <div className="glass flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1">
              {topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTopicId(t.id)}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-bold",
                    t.id === topic?.id ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "text-slate-600 dark:text-slate-300"
                  )}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12.5px]">
            {(["All", "MCQ", "Written"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1.5 font-bold",
                  typeFilter === f ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "glass"
                )}
              >
                {f}
              </button>
            ))}
            <label className="glass flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold">
              <input type="checkbox" checked={seenOnly} onChange={(e) => setSeenOnly(e.target.checked)} className="h-4 w-4 accent-amber-500" />
              Seen in past papers only
            </label>
          </div>

          {step === "flash"
            ? <FlashStep key={topic?.id} items={items} topicName={topic?.name ?? ""} marks={marks} onMark={mark} />
            : <ExamStep key={topic?.id + typeFilter + String(seenOnly)} items={items} topicName={topic?.name ?? ""} onMark={mark} />}
        </div>
      )}
    </div>
  );
}

function GuideStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="mt-4 grid gap-3">
      {STUDY_PLAN.map((d, i) => (
        <GlassCard key={d.day} className="p-5">
          <h3 className="font-extrabold">{d.day}</h3>
          <ul className="mt-2 space-y-1.5">
            {d.blocks.map((b) => (
              <li key={b} className="flex items-start gap-2 text-[13px] text-slate-600 dark:text-slate-400">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-cyan-500/15 text-[11px] font-black text-cyan-700 dark:text-cyan-300">{i + 1}</span>
                {b}
              </li>
            ))}
          </ul>
        </GlassCard>
      ))}
      <button onClick={onStart} className="rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:brightness-110">
        Start Step 2 — Flashcards →
      </button>
    </div>
  );
}

interface ItemView {
  id: string;
  type: "MCQ" | "Written";
  seen?: string;
  q: string;
  a: string;
  ex: string;
}

function SeenTag({ seen }: { seen?: string }) {
  if (!seen) return null;
  return (
    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-bold text-amber-700 dark:text-amber-300">
      Seen • {seen}
    </span>
  );
}

function FlashStep({ items, topicName, marks, onMark }: {
  items: ItemView[]; topicName: string;
  marks: Record<string, Mark>; onMark: (id: string, m: Mark | null) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = items[Math.min(idx, Math.max(items.length - 1, 0))];
  if (!card) {
    return <GlassCard className="mt-3 p-6 text-center text-sm text-slate-500">No cards match this filter — try “All”.</GlassCard>;
  }
  const go = (d: number) => {
    setIdx((i) => Math.min(items.length - 1, Math.max(0, i + d)));
    setFlipped(false);
  };
  const cur = marks[card.id];
  return (
    <div className="mt-3">
      <p className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400">
        {topicName} • Card {idx + 1} of {items.length} • {card.type}
      </p>
      <button
        onClick={() => setFlipped((f) => !f)}
        className="glass mt-2 block min-h-[220px] w-full rounded-3xl p-6 text-left transition hover:border-cyan-500/40"
        aria-live="polite"
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-purple-500/15 px-2.5 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-300">
            {flipped ? "Answer ✓ — tap to hide" : "Question — tap to reveal"}
          </span>
          <SeenTag seen={card.seen} />
        </span>
        {!flipped ? (
          <span className="mt-3 block text-[15px] font-bold leading-7">{card.q}</span>
        ) : (
          <span className="mt-3 block">
            <span className="block rounded-xl bg-emerald-500/10 p-3 text-[14px] font-bold leading-7 text-emerald-800 dark:text-emerald-200">{card.a}</span>
            <span className="mt-2 block text-[13px] leading-6 text-slate-600 dark:text-slate-400">{card.ex}</span>
          </span>
        )}
      </button>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => go(-1)} disabled={idx === 0} className="glass rounded-full px-4 py-2 text-[13px] font-bold disabled:opacity-40">← Prev</button>
        <button onClick={() => go(1)} disabled={idx === items.length - 1} className="glass rounded-full px-4 py-2 text-[13px] font-bold disabled:opacity-40">Next →</button>
        <span className="mx-1 h-5 w-px bg-slate-300 dark:bg-white/15" />
        <button
          onClick={() => onMark(card.id, cur === "ok" ? null : "ok")}
          className={cn("rounded-full px-4 py-2 text-[13px] font-bold", cur === "ok" ? "bg-emerald-500 text-white" : "glass")}
        >
          {cur === "ok" ? "✓ Mastered" : "Mark mastered"}
        </button>
        <button
          onClick={() => onMark(card.id, cur === "review" ? null : "review")}
          className={cn("rounded-full px-4 py-2 text-[13px] font-bold", cur === "review" ? "bg-amber-500 text-white" : "glass")}
        >
          {cur === "review" ? "★ To review" : "Needs review"}
        </button>
      </div>
    </div>
  );
}

function ExamStep({ items, topicName, onMark }: {
  items: ItemView[]; topicName: string; onMark: (id: string, m: Mark) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState<{ right: number; wrong: number }>({ right: 0, wrong: 0 });
  const [finished, setFinished] = useState(false);
  if (!items.length) {
    return <GlassCard className="mt-3 p-6 text-center text-sm text-slate-500">No questions match this filter — try “All”.</GlassCard>;
  }
  const card = items[Math.min(idx, items.length - 1)];
  const total = items.length;

  const judge = (ok: boolean) => {
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1) }));
    onMark(card.id, ok ? "ok" : "review");
    if (idx + 1 >= total) setFinished(true);
    else { setIdx(idx + 1); setRevealed(false); }
  };
  const restart = () => {
    setIdx(0); setRevealed(false); setScore({ right: 0, wrong: 0 }); setFinished(false);
  };

  if (finished) {
    const pct = Math.round((100 * score.right) / Math.max(total, 1));
    return (
      <GlassCard className="mt-3 p-6 text-center">
        <p className="text-[12px] font-bold uppercase tracking-widest text-slate-500">Exam finished • {topicName}</p>
        <p className="mt-2 bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-5xl font-black text-transparent">{pct}%</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {score.right} right • {score.wrong} to review • {total} attempted
        </p>
        <p className="mx-auto mt-2 max-w-md text-[13px] text-slate-500 dark:text-slate-400">
          {pct >= 80 ? "Exam-ready. Redo the ★ review cards tomorrow." : pct >= 50 ? "Good base — flip through the guide once more, then retake." : "Re-read the guide (Step 1), then retry the flashcards (Step 2)."}
        </p>
        <button onClick={restart} className="mt-4 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white">Retake exam</button>
      </GlassCard>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[12.5px] font-semibold text-slate-500 dark:text-slate-400">
        <span>{topicName} • Q{idx + 1}/{total} • {card.type}</span>
        <span className="text-emerald-600 dark:text-emerald-300">✓ {score.right}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-600" style={{ width: `${(100 * idx) / total}%` }} />
      </div>
      <GlassCard className="mt-2 p-5">
        <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
          <SeenTag seen={card.seen} />
          <span className="leading-7">{card.q}</span>
        </p>
        <p className="mt-3 text-[12.5px] text-slate-500 dark:text-slate-400">Answer on paper or in your head first — then reveal.</p>
        {!revealed ? (
          <button onClick={() => setRevealed(true)} className="mt-3 rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white dark:bg-white dark:text-slate-900">
            Reveal answer
          </button>
        ) : (
          <div className="mt-3">
            <p className="rounded-xl bg-emerald-500/10 p-3 text-[14px] font-bold leading-7 text-emerald-800 dark:text-emerald-200">{card.a}</p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600 dark:text-slate-400">{card.ex}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => judge(true)} className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-[13px] font-bold text-white">I got it right ✓</button>
              <button onClick={() => judge(false)} className="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 text-[13px] font-bold text-white">I missed it ✗</button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
