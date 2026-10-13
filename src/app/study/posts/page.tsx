import Link from "next/link";
import { GlassCard, SectionTitle } from "@/components/ui";
import { getChapters, getPosts, getSubjects, getVersions } from "@/lib/study-platform/catalog";
import { getStudyPlatformConfig } from "@/lib/study-platform/config";
import { StudyShell } from "@/components/study-platform/ui";

export const metadata = { title: "Posts — BornoLab Study" };

export default async function PostsPage() {
  const cfg = await getStudyPlatformConfig();
  const on = cfg.enabled || cfg.flags["study-platform"]?.enabled;
  const posts = getPosts();
  const versions = getVersions();
  return (
    <StudyShell>
      <SectionTitle kicker="Study • Posts" title="লক্ষ্য-পদ বেছে নিন (Target posts)" desc="বাংলাদেশের IT-সম্পর্কিত সরকারি/স্বায়ত্তশাসিত পদের তালিকা — প্রতিটি পদের ExamVersion আলাদা।" />
      {!on && (
        <GlassCard className="border-amber-500/30 p-4 text-[13px]">
          প্রিভিউ মোড — নতুন প্ল্যাটফর্ম ফ্ল্যাগের আড়ালে চলছে। পুরোনো <Link href="/study" className="underline">Study Hub</Link> আগের মতোই কাজ করছে।
        </GlassCard>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {posts.map((p) => (
          <Link key={p.id} href={`/study/posts/${p.slug}`}>
            <GlassCard className="p-5 transition hover:border-cyan-500/40">
              <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-700 dark:text-cyan-300">{p.org.bn} • গ্রেড {p.grade ?? "—"}</p>
              <h2 className="mt-1 font-extrabold leading-7">{p.title.bn} <span className="font-semibold text-slate-500">({p.title.en})</span></h2>
              <p className="mt-1 text-[12.5px] text-slate-500">{p.eligibilityNote?.bn}</p>
              <span className="mt-2 inline-block text-[13px] font-bold text-cyan-700 dark:text-cyan-300">সিলেবাস ও প্যাটার্ন →</span>
            </GlassCard>
          </Link>
        ))}
      </div>
      <h2 className="mb-2 mt-8 font-black">📋 ExamVersions ({versions.length})</h2>
      <div className="grid gap-2">
        {versions.map((v) => (
          <Link key={v.id} href={`/study/exams/${v.slug}`} className="glass flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3">
            <span className="font-bold">{v.label.bn} <span className="font-semibold text-slate-500">({v.label.en})</span></span>
            <span className="text-[12px] font-bold text-slate-500">{Math.round(v.durationSec / 60)} মিনিট • {v.totalMarks} নম্বর • −{v.policy.negativeMark} {v.demo ? "• ডেমো" : ""}</span>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-[12px] text-slate-500">সূত্র: {getSubjects().length}টি বিষয় • {getChapters().length}টি অধ্যায় • BPSC/নিয়োগ বিজ্ঞপ্তি অনুসরণ করুন।</p>
    </StudyShell>
  );
}
