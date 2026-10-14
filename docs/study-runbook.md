# Study Platform — Operator Runbook & Rollback Plan

> For the release pilot: deploy → enable behind flag → verify → go/no-go. See `docs/study-platform-plan.md` (scope) and `docs/study-developer.md` (API).

## 1. Deploy

CI (`/.github/workflows/ci.yml`) runs `npm ci → lint → typecheck → build` on every push/PR to `main`. Do not bypass a red CI.

```bash
npm run vercel:preview   # shareable *.vercel.app URL for pilot testing
npm run vercel:deploy    # == vercel --prod (only after pilot sign-off)
```

## 2. Enable the platform (staged rollout)

The module ships **disabled** (`studyPlatform.enabled: false`). Old `/study` hub works either way.

1. Sign in at `/admin/login`, open **Admin → Study** (top of the section = Study Platform panel).
2. Press **Enable platform** (writes `studyPlatform.enabled + flags` via `/api/study-platform/flags`, same cookie auth as the rest of admin).
3. On Vercel production, dashboard edits are **ephemeral** (serverless FS). Persist the flag via env seed:
   `SITE_CONFIG_JSON = {"studyPlatform":{"enabled":true,"flags":{"study-platform":{"enabled":true},"exam-engine":{"enabled":true}}}}`
   then redeploy (`docs/admin.md` §3, `docs/deploy-vercel.md` §2).

## 3. Durability notes (important for attempts)

- With `POSTGRES_URL`/`DATABASE_URL` set: study tables are created idempotently (`ensureStudySchema` DDL) and KV-backed records (`study-platform:*`) persist.
- **Without** a Postgres URL on Vercel: attempts/progress/imports live in per-instance memory + `data/*.json` and **do not survive** redeploys or scale-out. For the pilot this is acceptable (anonymous demo attempts still work end-to-end); for real learners, set a pooled Postgres URL (Neon `-pooler` / Supabase 6543) before announcing.
- Seed curriculum + questions are bundled fixtures — they work with zero setup in every environment.

## 4. Pilot checklist (testing on live, before next phase)

- [ ] `/study` hub shows the new IT-Job rails; old guides/downloads unchanged.
- [ ] `/study/posts` + a post page + a chapter page render BN/EN correctly on mobile.
- [ ] `/study/practice` builds a 10-question set; instant feedback + explanations show.
- [ ] `/study/exams/demo-20q-15min-v1` shows duration/marks/negative/leave policy; start → attempt page counts down.
- [ ] Answer a few, refresh mid-exam → resumes with the **same deadline** (no extension).
- [ ] Submit → `/study/results/[id]` shows raw/penalty/net/%, breakdowns, provisional pill.
- [ ] `/study/progress` requires login; after a submitted attempt, wrong queue populates.
- [ ] Admin → Study Platform: import a 1-row JSON draft → appears in review queue → Approve → Publish (or 422 with issue codes when incomplete).
- [ ] Export questions CSV + attempts CSV from the admin panel; re-score flow: change a key → attempt flagged ↻ → Re-score → original kept in history.
- [ ] `node --test tests/task13-study-fixes.test.mjs tests/task21-study-gating.test.mjs tests/task22-study-platform.test.mjs` green.

## 5. Rollback plan

| Situation | Action (≤5 min) |
|---|---|
| New routes erroring in production | Admin → Study Platform → **Disable platform** (instant; old hub untouched). If admin UI itself is down, set `SITE_CONFIG_JSON` without the flag and redeploy. |
| Bad deploy (build/runtime) | `vercel rollback` (promotes previous production deployment) or `vercel inspect <url>` → logs. Git: `git revert <commit>` + push (CI rebuilds). |
| Bad seed/content publish | Review queue → **Retire** the question; affected attempts get `needsRecalculation` + correction note, originals preserved. |
| Bad DB migration | DDL is `CREATE TABLE IF NOT EXISTS` only — no destructive statements; KV fallback keeps serving. Point-in-time restore via provider if needed. |

Rollback never touches the legacy study module (`/api/study*`, `study-data.ts`, reader/practice components) — it is independent of the flag.

## 6. Sprint-3 features in this release (operator notes)

- **OCR Studio** (Admin → Study): image/PDF → Tesseract `ben+eng` in the admin's browser; language data loads from CDN at runtime, so the admin machine needs internet. Output lands in the restricted evidence ledger (license `pending`) — paraphrase via import/manual entry, then review. Never publishes raw OCR.
- **Spaced review** (`/study/review`, SM-2 classic): grades Again(0)/Hard(3)/Good(4)/Easy(5); practice auto-grades correct→4/incorrect→2; exam submit auto-grades correct→4/incorrect→2/unanswered→1. Cards live on `UserProgress.srCards` (absent = new; old records keep working).
- **Cohort bands** (opt-in): learners toggle consent on `/study/progress` (copy: “অংশ নিন… কারো ব্যক্তিগত স্কোর কখনো দেখানো হয় না”). Bands appear at 30+ opted-in attempts per version; aggregate only — no peer scores, ids, or ranks leave the server.
- **Offline (PWA)**: service worker caches reading shell + static assets; exam autosaves queue on-device and sync on reconnect; **submit requires connection** and the deadline stays server-authoritative (late submits are marked auto-submitted). Needs proper 192/512 PNG icons for the install prompt (currently references `logo.png` only).
- **Editorial workflow is admin-only**: the single admin authors, reviews, publishes, assembles exams and recalculates — no reviewer accounts needed. Every action is audit-logged with the admin's identity.
- **Bangla TTS: deferred** by decision — no engine shipped.

## 7. Pilot content workflow (admin only — no reviewer accounts)

1. Admin → Study → OCR Studio / Import: stage evidence and drafts.
2. Review queue: fix blockers (options, key, explanation, citations, rights), then Approve → Publish.
3. Key corrections: change the key → affected attempts flagged ↻ → Re-score (originals preserved).
4. Learners opt in to cohort comparison themselves on `/study/progress` — never pre-tick consent for anyone.
5. Set `POSTGRES_URL` before the pilot if attempts/progress/SM-2 cards must survive redeploys.

## 8. Next-phase backlog (post-pilot)

Bangla TTS engine, richer OCR (table/diagram regions), FSRS scheduler option, percentile trend charts, offline practice-pack download, hard identity-based two-person enforcement.
