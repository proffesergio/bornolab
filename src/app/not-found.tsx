import Link from "next/link";
import { GlassCard, SectionTitle } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md text-center">
      <SectionTitle kicker="404" title="Page not found" desc="The link you followed doesn't exist or a tool was moved." />
      <GlassCard>
        <p className="text-[13.5px] text-slate-600 dark:text-slate-400">
          Try the PDF suite, the converter, or head back home.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 text-sm font-bold text-white hover:brightness-110">Home</Link>
          <Link href="/pdf-tools" className="glass hover-glow rounded-full px-6 py-3 text-sm font-bold text-slate-800 dark:text-slate-100">PDF Tools</Link>
        </div>
      </GlassCard>
    </div>
  );
}
