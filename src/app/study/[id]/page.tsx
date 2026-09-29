"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, Lock, Share2, Check, GraduationCap } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { StudyPractice } from "@/components/study-practice";
import { PRACTICE_TOPICS, studyCategoryLabel, type StudyMaterial } from "@/lib/study-data";

/** Shared, readable by everyone — download requires login (enforced server-side). */
export default function StudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [material, setMaterial] = useState<StudyMaterial | null | undefined>(undefined);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [dlBusy, setDlBusy] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/study").then((r) => r.json()).then((j) => {
      const found = (j.materials ?? []).find((m: StudyMaterial) => m.id === id) ?? null;
      setMaterial(found);
    }).catch(() => setMaterial(null));
    fetch("/api/auth/me").then((r) => r.json()).then((j) => setLoggedIn(Boolean(j.user))).catch(() => setLoggedIn(false));
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

  const download = async () => {
    setDlError(null);
    if (!loggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/study/${material.id}`)}`);
      return;
    }
    setDlBusy(true);
    try {
      const res = await fetch(`/api/study/download?id=${encodeURIComponent(material.id)}`);
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/study/${material.id}`)}`);
        return;
      }
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Download failed (${res.status})`);
      const blob = await res.blob();
      const ext = material.fileType === "link" ? "pdf" : material.fileType;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${material.title.replace(/["\r\n/\\]/g, "").slice(0, 80)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (e) {
      setDlError((e as Error).message);
    } finally {
      setDlBusy(false);
    }
  };

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
        <ArrowLeft size={14} /> All study materials
      </Link>
      <div className="mt-2">
        <SectionTitle
          kicker={`Study • ${studyCategoryLabel(material.category)}${material.subcategory ? ` • ${material.subcategory}` : ""}`}
          title={material.title}
        />
      </div>
      <p className="mt-3 max-w-3xl text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">{material.description}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={download} disabled={dlBusy}
          title={loggedIn ? "Download file" : "Login required to download"}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-[13px] font-bold text-white hover:brightness-110 disabled:opacity-60"
        >
          {loggedIn ? <Download size={15} /> : <Lock size={15} />}
          {dlBusy ? "Preparing…" : loggedIn ? "Download" : "Login to download"}
        </button>
        <button onClick={share} className="glass hover-glow flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-bold">
          {copied ? <Check size={15} className="text-emerald-500" /> : <Share2 size={15} />}
          {copied ? "Link copied!" : "Share this page"}
        </button>
        {material.fileType === "link" && (
          <a href={material.fileUrl} target="_blank" rel="noopener" className="glass hover-glow flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-bold">
            <ExternalLink size={15} /> Open external resource
          </a>
        )}
      </div>
      {dlError && <p role="alert" className="mt-2 text-[13px] font-semibold text-rose-500">{dlError}</p>}

      {/* reader — public */}
      {material.fileType !== "link" && (
        <GlassCard className="mt-4 overflow-hidden p-0">
          <div className="flex items-center justify-between px-4 py-2.5">
            <p className="text-[12.5px] font-bold text-slate-500 dark:text-slate-400">Reading preview — free for everyone</p>
            <a href={material.fileUrl} target="_blank" rel="noopener" className="text-[12.5px] font-bold text-cyan-700 underline dark:text-cyan-300">
              Open fullscreen
            </a>
          </div>
          <iframe
            src={material.fileUrl}
            title={material.title}
            className="h-[70vh] w-full border-0 bg-white"
            loading="lazy"
          />
        </GlassCard>
      )}

      {/* step-by-step practice */}
      <h2 className="mb-3 mt-10 flex items-center gap-1.5 text-lg font-black">
        <GraduationCap size={19} /> Practice this guide — step by step
      </h2>
      <StudyPractice topics={topics} />
    </div>
  );
}
