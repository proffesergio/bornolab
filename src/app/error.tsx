"use client";
import Link from "next/link";
import { GlassCard, SectionTitle } from "@/components/ui";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md text-center">
      <SectionTitle kicker="Error" title="Something went wrong" desc="An unexpected error interrupted this page. Your files never leave the browser, so nothing was lost server-side." />
      <GlassCard>
        <div className="mt-1 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 text-sm font-bold text-white hover:brightness-110">Try again</button>
          <Link href="/" className="glass hover-glow rounded-full px-6 py-3 text-sm font-bold text-slate-800 dark:text-slate-100">Home</Link>
        </div>
      </GlassCard>
    </div>
  );
}
