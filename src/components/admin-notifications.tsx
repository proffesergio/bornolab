"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, UserPlus, Receipt, Info, X, Volume2, VolumeX, CheckCheck } from "lucide-react";
import { GlassCard } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { AdminNotification } from "@/lib/notifications";

const POLL_MS = 15_000;
const MUTE_KEY = "bornolab-ntf-mute";

export function relTime(at: number): string {
  const s = Math.max(1, Math.floor((Date.now() - at) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    o.start();
    o.stop(ctx.currentTime + 0.15);
    setTimeout(() => void ctx.close(), 300);
  } catch { /* audio is best-effort */ }
}

/** Polls the admin notification feed; surfaces arrivals since mount for toasts. */
export function useNotifications() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [fresh, setFresh] = useState<AdminNotification[]>([]);
  const seenRef = useRef<Set<string> | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    try { setMuted(localStorage.getItem(MUTE_KEY) === "1"); } catch { /* private mode */ }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      try { localStorage.setItem(MUTE_KEY, m ? "0" : "1"); } catch { /* private mode */ }
      return !m;
    });
  }, []);

  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const r = await fetch("/api/admin/notifications?limit=20");
        if (!r.ok) return;
        const j = (await r.json()) as { items: AdminNotification[]; unread: number };
        if (stop) return;
        setItems(j.items ?? []);
        setUnread(j.unread ?? 0);
        const ids = new Set((j.items ?? []).map((n) => n.id));
        if (seenRef.current === null) {
          seenRef.current = ids; // baseline — no toast storm on load
        } else {
          const arrivals = (j.items ?? []).filter((n) => !seenRef.current!.has(n.id) && !n.read).slice(0, 3);
          if (arrivals.length > 0) {
            seenRef.current = ids;
            setFresh((f) => [...arrivals.reverse(), ...f].slice(0, 3));
            if (!muted) beep();
          }
        }
      } catch { /* offline — retry next tick */ }
    };
    void poll();
    const id = setInterval(poll, POLL_MS);
    return () => { stop = true; clearInterval(id); };
  }, [muted]);

  const markOne = useCallback(async (id: string) => {
    setItems((xs) => xs.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await fetch("/api/admin/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [id] }) });
    } catch { /* local state already updated */ }
  }, []);

  const markAll = useCallback(async () => {
    setItems((xs) => xs.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      await fetch("/api/admin/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    } catch { /* local state already updated */ }
  }, []);

  const dismissFresh = useCallback((id: string) => {
    setFresh((f) => f.filter((n) => n.id !== id));
  }, []);

  return { items, unread, fresh, muted, toggleMute, markOne, markAll, dismissFresh };
}

function typeIcon(type: AdminNotification["type"]) {
  if (type === "user.registered") return <UserPlus size={15} className="shrink-0 text-emerald-500" />;
  if (type === "order.placed") return <Receipt size={15} className="shrink-0 text-amber-500" />;
  return <Info size={15} className="shrink-0 text-cyan-500" />;
}

export function NotificationBell({ unread, onOpen }: { unread: number; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      aria-label={unread > 0 ? `${unread} unread notifications — open feed` : "Notifications — none unread"}
      className="relative ml-auto rounded-xl bg-white/5 p-2 text-slate-200 transition hover:bg-white/10"
    >
      <Bell size={17} />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </button>
  );
}

export function NotificationFeed({ items, unread, muted, onToggleMute, onMarkAll, onMarkOne, onJump, className }: {
  items: AdminNotification[];
  unread: number;
  muted: boolean;
  onToggleMute: () => void;
  onMarkAll: () => void;
  onMarkOne: (id: string) => void;
  onJump: (n: AdminNotification) => void;
  className?: string;
}) {
  return (
    <GlassCard className={className} >
      <div id="ntf-feed" className="flex scroll-mt-24 flex-wrap items-center gap-2">
        <h3 className="text-sm font-bold">Notifications {unread > 0 && <span className="ml-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-black text-red-500">{unread} new</span>}</h3>
        <span className="ml-auto flex gap-1.5">
          <button onClick={onToggleMute} aria-label={muted ? "Unmute new-registration sound" : "Mute new-registration sound"} aria-pressed={muted} className="rounded-full p-1.5 text-slate-500 hover:bg-white/10">
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button onClick={onMarkAll} disabled={unread === 0} className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-bold text-slate-500 hover:bg-white/10 disabled:opacity-40">
            <CheckCheck size={13} /> Mark all read
          </button>
        </span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.slice(0, 8).map((n) => (
          <li key={n.id}>
            <button
              onClick={() => { void onMarkOne(n.id); onJump(n); }}
              className={cn("flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left text-[13px] transition hover:bg-white/5",
                !n.read && "bg-cyan-500/[.07]")}
            >
              {typeIcon(n.type)}
              <span className="min-w-0 flex-1">
                <b className="block truncate">{n.title}</b>
                {n.detail && <span className="block truncate text-[12px] text-slate-500">{n.detail}</span>}
                <span className="text-[11px] text-slate-500">{relTime(n.at)}</span>
              </span>
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400" aria-label="unread" />}
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="p-2 text-[13px] text-slate-500">No activity yet — new member registrations and orders will appear here live.</li>}
      </ul>
    </GlassCard>
  );
}

export function NotificationToasts({ fresh, onDismiss, onJump }: {
  fresh: AdminNotification[];
  onDismiss: (id: string) => void;
  onJump: (n: AdminNotification) => void;
}) {
  useEffect(() => {
    if (fresh.length === 0) return;
    const id = setTimeout(() => onDismiss(fresh[0].id), 7000);
    return () => clearTimeout(id);
  }, [fresh, onDismiss]);
  if (fresh.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2" aria-live="polite">
      {fresh.map((n) => (
        <div key={n.id} className="glass pointer-events-auto rounded-2xl border-cyan-500/30 p-3 shadow-2xl">
          <div className="flex items-start gap-2">
            {typeIcon(n.type)}
            <button className="min-w-0 flex-1 text-left" onClick={() => { onDismiss(n.id); onJump(n); }}>
              <b className="block truncate text-[13.5px]">{n.title}</b>
              {n.detail && <span className="block truncate text-[12px] text-slate-500">{n.detail}</span>}
            </button>
            <button onClick={() => onDismiss(n.id)} aria-label="Dismiss notification" className="rounded-full p-1 text-slate-500 hover:bg-white/10">
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
