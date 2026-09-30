"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Download, Lock, ShoppingCart, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui";
import { CheckoutModal } from "@/components/checkout-modal";
import type { StudyMaterial } from "@/lib/study-data";

interface AccessState {
  loggedIn: boolean;
  fileType: string;
  read: boolean;
  download: boolean;
  gate: "ok" | "login" | "pay";
  priceBDT: number;
  paid: boolean;
  previewPages: number;
}

/**
 * Gated reader: everyone gets the free preview (first N PDF pages);
 * login continues reading/downloading free guides; paid guides need a
 * verified bKash order first. Full bytes only ever come from /api/study/read.
 */
export function StudyReader({ material }: { material: StudyMaterial }) {
  const router = useRouter();
  const [access, setAccess] = useState<AccessState | null>(null);
  const [buy, setBuy] = useState(false);
  const [dlBusy, setDlBusy] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/study/access?id=${encodeURIComponent(material.id)}`)
      .then((r) => r.json())
      .then(setAccess)
      .catch(() => {});
  }, [material.id]);

  const refresh = () => {
    fetch(`/api/study/access?id=${encodeURIComponent(material.id)}`)
      .then((r) => r.json())
      .then(setAccess)
      .catch(() => {});
  };

  const download = async () => {
    setDlError(null);
    if (!access) return;
    if (!access.loggedIn || !access.download) {
      if (access.gate === "pay") {
        setBuy(true);
        return;
      }
      router.push(`/login?next=${encodeURIComponent(`/study/${material.id}`)}`);
      return;
    }
    setDlBusy(true);
    try {
      const res = await fetch(`/api/study/download?id=${encodeURIComponent(material.id)}`);
      if (res.status === 401) {
        refresh();
        router.push(`/login?next=${encodeURIComponent(`/study/${material.id}`)}`);
        return;
      }
      if (res.status === 402) {
        refresh();
        setBuy(true);
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

  const isPdf = material.fileType === "pdf";
  const isLink = material.fileType === "link";
  const previewUrl = `/api/study/preview?id=${encodeURIComponent(material.id)}`;
  const fullUrl = `/api/study/read?id=${encodeURIComponent(material.id)}`;

  const downloadBtn = (primary: boolean) => (
    <button
      onClick={download}
      disabled={dlBusy || !access}
      title={!access ? "Checking access…" : access.gate === "pay" ? `Buy ৳${access.priceBDT} to download` : access.loggedIn ? "Download" : "Login required"}
      className={
        primary
          ? "flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 p-4 text-left text-white hover:brightness-110 disabled:opacity-60"
          : "glass hover-glow flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold disabled:opacity-60"
      }
    >
      {access && !access.loggedIn ? <Lock size={primary ? 20 : 14} /> : <Download size={primary ? 20 : 14} />}
      <span>
        <span className={primary ? "block font-extrabold" : ""}>
          {dlBusy ? "Preparing…" : !access ? "Download" : access.gate === "pay" ? `Buy ৳${access.priceBDT} to download` : access.loggedIn ? "Download" : "Login to download"}
        </span>
        {primary && (
          <span className="block text-[12.5px] text-white/80">
            {!access || access.gate === "login" ? "Free — one quick login" : access.gate === "pay" ? "bKash Send Money, manual verify" : "Save it for offline reading"}
          </span>
        )}
      </span>
    </button>
  );

  const gateCard = () => {
    if (!access) return null;
    if (access.gate === "ok") return null;
    const login = access.gate === "login";
    return (
      <GlassCard className="border-cyan-500/30 p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 text-white">
          {login ? <BookOpen size={22} /> : <ShoppingCart size={22} />}
        </span>
        <h3 className="mt-2 font-extrabold">
          {login ? (isPdf ? "Keep reading — free with login" : "Open the full module — free with login") : `This guide costs ৳${access.priceBDT}`}
        </h3>
        <p className="mx-auto mt-1 max-w-md text-[13px] text-slate-600 dark:text-slate-400">
          {login
            ? "You just read the free preview. Sign in with Google to continue reading and download — it takes seconds."
            : "Pay once via bKash Send Money and the full guide + download unlock after quick manual verification."}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {login ? (
            <Link
              href={`/login?next=${encodeURIComponent(`/study/${material.id}`)}`}
              className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white hover:brightness-110"
            >
              Continue with Google →
            </Link>
          ) : (
            <button
              onClick={() => setBuy(true)}
              className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-2.5 text-sm font-bold text-white hover:brightness-110"
            >
              Buy ৳{access.priceBDT} via bKash
            </button>
          )}
          {downloadBtn(false)}
        </div>
        {!login && (
          <p className="mt-2 text-[12px] text-slate-500">Already paid? Orders verify manually — the full guide unlocks here once approved.</p>
        )}
      </GlassCard>
    );
  };

  const readerShell = (src: string, label: string) => (
    <div id="study-reader" className="scroll-mt-24">
    <GlassCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between px-4 py-2.5">
        <p className="text-[12.5px] font-bold text-slate-500 dark:text-slate-400">{label}</p>
        <a href={src} target="_blank" rel="noopener" className="text-[12.5px] font-bold text-cyan-700 underline dark:text-cyan-300">
          Open fullscreen
        </a>
      </div>
      <iframe src={src} title={material.title} className="h-[70vh] w-full border-0 bg-white" loading="lazy" />
    </GlassCard>
    </div>
  );

  if (!access) {
    return <GlassCard className="p-10 text-center text-sm text-slate-500">Loading reader…</GlassCard>;
  }

  // External links open out; download stays server-gated.
  if (isLink) {
    return (
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <a href={material.fileUrl} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 p-4 text-white hover:brightness-110">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/20"><Sparkles size={20} /></span>
            <span><span className="block font-extrabold">Open resource</span><span className="block text-[12.5px] text-white/80">Opens in a new tab →</span></span>
          </a>
          {downloadBtn(true)}
        </div>
        {dlError && <p role="alert" className="text-[13px] font-semibold text-rose-500">{dlError}</p>}
      </div>
    );
  }

  // Interactive (HTML) module: full module only for entitled readers.
  if (!isPdf) {
    return (
      <div className="grid gap-3">
        {access.read ? (
          readerShell(fullUrl, "Interactive module — unlocked")
        ) : (
          <>
            <GlassCard className="p-6 text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">Interactive module</p>
              <h3 className="mt-1 font-extrabold">Practice inside: flashcards, exam mode, progress tracking</h3>
              <p className="mx-auto mt-1 max-w-md text-[13px] text-slate-600 dark:text-slate-400">Start below with the built-in practice — or unlock the full interactive module.</p>
            </GlassCard>
            {gateCard()}
          </>
        )}
        {dlError && <p role="alert" className="text-[13px] font-semibold text-rose-500">{dlError}</p>}
        {buy && (
          <CheckoutModal open onClose={() => { setBuy(false); refresh(); }} itemType="study" itemId={material.id} itemName={material.title} amountBDT={access.priceBDT} />
        )}
      </div>
    );
  }

  // PDF: free preview for everyone, full document for entitled readers.
  return (
    <div className="grid gap-3">
      {access.read ? (
        readerShell(fullUrl, access.paid ? "Full guide — unlocked, thank you!" : "Full guide — unlocked")
      ) : (
        <>
          {readerShell(previewUrl, `Free preview — first ${access.previewPages} pages, no login needed`)}
          <div className="-mt-1">{gateCard()}</div>
        </>
      )}
      <div className="flex flex-wrap gap-2">{downloadBtn(false)}</div>
      {dlError && <p role="alert" className="text-[13px] font-semibold text-rose-500">{dlError}</p>}
      {buy && (
        <CheckoutModal open onClose={() => { setBuy(false); refresh(); }} itemType="study" itemId={material.id} itemName={material.title} amountBDT={access.priceBDT} />
      )}
    </div>
  );
}
