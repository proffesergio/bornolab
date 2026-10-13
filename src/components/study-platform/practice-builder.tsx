"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui";
import { CyanButton, EmptyState } from "./ui";
import type { Question } from "@/lib/study-platform/types";

interface Filters {
  post: string;
  version: string;
  subject: string;
  chapter: string;
  difficulty: string;
  lang: string;
  qtype: string;
  mode: string;
  count: number;
}

const DEFAULTS: Filters = { post: "", version: "demo-20q-15min-v1", subject: "", chapter: "", difficulty: "", lang: "bn", qtype: "", mode: "all", count: 10 };

/** Custom practice builder — instant-feedback mode (not a timed exam). */
export function PracticeBuilder({ initial }: { initial?: Partial<Filters> }) {
  const router = useRouter();
  const [f, setF] = useState<Filters>(() => {
    // Lazy init from URL (e.g. /study/practice?chapter=ipv4-subnetting) — runs
    // during render so no setState-in-effect is needed; SSR-safe via typeof check.
    const base = { ...DEFAULTS, ...initial };
    if (typeof window === "undefined") return base;
    const ch = new URLSearchParams(window.location.search).get("chapter");
    return ch ? { ...base, chapter: ch } : base;
  });
  const [items, setItems] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const set = (k: keyof Filters, v: string | number) => setF((p) => ({ ...p, [k]: v }));

  const build = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/study-platform/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const j = await r.json();
      setItems(j.items ?? []);
      setIdx(0);
      setPicked(null);
      setScore({ right: 0, wrong: 0 });
      setStarted(true);
    } finally {
      setLoading(false);
    }
  };

  const card = items[idx];
  const lang = (f.lang === "en" ? "en" : "bn") as "bn" | "en";
  const judge = (optId: string) => {
    if (!card || picked) return;
    setPicked(optId);
    const ok = optId === card.key.optionId;
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), wrong: s.wrong + (ok ? 0 : 1) }));
  };
  const next = () => {
    setPicked(null);
    setIdx((i) => i + 1);
  };

  const field = "focus-glow w-full rounded-xl bg-slate-100 p-2.5 text-sm outline-none dark:bg-black/30";

  return (
    <div>
      <GlassCard>
        <h2 className="font-extrabold">🛠️ অনুশীলন তৈরি করুন (instant feedback)</h2>
        <p className="mt-1 text-[12.5px] text-slate-500">টাইমড পরীক্ষার আগে দুর্বল টপিক ঝালিয়ে নিন। এটি পরীক্ষা নয় — উত্তর সঙ্গে সঙ্গে দেখা যায়।</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <label className="text-[12px] font-bold">Version
            <select value={f.version} onChange={(e) => set("version", e.target.value)} className={field}>
              <option value="demo-20q-15min-v1">ডেমো — ২০ প্রশ্ন/১৫ মিনিট</option>
              <option value="bank-it-mcq-v1">ব্যাংক IT MCQ v1</option>
            </select>
          </label>
          <label className="text-[12px] font-bold">Difficulty
            <select value={f.difficulty} onChange={(e) => set("difficulty", e.target.value)} className={field}>
              <option value="">সব</option><option value="easy">সহজ</option><option value="medium">মাঝারি</option><option value="hard">কঠিন</option>
            </select>
          </label>
          <label className="text-[12px] font-bold">Language
            <select value={f.lang} onChange={(e) => set("lang", e.target.value)} className={field}>
              <option value="bn">বাংলা</option><option value="en">English</option>
            </select>
          </label>
          <label className="text-[12px] font-bold">Queue
            <select value={f.mode} onChange={(e) => set("mode", e.target.value)} className={field}>
              <option value="all">সব প্রশ্ন</option><option value="wrong">ভুল-হওয়া</option><option value="unanswered">অনুত্তরিত</option><option value="bookmarked">বুকমার্কড</option>
            </select>
          </label>
          <label className="text-[12px] font-bold">Count
            <select value={String(f.count)} onChange={(e) => set("count", Number(e.target.value))} className={field}>
              {[5, 10, 15, 20].map((c) => <option key={c} value={String(c)}>{c}টি</option>)}
            </select>
          </label>
          <div className="flex items-end">
            <button onClick={build} disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {loading ? "তৈরি হচ্ছে…" : "▶ অনুশীলন শুরু"}
            </button>
          </div>
        </div>
      </GlassCard>

      {started && items.length === 0 && (
        <div className="mt-3"><EmptyState title="কোনো প্রশ্ন মেলেনি" desc="ফিল্টার বদলে আবার চেষ্টা করুন।" /></div>
      )}

      {card && idx < items.length && (
        <GlassCard className="mt-3">
          <p className="text-[12px] font-bold text-slate-500">প্রশ্ন {idx + 1}/{items.length} • ✓ {score.right} • ✗ {score.wrong} {card.key.status === "provisional" && <span className="ml-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-amber-700">⚠ provisional</span>}</p>
          <p className="mt-2 text-[15px] font-bold leading-8">{card.locale[lang].stem}</p>
          <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Options">
            {(lang === "en" ? card.locale.en.options : card.locale.bn.options).map((text, i) => {
              const optId = card.options[i]?.id ?? "";
              const isKey = optId === card.key.optionId;
              const isPick = picked === optId;
              return (
                <button
                  key={i}
                  role="radio"
                  aria-checked={isPick}
                  onClick={() => judge(optId)}
                  disabled={!!picked}
                  className={`rounded-xl border p-3 text-left text-[13.5px] leading-7 transition ${picked ? (isKey ? "border-emerald-500 bg-emerald-500/10 font-bold" : isPick ? "border-rose-500 bg-rose-500/10" : "opacity-70") : "hover:border-cyan-500/50"}`}
                >
                  <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-slate-900/[.06] text-[12px] font-black dark:bg-white/10">{["ক", "খ", "গ", "ঘ"][i] ?? i + 1}</span>
                  {text}
                </button>
              );
            })}
          </div>
          {picked && (
            <div className="mt-3" aria-live="polite">
              <p className="text-[13px] leading-7 text-slate-600 dark:text-slate-300">{card.locale[lang].explanation}</p>
              <div className="mt-2 flex gap-2">
                {idx + 1 < items.length
                  ? <button onClick={next} className="rounded-full bg-slate-900 px-5 py-2 text-[13px] font-bold text-white dark:bg-white dark:text-slate-900">পরেরটি →</button>
                  : <p className="font-extrabold">শেষ! ✓ {score.right + (picked === card.key.optionId ? 0 : 0)}/{items.length} — <button onClick={() => router.push("/study/progress")} className="underline">অগ্রগতি দেখুন</button></p>}
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {started && items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <CyanButton href="/study/exams/demo-20q-15min-v1">⏱️ টাইমড পরীক্ষা দিন →</CyanButton>
        </div>
      )}
    </div>
  );
}
