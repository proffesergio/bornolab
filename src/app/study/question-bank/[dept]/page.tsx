"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Globe } from "lucide-react";
import { GlassCard, SectionTitle } from "@/components/ui";
import {
  qbDeptBySlug,
  type QBDocument,
} from "@/lib/question-bank-data";
import { cn } from "@/lib/cn";

/** /study/question-bank/[dept] — one department, subject-wise chapters + docs. */
export default function QBDeptPage({ params }: { params: Promise<{ dept: string }> }) {
  const { dept: slug } = use(params);
  const dept = qbDeptBySlug(slug);
  const [docs, setDocs] = useState<QBDocument[]>([]);

  useEffect(() => {
    fetch("/api/question-bank")
      .then((r) => r.json())
      .then((j) => setDocs((j.docs ?? []).filter((d: QBDocument) => d.deptId === dept?.id)))
      .catch(() => {});
  }, [dept?.id]);

  const bySubject = useMemo(() => {
    const m = new Map<string, QBDocument[]>();
    for (const d of docs) {
      const key = d.subjectId ?? "general";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(d);
    }
    return m;
  }, [docs]);

  if (!dept) {
    return (
      <GlassCard className="p-10 text-center">
        <p className="font-extrabold">Department not found</p>
        <Link href="/study/question-bank" className="mt-4 inline-block rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white">← All departments</Link>
      </GlassCard>
    );
  }

  return (
    <div>
      <Link href="/study/question-bank" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        <ArrowLeft size={14} /> All departments
      </Link>
      <SectionTitle
        kicker={`Question Bank • ${dept.title.en}`}
        title={`${dept.title.bn} (${dept.title.en}) — বিষয়ভিত্তিক সমাধান`}
        desc={`${dept.blurb.bn} ${dept.blurb.en}`}
      />

      <div className="mt-5 grid gap-5">
        {dept.subjects.map((s) => {
          const items = bySubject.get(s.id) ?? [];
          return (
            <section key={s.id} aria-label={s.title.en}>
              <h2 className="mb-2 flex items-center gap-2 text-[16px] font-black">
                <span className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white", dept.grad)}>
                  <FileText size={16} />
                </span>
                {s.title.bn} <span className="font-semibold text-slate-500">({s.title.en})</span>
                <span className="rounded-full bg-slate-900/5 px-2.5 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">{items.length} docs</span>
              </h2>
              <p className="mb-2 text-[12.5px] text-slate-500 dark:text-slate-400">{s.blurb.bn}</p>
              {/* chapter rail — structural placement for every chapter */}
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1" aria-label={`${s.title.en} chapters`}>
                {s.chapters.map((c) => {
                  const has = items.some((d) => d.chapterId === c.id);
                  return (
                    <span
                      key={c.id}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold",
                        has ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "glass text-slate-500"
                      )}
                      title={has ? "Solution attached" : "Chapter template — awaiting upload"}
                    >
                      {c.title.bn}{has ? " ✓" : ""}
                    </span>
                  );
                })}
              </div>
              {items.length === 0 ? (
                <GlassCard className="p-5 text-[13px] text-slate-500">
                  Chapter templates are ready ({s.chapters.map((c) => c.title.bn).join(", ")}) — no solution PDF uploaded here yet. Admin → Study → Question Bank → pick this subject to attach one.
                </GlassCard>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((d) => {
                    const awaiting = d.fileUrl === "#";
                    const Icon = d.fileType === "link" ? Globe : FileText;
                    const chapter = s.chapters.find((c) => c.id === d.chapterId);
                    return (
                      <GlassCard key={d.id} className="flex flex-col p-4">
                        <div className="flex items-center gap-2">
                          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white", dept.grad)}>
                            <Icon size={16} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-[14px] font-extrabold">{d.title}</h3>
                            {chapter && <p className="truncate text-[11.5px] font-semibold text-slate-500">অধ্যায়: {chapter.title.bn}</p>}
                          </div>
                        </div>
                        <p className="mt-2 line-clamp-2 flex-1 text-[12.5px] text-slate-600 dark:text-slate-400">{d.description}</p>
                        <div className="mt-2.5">
                          {awaiting ? (
                            <span className="text-[12.5px] font-bold text-slate-500">Template ready — PDF upload pending</span>
                          ) : (
                            <Link
                              href={d.fileUrl}
                              target={d.fileUrl.startsWith("http") ? "_blank" : undefined}
                              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-2 text-[12.5px] font-bold text-white hover:brightness-110"
                            >
                              Open solution →
                            </Link>
                          )}
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
