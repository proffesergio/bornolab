import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionTitle } from "@/components/ui";
import { chapterBySlug, getPublishedSeedQuestions } from "@/lib/study-platform/catalog";
import { ChapterReader } from "@/components/study-platform/chapter-reader";
import { StudyShell } from "@/components/study-platform/ui";

export default async function ChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const chapter = chapterBySlug(slug);
  if (!chapter) return notFound();
  const related = getPublishedSeedQuestions().filter((q) => q.chapterId === chapter.id);
  return (
    <StudyShell>
      <Link href="/study/posts" className="text-[13px] font-bold text-slate-500">← পদ/অধ্যায়</Link>
      <div className="mt-2">
        <SectionTitle kicker="Study • Chapter" title={`${chapter.title.bn}`} desc={chapter.title.en} />
      </div>
      <ChapterReader chapter={chapter} related={related} />
    </StudyShell>
  );
}
