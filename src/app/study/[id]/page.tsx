"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, GraduationCap, Share2 } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { StudyPractice } from "@/components/study-practice";
import { StudyReader } from "@/components/study-reader";
import { PRACTICE_TOPICS, studyCategoryLabel, type StudyMaterial } from "@/lib/study-data";

/** Shared, readable preview for everyone — full read/download gated by login (+ purchase for paid). */
export default function StudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [material, setMaterial] = useState<StudyMaterial | null | undefined>(undefined);
  const [siblings, setSiblings] = useState<StudyMaterial[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/study").then((r) => r.json()).then((j) => {
      const all = (j.materials ?? []) as StudyMaterial[];
      const found = all.find((m) => m.id === id) ?? null;
      setMaterial(found);
      if (found) {
        setSiblings(all.filter((m) =>
          m.id !== found.id &&
          (m.subcategory ? m.subcategory === found.subcategory : m.category === found.category)
        ).slice(0, 2));
      }
    }).catch(() => setMaterial(null));
  }, [id]);

  if (material === undefined) {
    return <GlassCard className="p-10 text-center text-sm text-slate-500">Loading material…</GlassCard>;
  }
  if (material === null) {
    return (
      <GlassCard className="p-10 text-center">
        <p className="font-extrabold">Material not found</p>
        <p className="mt-1 text-sm text-slate-500">It may have been removed by the admin.</p>
        <Link href="/study" className="mt-4 inline-block rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white">← Back to Study Hub</Link>
      </GlassCard>
    );
  }

  const topics = (material.topics?.length ? PRACTICE_TOPICS.filter((t) => material.topics!.includes(t.id)) : PRACTICE_TOPICS);
  const paid = material.access === "paid";

  const share = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copy this link to share:", url);
    }
  };

  return (
    <div>
      <Link href="/study" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        <ArrowLeft size={14} /> Study Hub
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <SectionTitle
            kicker={`${studyCategoryLabel(material.category)}${material.subcategory ? ` • ${material.subcategory}` : ""}`}
            title={material.title}
          />
        </div>
        <span className={paid ? "rounded-full bg-amber-400/20 px-3 py-1.5 text-[12px] font-black text-amber-700 dark:text-amber-300" : "rounded-full bg-emerald-500/15 px-3 py-1.5 text-[12px] font-black text-emerald-600 dark:text-emerald-300"}>
          {paid ? `৳${material.priceBDT ?? 0} • PAID` : "FREE"}
        </span>
      </div>
      <p className="mt-3 max-w-3xl text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">{material.description}</p>

      <div className="mt-3">
        <button onClick={share} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
          {copied ? "Link copied!" : "Share this page"}
        </button>
      </div>
      {siblings.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="font-bold text-slate-500 dark:text-slate-400">Also available as:</span>
          {siblings.map((s) => (
            <Link
              key={s.id} href={`/study/${s.id}`}
              className="glass hover-glow inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold"
            >
              {s.fileType === "pdf" ? "PDF guide" : s.fileType === "link" ? "Resource link" : "Interactive module"} <ArrowRight size={13} />
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4">
        <StudyReader material={material} />
      </div>

      {/* step-by-step practice */}
      <h2 className="mb-3 mt-10 flex items-center gap-1.5 text-lg font-black">
        <GraduationCap size={19} /> Practice this guide — step by step
      </h2>
      <StudyPractice topics={topics} />
    </div>
  );
}
