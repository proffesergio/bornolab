import { SectionTitle } from "@/components/ui";
import { ChapterBrowser } from "@/components/study-platform/chapter-browser";
import { StudyShell } from "@/components/study-platform/ui";
import { getChapters, getPublishedSeedQuestions, getSubjects } from "@/lib/study-platform/catalog";

export const metadata = { title: "Study Notes — BornoLab Study" };

/** /study/chapters — browsable bilingual notes index (?subject=slug). */
export default async function ChaptersIndex({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const sp = await searchParams;
  const subjects = getSubjects();
  const initial = subjects.find((s) => s.slug === sp.subject)?.id ?? "";
  return (
    <StudyShell>
      <SectionTitle
        kicker="Study • Notes"
        title="স্টাডি নোট (বিষয়ভিত্তিক)"
        desc="প্রতিটি অধ্যায়ে বাংলা/English নোট, মূল পরিভাষা, উদাহরণ, সাধারণ ভুল, দ্রুত রিভিশন ও কুইক চেক — তারপর অনুশীলন।"
      />
      <ChapterBrowser chapters={getChapters()} subjects={subjects} questions={getPublishedSeedQuestions()} initialSubject={initial} />
    </StudyShell>
  );
}
