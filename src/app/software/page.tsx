"use client";
import { useEffect, useMemo, useState } from "react";
import { Download, ShoppingCart, MonitorDown, BadgeCheck } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { SOFTWARE, applySoftwareOverrides } from "@/lib/software-data";
import { DEFAULT_CONFIG } from "@/lib/site-config-shared";
import { CheckoutModal } from "@/components/checkout-modal";
import { downloadBlob } from "@/lib/doc-utils";
import { cn } from "@/lib/cn";

export default function SoftwarePage() {
  const [tab, setTab] = useState<"All" | "Free" | "Paid">("All");
  const [overrides, setOverrides] = useState<Record<string, { priceBDT?: number; enabled?: boolean }>>({});
  const [buy, setBuy] = useState<{ id: string; name: string; price: number } | null>(null);

  useEffect(() => {
    fetch("/api/site-config").then((r) => r.json()).then((c) => {
      setOverrides(c?.softwareOverrides ?? {});
    }).catch(() => {});
  }, []);

  const items = useMemo(
    () => applySoftwareOverrides(SOFTWARE, overrides ?? DEFAULT_CONFIG.softwareOverrides).filter((s) => s.enabled),
    [overrides]
  );
  const shown = items.filter((s) => tab === "All" || s.license === tab);

  const getFree = (id: string, name: string, version: string, platform: string) => {
    const txt = [
      `${name} — Free Starter Kit (v${version}, ${platform})`,
      "BornoLab Software Store",
      "",
      "Thanks for downloading! This kit contains your license + install guide.",
      "",
      "INSTALL",
      "1. Paid builds: the installer link is delivered after checkout (Admin verifies",
      "   your bKash/Nagad/Bank/Binance payment, then marks the order delivered).",
      "2. Free builds: watch the Software page — the installer appears here on release day.",
      "",
      "LICENSE: free for personal + commercial use. Redistribution is not allowed.",
      "SUPPORT: use the Contact page — mention your order ID for paid items.",
      "",
      `Issued: ${new Date().toLocaleString()} • Item: ${id}`,
      "",
    ].join("\n");
    downloadBlob(new Blob([txt], { type: "text/plain" }), `${id}-starter-kit.txt`);
  };

  return (
    <div>
      <SectionTitle kicker="Store" title="Software — Free & Paid" desc="Desktop tools for Bangla DTP, OCR and publishing. Paid apps unlock via bKash, Nagad, Bank Transfer or Binance/Crypto." />
      <div className="mb-4 flex gap-1.5" role="tablist" aria-label="License filter">
        {(["All", "Free", "Paid"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn("rounded-full px-4 py-2 text-[12.5px] font-bold", tab === t ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "glass text-slate-700 hover-glow dark:text-slate-300")}>
            {t}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((s) => (
          <GlassCard key={s.id} className="flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 text-white"><MonitorDown size={20} /></span>
              <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-black uppercase", s.license === "Paid" ? "bg-amber-400/20 text-amber-600 dark:text-amber-300" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300")}>
                {s.license === "Paid" ? `৳${s.priceBDT}` : "Free"}
              </span>
            </div>
            <h3 className="mt-3 font-extrabold">{s.name}</h3>
            <p className="mt-1 flex-1 text-[13px] text-slate-600 dark:text-slate-400">{s.tagline}</p>
            <p className="mt-2 text-[11px] text-slate-500">{s.platform} • v{s.version} • {s.size} • ⬇ {s.downloads}</p>
            {s.license === "Paid" ? (
              <button onClick={() => setBuy({ id: s.id, name: s.name, price: s.priceBDT })}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-2.5 text-[13px] font-bold text-white hover:brightness-110">
                <ShoppingCart size={15} /> Buy ৳{s.priceBDT}
              </button>
            ) : (
              <button onClick={() => getFree(s.id, s.name, s.version, s.platform)}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-2.5 text-[13px] font-bold text-white hover:brightness-110">
                <Download size={15} /> Download Free
              </button>
            )}
            <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500"><BadgeCheck size={12} /> bKash • Nagad • Bank • Binance accepted</p>
          </GlassCard>
        ))}
      </div>
      {shown.length === 0 && <GlassCard><p className="text-sm text-slate-500">Nothing here right now.</p></GlassCard>}
      {buy && <CheckoutModal open onClose={() => setBuy(null)} itemType="software" itemId={buy.id} itemName={buy.name} amountBDT={buy.price} />}
    </div>
  );
}
