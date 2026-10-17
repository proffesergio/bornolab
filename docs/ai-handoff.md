# BornoLab shared AI handoff

Last updated: 2026-10-17. This tracked file is the shared memory for Codex, Claude, Gemini and other agents. Read `AGENTS.md` first. Source files and fresh command output take precedence over historical plans.

## Latest state: admin and Study redesign implementation

The maintainer reports completing the printing migration. Live verification on 2026-10-17 confirmed `/api/printing` returns 200 with 20 services, 16 categories and `demo: true`; `/api/printing/flags` returns `enabled: true`. This supersedes the printing-unavailable result in the historical deployment record below. No new schema migration, authenticated write or restore check was run by this session.

The maintainer approved the redesign proposal and requested implementation on 2026-10-17. Implemented the recommended core: unified admin navigation, form-based Printing controls, durable public mockups with selectable starting references, and goal → subject → chapter Study discovery. Editable-template sales and new delegated staff/supplier logins remain outside this release. Read [admin-workspaces.md](admin-workspaces.md) for the operator guide and exact direct links.

The former JSON-only printing catalog is replaced with category/service/details/media/pricing/options/policies forms, duplication, status/category/search filters, bulk publication, draft preview and record deep links. Partner/designer and design-fee/settings workflows also use forms. Public mockup cover/gallery selection and category images are connected to the storefront. A selected gallery design is server-validated and snapshotted in the order; artwork, price, payment/COD and proof/production rules remain unchanged.

New shared code lives in `src/components/admin/`. `workspace.tsx` owns query-based navigation and unsaved-change guards. Showcase metadata/bytes use isolated public-media KV rows via `media-repository.ts`, not the legacy upload endpoint or printing aggregate. Images are decoded with explicitly declared `sharp@0.35.4` (already used transitively by Next), re-encoded WebP and bounded to 2 MB uploads / 250 assets / 128 MB stored bytes. Draft bytes require admin; published references and historical order references prevent unpublishing; archive is non-destructive. Production storage fails closed. No additional schema migration, provider credential or paid storage account was added.

Study now has Explore learning / Resource library / My learning. `study-navigation.ts` defines validated goal/subject/chapter discovery settings; the separate `study:navigation` record uses transactional version checks and a primary audit. Existing lesson/resource/exam URLs and progress remain intact; older flashcards are at `/study/guided-practice`. Resource editing preserves existing IDs/topics and supports department/subject fields. The original binary Study/font/software upload endpoint still uses local disk; use durable external URLs for those production files.

Validation for this release: typecheck and production build passed; all 200 automated tests passed; lint has 0 errors and the same 3 existing question-bank/site-widget warnings. An authenticated local HTTP run passed login → image upload → draft denial → publication → service cover/gallery assignment → public reads, learning organization save/read, stale-version rejection and affected page routes. Original local catalog/navigation/media metadata was restored afterward. Production deployment is pending; update this record when verified. Browser surfaces were unavailable, so browser/mobile visual and accessibility checks were not performed. HTTP checks do not establish client interaction or layout correctness.

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
- Application revision: `f1d30518e3c3ce83ac1a3674c54be05fb929ba5a`, pushed to `origin/main`.
- Vercel confirmed **Ready** and promoted the production alias on 2026-10-15. Immutable deployment: <https://bornolab-kd5xcvus7-newellx.vercel.app>; ID: `dpl_FoosSq8KZdEkZZe6dL4dNXjSQZzA`. [Build/deployment inspection](https://vercel.com/newellx/bornolab/FoosSq8KZdEkZZe6dL4dNXjSQZzA).
- Live HTTP checks: `/`, `/study`, `/study/question-bank`, `/study/question-bank/petrobangla`, `/printing/help` and `/api/question-bank` returned 200. Study includes the new Question Bank entry; `/sw.js` serves `bornolab-sw-v2`.
- Printing is deployed but storage is unavailable: `/printing` returns 200 with the preparation screen; `/api/printing` returns 503; `/api/printing/flags` reports `enabled: false`. The required table was not created or verified by this session. Do not advertise printing as accepting live orders.
- Unauthenticated `/api/printing/orders`, `/api/printing/notifications` and `/api/admin/printing` each returned 401. No authenticated order or database restore flow was exercised against production.
- A documentation-only follow-up records this deployment evidence; it does not change the deployed application behavior.

## Next work

1. Keep printing in demo mode until real adapters, signed callbacks, idempotency, reconciliation and operational acceptance exist.
2. Run browser/mobile/light-dark/keyboard/accessibility checks, authenticated customer/admin flows, and staging PostgreSQL concurrency/backup/restore checks. These are not established by the local automated suite.
3. Move private artwork to durable object storage with signed uploads, scanning and image/PDF preflight before higher-volume use. Vercel request limits may be lower than the configured file maximum.
4. Proofread and validate question-bank extraction before practice/exam publication; retain source/provenance information.
5. Treat `docs/plans.md` as historical product ideas. Consult the current printing and Study runbooks for implemented behavior.

When handing off: record changed behavior, exact checks/results, deployed revision/URL and any remaining limitations. Keep provider-specific entry files as pointers to this shared memory.
