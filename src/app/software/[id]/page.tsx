"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Download, Inbox, MonitorDown, ShoppingCart } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { GlassCard, SectionTitle } from "@/components/ui";
import { AdUnits } from "@/components/ads";
import { CheckoutModal } from "@/components/checkout-modal";
import { buildSoftwareCatalog, type Software } from "@/lib/software-data";
import { DEFAULT_CONFIG } from "@/lib/site-config-shared";
import { downloadBlob } from "@/lib/doc-utils";
import { cn } from "@/lib/cn";

type Tab = "overview" | "versions" | "guide";

/** App detail page: overview, older versions, setup guide, screenshots. */
export default function SoftwareDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>("overview");
  const [overrides, setOverrides] = useState<Record<string, { priceBDT?: number; enabled?: boolean }>>({});
  const [custom, setCustom] = useState<Software[]>([]);
  const [buy, setBuy] = useState<{ id: string; name: string; price: number } | null>(null);
  const [request, setRequest] = useState(false);
  const [addedMsg, setAddedMsg] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/site-config").then((r) => r.json()).then((c) => {
      setOverrides(c?.softwareOverrides ?? {});
      setCustom(c?.customSoftware ?? []);
    }).catch(() => {});
  }, []);

  const app = useMemo(
    () => buildSoftwareCatalog(overrides ?? DEFAULT_CONFIG.softwareOverrides, custom).find((s) => s.id === id && s.enabled) ?? null,
    [overrides, custom, id]
  );

  if (!app) {
    return (
      <GlassCard className="p-10 text-center">
        <p className="font-extrabold">Software not found</p>
        <p className="mt-1 text-sm text-slate-500">It may have been hidden by the admin.</p>
        <Link href="/software" className="mt-4 inline-block rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white">← All software</Link>
      </GlassCard>
    );
  }

  const paid = app.license === "Paid";

  const grab = async (url: string, name: string) => {
    setDlError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (!blob.size) throw new Error("empty file");
      downloadBlob(blob, name);
    } catch {
      setDlError("Download failed — the file may have moved. Use the fallback link or check back soon.");
    }
  };

  const take = (url: string, label: string) => {
    if (!url || url === "#") {
      setDlError("This file is delivered after checkout — place an order and the admin will send your download.");
      return;
    }
    if (paid) {
      setBuy({ id: `${app.id}:${label}`, name: `${app.name} (${label})`, price: app.priceBDT });
      return;
    }
    void grab(url, `${app.name}-${label}`.replace(/["\r\n/\\]/g, "").slice(0, 80));
  };

  const versions = app.versions ?? [];

  const cartCurrent = () => {
    if (addToCart({ key: `software:${app!.id}`, itemType: "software", itemId: app!.id, itemName: `${app!.name} (v${app!.version})`, amountBDT: app!.priceBDT })) {
      setAddedMsg(true);
      setTimeout(() => setAddedMsg(false), 1500);
    }
  };

  return (
    <div>
      <Link href="/software" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        <ArrowLeft size={14} /> Software store
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 text-white"><MonitorDown size={22} /></span>
          <div>
            <SectionTitle kicker={`${app.platform} • v${app.version} • ${app.size}`} title={app.name} desc={app.tagline} />
          </div>
        </div>
        <span className={cn("rounded-full px-3 py-1.5 text-[12px] font-black uppercase", paid ? "bg-amber-400/20 text-amber-600 dark:text-amber-300" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300")}>
          {paid ? `৳${app.priceBDT}` : "Free"}
        </span>
      </div>

      {(app.screenshots?.length ?? 0) > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {app.screenshots!.slice(0, 4).map((src) => (
            // eslint-disable-next-line @next/next/no-img-element -- admin-provided runtime URL
            <img key={src} src={src} alt={`${app.name} screenshot`} loading="lazy" className="glass w-full rounded-2xl object-cover" />
          ))}
        </div>
      )}

      <div className="mb-4 mt-4 flex gap-1.5" role="tablist" aria-label="App sections">
        {(["overview", "versions", "guide"] as const).map((t) => (
          <button
            key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={cn("rounded-full px-4 py-2 text-[12.5px] font-bold capitalize", tab === t ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "glass hover-glow")}
          >
            {t}{t === "versions" && versions.length > 0 ? ` (${versions.length})` : ""}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <GlassCard className="p-5">
          <h2 className="font-extrabold">Current release — v{app.version}</h2>
          <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-400">{app.platform} • {app.size} • ⬇ {app.downloads}</p>
          {(app.changelog?.length ?? 0) > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] leading-6 text-slate-600 dark:text-slate-400">
              {app.changelog!.map((c) => <li key={c}>{c}</li>)}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {paid ? (
              <>
                <button onClick={() => take(app.fileUrl, `v${app.version}`)} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-bold text-white hover:brightness-110">
                  <ShoppingCart size={15} /> Buy ৳{app.priceBDT}
                </button>
                <button onClick={cartCurrent} title="Add to cart" aria-label={`Add ${app.name} to cart`} className="glass hover-glow rounded-full p-3">
                  <ShoppingCart size={16} />
                </button>
              </>
            ) : (
              <button onClick={() => take(app.fileUrl, `v${app.version}`)} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-white hover:brightness-110">
                <Download size={15} /> Download Free
              </button>
            )}
            <button
              onClick={() => setRequest(true)}
              className="glass hover-glow flex items-center gap-1.5 rounded-full px-5 py-3 text-sm font-bold"
            >
              <Inbox size={15} /> Request
            </button>
            {app.fallbackUrl && app.fallbackUrl !== "#" && (
              <a href={app.fallbackUrl} target="_blank" rel="noopener" className="glass hover-glow rounded-full px-6 py-3 text-sm font-bold">Info page</a>
            )}
          </div>
          <p className="mt-3 flex items-center gap-1 text-[11.5px] text-slate-500"><BadgeCheck size={12} /> bKash Send Money accepted • manual verification</p>
          {addedMsg && <p role="status" className="mt-2 text-[13px] font-bold text-emerald-600 dark:text-emerald-300">✓ Added to cart — <Link href="/cart" className="underline">open cart</Link></p>}
          {dlError && <p role="alert" className="mt-2 text-[13px] font-semibold text-rose-500">{dlError}</p>}
        </GlassCard>
      )}

      {tab === "versions" && (
        <div className="space-y-2">
          {versions.length === 0 && <GlassCard><p className="text-sm text-slate-500">Only the current release is published.</p></GlassCard>}
          {versions.map((v) => (
            <div key={v.id} className="glass flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4">
              <span>
                <b>v{v.version}</b> {v.size && <span className="text-[12px] text-slate-500">• {v.size}</span>}
                {v.changelog && <span className="block text-[12.5px] text-slate-500 dark:text-slate-400">{v.changelog}</span>}
              </span>
              <button onClick={() => take(v.fileUrl, `v${v.version}`)} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-[13px] font-bold text-white hover:brightness-110">
                {paid ? <ShoppingCart size={14} /> : <Download size={14} />} {paid ? `Buy ৳${app.priceBDT}` : "Download"}
              </button>
            </div>
          ))}
          {dlError && <p role="alert" className="mt-2 text-[13px] font-semibold text-rose-500">{dlError}</p>}
        </div>
      )}

      {tab === "guide" && (
        <GlassCard className="p-5">
          <h2 className="font-extrabold">Setup & install guide</h2>
          {app.guide ? (
            <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">{app.guide}</p>
          ) : (
            <p className="mt-2 text-[13.5px] text-slate-500">No guide published for this app yet — contact us if you need help installing it.</p>
          )}
        </GlassCard>
      )}

      <AdUnits slot="inFeed" className="mt-8" />
      {buy && <CheckoutModal open onClose={() => setBuy(null)} itemType="software" itemId={buy.id} itemName={buy.name} amountBDT={buy.price} />}
      {request && <CheckoutModal open onClose={() => setRequest(false)} mode="request" itemType="software" itemId={app.id} itemName={app.name} amountBDT={app.priceBDT} />}
    </div>
  );
}
