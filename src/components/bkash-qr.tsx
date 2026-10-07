"use client";
import { useEffect, useState } from "react";
import { QrCode, X } from "lucide-react";
import QRCode from "qrcode";

/**
 * bKash QR viewer. Prefers the admin-uploaded official QR image
 * (scannable inside the bKash app); otherwise generates a QR encoding
 * the number itself (any generic scanner reads it — tap to copy).
 */
export function BkashQrButton({ number, qrUrl, size = "md" }: {
  number: string;
  qrUrl?: string;
  size?: "md" | "sm";
}) {
  const [open, setOpen] = useState(false);
  const [genUrl, setGenUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && !qrUrl) {
      QRCode.toDataURL(`tel:${number.replace(/\s/g, "")}`, { width: 320, margin: 1 })
        .then(setGenUrl)
        .catch(() => setGenUrl(null));
    }
  }, [open, qrUrl, number]);

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          size === "sm"
            ? "inline-flex items-center gap-1 rounded-full bg-pink-500/15 px-2.5 py-1 text-[11px] font-bold text-pink-700 dark:text-pink-300"
            : "glass hover-glow flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold"
        }
      >
        <QrCode size={size === "sm" ? 13 : 15} /> View QR
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="bKash QR code"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-xs rounded-3xl bg-white p-6 text-center text-slate-900 dark:bg-[#0d1428] dark:text-slate-100"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold">bKash Personal</p>
              <button onClick={() => setOpen(false)} aria-label="Close QR" className="rounded-full p-1.5 hover:bg-slate-900/5 dark:hover:bg-white/10">
                <X size={16} />
              </button>
            </div>
            <div className="mx-auto mt-3 grid h-56 w-56 place-items-center overflow-hidden rounded-2xl bg-white p-2">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded runtime image
                <img src={qrUrl} alt="Official bKash QR — scan inside the bKash app" className="max-h-full max-w-full object-contain" />
              ) : genUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- generated data URL
                <img src={genUrl} alt={`QR encoding ${number}`} className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-[12px] text-slate-400">Generating…</span>
              )}
            </div>
            <button onClick={copyNumber} className="mt-3 font-mono text-[15px] font-bold" title="Tap to copy">
              {copied ? "✓ Copied!" : number}
            </button>
            <p className="mt-1 text-[11.5px] text-slate-500 dark:text-slate-400">
              {qrUrl ? "Scan inside your bKash app (Send Money)" : "Scan with any camera to copy the number, then Send Money in bKash"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
