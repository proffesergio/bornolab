import type { Metadata } from "next";
import Link from "next/link";
import { GlassCard, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "About BornoLab",
  description:
    "About BornoLab — a free, client-first বাংলা Font & Document Suite: Bijoy to Unicode converter, Bangla fonts, text styler, PDF tools and software store.",
};

export default function AboutPage() {
  return (
    <div>
      <SectionTitle
        kicker="About"
        title="What is BornoLab?"
        desc="বর্ণল্যাব is a free, client-first বাংলা Font & Document Suite for creators, newsrooms, authors, students and DTP studios across Bangladesh."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h2 className="text-lg font-black">Our mission</h2>
          <p className="mt-2 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            For decades, Bangla publishing ran on Bijoy (ANSI) fonts like SutonnyMJ — powerful for print,
            but unreadable on the web without the exact font installed. Meanwhile modern phones, websites
            and databases speak Unicode. BornoLab bridges that gap: a newsroom-grade{" "}
            <Link className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/bijoy-unicode-converter">
              Bijoy to Unicode converter
            </Link>{" "}
            that preserves কার, য-ফলা, রেফ and যুক্তবর্ণ, a curated{" "}
            <Link className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/fonts">
              Bangla font directory
            </Link>{" "}
            with live previews, a{" "}
            <Link className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/styler">
              fancy text styler
            </Link>{" "}
            for social media, and a growing{" "}
            <Link className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/pdf-tools">
              PDF tools suite
            </Link>{" "}
            (PDF to DOCX, splitter, merger, compressor) — all running 100% in your browser.
          </p>
          <p className="mt-2 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            Heavy publishing pipelines — book formatting, journal templates, OCR on scanned pages — are
            handled through self-hosted n8n automation, so your documents stay yours. No uploads, no
            waiting rooms, no watermarks on free tools.
          </p>
        </GlassCard>
        <GlassCard>
          <h2 className="text-lg font-black">Who it serves</h2>
          <ul className="mt-2 space-y-2 text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
            <li><b>Newspapers & DTP studios:</b> convert decades of Bijoy archives into searchable Unicode, then format print-ready pages.</li>
            <li><b>Authors & publishers:</b> manuscript in, formatted book or journal out — with proper headings, tables and page sizes.</li>
            <li><b>Creators & marketers:</b> stylish Bangla captions, thumbnails and posters with premium display fonts in seconds.</li>
            <li><b>Students & offices:</b> Govt Nikosh templates, PDF to Word homework, split admission circulars — free, in-browser.</li>
          </ul>
        </GlassCard>
      </div>
      <GlassCard className="mt-4">
        <h2 className="text-lg font-black">How we sustain free tools</h2>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-7 text-slate-600 dark:text-slate-400">
          Core converters and PDF utilities are free forever. Premium Bangla fonts and pro desktop software
          are sold through the{" "}
          <Link className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/software">
            software store
          </Link>{" "}
          with local payment methods (bKash, Nagad, bank, Binance), and display advertising (Google AdSense)
          may appear in clearly labelled slots. Read our{" "}
          <Link className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/privacy">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/terms">
            Terms of Use
          </Link>
          , or <Link className="font-bold text-cyan-700 underline dark:text-cyan-300" href="/contact">contact us</Link> with
          feedback — every message is read by a human.
        </p>
      </GlassCard>
    </div>
  );
}
