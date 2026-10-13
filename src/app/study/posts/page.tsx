import Link from "next/link";
import { GlassCard, SectionTitle } from "@/components/ui";
import { PostBrowser } from "@/components/study-platform/post-browser";
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
      <div className="mt-4">
        <PostBrowser posts={posts} />
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
