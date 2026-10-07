"use client";
import { useState } from "react";
import { ShieldCheck, Loader2, Lock } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { downloadBlob } from "@/lib/doc-utils";
import { useSiteConfig } from "@/components/site-widgets";
import { pdfCaps } from "@/lib/site-config-shared";

async function logOp(op: { tool: string; files: number; pages: number; ms: number; ok: boolean; err?: string }) {
  try {
    await fetch("/api/pdf/log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(op) });
  } catch { /* best-effort */ }
}

const MAGIC = "BLABLOCK1";

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 150_000, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
  );
}

export default function ProtectPdfPage() {
  const { config } = useSiteConfig();
  const caps = pdfCaps(config, "protect");
  const [file, setFile] = useState<File | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const protect = async () => {
    setError(null); setDone(null);
    if (!file) { setError("Choose a PDF file first."); return; }
    if (file.size > caps.maxMB * 1024 * 1024) { setError(`Exceeds the ${caps.maxMB} MB per-file cap.`); return; }
    if (pw.length < 4) { setError("Password must be at least 4 characters."); return; }
    if (pw !== pw2) { setError("Passwords do not match."); return; }
    setBusy(true);
    const started = Date.now();
    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(pw, salt);
      const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, data as BufferSource));
      const magic = new TextEncoder().encode(MAGIC);
      const out = new Uint8Array(magic.length + salt.length + iv.length + cipher.length);
      out.set(magic, 0); out.set(salt, magic.length); out.set(iv, magic.length + salt.length); out.set(cipher, magic.length + salt.length + iv.length);
      downloadBlob(new Blob([out as BlobPart], { type: "application/pdf" }), file.name.replace(/\.pdf$/i, "") + ".locked.pdf");
      setDone(`Locked ${file.name} with AES-256-GCM. Open it anytime in BornoLab → Unlock PDF with the same password.`);
      void logOp({ tool: "protect", files: 1, pages: 0, ms: Date.now() - started, ok: true });
    } catch (e) {
      setError(`Lock failed: ${(e as Error).message}`);
      void logOp({ tool: "protect", files: 1, pages: 0, ms: Date.now() - started, ok: false, err: String((e as Error).message) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <SectionTitle kicker="PDF Suite" title="Protect PDF" desc="Lock a PDF with a password using AES-256-GCM — fully client-side. Unlock it later with BornoLab Unlock PDF." />
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[13px] font-semibold text-red-600 dark:text-red-300">{error}</p>}
      {done && <p className="mb-3 rounded-xl bg-emerald-500/10 p-3 text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">{done}</p>}
      <GlassCard>
        <label htmlFor="protect-file" className="text-xs font-bold">PDF file (max {caps.maxMB} MB)</label>
        <input id="protect-file" type="file" accept="application/pdf,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 w-full rounded-xl bg-slate-100 p-3 text-sm dark:bg-black/30" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="protect-pw" className="text-xs font-bold">Password</label>
            <input id="protect-pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-3 text-sm outline-none dark:bg-black/30" />
          </div>
          <div>
            <label htmlFor="protect-pw2" className="text-xs font-bold">Confirm password</label>
            <input id="protect-pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void protect(); }} className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-3 text-sm outline-none dark:bg-black/30" />
          </div>
        </div>
        <button onClick={protect} disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Lock PDF
        </button>
        <p className="mt-3 flex gap-1.5 text-[12px] text-slate-500"><ShieldCheck size={14} className="mt-0.5 shrink-0" /> AES-256-GCM with PBKDF2 (150k rounds). Files never leave your browser. Note: locked files open with BornoLab Unlock — not Adobe Reader passwords.</p>
      </GlassCard>
    </div>
  );
}
