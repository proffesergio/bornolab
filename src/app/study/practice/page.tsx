"use client";
import { Suspense } from "react";
import { SectionTitle } from "@/components/ui";
import { PracticeBuilder } from "@/components/study-platform/practice-builder";
import { StudyShell } from "@/components/study-platform/ui";

export default function PracticePage() {
  return (
    <StudyShell>
      <SectionTitle kicker="Study • Practice" title="অনুশীলন (Practice — instant feedback)" desc="পোস্ট/সংস্করণ/বিষয়/অধ্যায়, কঠিনতা, ভাষা, ভুল/অনুত্তর/বুকমার্ক ও সংখ্যা বেছে নিন। টাইমড পরীক্ষার আগে ঝালিয়ে নিন।" />
      <Suspense fallback={<p className="text-sm text-slate-500">লোড হচ্ছে…</p>}>
        <PracticeBuilder />
      </Suspense>
    </StudyShell>
  );
}
