/** Catalog: seed fixtures + stored overrides (KV/Postgres). Server can augment; client uses seed directly. */
import { PLATFORM_CHAPTERS, PLATFORM_POSTS, PLATFORM_SUBJECTS, PLATFORM_VERSIONS, postBySlug, versionBySlug } from "./curriculum";
import { SEED_QUESTIONS, enrichedChapters } from "./seed-content";
import type { Chapter, ExamVersion, Post, Question } from "./types";

export function getPosts(): Post[] {
  return PLATFORM_POSTS.filter((p) => p.enabled);
}

export function getSubjects() {
  return PLATFORM_SUBJECTS;
}

export function getChapters(): Chapter[] {
  return enrichedChapters();
}

export function getVersions(): ExamVersion[] {
  return PLATFORM_VERSIONS.filter((v) => v.enabled);
}

export function getPublishedSeedQuestions(): Question[] {
  return SEED_QUESTIONS.filter((q) => q.status === "published");
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

export function questionsForVersion(versionSlug: string, all: Question[]): Question[] {
  const v = versionBySlug(versionSlug);
  if (!v) return [];
  const ids = new Set(v.postSlugs);
  // Demo version draws from all published seed items up to section totals.
  const pool = all.filter((q) => q.status === "published" && (q.examVersionIds.includes(v.id) || q.postSlugs.some((p) => ids.has(p))));
  return pool;
}

export { postBySlug, versionBySlug, PLATFORM_CHAPTERS, PLATFORM_POSTS, PLATFORM_SUBJECTS, PLATFORM_VERSIONS };

/** Chapter lookup over the enriched list (deep-chapter patches applied). */
export function chapterBySlug(slug: string) {
  return enrichedChapters().find((c) => c.slug === slug);
}
