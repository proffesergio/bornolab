# Study Platform — Developer Document

> Bengali-first IT Government Job Preparation: materials, question bank, timed exams. Original content only; third-party sources are topic references, never copied.

## 1. Data model (`src/lib/study-platform/types.ts`)

- **Post** (role, e.g. `bank-assistant-programmer`) → **Exam** (family) → **ExamVersion** (dated pattern: `durationSec`, `totalMarks`, `sections[]`, `policy{marksPerQuestion, negativeMark, unansweredPenalty}`, `leave{allowLeave, leaveAction}`, `shuffleQuestions/Options`, `attemptLimit`, `syllabusRef`, `sources[]`, `demo?`).
- **Subject → Chapter → Topic** with `BilingualText {bn, en}`, aliases, objectives, keyTerms, workedExamples, traps, revisionNotes, resourceLinks.
- **Question**: `locale{bn,en:{stem, options[≥4], explanation}}`, `options[]` with per-locale text, `key{optionId, status: provisional|approved, confidence}`, `citations[]`, `license{original|licensed|link-only|pending|blocked}`, `status: draft→…→published→retired`, `version`, `history[]`, `ambiguityFlag`, `ocrFlags[]`.
- **Attempt**: `seed`, `questionOrder`, `optionOrder`, `answers{questionId:{optionId|null, markedForReview}}`, `startedAt`, `deadline`, `submittedAt|null`, `score?`, `needsRecalculation?`, `correctionNote?`.
- **ScorePolicy / UserProgress / Bookmark / QuestionFlag / AuditEvent / FeatureFlag** as in types.

## 2. Routes

| Route | Purpose |
|---|---|
| `/study` | Hub (preserved) + preparation-module cards, subject rail, progress rail |
| `/study/posts` | Browse posts + versions |
| `/study/posts/[slug]` | Syllabus map, patterns, practice path |
| `/study/chapters` | Browsable notes index: BN/EN search, subject filter, cards |
| `/study/chapters/[slug]` | BN/EN/split reader, glossary, examples, quick checks, bookmarks |
| `/study/practice` | Builder: version, difficulty, lang, queue (all/wrong/unanswered/bookmarked), count; instant feedback |
| `/study/exams/[slug]` | Instructions, config, leave policy, sample, confirm |
| `/study/exams/[slug]/attempt/[attemptId]` | Timed engine |
| `/study/results/[attemptId]` | Score + breakdowns + review + citations + recalculation |
| `/study/progress` | History, wrong/unanswered queues, guidance disclaimer |
| `/admin` → Study | Flags, import, review queue, audit (reuses admin auth) |

## 3. API contract

- `GET /api/study-platform/taxonomy` → `{posts, subjects, chapters, versions, questionCount}` (published only; 404 when disabled).
- `POST /api/study-platform/practice` `{version, difficulty, chapter, qtype, mode, count}` → `{items, total}`.
- `POST /api/study-platform/attempts` `{action:create, versionSlug}` → `{attemptId, deadline, count}`; `{action:submit, attemptId, auto}` → idempotent `{attempt}`.
- `PATCH /api/study-platform/attempts` `{attemptId, questionId, optionId|null, markedForReview}` → `{savedAt}` (409 if submitted, 410 if past deadline).
- `GET /api/study-platform/attempts?id=` → `{attempt, now, remainingSec}` (owner or admin).
- `GET /api/study-platform/progress` (login) → `{progress, attempts, bookmarks, disclaimer}`.
- `POST/DELETE /api/study-platform/bookmarks` (login).
- `DELETE /api/study-platform/attempts` `{attemptId}` — cancel an unsubmitted attempt (owner or admin; submitted attempts cannot be cancelled).
- Admin (`requireAdmin`): `POST /api/study-platform/import` (JSON/CSV → staging + drafts, never auto-publish); `GET/POST /api/study-platform/review` (queue with content preview, key confidence, duplicate groups + approve/publish/retire/rollback, 422 on blockers, key-change → recalculation candidates); `POST /api/study-platform/recalculate` (re-score flagged attempts; originals preserved in `previousScores`); `GET /api/study-platform/export?kind=questions|attempts&format=json|csv`; `GET /api/study-platform/audit`; `GET/PUT /api/study-platform/flags`.
- Guards: per-IP throttles on attempt-create (20/h) and practice (60/h); attempt creation resumes an active attempt and enforces `ExamVersion.attemptLimit`; expired `expiresAt` citations block publication.
- `GET /api/study-platform/schedule` (login) → SM-2 due queue + summary; `POST` `{questionId, grade 0|3|4|5}` records a grade. Grades: Again 0 / Hard 3 / Good 4 / Easy 5 (classic SM-2, ease floor 1.3, interval cap 365d); practice auto-grades correct→4/incorrect→2; exam submit auto-grades correct→4/incorrect→2/unanswered→1 into `UserProgress.srCards`.
- `POST /api/study-platform/consent` `{optIn}` (login); `GET /api/study-platform/percentile?version=` (login + opt-in) → cohort band only at 30+ opted-in attempts; never peer scores/ids/ranks.
- `GET/POST /api/study-platform/evidence` (admin) — restricted OCR evidence ledger; raw evidence never reaches learners.
- PWA: `/manifest.webmanifest` (app/manifest.ts), `/sw.js` (shell + static cache, API never cached, `/offline` fallback), outbox-synced exam autosaves; submit stays online-only with server deadline (late submits marked auto-submitted).
- Editorial workflow is admin-only by decision: the single admin authors, reviews, publishes and recalculates (every action audit-logged). No reviewer accounts. Bangla TTS deferred by decision.

## 4. Scoring rules (`scoring.ts`)

- Per-question `marksPerQuestion`; wrong → `−negativeMark`; unanswered → `−unansweredPenalty` (default 0).
- `raw` = correct × marks; `penalty` = wrong × neg + unanswered × unpen; `net = raw − penalty`; `pct = 100 × net / max`.
- Section/topic totals + `timeUsedSec = submittedAt − startedAt`; `keyStatus = provisional` if any item provisional.
- Section mapping is chapter→subject→section (`resolveSection`); the per-question section is frozen on the attempt at creation so later taxonomy edits never rewrite history.
- `seededShuffle` (mulberry32) for reproducible review; `optionOrder`/`questionOrder` stored on attempt.
- Demo: 20Q/15min/0.50 verified in `task22` + engine tests.

## 5. Ingestion / review workflow (`ingestion.ts`, `validation.ts`)

1. Import JSON/CSV/manual → `stageRow` (source URL/title/page/retrieval/fileHash/license) → `study_evidence` (admin-only).
2. Unicode NFC cleanup; `detectOcrFlags` (garbled-bangla, broken-formula, missing-option/diagram); `findDuplicateStems`.
3. `toDraftQuestion` → status `draft`, key `provisional/low`, license `pending` — paraphrase + independent solve required (run code/math; attach RFC/NIST/OWASP/MDN/official/dated sources; bilingual review).
4. `validateForPublication` blocks publish on: missing BN/EN stem, <4 options per locale, missing explanation per locale, missing/unapproved key, missing citation, pending/blocked rights, ambiguity/OCR flags.
5. Review API enforces two-person flow + 422 with issue codes; key change post-publish marks attempts `needsRecalculation`, preserves originals, logs `AuditEvent`; rollback via `QuestionVersion.history`.

## 6. How to add a new post or ExamVersion

1. Add `Post` to `PLATFORM_POSTS` (+ `examIds`), `Exam` to `PLATFORM_EXAMS`, `ExamVersion` to `PLATFORM_VERSIONS` in `src/lib/study-platform/curriculum.ts` with BN/EN labels, duration/marks/sections/policy/leave/shuffle/sources.
2. Tag seed questions with `postSlugs`/`examVersionIds` (or import drafts → review → publish).
3. Verify: `node --test tests/task22-study-platform.test.mjs`, `npm run typecheck`, `npm run lint`.
4. Operate: Admin → Study Platform → enable flag, import, review queue, audit; monitor attempts via progress API; on key fix use review `newKeyOptionId` → recalculation candidates → notify learners via correction notes.

## 7. Limitations (reported, not hidden)

- Duranta/Scribd/SlideShare PDFs were research leads only; several are scans/OCR-corrupted or answer-templates (e.g. 200-slot OMR) — not ingested; counts (e.g. ~67 Duranta rows) are timestamped observations.
- Printed/embedded keys are not trusted (POST-vs-GET, white/black-box, ARP/RARP, current-affairs) — each seed answer was independently re-derived and cited.
- Postgres tables are created idempotently at runtime; without `POSTGRES_URL/DATABASE_URL` the KV-file fallback is authoritative (single-instance semantics on serverless).
- Current-affairs seeds require dated citations + `expiresAt`; expired items must be re-reviewed before publish.
- Lesson sources (2026-10-14, recorded access): Google Drive `Computer Fundamentals Bengali.pdf` — sign-in required, **not accessible**; banglabookshelf `Computer-er Itihash.pdf` — raw scanned-image PDF (no text layer), **not reproduced**; BOU `osbba_1103/Unit-01.pdf` — official textbook PDF (SutonnyMJ-encoded), used as topic reference only; Subeen C book (banglabookshelf copy) — copyrighted published book, used as topic reference only. All 104 lessons + 20 questions are **original BornoLab authorship**; no book text, scans, PDFs, or question banks were copied, rehosted, or redistributed.
