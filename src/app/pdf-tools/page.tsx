"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText, Scissors, Combine, Minimize2, Image as ImageIcon,
  Globe, ShieldCheck, Unlock, Sparkles, Languages, ArrowRight, Pencil,
} from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { useSiteConfig } from "@/components/site-widgets";
import { cn } from "@/lib/cn";

interface Tool {
  href: string;
  icon: typeof FileText;
  title: string;
  desc: string;
  grad: string;
  status: "live" | "soon";
  anchor?: string;
}

const TOOLS: (Tool & { pdfTool?: "merge" | "split" | "translate" | "compress" | "images" | "html" | "protect" | "unlock" | "summarize" | "aitranslate" | "edit" })[] = [
  { href: "/edit-pdf", icon: Pencil, title: "Edit PDF", desc: "Read, zoom and navigate — text, highlight, shapes and signing land here next.", grad: "from-cyan-500 to-violet-600", status: "live", pdfTool: "edit" },
  { href: "/merge", icon: Combine, title: "Merge PDF", desc: "Combine many PDFs into one file in your custom sequence — drag order, then merge.", grad: "from-orange-500 to-red-500", status: "live", pdfTool: "merge" },
  { href: "/translate", icon: FileText, title: "PDF to DOCX", desc: "Text nodes become editable paragraphs — never textbox soup. Tables and reading order preserved.", grad: "from-emerald-500 to-teal-600", status: "live", pdfTool: "translate" },
  { href: "/split", icon: Scissors, title: "Split PDF", desc: "Visual thumbnails, ranges like 1-3, 5, 7-12. Export PDF, JPG/PNG zip, or DOCX.", grad: "from-amber-500 to-orange-600", status: "live", pdfTool: "split" },
  { href: "/compress", icon: Minimize2, title: "Compress PDF", desc: "Shrink file size with Extreme / Recommended / Custom quality levels. Before/after sizes included.", grad: "from-lime-500 to-green-600", status: "live", pdfTool: "compress" },
  { href: "/images-to-pdf", icon: ImageIcon, title: "Images to PDF", desc: "JPG/PNG photos to one PDF — reorder, page size, orientation and margin controls.", grad: "from-yellow-500 to-amber-600", status: "live", pdfTool: "images" },
  { href: "/html-to-pdf", icon: Globe, title: "HTML to PDF", desc: "Fetch a URL or paste HTML, preview it, then Print → Save as PDF. Fully in-browser.", grad: "from-sky-500 to-blue-600", status: "live", pdfTool: "html" },
  { href: "/protect-pdf", icon: ShieldCheck, title: "Protect PDF", desc: "Lock a PDF with a password (AES-256-GCM, client-side). Reopen with Unlock PDF.", grad: "from-blue-500 to-indigo-600", status: "live", pdfTool: "protect" },
  { href: "/unlock-pdf", icon: Unlock, title: "Unlock PDF", desc: "Open a BornoLab-locked PDF with its password and download the original.", grad: "from-slate-500 to-slate-700", status: "live", pdfTool: "unlock" },
  { href: "/summarize", icon: Sparkles, title: "AI Summarizer", desc: "Key points extracted offline from long documents — PDF or pasted text, nothing uploaded.", grad: "from-purple-500 to-fuchsia-600", status: "live", pdfTool: "summarize" },
  { href: "/ai-translate", icon: Languages, title: "AI Translator", desc: "Translate document text paragraph-by-paragraph — right in your browser.", grad: "from-cyan-500 to-sky-600", status: "live", pdfTool: "aitranslate" },
];

export default function PdfToolsPage() {
  const { config } = useSiteConfig();

  return (
    <div>
      <SectionTitle
        kicker="PDF Suite"
        title="PDF Tools — merge, split, compress & convert"
        desc="Free in-browser PDF utilities: merge, split, compress, photos to PDF, PDF to Word, HTML snapshots, password locking, offline summaries and translation. Your files never leave your browser."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.filter((t) => {
          if (t.pdfTool) return config.pdfTools[t.pdfTool]?.enabled ?? true;
          return true;
        }).map(({ href, anchor, icon: Icon, title, desc, grad, status }, i) => {
          const inner = (
            <GlassCard className={cn("hover-glow h-full group", status === "soon" && "opacity-90")}>
              <span className={cn("inline-grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg", grad)}>
                <Icon size={20} />
              </span>
              <h3 className="mt-3 flex items-center gap-2 text-lg font-extrabold group-hover:text-cyan-700 dark:group-hover:text-cyan-200">
                {title}
                {status === "soon" ? (
                  <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">Soon</span>
                ) : (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Live</span>
                )}
              </h3>
              <p className="mt-0.5 text-[13px] font-medium text-slate-600 dark:text-slate-400">{desc}</p>
              {status === "live" && (
                <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-cyan-700 dark:text-cyan-300">
                  Open <ArrowRight size={14} />
                </span>
              )}
            </GlassCard>
          );
          return (
            <motion.div
              key={title}
              id={anchor}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              className="scroll-mt-24"
            >
              {status === "live" ? <Link href={href} className="block h-full">{inner}</Link> : inner}
            </motion.div>
          );
        })}
      </div>
      <GlassCard className="mt-6">
        <h2 className="text-lg font-black">Private by design</h2>
        <p className="mt-1.5 max-w-3xl text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
          Merging, splitting and converting run 100% in your browser with open libraries — no uploads,
          no waiting rooms, no watermarks. Every tool in this suite is
          individually switchable from the Admin dashboard, with per-tool upload caps and usage logs.
        </p>
      </GlassCard>
    </div>
  );
}
