"use client";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard, SectionTitle } from "@/components/ui";
import { StudyShell } from "@/components/study-platform/ui";

interface VersionInfo {
  slug: string;
  labelBn: string;
  labelEn: string;
  durationMin: number;
  totalMarks: number;
  negative: number;
  unanswered: number;
  leaveBn: string;
  leaveEn: string;
  demo?: boolean;
}

const VERSIONS: Record<string, VersionInfo> = {
  "demo-20q-15min-v1": {
    slug: "demo-20q-15min-v1", labelBn: "ডেমো সংস্করণ — ২০ প্রশ্ন / ১৫ মিনিট", labelEn: "Demo version — 20 questions / 15 minutes",
    durationMin: 15, totalMarks: 20, negative: 0.5, unanswered: 0,
    leaveBn: "পেজ ছাড়লে সতর্কতা; সময় থামবে না; রিফ্রেশে deadline বাড়বে না।", leaveEn: "Leaving shows a warning; the timer keeps running.",
    demo: true,
  },
  "bank-it-mcq-v1": {
    slug: "bank-it-mcq-v1", labelBn: "ব্যাংক আইটি MCQ — সংস্করণ ১", labelEn: "Bank IT MCQ — version 1",
    durationMin: 60, totalMarks: 80, negative: 0.25, unanswered: 0,
    leaveBn: "রিফ্রেশ/রিকানেক্টে সময় বাড়বে না।", leaveEn: "Refresh/reconnect does not extend the deadline.",
  },
};

/** /study/exams/[slug] — pre-exam instructions + start confirmation. */
export default function ExamIntro({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const v = slug ? VERSIONS[slug] : undefined;
  if (slug && !v) {
    return <StudyShell><GlassCard className="p-8 text-center">সংস্করণ পাওয়া যায়নি। <a href="/study/posts" className="underline">পদ দেখুন</a></GlassCard></StudyShell>;
  }
  if (!v) return <StudyShell><GlassCard className="p-8 text-center text-sm text-slate-500">লোড হচ্ছে…</GlassCard></StudyShell>;

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/study-platform/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", versionSlug: v.slug }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Could not start");
      router.push(`/study/exams/${v.slug}/attempt/${j.attemptId}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <StudyShell>
      <SectionTitle kicker="Study • Timed exam" title={v.labelBn} desc={v.labelEn} />
      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <GlassCard>
          <h2 className="font-extrabold">📋 নির্দেশনা (পড়ুন)</h2>
          <ul className="mt-2 space-y-1.5 text-[13.5px] leading-7 text-slate-600 dark:text-slate-300">
            <li>• সময়: <b>{v.durationMin} মিনিট</b> (সার্ভার-deadline; ক্লায়েন্ট টাইমার শুধু প্রদর্শন)।</li>
            <li>• নম্বর: <b>{v.totalMarks}</b>; ভুলে <b>−{v.negative}</b>; অনুত্তরিতে <b>{v.unanswered}</b>।</li>
            <li>• উত্তর স্বয়ংক্রিয় সংরক্ষণ; ফ্ল্যাগ/প্যালেট/রিভিউ-স্ক্রিন আছে।</li>
            <li>• সময় শেষে <b>ঠিক একবার</b> স্বয়ংক্রিয় জমা; রিফ্রেশ/রিকানেক্টে সময় বাড়ে না।</li>
            <li>• Leave নীতি: {v.leaveBn}</li>
            <li>• জমার পর ব্যাখ্যা/সাইটেশন দেখা যাবে; provisional কী আলাদা চিহ্নিত।</li>
          </ul>
          <div className="mt-3 rounded-xl bg-purple-500/10 p-3 text-[12.5px]">
            ♿ অ্যাক্সেসিবিলিটি: কীবোর্ড (←/→, 1–4, F), স্ক্রিন-রিডার ঘোষণা, বড় টাচ-টার্গেট। <span className="font-bold">Sample preview:</span> নিচে ১টি নমুনা।
          </div>
          <div className="mt-2 rounded-xl bg-slate-900/[.04] p-3 text-[13px] dark:bg-white/5">
            <p className="font-bold">নমুনা: 192.168.10.45/27-এ ব্রডকাস্ট কোনটি?</p>
            <p className="mt-1 text-slate-500">ক) .63 • খ) .31 • গ) .62 • ঘ) .45 — (আসল পরীক্ষায় শাফল হবে)</p>
          </div>
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-[13.5px] font-semibold">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-1 h-4 w-4 accent-cyan-500" />
            আমি নির্দেশনা পড়েছি এবং সার্ভার-deadline, নেগেটিভ মার্কিং ও leave-নীতি বুঝেছি।
          </label>
          {error && <p role="alert" className="mt-2 text-[13px] font-bold text-rose-500">{error}</p>}
          <button onClick={start} disabled={!ack || busy} className="mt-3 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3.5 text-sm font-bold text-white disabled:opacity-50 sm:w-auto">
            {busy ? "শুরু হচ্ছে…" : "▶ পরীক্ষা শুরু করুন"}
          </button>
        </GlassCard>
        <GlassCard>
          <h3 className="text-sm font-extrabold">⚙️ কনফিগারেশন</h3>
          <dl className="mt-2 space-y-1.5 text-[13px]">
            <div className="flex justify-between"><dt>Duration</dt><dd className="font-bold">{v.durationMin} min</dd></div>
            <div className="flex justify-between"><dt>Marks</dt><dd className="font-bold">{v.totalMarks}</dd></div>
            <div className="flex justify-between"><dt>Negative</dt><dd className="font-bold">−{v.negative}</dd></div>
            <div className="flex justify-between"><dt>Unanswered</dt><dd className="font-bold">{v.unanswered}</dd></div>
            {v.demo && <p className="rounded-full bg-purple-500/15 px-2.5 py-1 text-center text-[11px] font-black text-purple-700 dark:text-purple-300">ডেমো ফিক্সচার — সার্বজনীন নিয়ম নয়</p>}
          </dl>
        </GlassCard>
      </div>
    </StudyShell>
  );
}
