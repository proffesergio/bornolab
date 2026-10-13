# BornoLab Study Platform — Implementation Plan (Week 1–4, single release)

> Source of truth for the Study module upgrade. Preserved so Week 2–4 can continue from here.
> Stack: Next.js 16 App Router, React 19, TS, Tailwind v4, Framer Motion, Lucide, postgres, Zustand, pdf-lib/pdfjs/docx/mammoth, JSON + Postgres-KV storage.

## 0. Decisions (from clarifying Q&A, 2026-10-13)

- **Scope:** Implement all 4 weeks in one change set (foundation → seed bank → exam engine → analytics/admin), behind a feature flag.
- **Storage:** New normalized Postgres tables with idempotent DDL + JSON/KV fallback adapter via `src/lib/store.ts` (`readJson`/`writeJson`) + `src/lib/db.ts` (`bornolab_kv`). No break to local dev: when `POSTGRES_URL/DATABASE_URL` is absent, everything runs on `data/*.json` + in-memory.
- **Seed:** Broad skeleton (15-subject bilingual tree, post taxonomy, lawful links) + deep sample (2 full chapters + ~30 original questions + demo ExamVersion). All seeded Qs are original paraphrases; sources used only for topic coverage.
- **Admin:** Reuse existing single-admin cookie + roles/permissions system (`src/app/api/admin/me/route.ts` `requireAdmin`). No new auth; editorial roles modeled as data + review workflow, enforced in API.
- **Release:** `studyPlatform.enabled` feature flag (default off in code, overridable via site-config). Old `/study` + `/study/[id]` UI, tri-state login, human labels, and `task13`/`task21` tests untouched.

## 1. Route map (preserve existing, add new)

Preserve:
- `/study` — hub (extended, not replaced; adds Practice-now path + post/chapter rails when flag on)
- `/study/[id]` — material detail via `StudyReader` (unchanged gating)
- `/api/study*` — catalog/access/preview/read/download (unchanged)

Add (flag-gated, Bengali-first):
- `/study/posts` — browse IT posts + ExamVersions
- `/study/posts/[slug]` — post overview, syllabus, chapter map, patterns, sets
- `/study/chapters/[slug]` — bilingual reader (toggle/split), glossary, examples, quick checks, bookmarks, related practice
- `/study/practice` — custom builder (post, version, subject, chapter, difficulty, lang, type, wrong/unanswered/bookmarked, count)
- `/study/exams/[slug]` — pre-exam instructions, duration/marks/negative, preview, confirm, accommodations
- `/study/exams/[slug]/attempt/[attemptId]` — timed engine (server deadline, autosave, palette, review, auto-submit)
- `/study/results/[attemptId]` — score, timing, breakdowns, review, citations, recalculation status
- `/study/progress` — history, mastery, wrong queue, streaks, spaced review, readiness guidance + disclaimers
- `/admin` → Study section extended with taxonomy/review/assembly/attempts/flags/audit (reuses `AdminStudy`)

APIs:
- `GET /api/study-platform/taxonomy` — posts, exams, versions, subjects, chapters (public, flag-gated)
- `POST /api/study-platform/practice` — builds question set from filters (login for wrong/bookmarked filters)
- `POST /api/study-platform/attempts` — create (server deadline + seed/order); `PATCH` autosave (idempotent); `POST …/submit` (idempotent, exactly-once)
- `GET /api/study-platform/attempts?id=` — resume + result (privacy-safe: own attempts only unless admin)
- `GET /api/study-platform/progress` — history/mastery/queues (login)
- `POST /api/study-platform/bookmarks`, `/api/study-platform/flags` — learner mutations
- Admin (requireAdmin): `POST /api/study-platform/import` (JSON/CSV/manual + OCR staging), `POST /api/study-platform/review` (approve/reject/retire + recalculation candidates), `GET /api/study-platform/audit`, `PUT /api/study-platform/flags` (feature flags), `POST /api/study-platform/recalculate`

## 2. Data model

See `src/lib/study-platform/types.ts`. Normalized, stable IDs, locale variants (never overwrite BN with EN):

Post → Exam → ExamVersion (dated pattern: duration, marks, sections, weights, negative, unanswered policy, attempt/leave rules, randomization, syllabus, sources)
Subject → Chapter → Topic → StudyMaterial (extends existing `StudyMaterial` with locale, chapter/topic links, free/premium, license)
Question (+ QuestionLocale BN/EN, Option + OptionLocale, AnswerKey with confidence + provisional/approved, Explanation + citations, SourceCitation, LicenseRecord, Review, QuestionVersion)
Attempt (+ AttemptAnswer: order/seed preserved), ScorePolicy, UserProgress, Bookmark, QuestionFlag, AuditEvent, FeatureFlag.

Statuses: `draft → normalized → independently_solved → reference_attached → reviewer_approved → published → retired`.
Publication blockers: missing options, missing reviewed key, missing explanation/rationale, missing source/license, missing required locale variant, unresolved ambiguity/OCR flags.

## 3. Migration / compatibility

- `src/lib/study-platform/store.ts`:
  - `ensureStudySchema()` — idempotent `CREATE TABLE IF NOT EXISTS` for `study_posts, study_exams, study_versions, study_subjects, study_chapters, study_questions, study_attempts, study_answers, study_progress, study_bookmarks, study_flags, study_audit, study_evidence` (+ KV fallback keys `study-platform:*`).
  - When DB absent: KV-file store only; seed served from bundled fixtures (`curriculum.ts` + `seed-content.ts`) so local dev/Vercel-preview works with zero setup.
  - Existing `customStudy`/`studyOverrides` untouched; new `studyPlatform` key in site-config (`enabled`, `demoMode`) with defaults off/safe.
- No overwrite of `src/lib/study-data.ts`, `study-access.ts`, reader/practice components, or `/api/study` handlers.

## 4. Exam engine rules

- Server-authoritative `deadline = startedAt + durationSec`; client timer is display only.
- Autosave answers + marked-for-review, idempotent by `(attemptId, questionId)`.
- Palette (answered/unanswered/flagged), filters, section nav, keyboard (arrows + 1-4 + F flag), one-question/section layouts, final review (unanswered/flagged counts), submit confirm, auto-submit exactly once at deadline (server `submit` is idempotent; client guard + `beforeunload` per leave policy).
- Reconnect/resume never extends deadline (server recomputes `remaining = deadline - now`).
- Leave/refresh policy per ExamVersion, shown before start (`allowLeave`, `leaveAction: warn|cancel|allow`).
- Randomization: `shuffleQuestions/shuffleOptions` + stored `seed`, `questionOrder`, `optionOrder` for reproducible review.
- Scoring (`scoring.ts`): per-question marks, `negativeMark`, `unansweredPenalty` (default 0), partial credit reserved; result = raw, penalty, net, %, correct/incorrect/unanswered, timeUsed, section/topic totals, key status (`provisional|approved`), recalculation marker. Demo fixture: 20Q/15min/0.50, no unanswered penalty — verified in tests.
- No ranking/percentile unless population + privacy defined; readiness/heatmap labeled as guidance with disclaimer.

## 5. Ingestion / editorial workflow

- `ingestion.ts`: JSON/CSV/manual parsers → restricted staging (`study_evidence`, admin-only) with source URL/title/page/section/retrieval date/file hash/license; Unicode NFC + Bengali cleanup; flags for duplicate stems, repeated numbers, missing options, malformed code, broken equations, garbled BN, missing diagrams.
- Raw evidence never exposed to learners; draft paraphrase required; independent solve (run code/math; attach RFC/NIST/OWASP/MDN/official/dated sources for standards/security/facts; bilingual review for BN/EN).
- Two-person approval: author ≠ publisher; `review.ts` actions recorded as `AuditEvent`; key change after publish → affected attempts marked `needsRecalculation`, original preserved + correction note.
- Bulk import/export, preview-before-publish, duplicate merge, rejection reasons, assignment, version compare, rollback, audit history — admin UI + APIs.

## 6. Rights checklist (must stay true)

- [ ] No bulk copy of LiveMCQ/Duranta/Scribd/SlideShare/FB PDFs, keys, scans, logos, screenshots, UI copy, layouts. Topics only → new paraphrase + distractors + explanation + independently checked answer.
- [ ] Editorial metadata (URL/title/page/retrieval/provenance/license) stored restricted; only lawful attribution links published.
- [ ] OCR raw kept separate; corruption flagged, never silently published.
- [ ] No third-party/LLM answer presented as official key without independent check + approval.
- [ ] Source-access limits recorded, never claimed as exhaustive.
- [ ] LiveMCQ demo numbers (20Q/15min/0.50, subject split) treated as one demo fixture, not a universal rule.
- [ ] Analytics labeled as guidance, not success probability.
- [ ] Duranta ~67-row observation timestamped, not permanent; OMR-200-slot PDF not treated as bank; Scribd/SlideShare not treated as official keys; questionable keys (POST-vs-GET, white/black-box, ARP/RARP, current-affairs) explicitly QA'd.
- [ ] Current affairs require dated authoritative citation + expiry/review.

## 7. UI / a11y

- Dark-first glassmorphism, existing tokens; study accent: electric cyan `#06b6d4` + saffron `#f59e0b`; BN font stack (Hind Siliguri/Noto Sans Bengali) + Latin companion; Framer Motion subtle (page/progress/question/success/expandable), `prefers-reduced-motion` respected; exam mode distraction-free.
- Keyboard focus visible, landmarks, radio groups, errors readable, timer/save screen-reader announcements (`aria-live`), non-color status (icon+text+pattern), mobile-first wrapping for conjuncts/formulas/code/tables, touch targets ≥44px, light/dark compat, empty/loading/error/locked/expired/draft/provisional/no-results states.

## 8. Acceptance (all must be true before release)

Existing tests pass (esp. study access/download/login); typecheck+lint+relevant tests pass; BN/EN/formula/code/table render mobile+desktop; BN+EN locales coexist; ExamVersion configurability; demo scoring verified; correct/incorrect/unanswered/penalty/net/section/topic/time correct; idempotent auto-submit, no deadline extension; leave policy visible + enforced; palette/autosave/resume keyboard-accessible; provisional distinct + corrections audited; publication blockers enforced; OCR/ambiguous/duplicate/incomplete flagged; RBAC hides evidence/drafts/private/audit; a11y smoke; BN/EN search with aliases; no protected branding/content copied; seeds original/licensed with attribution; current-affairs dated + expiring; developer doc present.

## 9. Backlog (next sprint)

Full OCR pipeline UI, PDF diagram redaction tool, spaced-repetition scheduler v2, percentile populations with privacy review, Bangla TTS for chapters, offline exam pack.
