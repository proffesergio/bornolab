import Link from "next/link";
import { notFound } from "next/navigation";
import { GlassCard, SectionTitle } from "@/components/ui";
import { getChapters, getVersions, postBySlug } from "@/lib/study-platform/catalog";
import { StudyShell } from "@/components/study-platform/ui";

export default async function PostDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) return notFound();
  const versions = getVersions().filter((v) => v.postSlugs.includes(post.slug));
  const chapters = getChapters().slice(0, 8);
  return (
    <StudyShell>
      <Link href="/study/posts" className="text-[13px] font-bold text-slate-500">← সব পদ</Link>
      <div className="mt-2">
        <SectionTitle kicker={post.org.bn} title={`${post.title.bn} (${post.title.en})`} desc={post.eligibilityNote?.bn} />
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div>
          <GlassCard>
            <h2 className="font-extrabold">📜 সিলেবাস-মানচিত্র</h2>
            <p className="mt-1 text-[13px] text-slate-500">উৎস: BPSC/নিয়োগ বিজ্ঞপ্তি (http://bpsc.gov.bd/) — সার্কুলারভেদে প্যাটার্ন বদলায়।</p>
            <div className="mt-2 grid gap-1.5">
              {chapters.map((c) => (
                <Link key={c.id} href={`/study/chapters/${c.slug}`} className="rounded-xl bg-slate-900/[.04] px-3 py-2 text-[13px] font-semibold hover:bg-cyan-500/10 dark:bg-white/5">
                  {c.title.bn} <span className="text-slate-500">({c.title.en})</span>
                </Link>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="mt-3">
            <h2 className="font-extrabold">⏱️ পরীক্ষা-প্যাটার্ন</h2>
            {versions.length === 0 && <p className="mt-1 text-[13px] text-slate-500">এই পদের জন্য এখনও সংস্করণ যোগ হয়নি।</p>}
            {versions.map((v) => (
              <Link key={v.id} href={`/study/exams/${v.slug}`} className="mt-2 block rounded-xl bg-cyan-500/10 p-3">
                <p className="font-bold">{v.label.bn}</p>
                <p className="text-[12.5px] text-slate-500">{Math.round(v.durationSec / 60)} মিনিট • {v.totalMarks} নম্বর • নেগেটিভ −{v.policy.negativeMark} • অনুত্তরিত পেনাল্টি {v.policy.unansweredPenalty}</p>
              </Link>
            ))}
          </GlassCard>
        </div>
        <aside>
          <GlassCard>
            <h3 className="text-sm font-extrabold">▶ অনুশীলন-পথ</h3>
            <div className="mt-2 grid gap-2">
              <Link href="/study/practice" className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2.5 text-center text-[13px] font-bold text-white">Practice now →</Link>
              <Link href="/study/progress" className="glass rounded-xl px-4 py-2.5 text-center text-[13px] font-bold">অগ্রগতি →</Link>
            </div>
            <p className="mt-2 text-[12px] text-slate-500">আগে অধ্যায় পড়ুন, তারপর practice, তারপর timed exam।</p>
          </GlassCard>
        </aside>
      </div>
    </StudyShell>
  );
}
