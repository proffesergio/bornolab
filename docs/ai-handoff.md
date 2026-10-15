# BornoLab shared AI handoff

Last updated: 2026-10-15. This tracked file is the shared memory for Codex, Claude, Gemini and other agents. Read `AGENTS.md` first. Source files and fresh command output take precedence over historical plans.

## Product and architecture

BornoLab is a Bangladesh-first document, typography, Study and printing workspace. It uses Next.js 16.3.5 App Router, React 19.2.8, TypeScript, Tailwind 4, Framer Motion and the existing PostgreSQL/JSON storage helpers. CI uses Node 22; the existing Vercel project is configured for Node 24, matching the runtime used for this local validation.

The README showcases the modules and maps visual/architecture patterns to real source files. Reuse `src/components/ui.tsx`, `globals.css`, `cn`, navigation, themes and existing authentication rather than creating another shell or admin system.

## Current release contents

- Printing storefront, service configurator, private artwork, demo orders/payments, quotes, customer proof approval, production/QC, demo shipping, COD adjustments, support and notifications. Operations are integrated into the existing admin panel.
- Printing repository: `src/lib/printing/repository.ts`; additive schema: `docs/migrations/001-printing.sql`; explicit apply/check command: `scripts/migrate-printing.mjs`.
- Printing seeds contain 16 categories, 20 services and clearly fictional demo records. Payments, shipping and external messages are not live integrations.
- Study Hub includes refreshed discovery sections and reusable motion wrappers. Question Bank Solutions lives at `/study/question-bank`, with department routes, an API and admin controls.
- `src/lib/question-bank/extracted-gk.ts` is an unreviewed extraction with Bangla font corruption. Other source documents need OCR/conversion. Preserve source limitations; do not imply all solution content has been verified.
- `scripts-tmp/extract-gk.mjs` is a local extraction helper, not an application runtime or deployment prerequisite.

## Data rules that matter

- Existing `src/lib/store.ts` uses PostgreSQL KV with local/in-memory fallback. Printing deliberately differs: configured database failures must fail closed.
- Printing uses a single JSONB aggregate locked with `SELECT ... FOR UPDATE`. Small demo files are base64 in that private aggregate. Production-scale commerce needs object storage, scanning and a more scalable data layout.
- Submitted prices and service snapshots are immutable. Changes use financial adjustments. Latest customer proof approval and confirmed payment/COD gate production.
- Production printing requires the additive migration and existing session secrets. `PRINTING_LOCAL_STORAGE` must stay disabled on Vercel.
- Never expose private files under `public/`, cache private APIs/pages in the service worker, or commit runtime data, local environment files or `.vercel/`.

## Validation on 2026-10-15

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed with 0 errors and 3 existing warnings |
| `node --test tests/*.test.mjs` | 197 passed, 0 failed |
| `npm run build` | Passed with Next.js 16.3.5 / Turbopack |

The warnings are an unused `deptMeta` and `aria-pressed` on a `listitem` in the question-bank hub, plus a complex effect dependency in `site-widgets.tsx`. These were not changed during the documentation work. Tests include printing domain/route cases and real isolated local-store writes; auth/database route mocks do not replace production database or browser E2E checks.

## Deployment record

- Existing Vercel project: `newellx/bornolab`.
- Production alias: <https://bornolab.vercel.app>.
- Workspace linked using the existing signed-in CLI account; `.vercel/` and generated local environment files stay ignored.
- Production database variables are present but marked `sensitive`; both `env pull` and `env run` returned empty database values. The authenticated metadata API confirmed the sensitive type. The migration exited with "No database configured" and made no changes. Do not try to downgrade the variables or expose a migration endpoint; the maintainer must run `docs/migrations/001-printing.sql` through the trusted production database console, or provide a connection via a local secret manager.
- The maintainer explicitly requested skipping local migration work and proceeding with the live deployment. Do not treat the deployment as evidence that the printing migration ran.
- Production deployment is in progress for this release. Replace this line with confirmed evidence after completion; do not infer a deployment from this document. Printing remains fail-closed if its table is absent.

## Next work

1. Keep printing in demo mode until real adapters, signed callbacks, idempotency, reconciliation and operational acceptance exist.
2. Run browser/mobile/light-dark/keyboard/accessibility checks, authenticated customer/admin flows, and staging PostgreSQL concurrency/backup/restore checks. These are not established by the local automated suite.
3. Move private artwork to durable object storage with signed uploads, scanning and image/PDF preflight before higher-volume use. Vercel request limits may be lower than the configured file maximum.
4. Proofread and validate question-bank extraction before practice/exam publication; retain source/provenance information.
5. Treat `docs/plans.md` as historical product ideas. Consult the current printing and Study runbooks for implemented behavior.

When handing off: record changed behavior, exact checks/results, deployed revision/URL and any remaining limitations. Keep provider-specific entry files as pointers to this shared memory.
