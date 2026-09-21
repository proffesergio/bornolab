"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText, Scissors, Combine, Minimize2, Image as ImageIcon,
  Globe, ShieldCheck, Unlock, Sparkles, Languages, ArrowRight,
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

const TOOLS: (Tool & { pdfTool?: "merge" | "split" | "translate" })[] = [
  { href: "/merge", icon: Combine, title: "Merge PDF", desc: "Combine many PDFs into one file in your custom sequence — drag order, then merge.", grad: "from-orange-500 to-red-500", status: "live", pdfTool: "merge" },
  { href: "/translate", icon: FileText, title: "PDF to DOCX", desc: "Text nodes become editable paragraphs — never textbox soup. Tables and reading order preserved.", grad: "from-emerald-500 to-teal-600", status: "live", pdfTool: "translate" },
  { href: "/split", icon: Scissors, title: "Split PDF", desc: "Visual thumbnails, ranges like 1-3, 5, 7-12. Export PDF, JPG/PNG zip, or DOCX.", grad: "from-amber-500 to-orange-600", status: "live", pdfTool: "split" },
  { href: "/pdf-tools", anchor: "compress", icon: Minimize2, title: "Compress PDF", desc: "Shrink file size while keeping visual fidelity. Quality slider included at launch.", grad: "from-lime-500 to-green-600", status: "soon" },
  { href: "/pdf-tools", icon: ImageIcon, title: "Images to PDF", desc: "JPG/PNG to PDF with margin and orientation controls.", grad: "from-yellow-500 to-amber-600", status: "soon" },
  { href: "/pdf-tools", icon: Globe, title: "HTML to PDF", desc: "Paste a URL, get a snapshot PDF of the page.", grad: "from-sky-500 to-blue-600", status: "soon" },
  { href: "/pdf-tools", icon: ShieldCheck, title: "Protect PDF", desc: "Password-protect and encrypt documents against unauthorized access.", grad: "from-blue-500 to-indigo-600", status: "soon" },
  { href: "/pdf-tools", icon: Unlock, title: "Unlock PDF", desc: "Remove password restrictions you own the rights to.", grad: "from-slate-500 to-slate-700", status: "soon" },
  { href: "/pdf-tools", icon: Sparkles, title: "AI Summarizer", desc: "Key points and bulleted summaries extracted from long documents.", grad: "from-purple-500 to-fuchsia-600", status: "soon" },
  { href: "/pdf-tools", icon: Languages, title: "AI Translator", desc: "Translate document content while keeping the layout intact.", grad: "from-cyan-500 to-sky-600", status: "soon" },
];

export default function PdfToolsPage() {
  const { config } = useSiteConfig();

  return (
    <div>
      <SectionTitle
        kicker="PDF Suite"
        title="PDF Tools — merge, split, convert & secure"
        desc="Free in-browser PDF utilities: convert PDF to editable Word documents, split out the pages you need, and soon merge, compress, protect and summarize. Your files never leave your browser."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.filter((t) => {
          if (t.pdfTool) return config.pdfTools[t.pdfTool].enabled;
          if (t.href === "/translate") return config.tools.translate;
          if (t.href === "/split") return config.tools.split;
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
          no waiting rooms, no watermarks. Large print-shop jobs (OCR on scanned pages, batch
          publishing pipelines) can be offloaded to your own n8n workflows. Every tool in this suite is
          individually switchable from the Admin dashboard, with per-tool upload caps and usage logs.
        </p>
      </GlassCard>
    </div>
  );
}
