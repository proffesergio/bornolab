"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Languages, Type, Sparkles, FileText, Scissors, MonitorDown, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "./theme";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/convert", label: "Converter", icon: Languages },
  { href: "/fonts", label: "Fonts", icon: Type },
  { href: "/styler", label: "Styler", icon: Sparkles },
  { href: "/translate", label: "PDF⇆DOCX", icon: FileText },
  { href: "/split", label: "Splitter", icon: Scissors },
  { href: "/software", label: "Software", icon: MonitorDown },
];

export function Navbar() {
  const path = usePathname();
  const { dark, toggle } = useTheme();
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
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition",
                  active
                    ? "text-white"
                    : "text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100"
                )}
              >
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
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2.5 lg:hidden" aria-label="Mobile">
        {LINKS.map(({ href, label }) => (
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
      </nav>
    </header>
  );
}
