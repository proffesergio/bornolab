# Printing Services implementation plan

## Existing application
Repository inventory covers `src/app`, `src/components`, `src/lib`, `tests`, `docs`, and public assets. Next.js 16.3 App Router / React 19 / TypeScript, npm lockfile, Tailwind 4, Lucide icons, Framer Motion and shared `GlassCard` / `SectionTitle` implement the existing light/dark cyan-purple language. Local Inter and Bengali fonts are loaded by the root layout. Responsive utilities use sm/md/lg; navigation switches at lg. Existing labeled inputs, menu ARIA and focus-glow conventions are reusable.

Office/PDF routes, Fonts (`/fonts`), software and Study (`/study`) remain intact. Navbar, homepage cards, UserMenu and cart are integration points; there is no separate member dashboard. `/printing/orders` becomes the member print workspace linked from the account menu and cart. Search is module-local, as there is no global search abstraction.

Authentication uses existing signed member cookies via `requireMember` and the admin guard via `requireAdmin`; no new authentication or roles. The current admin guard grants access to the configured administrator, not granular staff permissions. Shared roles/plans exist but do not authorize the current admin session. Printing follows that existing boundary; delegated supplier/designer access is deferred.

Storage uses postgres.js and `bornolab_kv` JSONB with local JSON fallback; no ORM or migration framework. Existing users, sessions, plans, roles, orders, activity, audit, site config and Study records must not change. Printing needs transactional mutations and fail-closed writes, rather than existing store's silent ephemeral fallback. New printing records will use a separate transactional Postgres table, with an explicitly local development backend. Node test runner plus ESLint and TypeScript are available.

Existing notifications are admin-only (`pushNotification`); new requests can use this feed. Payments currently support manual transfer for digital orders and are not a live gateway. Existing public catalog uploads are unsuitable for private customer artwork. Analytics and activity helpers exist; financial/customer details must not enter public analytics. Existing n8n integrations remain unchanged.

## Routes and reuse
Add `/printing`, `/printing/[slug]`, `/printing/orders`, `/printing/quote`, `/printing/help`, and printing APIs. Reuse root layout, Navbar, account menu, shared UI, themes, fonts and admin sidebar/topbar. Add a Printing section inside `/admin`, with catalog configuration and order operations rather than a second panel.

## Domain
Add localized category/service/option definitions, integer-paisa pricing snapshots, member-owned draft/orders, quote requests, immutable transition history, proof versions/approval identity, private uploads and shipment/provider boundaries. Store normalized records in the printing namespace. Seed catalog is explicitly illustrative/demo and admin-controlled. No invented reviews or sales metrics.

## Integration phases
Initial payment and shipping are mock adapters; COD remains pending confirmation/collection and is never payment success. Private uploads initially support PDF/PNG/JPEG with signature validation; AI/EPS/SVG need a safe scanning/conversion pipeline before enabling. Serverless private object storage and antivirus integration require deployment configuration; do not silently store public files.

Creator public publishing, royalty payouts, supplier logins, real settlement/refund integrations, real courier/payment webhooks, advanced coupons, external customer notification delivery, saved addresses and full translated UI are deferred until their operational integrations and permissions are implemented. Controlled demo QC/partner management, refund adjustments and owner-scoped in-app notifications are included. Domain extension points retain ownership, moderation and rights declarations. No claim of live tracking, professional artwork approval or real paid status in demo mode.

## Implemented demo scope
The implementation now includes 16 categories / 20 services, category-specific local mockups, select/radio/swatch metadata, configuration and paisa pricing, account-owned drafts/orders/templates, private signed uploads, quote reference uploads/versioned offers/acceptance/conversion, current-artwork proof approval and canvas previews, controlled partners/designers and production jobs, recorded QC, mock shipments/failure events, append-only refund/cost/reversal records, design versions/final-file delivery and in-app support/notifications. The existing admin adds configurable metrics, validated catalog/settings/partner editors, orders/proofs/quotes/support, audited exports and audit history. SEO image/canonical controls extend the existing SEO editor. Private navigations are excluded from the existing offline cache.

See `printing-services-runbook.md` for exact models, routes, deployment/backup instructions, validation results and remaining production work. Deferred financial/provider functionality concerns real settlement, payouts and production-scale integrations; the demo records and operations do not move real money.

## Compatibility and validation
Additive routes and isolated records preserve digital-order/payment behavior and Study/Office/Fonts. Never replace root layout or existing admin screens. Verify TypeScript, ESLint, regression tests, pricing/state-machine tests and build. Catalog changes affect future orders only; submitted orders retain snapshots. Production must be gated by payment/COD confirmation and current-version proof approval.
