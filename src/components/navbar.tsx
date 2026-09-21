"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Moon, Sun, Languages, Type, Sparkles, MonitorDown, Home,
  FileText, Scissors, Combine, Minimize2, Image as ImageIcon, LayoutGrid, ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "./theme";
import { UserMenu } from "./user-menu";
import { useSiteConfig } from "./site-widgets";
import { cn } from "@/lib/cn";
import type { PdfToolKey, ToolKey } from "@/lib/site-config-shared";

const LINKS: { href: string; label: string; icon: typeof Home; tool?: ToolKey }[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/bijoy-unicode-converter", label: "Bijoy <> Unicode", icon: Languages, tool: "convert" },
  { href: "/fonts", label: "Fonts", icon: Type, tool: "fonts" },
  { href: "/styler", label: "Styler", icon: Sparkles, tool: "styler" },
  { href: "/software", label: "Software", icon: MonitorDown, tool: "software" },
];

const PDF_TOOLS: { href: string; label: string; icon: typeof FileText; tool?: ToolKey; pdfTool?: PdfToolKey; badge?: string }[] = [
  { href: "/pdf-tools", label: "All PDF Tools", icon: LayoutGrid },
  { href: "/merge", label: "Merge PDF", icon: Combine, pdfTool: "merge" },
  { href: "/translate", label: "PDF to DOCX", icon: FileText, tool: "translate" },
  { href: "/split", label: "Split PDF", icon: Scissors, tool: "split" },
  { href: "/compress", label: "Compress PDF", icon: Minimize2, pdfTool: "compress" },
  { href: "/images-to-pdf", label: "Images to PDF", icon: ImageIcon, pdfTool: "images" },
];

const PDF_ROUTES = ["/pdf-tools", "/translate", "/split", "/merge", "/compress", "/images-to-pdf"];

export function Navbar() {
  const path = usePathname();
  const { dark, toggle } = useTheme();
  const { config } = useSiteConfig();
  const [pdfOpen, setPdfOpen] = useState(false);

  const visibleLinks = LINKS.filter((l) => !l.tool || config.tools[l.tool]);
  const visiblePdfTools = PDF_TOOLS.filter(
    (t) => (!t.tool || config.tools[t.tool]) && (!t.pdfTool || config.pdfTools[t.pdfTool].enabled)
  );
  const pdfActive = PDF_ROUTES.some((r) => path === r || path.startsWith(r + "/") || path.startsWith(r + "#"));

  const pill = "relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition";
  const idle = "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-[#070b16]/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 text-lg font-black text-white shadow-[0_0_24px_rgba(34,211,238,.5)]">
            ব
          </span>
          <span className="leading-tight">
            <span className="block text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white">BornoLab</span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">বাংলা Font & Document Suite</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {visibleLinks.slice(0, 4).map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href} className={cn(pill, active ? "text-white" : idle)}>
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/90 to-purple-600/90"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon size={15} className="relative" />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
          {visiblePdfTools.length > 0 && (
            <div
              className="relative"
              onMouseEnter={() => setPdfOpen(true)}
              onMouseLeave={() => setPdfOpen(false)}
            >
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded={pdfOpen}
                onClick={() => setPdfOpen((v) => !v)}
                onKeyDown={(e) => { if (e.key === "Escape") setPdfOpen(false); }}
                className={cn(pill, pdfActive ? "text-white" : idle)}
              >
                {pdfActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/90 to-purple-600/90"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <FileText size={15} className="relative" />
                <span className="relative">PDF Tools</span>
                <ChevronDown size={14} className={cn("relative transition-transform", pdfOpen && "rotate-180")} />
              </button>
              {pdfOpen && (
                <div
                  role="menu"
                  aria-label="PDF Tools"
                  className="glass absolute left-1/2 top-full z-50 mt-2 w-60 -translate-x-1/2 rounded-2xl p-2 shadow-2xl"
                >
                  {visiblePdfTools.map(({ href, label, icon: Icon, badge }) => (
                    <Link
                      key={href + label}
                      href={href}
                      role="menuitem"
                      onClick={() => setPdfOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-700 transition hover:bg-cyan-500/10 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                      <Icon size={15} className="shrink-0 text-cyan-600 dark:text-cyan-300" />
                      <span className="flex-1">{label}</span>
                      {badge && (
                        <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                          {badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          {visibleLinks.slice(4).map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href} className={cn(pill, active ? "text-white" : idle)}>
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/90 to-purple-600/90"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon size={15} className="relative" />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <UserMenu />
          <button
            onClick={toggle}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="theme-toggle-btn glass flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold text-slate-700 dark:text-slate-200"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            <span className="hidden sm:inline">{dark ? "Light" : "Dark"}</span>
          </button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2.5 lg:hidden" aria-label="Mobile">
        {visibleLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium",
              path === href ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "glass text-slate-700 dark:text-slate-300"
            )}
          >
            {label}
          </Link>
        ))}
        {visiblePdfTools.length > 0 && (
          <>
            <span className="whitespace-nowrap px-1 py-1.5 text-[12px] font-bold text-slate-400">PDF:</span>
            {visiblePdfTools.filter((t) => t.href !== "/pdf-tools").map(({ href, label }) => (
              <Link
                key={href + label}
                href={href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium",
                  path === href ? "bg-gradient-to-r from-cyan-500 to-purple-600 text-white" : "glass text-slate-700 dark:text-slate-300"
                )}
              >
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>
    </header>
  );
}
