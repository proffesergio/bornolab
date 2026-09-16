"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Languages, Type, Sparkles, FileText, Scissors, MonitorDown, Workflow, Zap,
  ShieldCheck, Newspaper, BookOpen, PenLine, GraduationCap, Check, HelpCircle,
} from "lucide-react";
import { GlassCard } from "@/components/ui";
import { AdSlot, useSiteConfig } from "@/components/site-widgets";
import type { ToolKey } from "@/lib/site-config";

const CARDS: { key: ToolKey | "styler"; href: string; icon: typeof Languages; title: string; desc: string; points: string[]; grad: string }[] = [
  { key: "convert", href: "/convert", icon: Languages, title: "Unicode ⇆ Bijoy", desc: "Newsroom-grade encoding engine.", points: ["কার, য-ফলা, রেফ ও যুক্তবর্ণ নির্ভুল", "One-click convert + copy buttons", "Bijoy preview fix with live Bangla ghost view"], grad: "from-cyan-500 to-sky-600" },
  { key: "fonts", href: "/fonts", icon: Type, title: "Font Directory", desc: "Free + premium Bangla faces.", points: ["Live preview with size slider", "Bangla / English / Premium filters", "Buy with bKash, Nagad, Bank, Binance"], grad: "from-violet-500 to-purple-600" },
  { key: "styler", href: "/styler", icon: Sparkles, title: "Decorator & Styler", desc: "Facebook-ready fancy text.", points: ["Neon, outline, gradient, glitch", "Bracket frames & symbol wings", "One-click copy per style"], grad: "from-fuchsia-500 to-pink-600" },
  { key: "translate", href: "/translate", icon: FileText, title: "PDF ⇆ DOCX", desc: "Editable docs, layout intact.", points: ["No absolute text-box soup", "Tables & flow preserved", "Scanned PDFs via n8n OCR"], grad: "from-emerald-500 to-teal-600" },
  { key: "split", href: "/split", icon: Scissors, title: "PDF Splitter", desc: "Slice & export anywhere.", points: ["Visual thumbnails + checkboxes", "Ranges like 1-3, 5, 7-12", "Export PDF, JPG/PNG zip, DOCX"], grad: "from-amber-500 to-orange-600" },
  { key: "software", href: "/software", icon: MonitorDown, title: "Software Store", desc: "Desktop tools for DTP pros.", points: ["Free OCR, font manager, templates", "Paid pro tools with license", "Local payment methods"], grad: "from-slate-500 to-slate-700" },
];

const AUDIENCES = [
  { icon: Newspaper, title: "Newspapers & DTP", desc: "Convert decades of Bijoy archives to searchable Unicode in batches — then format print-ready pages." },
  { icon: BookOpen, title: "Authors & Publishers", desc: "Manuscript → formatted Journal/Book (EN/BN pipelines) with proper headings, tables and page sizes." },
  { icon: PenLine, title: "Creators & Marketers", desc: "Stylish Bangla captions, thumbnails and posters with premium display fonts in seconds." },
  { icon: GraduationCap, title: "Students & Offices", desc: "Govt Nikosh templates, PDF↔Word homework, split admission circulars — all free, all in-browser." },
];

const FAQS = [
  { q: "Why does Bijoy text look like English letters?", a: "Bijoy (ANSI) fonts reuse Latin character slots for Bangla glyphs. Without SutonnyMJ installed your browser shows the raw Latin codes. BornoLab detects this and shows a live auto-converted Bangla preview, plus one-click copy for Word." },
  { q: "Is my document uploaded to a server?", a: "No. Converting, splitting and translating run 100% in your browser. Only heavy print-automation jobs and manual-payment orders touch the server (or your own n8n)." },
  { q: "How do I buy a premium font or software?", a: "Hit Buy, pick bKash / Nagad / Bank / Binance, send the amount to the merchant account shown, and submit your sender number + transaction ID. Admin verifies and delivers your download + license." },
  { q: "What is the n8n print automation?", a: "For books and journals: upload a messy .docx plus a reference template, and an n8n workflow applies page sizes, heading styles, BN/EN font rules, table borders and merges — returning a print-ready PDF. Spec in docs/plans.md." },
];

export default function Home() {
  const { config } = useSiteConfig();
  const visible = CARDS.filter((c) => (c.key === "styler" ? config.tools.styler : config.tools[c.key as ToolKey]));

  return (
    <div>
      {/* HERO */}
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="glass relative overflow-hidden rounded-3xl p-8 text-center sm:p-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_16rem_at_50%_-20%,rgba(34,211,238,.18),transparent)] dark:bg-[radial-gradient(40rem_16rem_at_50%_-20%,rgba(34,211,238,.25),transparent)]" />
        <p className="relative text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-300">বর্ণল্যাব • BornoLab</p>
        <h1 className="relative mt-3 text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl">
          বাংলা Type &{" "}
          <span className="bg-gradient-to-r from-cyan-600 via-violet-600 to-pink-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-violet-400 dark:to-pink-400">
            Document Suite
          </span>
        </h1>
        <p className="relative mx-auto mt-4 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          Converter, premium fonts, fancy styler, PDF⇆DOCX translator, splitter and software store —
          fast in your browser, with <span className="font-semibold text-cyan-700 dark:text-cyan-200">n8n workflows</span> for heavy print jobs.
        </p>
        <div className="relative mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/convert" className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_30px_rgba(34,211,238,.35)] hover:brightness-110">Start Converting</Link>
          <Link href="/fonts" className="glass hover-glow rounded-full px-6 py-3 text-sm font-bold text-slate-800 dark:text-slate-100">Browse Fonts</Link>
          <Link href="/software" className="glass hover-glow rounded-full px-6 py-3 text-sm font-bold text-slate-800 dark:text-slate-100">Software Store</Link>
        </div>
        <div className="relative mt-6 flex flex-wrap justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="glass rounded-full px-3 py-1.5"><Zap size={12} className="mr-1 inline" />Client-first, instant</span>
          <span className="glass rounded-full px-3 py-1.5"><Workflow size={12} className="mr-1 inline" />n8n automation-ready</span>
          <span className="glass rounded-full px-3 py-1.5"><ShieldCheck size={12} className="mr-1 inline" />Files stay in browser</span>
        </div>
      </motion.div>

      {/* STATS */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["6", "Pro tools + store"],
          ["15+", "Bangla & Latin fonts"],
          ["100%", "Client-side, private"],
          ["4", "Local pay methods"],
        ].map(([n, l]) => (
          <GlassCard key={l} className="p-4 text-center">
            <p className="bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-2xl font-black text-transparent dark:from-cyan-300 dark:to-purple-400">{n}</p>
            <p className="mt-0.5 text-[12px] font-semibold text-slate-600 dark:text-slate-400">{l}</p>
          </GlassCard>
        ))}
      </div>

      <AdSlot slot="header" className="mt-4" />

      {/* TOOLS with usefulness points */}
      <h2 className="mb-3 mt-8 text-lg font-black">Everything you need, one hub</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(({ href, icon: Icon, title, desc, points, grad }, i) => (
          <motion.div key={href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
            <Link href={href} className="block h-full">
              <GlassCard className="hover-glow h-full group">
                <span className={`inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${grad} text-white shadow-lg`}><Icon size={20} /></span>
                <h3 className="mt-3 text-lg font-extrabold group-hover:text-cyan-700 dark:group-hover:text-cyan-200">{title}</h3>
                <p className="mt-0.5 text-[13px] font-medium text-slate-600 dark:text-slate-400">{desc}</p>
                <ul className="mt-2.5 space-y-1.5">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-1.5 text-[12.5px] text-slate-600 dark:text-slate-400">
                      <Check size={13} className="mt-0.5 shrink-0 text-emerald-500" /> {p}
                    </li>
                  ))}
                </ul>
                <span className="mt-3 inline-block text-[13px] font-bold text-cyan-700 dark:text-cyan-300">Open →</span>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* AUDIENCES */}
      <h2 className="mb-3 mt-10 text-lg font-black">Built for how Bangladesh works</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AUDIENCES.map(({ icon: Icon, title, desc }) => (
          <GlassCard key={title} className="p-5">
            <Icon size={22} className="text-purple-600 dark:text-purple-300" />
            <h3 className="mt-2.5 font-extrabold">{title}</h3>
            <p className="mt-1 text-[13px] leading-6 text-slate-600 dark:text-slate-400">{desc}</p>
          </GlassCard>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <GlassCard className="mt-8">
        <h2 className="text-lg font-black">How it works</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            ["1", "Paste or drop", "Text, fonts, PDFs — nothing uploads, everything runs locally."],
            ["2", "Convert & preview", "Instant results with live Bangla previews and copy buttons."],
            ["3", "Export or order", "Download free assets, or pay with bKash/Nagad/Bank/Binance for premium."],
          ].map(([n, t, d]) => (
            <li key={n} className="rounded-2xl bg-slate-900/[.04] p-4 dark:bg-white/5">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 text-sm font-black text-white">{n}</span>
              <p className="mt-2 font-bold">{t}</p>
              <p className="mt-0.5 text-[13px] text-slate-600 dark:text-slate-400">{d}</p>
            </li>
          ))}
        </ol>
      </GlassCard>

      <AdSlot slot="inFeed" className="mt-4" />

      {/* FAQ */}
      <h2 className="mb-3 mt-8 flex items-center gap-1.5 text-lg font-black"><HelpCircle size={19} /> FAQ</h2>
      <div className="grid gap-3">
        {FAQS.map((f) => (
          <details key={f.q} className="glass group rounded-2xl p-4">
            <summary className="cursor-pointer text-[14.5px] font-bold">{f.q}</summary>
            <p className="mt-2 text-[13.5px] leading-6 text-slate-600 dark:text-slate-400">{f.a}</p>
          </details>
        ))}
      </div>

      {/* CTA */}
      <GlassCard className="mt-8 border-cyan-500/30 text-center">
        <h2 className="text-xl font-black">Print-ready books & journals, on autopilot</h2>
        <p className="mx-auto mt-1.5 max-w-xl text-[13.5px] text-slate-600 dark:text-slate-400">
          Messy .docx in → formatted Journal/Book out (separate EN/BN font pipelines, reference templates, smart tables) via n8n. Roadmap in <code>docs/plans.md</code>.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/translate" className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-white hover:brightness-110">Try DOCX Tools</Link>
          <Link href="/split" className="glass hover-glow rounded-full px-6 py-3 text-sm font-bold text-slate-800 dark:text-slate-100">Split a PDF</Link>
        </div>
      </GlassCard>

      <AdSlot slot="footer" className="mt-4" />
    </div>
  );
}
