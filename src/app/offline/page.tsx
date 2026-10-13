import Link from "next/link";
import { GlassCard, SectionTitle } from "@/components/ui";
import { StudyShell } from "@/components/study-platform/ui";

export const metadata = { title: "Offline — BornoLab Study" };

/** Served by the service worker when a navigation fails offline. */
export default function OfflinePage() {
  return (
    <StudyShell>
      <SectionTitle kicker="Offline" title="অফলাইনে আছেন" desc="ইন্টারনেট ফিরলে পেজটি আবার লোড হবে। আগে দেখা নোট ও স্টাডি পেজগুলো ক্যাশ থেকে খুলবে।" />
      <GlassCard className="text-center">
        <p className="text-[14px] leading-7 text-slate-600 dark:text-slate-300">
          ⏱️ টাইমড পরীক্ষার উত্তর ডিভাইসে সারিবদ্ধ (queue) থাকে — reconnect-এ স্বয়ংক্রিয়ভাবে sync হয়।
          জমা (submit) শুধু অনলাইনে হয়; deadline সার্ভারেই গণনা হয়।
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link href="/study" className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white">Study Hub →</Link>
          <Link href="/study/chapters" className="glass rounded-full px-6 py-2.5 text-sm font-bold">নোট →</Link>
        </div>
      </GlassCard>
    </StudyShell>
  );
}
