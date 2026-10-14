/** Catalog: seed fixtures + stored overrides (KV/Postgres). Server can augment; client uses seed directly. */
import { PLATFORM_CHAPTERS, PLATFORM_POSTS, PLATFORM_SUBJECTS, PLATFORM_VERSIONS, postBySlug, versionBySlug } from "./curriculum";
import { SEED_QUESTIONS, enrichedChapters } from "./seed-content";
import { LESSON_CHAPTERS_FUND } from "./lessons-fundamentals";
import { LESSON_CHAPTERS_CPROG, LESSON_QUESTIONS } from "./lessons-cprog";
import type { Chapter, ExamVersion, Post, Question } from "./types";

/** All lesson chapters (original BornoLab authorship — see lessons-*.ts headers). */
export function lessonChapters(): Chapter[] {
  return [...LESSON_CHAPTERS_FUND, ...LESSON_CHAPTERS_CPROG];
}

export function getPosts(): Post[] {
  return PLATFORM_POSTS.filter((p) => p.enabled);
}

export function getSubjects() {
  return PLATFORM_SUBJECTS;
}

export function getChapters(): Chapter[] {
  return [...enrichedChapters(), ...lessonChapters()];
}

export function getVersions(): ExamVersion[] {
  return PLATFORM_VERSIONS.filter((v) => v.enabled);
}

export function getPublishedSeedQuestions(): Question[] {
  return [...SEED_QUESTIONS, ...LESSON_QUESTIONS].filter((q) => q.status === "published");
}

export function getDemoVersion(): ExamVersion {
  return PLATFORM_VERSIONS.find((v) => v.demo) ?? PLATFORM_VERSIONS[0];
}

/** Merge seed + admin-stored questions (stored wins by id). Stored list passed from API. */
export function mergeQuestions(seed: Question[], stored: Question[]): Question[] {
  const byId = new Map<string, Question>();
  for (const q of seed) byId.set(q.id, q);
  for (const q of stored) byId.set(q.id, q);
  return [...byId.values()];
}

/** Chapter id → subject id (for section resolution). Pure. */
export function chapterSubjectMap(): Record<string, string> {
  const m: Record<string, string> = {};
  for (const c of getChapters()) m[c.id] = c.subjectId;
  return m;
}

/** Resolve a question's chapter to its ExamVersion section (chapter→subject→section). */
export function resolveSection(
  version: ExamVersion,
  chapterId: string | undefined,
  map: Record<string, string> = chapterSubjectMap()
): string {
  const subj = chapterId ? map[chapterId] : undefined;
  const sec = subj ? version.sections.find((s) => s.subjectIds.includes(subj)) : undefined;
  return sec?.id ?? version.sections[0]?.id ?? "general";
}

export function questionsForVersion(versionSlug: string, all: Question[]): Question[] {
  const v = versionBySlug(versionSlug);
  if (!v) return [];
  const ids = new Set(v.postSlugs);
  // Demo version draws from all published seed items up to section totals.
  const pool = all.filter((q) => q.status === "published" && (q.examVersionIds.includes(v.id) || q.postSlugs.some((p) => ids.has(p))));
  return pool;
}

export { postBySlug, versionBySlug, PLATFORM_CHAPTERS, PLATFORM_POSTS, PLATFORM_SUBJECTS, PLATFORM_VERSIONS };

/** Chapter lookup over the enriched list + lessons. */
export function chapterBySlug(slug: string) {
  return getChapters().find((c) => c.slug === slug);
}
