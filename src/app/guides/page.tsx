"use client";
import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import { AdUnits } from "@/components/ads";
import { GUIDES } from "@/lib/guides";

const CATS = [...new Set(GUIDES.map((g) => g.category))];

export default function GuidesPage() {
  return (
    <div>
      <SectionTitle
        kicker="Guides"
        title="Bangla Computing Guides"
        desc="In-depth, practical guides: Bijoy & Unicode, typing, fonts, PDFs, admissions. Free forever."
      />
      <div className="mt-4 flex flex-wrap gap-1.5">
        {CATS.map((c) => (
          <span key={c} className="glass rounded-full px-3 py-1.5 text-[12px] font-bold">{c}</span>
        ))}
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="block h-full">
            <GlassCard className="hover-glow flex h-full flex-col p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">{g.category}</p>
              <h2 className="mt-1 font-extrabold leading-6">{g.title}</h2>
              <p className="mt-1.5 line-clamp-3 flex-1 text-[13px] leading-6 text-slate-600 dark:text-slate-400">{g.description}</p>
              <p className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                <Clock size={13} /> {g.minutes} min read
                <span className="ml-auto inline-flex items-center gap-1 font-bold text-cyan-700 dark:text-cyan-300">
                  <BookOpen size={13} /> Read →
                </span>
              </p>
            </GlassCard>
          </Link>
        ))}
      </div>
      <AdUnits slot="inFeed" className="mt-8" />
    </div>
  );
}
