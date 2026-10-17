<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# BornoLab repository instructions

## Start here

- Read [README.md](README.md) for the product showcase and design patterns, then [docs/ai-handoff.md](docs/ai-handoff.md) for current state and remaining work.
- Check `git status --short` before editing. Preserve unrelated or unfinished work; do not reset, clean, or overwrite it.
- The installed framework is Next.js 16.3.5 App Router with React 19.2.8, TypeScript and Tailwind CSS 4. Read the relevant installed Next.js guide before changing framework code. `docs/plans.md` is historical, not the current architecture reference.
- Keep shared project memory in tracked Markdown. Update the handoff after material implementation, validation or deployment changes; never put secrets or customer data in memory files.

## Implementation and design

- Reuse the existing root layout, Navbar, themes, `GlassCard`, `SectionTitle`, `cn`, member sessions and configured admin guard. Printing belongs in the existing admin panel.
- Match the existing light/dark glass surfaces, cyan/purple accents, rounded cards, responsive grids and local Bangla/Latin typography. Study motion wrappers live in `src/components/study-motion.tsx`.
- Admin modules use shared controls and URL navigation in `src/components/admin/workspace.tsx`. Read `docs/admin-workspaces.md` before changing catalog/media or Study organization workflows. Preserve record deep links and unsaved-change guards.
- Keep module UI in `src/app`/`src/components`, domain logic in `src/lib`, and authorization/validation at route boundaries. Client totals are display-only; the server computes authoritative printing totals.
- Printing is a managed demo: simulated payments and shipments only. Preserve immutable order snapshots, latest-proof approval, ownership checks, private file links and payment/COD production gates. Do not enable unfinished live providers.
- Question-bank extraction is draft source material. Preserve provenance and review states; do not present raw OCR or corrupted Bangla as verified exam content.

## Data and deployment

- Never commit `.env*` except the placeholder `.env.example`, `.vercel/`, runtime `data/*.json`, private uploads, backups or generated caches.
- Production printing requires PostgreSQL and `docs/migrations/001-printing.sql`. Use `npm run db:migrate:printing` explicitly against the intended environment and verify with `-- --check`. Never migrate during build or a public request.
- Printing storage fails closed on database errors. Local JSON is for development/single-process persistent self-hosting; never enable `PRINTING_LOCAL_STORAGE` on Vercel.
- Public showcase images use the bounded media repository and isolated KV keys; customer artwork stays private in its existing workflow. Media and learning settings require durable PostgreSQL in production and must not inherit the legacy store's silent fallback. Preserve referenced historical images and catalog/navigation version checks.
- Consult [docs/deploy-vercel.md](docs/deploy-vercel.md) and the printing runbook. Verify the linked Vercel project/environment before deploying. Record the deployment URL and actual checks in the handoff; do not claim success from an upload alone.

## Validation

Run `npm run typecheck`, `npm run lint`, `node --test tests/*.test.mjs` and `npm run build` for a release. CI uses Node 22; the current Vercel project uses Node 24. Record warnings and unrun checks honestly. HTTP smoke tests and mocked route tests do not establish browser accessibility, real payment readiness or database restore correctness.
