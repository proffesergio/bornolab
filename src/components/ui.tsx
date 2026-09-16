"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export function GlassCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={cn("glass rounded-2xl p-5 shadow-2xl shadow-black/20", className)}
    >
      {children}
    </motion.section>
  );
}

export function SectionTitle({ kicker, title, desc }: { kicker: string; title: string; desc?: string }) {
  return (
    <div className="mb-5">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">{kicker}</p>
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
      {desc && <p className="mt-1.5 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{desc}</p>}
    </div>
  );
}
