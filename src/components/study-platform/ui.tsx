"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** BornoLab study accent: electric cyan + warm saffron. BN-friendly stack. */
export function StudyShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="study-bn"
      style={{ fontFamily: "'Hind Siliguri','Noto Sans Bengali','Noto Sans',system-ui,sans-serif" }}
    >
      {children}
    </div>
  );
}

export function StudyHero({ kicker, title, desc, actions }: { kicker: string; title: string; desc?: string; actions?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">{kicker}</p>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
      {desc && <p className="mt-1.5 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">{desc}</p>}
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </motion.div>
  );
}

export function LangToggle({ lang, onChange }: { lang: "bn" | "en" | "split"; onChange: (l: "bn" | "en" | "split") => void }) {
  const opts = [
    { id: "bn" as const, label: "বাংলা" },
    { id: "en" as const, label: "English" },
    { id: "split" as const, label: "দুটোই" },
  ];
  return (
    <div className="glass inline-flex rounded-full p-1" role="radiogroup" aria-label="Language">
      {opts.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={lang === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "rounded-full px-4 py-1.5 text-[12.5px] font-bold",
            lang === o.id ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "text-slate-600 dark:text-slate-300"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="glass rounded-2xl p-8 text-center">
      <p className="font-extrabold">{title}</p>
      {desc && <p className="mx-auto mt-1 max-w-md text-[13px] text-slate-500 dark:text-slate-400">{desc}</p>}
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}

export function StatusPill({ kind, children }: { kind: "free" | "provisional" | "approved" | "demo" | "locked" | "guidance"; children: ReactNode }) {
  const map: Record<string, string> = {
    free: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    provisional: "bg-amber-400/20 text-amber-700 dark:text-amber-300",
    approved: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
    demo: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
    locked: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
    guidance: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black", map[kind])}>
      {kind === "provisional" && <span aria-hidden>⚠</span>}
      {kind === "approved" && <span aria-hidden>✓</span>}
      {children}
    </span>
  );
}

export function SaffronButton({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const cls = "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-[13px] font-bold text-white hover:brightness-110";
  if (href) return <a href={href} className={cls}>{children}</a>;
  return <button onClick={onClick} className={cls}>{children}</button>;
}

export function CyanButton({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const cls = "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-[13px] font-bold text-white hover:brightness-110";
  if (href) return <a href={href} className={cls}>{children}</a>;
  return <button onClick={onClick} className={cls}>{children}</button>;
}
