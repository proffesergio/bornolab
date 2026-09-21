"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Every tool in the BornoLab toolbox, as short rotating hero phrases. */
export const HERO_PHRASES = [
  "Unicode ⇄ Bijoy in one click",
  "বিজয় থেকে ইউনিকোড, মুহূর্তেই",
  "200+ Bangla fonts with live preview",
  "Fancy Styler for Facebook & Reels",
  "PDF → DOCX with layout intact",
  "Split PDFs by page range in seconds",
  "Merge PDFs in your custom order",
  "Compress, protect & unlock PDFs",
  "JPG → PDF and HTML → PDF",
  "AI summaries + n8n print automation",
];

const INTERVAL_MS = 2800;

function pickNext(current: number): number {
  if (HERO_PHRASES.length < 2) return 0;
  let next = Math.floor(Math.random() * HERO_PHRASES.length);
  if (next === current) next = (next + 1) % HERO_PHRASES.length;
  return next;
}

export function HeroRotator() {
  const [index, setIndex] = useState(0);
  // Lazy init from the media query (no setState-in-effect); event callback keeps it live.
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    if (mq.matches) return () => mq.removeEventListener("change", onChange);
    const id = setInterval(() => setIndex((i) => pickNext(i)), INTERVAL_MS);
    return () => {
      clearInterval(id);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  return (
    <span
      data-testid="hero-rotator"
      aria-live="polite"
      className="relative mt-4 block min-h-[2.2em] text-base font-bold text-slate-700 dark:text-slate-200 sm:text-lg"
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={reduced ? "static" : index}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-gradient-to-r from-cyan-600 via-violet-600 to-pink-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-violet-300 dark:to-pink-300"
        >
          {reduced ? HERO_PHRASES[0] : HERO_PHRASES[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
