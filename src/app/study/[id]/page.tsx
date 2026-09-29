"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Download, ExternalLink, Lock, Share2, Check, GraduationCap, Sparkles } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { StudyPractice } from "@/components/study-practice";
import { useLogin } from "@/components/use-login";
import { PRACTICE_TOPICS, studyCategoryLabel, type StudyMaterial } from "@/lib/study-data";

/** Shared, readable by everyone — download requires login (enforced server-side). */
export default function StudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [material, setMaterial] = useState<StudyMaterial | null | undefined>(undefined);
  const [siblings, setSiblings] = useState<StudyMaterial[]>([]);
  const { loggedIn, refresh } = useLogin();
  const [dlBusy, setDlBusy] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);
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
  const isPdf = material.fileType === "pdf";
  const isLink = material.fileType === "link";

  const download = async () => {
    setDlError(null);
    // Recheck at click time: never bounce a signed-in user to /login
    // just because the initial session check was slow or failed once.
    const ok = loggedIn === true || (loggedIn === null && (await refresh()));
    if (!ok) {
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
      const ext = isLink ? "pdf" : material.fileType;
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

  const scrollToReader = () => {
    document.getElementById("study-reader")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div>
      <Link href="/study" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        <ArrowLeft size={14} /> Study Hub
      </Link>
      <div className="mt-2">
        <SectionTitle
          kicker={`${studyCategoryLabel(material.category)}${material.subcategory ? ` • ${material.subcategory}` : ""}`}
          title={material.title}
        />
      </div>
      <p className="mt-3 max-w-3xl text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">{material.description}</p>

      {/* two clear options */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {!isLink && (
          <button
            onClick={scrollToReader}
            className="glass hover-glow group flex items-center gap-3 rounded-2xl p-4 text-left"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 text-white">
              {isPdf ? <BookOpen size={20} /> : <Sparkles size={20} />}
            </span>
            <span>
              <span className="block font-extrabold">{isPdf ? "Read online — free" : "Open the interactive module"}</span>
              <span className="block text-[12.5px] text-slate-500 dark:text-slate-400">
                {isPdf ? "Full guide below, no login needed" : "Step-by-step, no login needed"} →
              </span>
            </span>
          </button>
        )}
        {isLink ? (
          <a
            href={material.fileUrl} target="_blank" rel="noopener"
            className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 p-4 text-white hover:brightness-110"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/20">
              <ExternalLink size={20} />
            </span>
            <span>
              <span className="block font-extrabold">Open resource</span>
              <span className="block text-[12.5px] text-white/80">Opens in a new tab →</span>
            </span>
          </a>
        ) : isPdf ? (
          <button
            onClick={download} disabled={dlBusy}
            title={loggedIn === false ? "Login required to download" : "Download the PDF"}
            className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 p-4 text-left text-white hover:brightness-110 disabled:opacity-60"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/20">
              {loggedIn === false ? <Lock size={20} /> : <Download size={20} />}
            </span>
            <span>
              <span className="block font-extrabold">{dlBusy ? "Preparing…" : loggedIn === false ? "Login to download" : "Download PDF"}</span>
              <span className="block text-[12.5px] text-white/80">
                {loggedIn === false ? "Free — one quick login" : "Save it for offline reading"}
              </span>
            </span>
          </button>
        ) : (
          <button
            onClick={scrollToReader}
            className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 p-4 text-left text-white hover:brightness-110"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/20">
              <GraduationCap size={20} />
            </span>
            <span>
              <span className="block font-extrabold">Practice below</span>
              <span className="block text-[12.5px] text-white/80">Flashcards & exam mode included →</span>
            </span>
          </button>
        )}
      </div>
      <div className="mt-3">
        <button onClick={share} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
          {copied ? "Link copied!" : "Share this page"}
        </button>
      </div>
      {dlError && <p role="alert" className="mt-2 text-[13px] font-semibold text-rose-500">{dlError}</p>}
      {siblings.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
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

      {/* reader — public */}
      {!isLink && (
        <div id="study-reader" className="mt-4 scroll-mt-24">
        <GlassCard className="overflow-hidden p-0">
          <div className="flex items-center justify-between px-4 py-2.5">
            <p className="text-[12.5px] font-bold text-slate-500 dark:text-slate-400">
              {isPdf ? "Reading room — free for everyone" : "Interactive module — free for everyone"}
            </p>
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
        </div>
      )}

      {/* step-by-step practice */}
      <h2 className="mb-3 mt-10 flex items-center gap-1.5 text-lg font-black">
        <GraduationCap size={19} /> Practice this guide — step by step
      </h2>
      <StudyPractice topics={topics} />
    </div>
  );
}
