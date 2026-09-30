"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Loader2, Copy } from "lucide-react";
import { PAY_METHODS, methodAccount, type PayMethod } from "@/lib/payments";
import { BkashQrButton } from "@/components/bkash-qr";
import type { CartItem } from "@/lib/cart";
import type { SiteConfig } from "@/lib/site-config-shared";
import { DEFAULT_CONFIG } from "@/lib/site-config-shared";

interface Props {
  open: boolean;
  onClose: () => void;
  itemType: "font" | "software" | "study";
  itemId: string;
  itemName: string;
  amountBDT: number;
  /** Multi-item cart checkout: combined order, amount = cart total. */
  items?: CartItem[];
  /** "request" = quote/free request (no payment step, contact + note only). */
  mode?: "purchase" | "request";
  /** Called once when the order/request is accepted (e.g. to clear the cart). */
  onOrdered?: () => void;
}

/** Manual-payment checkout: bKash Send Money (personal) by default; other methods only if enabled in Admin → Payments. */
export function CheckoutModal({ open, onClose, itemType, itemId, itemName, amountBDT, items, mode = "purchase", onOrdered }: Props) {
  const cartMode = Array.isArray(items) && items.length > 0;
  const requestMode = mode === "request";
  const total = cartMode ? items!.reduce((n, i) => n + (i.amountBDT || 0), 0) : amountBDT;
  const title = cartMode ? `${items!.length} item${items!.length === 1 ? "" : "s"}` : itemName;
  const [payments, setPayments] = useState<SiteConfig["payments"]>(DEFAULT_CONFIG.payments);
  const methods = PAY_METHODS.filter((m) => payments.processors?.[m.id]?.enabled ?? m.id === "bkash");
  const visibleMethods = methods.length > 0 ? methods : PAY_METHODS.filter((m) => m.id === "bkash");
  const [method, setMethod] = useState<PayMethod>("bkash");
  const [sender, setSender] = useState("");
  const [txn, setTxn] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Reset per opening + load merchant accounts — setState-in-effect is intended here
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) {
      setOrderId(null); setError(""); setSender(""); setTxn(""); setNote("");
      fetch("/api/site-config").then((r) => r.json()).then((c) => {
        if (c?.payments) {
          const p = { ...DEFAULT_CONFIG.payments, ...c.payments };
          setPayments(p);
          const vis = PAY_METHODS.filter((m) => p.processors?.[m.id]?.enabled ?? m.id === "bkash");
          setMethod((vis.length > 0 ? vis : PAY_METHODS.filter((m) => m.id === "bkash"))[0].id);
        }
      }).catch(() => {});
    }
  }, [open ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const submit = async () => {
    if (!sender.trim()) { setError(requestMode ? "আপনার যোগাযোগ (contact) দিন" : "আপনার অ্যাকাউন্ট নম্বর দিন (sender account)"); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType, itemId, itemName: title, amountBDT: total,
          ...(cartMode ? { items: items!.map(({ itemType: t, itemId: i, itemName: n, amountBDT: a }) => ({ itemType: t, itemId: i, itemName: n, amountBDT: a })) } : {}),
          kind: requestMode ? "request" : "purchase",
          method, sender, txn, note,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Order failed");
      setOrderId(j.orderId);
      onOrdered?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const isBkash = method === "bkash";
  const bkashPersonal = (payments.bkashPersonal || "").trim() || payments.bkash;
  const account = isBkash ? bkashPersonal : methodAccount(method, payments);
  const hint = isBkash ? "bKash Personal — Send Money (not merchant)" : PAY_METHODS.find((m) => m.id === method)?.hint;
  const copyAccount = async () => {
    await navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose} role="dialog" aria-modal="true" aria-label={`Buy ${itemName}`}
        >
          <motion.div
            initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 16 }}
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-md rounded-3xl bg-white p-6 text-slate-900 dark:bg-[#0d1428] dark:text-slate-100"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-extrabold">
                  {orderId ? "Order received!" : requestMode ? `Request ${title}` : cartMode ? `Checkout (${title})` : `Buy ${title}`}
                </h3>
                <p className="text-[13px] text-slate-600 dark:text-slate-400">
                  {orderId
                    ? requestMode
                      ? "Request noted — we reply with availability & payment details."
                      : "Pay first, then we verify & deliver."
                    : requestMode
                      ? <>No payment now — send a request, we reply. <b className="text-emerald-600 dark:text-emerald-300">৳{total}</b></>
                      : <>Price: <b className="text-emerald-600 dark:text-emerald-300">৳{total}</b> • Manual verification</>}
                </p>
                {cartMode && !orderId && (
                  <ul className="mt-2 space-y-1 text-[12px] text-slate-600 dark:text-slate-400">
                    {items!.map((i) => (
                      <li key={i.key} className="flex justify-between gap-2"><span className="truncate">{i.itemName}</span><b>৳{i.amountBDT}</b></li>
                    ))}
                  </ul>
                )}
              </div>
              <button onClick={onClose} aria-label="Close checkout" className="hover-glow rounded-full p-2"><X size={17} /></button>
            </div>

            {orderId ? (
              <div className="mt-4 rounded-2xl bg-emerald-500/10 p-4 text-center">
                <Check size={28} className="mx-auto text-emerald-500" />
                <p className="mt-2 font-mono text-xl font-black tracking-wider">{orderId}</p>
                <p className="mt-1 text-[12.5px] text-slate-600 dark:text-slate-400">
                  {requestMode
                    ? "এই Order ID টি সংরক্ষণ করুন — availability ও payment details জানিয়ে দেওয়া হবে।"
                    : <>৳{total} via {PAY_METHODS.find((m) => m.id === method)?.label} পাঠিয়ে এই Order ID টি সংরক্ষণ করুন।
                      Admin verify করে ডাউনলোড লিংক পাঠিয়ে দেবেন।</>}
                </p>
                <button onClick={onClose} className="mt-3 w-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2.5 text-sm font-bold text-white">Done</button>
              </div>
            ) : requestMode ? (
              <>
                <label className="mt-4 block text-xs font-bold" htmlFor="co-sender">Your contact (email / phone / WhatsApp)</label>
                <input id="co-sender" value={sender} onChange={(e) => setSender(e.target.value)} placeholder="you@example.com / 01XXXXXXXXX" className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-2.5 text-sm outline-none dark:bg-black/30" />
                <label className="mt-2.5 block text-xs font-bold" htmlFor="co-note">What do you need? (format, version, deadline…)</label>
                <input id="co-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. TTF + OTF, needed this week" className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-2.5 text-sm outline-none dark:bg-black/30" />
                {error && <p className="mt-2 text-[12px] font-semibold text-rose-500">{error}</p>}
                <button onClick={submit} disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                  {busy && <Loader2 size={15} className="animate-spin" />} Send request
                </button>
              </>
            ) : (
              <>
                {visibleMethods.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-1.5" role="tablist" aria-label="Payment method">
                  {visibleMethods.map((m) => (
                    <button
                      key={m.id} role="tab" aria-selected={method === m.id}
                      onClick={() => setMethod(m.id)}
                      className={method === m.id
                        ? "rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 px-1 py-2.5 text-[11px] font-bold text-white"
                        : "glass rounded-xl px-1 py-2.5 text-[11px] font-bold text-slate-700 hover-glow dark:text-slate-300"}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                )}
                <div className="mt-3 rounded-2xl bg-slate-900/[.04] p-3.5 dark:bg-white/5">
                  <p className="text-[11px] uppercase tracking-wider text-slate-500">{hint}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-mono text-[15px] font-bold">{account}</p>
                    <span className="flex items-center gap-1">
                      {isBkash && <BkashQrButton number={account} qrUrl={payments.bkashQrUrl} size="sm" />}
                      <button onClick={copyAccount} aria-label="Copy merchant account" className="hover-glow rounded-full p-2">
                        {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                      </button>
                    </span>
                  </div>
                </div>
                <label className="mt-3 block text-xs font-bold" htmlFor="co-sender">Your {method === "bank" ? "account / reference" : method === "binance" ? "Binance UID / email" : "number"} (sender)</label>
                <input id="co-sender" value={sender} onChange={(e) => setSender(e.target.value)} placeholder="01XXXXXXXXX" className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-2.5 text-sm outline-none dark:bg-black/30" />
                <label className="mt-2.5 block text-xs font-bold" htmlFor="co-txn">Transaction ID (optional)</label>
                <input id="co-txn" value={txn} onChange={(e) => setTxn(e.target.value)} placeholder="TrxID / Hash" className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-2.5 font-mono text-sm outline-none dark:bg-black/30" />
                <label className="mt-2.5 block text-xs font-bold" htmlFor="co-note-2">Note (optional)</label>
                <input id="co-note-2" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything we should know" className="focus-glow mt-1 w-full rounded-xl bg-slate-100 p-2.5 text-sm outline-none dark:bg-black/30" />
                {error && <p className="mt-2 text-[12px] font-semibold text-rose-500">{error}</p>}
                <button onClick={submit} disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                  {busy && <Loader2 size={15} className="animate-spin" />} I&apos;ve paid ৳{total} — Submit order
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
