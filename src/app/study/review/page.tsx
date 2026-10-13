"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard, SectionTitle } from "@/components/ui";
import { CodeText } from "@/components/study-platform/code-text";
import { EmptyState, StudyShell } from "@/components/study-platform/ui";
import type { Question } from "@/lib/study-platform/types";
import { cn } from "@/lib/cn";

const GRADES = [
  { v: 0, bn: "আবার", en: "Again", cls: "bg-rose-500" },
  { v: 3, bn: "কঠিন", en: "Hard", cls: "bg-amber-500" },
  { v: 4, bn: "পেরেছি", en: "Good", cls: "bg-emerald-500" },
  { v: 5, bn: "সহজ", en: "Easy", cls: "bg-cyan-500" },
];

/** /study/review — SM-2 due queue with Again/Hard/Good/Easy grading. */
export default function ReviewPage() {
  const [items, setItems] = useState<Question[]>([]);
  const [summary, setSummary] = useState<{ due: number; fresh: number; total: number } | null>(null);
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<"bn" | "en">("bn");

  useEffect(() => {
    fetch("/api/study-platform/schedule").then(async (r) => {
      if (r.status === 401) { setError("login"); return; }
      const j = await r.json();
      setItems(j.queue ?? []);
      setSummary(j.summary ?? null);
    }).catch(() => setError("load"));
  }, []);

  if (error === "login") {
    return (
      <StudyShell>
        <GlassCard className="p-8 text-center">
          <p className="font-extrabold">রিভিউ দেখতে লগইন করুন</p>
          <Link href="/login?next=/study/review" className="mt-3 inline-block rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white">Continue with Google →</Link>
        </GlassCard>
      </StudyShell>
    );
  }
  if (error || !summary) {
    return <StudyShell><GlassCard className="p-8 text-center text-sm text-slate-500">{error ? "লোড ব্যর্থ — আবার চেষ্টা করুন।" : "লোড হচ্ছে…"}</GlassCard></StudyShell>;
  }

  const card = items[idx];
  if (!card) {
    return (
      <StudyShell>
        <SectionTitle kicker="Study • Review" title="আজকের রিভিউ শেষ 🎉" desc={`✓ ${done}টি graded • বাকি নেই — কাল আবার আসুন (streak বজায় থাকবে)।`} />
        <div className="grid gap-2 sm:grid-cols-2">
          <Link href="/study/practice" className="rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3.5 text-center text-sm font-bold text-white">নতুন অনুশীলন →</Link>
          <Link href="/study/progress" className="glass rounded-2xl px-6 py-3.5 text-center text-sm font-bold">অগ্রগতি →</Link>
        </div>
      </StudyShell>
    );
  }

  const grade = async (v: number) => {
    try {
      await fetch("/api/study-platform/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: card.id, grade: v }),
      });
    } catch { /* offline — grade lost, item stays due */ }
    setDone((d) => d + 1);
    setShown(false);
    setIdx((i) => i + 1);
  };

  const opts = lang === "en" ? card.locale.en.options : card.locale.bn.options;

  return (
    <StudyShell>
      <SectionTitle
        kicker="Study • Spaced review"
        title={`ডিউ রিভিউ (${idx + 1}/${items.length})`}
        desc={`Due ${summary.due} • নতুন ${summary.fresh} • মনে রাখার হার বাড়াতে প্রতিদিন গ্রেড করুন।`}
      />
      <div className="mb-2 flex gap-2">
        {(["bn", "en"] as const).map((l) => (
          <button key={l} onClick={() => setLang(l)} className={cn("rounded-full px-4 py-1.5 text-[12.5px] font-bold", lang === l ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "glass")}>
            {l === "bn" ? "বাংলা" : "English"}
          </button>
        ))}
      </div>
      <GlassCard>
        <p className="text-[15px] font-bold leading-8"><CodeText text={card.locale[lang].stem} /></p>
        {!shown ? (
          <button onClick={() => setShown(true)} className="mt-3 rounded-xl bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white dark:bg-white dark:text-slate-900">
            উত্তর দেখুন
          </button>
        ) : (
          <div className="mt-3" aria-live="polite">
            <div className="grid gap-1.5">
              {opts.map((t, i) => {
                const isKey = card.options[i]?.id === card.key.optionId;
                return (
                  <p key={i} className={cn("rounded-xl p-2.5 text-[13.5px] leading-7", isKey ? "bg-emerald-500/10 font-bold text-emerald-800 dark:text-emerald-200" : "text-slate-600 dark:text-slate-400")}>
                    <CodeText text={t} />
                  </p>
                );
              })}
            </div>
            <p className="mt-2 text-[13px] leading-7 text-slate-600 dark:text-slate-300"><CodeText text={card.locale[lang].explanation} /></p>
            <p className="mt-3 text-[12.5px] font-bold text-slate-500">কেমন মনে ছিল?</p>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {GRADES.map((g) => (
                <button key={g.v} onClick={() => grade(g.v)} className={cn("rounded-xl px-2 py-2.5 text-[12.5px] font-black text-white", g.cls)}>
                  {g.bn}<span className="block text-[10.5px] font-bold opacity-80">{g.en}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
      {card.key.status === "provisional" && <p className="mt-2 text-[12.5px] font-bold text-amber-600">⚠ Provisional key — যাচাই বাকি</p>}
    </StudyShell>
  );
}
