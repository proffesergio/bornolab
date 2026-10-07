"use client";
import { useState } from "react";
import { Unlock, Loader2, Download } from "lucide-react";
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

async function deriveKey(password: string, salt: Uint8Array, usage: "decrypt"): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 150_000, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, [usage]
  );
}

export default function UnlockPdfPage() {
  const { config } = useSiteConfig();
  const caps = pdfCaps(config, "unlock");
  const [file, setFile] = useState<File | null>(null);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const unlock = async () => {
    setError(null); setDone(false);
    if (!file) { setError("Choose a .locked.pdf file first."); return; }
    if (file.size > caps.maxMB * 1024 * 1024) { setError(`Exceeds the ${caps.maxMB} MB per-file cap.`); return; }
    if (!pw) { setError("Enter the password used to lock it."); return; }
    setBusy(true);
    const started = Date.now();
    try {
      const raw = new Uint8Array(await file.arrayBuffer());
      const magic = new TextDecoder().decode(raw.slice(0, MAGIC.length));
      if (magic !== MAGIC) throw new Error("Not a BornoLab locked file. Adobe-password PDFs need the owner password in a desktop reader.");
      const salt = raw.slice(MAGIC.length, MAGIC.length + 16);
      const iv = raw.slice(MAGIC.length + 16, MAGIC.length + 28);
      const cipher = raw.slice(MAGIC.length + 28);
      const key = await deriveKey(pw, salt, "decrypt");
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, cipher as BufferSource);
      downloadBlob(new Blob([plain], { type: "application/pdf" }), file.name.replace(/\.locked\.pdf$/i, "") + ".unlocked.pdf");
      setDone(true);
      void logOp({ tool: "unlock", files: 1, pages: 0, ms: Date.now() - started, ok: true });
    } catch (e) {
      const msg = (e as Error).message.includes("OperationError") || (e as Error).name === "OperationError"
        ? "Wrong password — decryption failed."
        : `Unlock failed: ${(e as Error).message}`;
      setError(msg);
      void logOp({ tool: "unlock", files: 1, pages: 0, ms: Date.now() - started, ok: false, err: msg });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <SectionTitle kicker="PDF Suite" title="Unlock PDF" desc="Open a BornoLab-locked PDF with its password. Decryption runs 100% in your browser." />
      {error && <p role="alert" className="mb-3 rounded-xl bg-red-500/10 p-3 text-[13px] font-semibold text-red-600 dark:text-red-300">{error}</p>}
      {done && <p className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-[13px] font-semibold text-emerald-700 dark:text-emerald-300"><Download size={14} /> Unlocked — your PDF has downloaded.</p>}
      <GlassCard>
        <label htmlFor="unlock-file" className="text-xs font-bold">Locked file (.locked.pdf, max {caps.maxMB} MB)</label>
        <input id="unlock-file" type="file" accept=".pdf,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 w-full rounded-xl bg-slate-100 p-3 text-sm dark:bg-black/30" />
        <label htmlFor="unlock-pw" className="mt-3 block text-xs font-bold">Password</label>
        <input id="unlock-pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void unlock(); }} className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-3 text-sm outline-none dark:bg-black/30" />
        <button onClick={unlock} disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-slate-600 to-slate-800 px-4 py-3 text-sm font-bold text-white disabled:opacity-40">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />} Unlock & Download
        </button>
      </GlassCard>
    </div>
  );
}
