import { NextResponse } from "next/server";
import { getChapters, getPosts, getSubjects, getVersions, getPublishedSeedQuestions } from "@/lib/study-platform/catalog";
import { listQuestions } from "@/lib/study-platform/store";
import { mergeQuestions } from "@/lib/study-platform/catalog";
import { getStudyPlatformConfig } from "@/lib/study-platform/config";

/** GET /api/study-platform/taxonomy — public, flag-gated catalog. */
export async function GET() {
  const cfg = await getStudyPlatformConfig();
  if (!cfg.enabled && !cfg.flags["study-platform"]?.enabled) {
    return NextResponse.json({ error: "Study platform is disabled", enabled: false }, { status: 404 });
  }
  const stored = await listQuestions().catch(() => []);
  const questions = mergeQuestions(getPublishedSeedQuestions(), stored).filter((q) => q.status === "published");
  return NextResponse.json({
    enabled: true,
    posts: getPosts(),
    subjects: getSubjects(),
    chapters: getChapters(),
    versions: getVersions(),
    questionCount: questions.length,
  });
}
