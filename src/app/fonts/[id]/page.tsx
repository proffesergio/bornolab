"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Download, Inbox, ShoppingCart } from "lucide-react";
import { addToCart } from "@/lib/cart";
import { GlassCard, SectionTitle } from "@/components/ui";
import { AdUnits } from "@/components/ads";
import { CheckoutModal } from "@/components/checkout-modal";
import { DEFAULT_PREVIEW_TEXT, buildFontCatalog, previewFamily, variantPricing, type BanglaFont } from "@/lib/fonts-data";
import { DEFAULT_CONFIG } from "@/lib/site-config-shared";
import { downloadBlob } from "@/lib/doc-utils";
import { cn } from "@/lib/cn";

function fileName(fontName: string, label: string, url: string): string {
  const clean = `${fontName}-${label}`.replace(/["\r\n/\\]/g, "").trim().slice(0, 80) || "font";
  const m = url.split("?")[0].match(/\.([a-z0-9]{2,5})$/i);
  return `${clean}.${(m?.[1] ?? "ttf").toLowerCase()}`;
}

/** Font family page: big preview, variant picker, per-variant download/buy. */
export default function FontDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [q, setQ] = useState(DEFAULT_PREVIEW_TEXT);
  const [size, setSize] = useState(32);
  const [overrides, setOverrides] = useState<Record<string, { premium?: boolean; priceBDT?: number; enabled?: boolean }>>({});
  const [custom, setCustom] = useState<BanglaFont[]>([]);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [buy, setBuy] = useState<{ id: string; name: string; price: number } | null>(null);
  const [request, setRequest] = useState(false);
  const [addedMsg, setAddedMsg] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);
  const [dlBusy, setDlBusy] = useState(false);

  useEffect(() => {
    fetch("/api/site-config").then((r) => r.json()).then((c) => {
      setOverrides(c?.fontOverrides ?? {});
      setCustom(c?.customFonts ?? []);
    }).catch(() => {});
  }, []);

  const catalog = useMemo(
    () => buildFontCatalog(overrides ?? DEFAULT_CONFIG.fontOverrides, custom),
    [overrides, custom]
  );
  const font = catalog.find((f) => f.id === id && f.enabled) ?? null;
  const variants = font?.variants ?? [];
  const active = variants.find((v) => v.id === variantId) ?? null;

  const grab = async (url: string, name: string) => {
    setDlError(null);
    setDlBusy(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (!blob.size) throw new Error("empty file");
      downloadBlob(blob, name);
    } catch {
      try {
        const res = await fetch(`/api/fonts?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}`);
        if (!res.ok) throw new Error("download unavailable");
        downloadBlob(await res.blob(), name);
      } catch {
        setDlError("Download failed — the file may have moved. Try the fallback link or check back soon.");
      }
    } finally {
      setDlBusy(false);
    }
  };

  const take = (url: string, label: string, premium: boolean, price: number) => {
    if (!url || url === "#") {
      setDlError("This file has no download attached yet — check back soon.");
      return;
    }
    if (premium) {
      setBuy({ id: `${font!.id}:${label}`, name: `${font!.name} (${label})`, price });
      return;
    }
    void grab(url, fileName(font!.name, label, url));
  };

  if (!font) {
    return (
      <GlassCard className="p-10 text-center">
        <p className="font-extrabold">Font not found</p>
        <p className="mt-1 text-sm text-slate-500">It may have been hidden by the admin.</p>
        <Link href="/fonts" className="mt-4 inline-block rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white">← All fonts</Link>
      </GlassCard>
    );
  }

  const basePricing = { premium: font.premium ?? font.license === "Paid", priceBDT: font.priceBDT ?? 0 };
  const cartFor = (label: string, price: number) => () => {
    if (addToCart({ key: `font:${font!.id}:${label}`, itemType: "font", itemId: `${font!.id}:${label}`, itemName: `${font!.name} (${label})`, amountBDT: price })) {
      setAddedMsg(true);
      setTimeout(() => setAddedMsg(false), 1500);
    }
  };
  const copyFamily = async () => {
    try {
      await navigator.clipboard.writeText(q);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div>
      <Link href="/fonts" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        <ArrowLeft size={14} /> Font directory
      </Link>
      <div className="mt-2">
        <SectionTitle kicker={`${font.bangla ? "বাংলা" : "English"} • ${font.type} • ${font.category}`} title={font.name} desc={`by ${font.designer} • ${font.license}`} />
      </div>

      <GlassCard className="mt-4">
        <label htmlFor="family-preview" className="text-xs font-bold">Try it — type anything</label>
        <input id="family-preview" value={q} onChange={(e) => setQ(e.target.value)} className="focus-glow mt-1.5 w-full rounded-xl bg-slate-100 p-3 text-[15px] outline-none dark:bg-black/30" />
        <div className="mt-3 flex items-center gap-3">
          <label htmlFor="family-size" className="whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">Size <b className="text-slate-900 dark:text-slate-200">{size}px</b></label>
          <input id="family-size" type="range" min={16} max={72} value={size} onChange={(e) => setSize(+e.target.value)} className="flex-1 accent-cyan-500" />
          <button onClick={copyFamily} className="glass hover-glow flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold">
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-900/[.04] p-5 dark:bg-white/5" style={{ fontFamily: previewFamily(font.id), fontSize: size, lineHeight: 1.7 }}>
          {q || "Type to preview…"}
        </p>
      </GlassCard>

      {/* base file */}
      <h2 className="mb-2 mt-6 text-sm font-extrabold uppercase tracking-widest text-slate-500">Main file</h2>
      <FileRow
        label="Standard"
        url={font.fileUrl}
        premium={basePricing.premium}
        price={basePricing.priceBDT}
        busy={dlBusy}
        onTake={() => take(font.fileUrl, "Standard", basePricing.premium, basePricing.priceBDT)}
        onCart={basePricing.premium ? cartFor("Standard", basePricing.priceBDT) : undefined}
      />

      {/* variants */}
      {variants.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-extrabold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">
            Variants ({variants.length})
          </h2>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Font variants">
            {variants.map((v) => (
              <button
                key={v.id} role="tab" aria-selected={active?.id === v.id || (!active && false)}
                onClick={() => setVariantId(active?.id === v.id ? null : v.id)}
                className={cn("rounded-full px-4 py-2 text-[13px] font-bold", active?.id === v.id ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "glass hover-glow")}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className="mt-2 space-y-2">
            {(active ? [active] : variants).map((v) => {
              const p = variantPricing(font, v);
              return (
                <FileRow
                  key={v.id}
                  label={v.label}
                  url={v.fileUrl}
                  premium={p.premium}
                  price={p.priceBDT}
                  busy={dlBusy}
                  onTake={() => take(v.fileUrl, v.label, p.premium, p.priceBDT)}
                  onCart={p.premium ? cartFor(v.label, p.priceBDT) : undefined}
                />
              );
            })}
          </div>
        </>
      )}

      {/* full-family bundle */}
      {font.bundleUrl && (
        <>
          <h2 className="mb-2 mt-6 text-sm font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-300">Full family bundle (.zip)</h2>
          <FileRow
            label="All variants"
            url={font.bundleUrl}
            premium={basePricing.premium}
            price={basePricing.priceBDT}
            busy={dlBusy}
            onTake={() => take(font.bundleUrl!, "Bundle", basePricing.premium, basePricing.priceBDT)}
            onCart={basePricing.premium ? cartFor("Bundle", basePricing.priceBDT) : undefined}
          />
        </>
      )}

      {dlError && <p role="alert" className="mt-3 text-[13px] font-semibold text-rose-500">{dlError}</p>}
      {addedMsg && <p role="status" className="mt-2 text-[13px] font-bold text-emerald-600 dark:text-emerald-300">✓ Added to cart — <Link href="/cart" className="underline">open cart</Link></p>}
      <button
        onClick={() => setRequest(true)}
        className="glass hover-glow mt-3 flex items-center gap-1.5 rounded-full px-5 py-2.5 text-[13px] font-bold"
      >
        <Inbox size={14} /> Request this font (quote / custom format)
      </button>
      <AdUnits slot="inFeed" className="mt-8" />
      {buy && <CheckoutModal open onClose={() => setBuy(null)} itemType="font" itemId={buy.id} itemName={buy.name} amountBDT={buy.price} />}
      {request && <CheckoutModal open onClose={() => setRequest(false)} mode="request" itemType="font" itemId={font.id} itemName={font.name} amountBDT={basePricing.priceBDT} />}
    </div>
  );
}

function FileRow({ label, url, premium, price, busy, onTake, onCart }: {
  label: string; url: string; premium: boolean; price: number; busy: boolean; onTake: () => void; onCart?: () => void;
}) {
  const hasFile = Boolean(url && url !== "#");
  return (
    <div className="glass flex flex-wrap items-center justify-between gap-2 rounded-2xl p-4">
      <span>
        <b>{label}</b>
        <span className="ml-2 text-[12px] font-semibold text-slate-500">
          {premium ? `৳${price} • buy to download` : hasFile ? "free download" : "coming soon"}
        </span>
        {hasFile && <span className="block max-w-full truncate font-mono text-[10.5px] text-slate-400">{url.split("/").pop()}</span>}
      </span>
      <span className="flex items-center gap-2">
        {onCart && (
          <button
            onClick={onCart}
            title="Add to cart"
            aria-label={`Add ${label} to cart`}
            className="glass hover-glow rounded-full p-2.5"
          >
            <ShoppingCart size={15} />
          </button>
        )}
        <button
          onClick={onTake}
          disabled={busy || !hasFile}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-[13px] font-bold text-white hover:brightness-110 disabled:opacity-40"
        >
          {premium ? <ShoppingCart size={14} /> : <Download size={14} />}
          {premium ? `Buy ৳${price}` : "Download"}
        </button>
      </span>
    </div>
  );
}
