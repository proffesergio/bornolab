# BornoLab Printing Services runbook

## Release boundary

This is an integrated managed **demo release**. Every order is marked demo; payment completion is `demo_paid`, shipments use `DEMO-` references, and no real payment, courier booking, email, SMS, payout or physical fulfillment occurs. Catalog, orders, account entry points and operations reuse BornoLab. Public creator publishing and supplier accounts remain disabled.

## Changed modules

| Area | Files / behavior |
| --- | --- |
| Domain | `src/lib/printing/domain.ts`: service/options, integer pricing, financial adjustments, order/proof/job state machines, quote models, partner/designer models, rights and future creator types |
| Persistence | `src/lib/printing/repository.ts`: transactional Postgres aggregate and atomic local development writes; no silent memory fallback |
| Fixtures | `src/lib/printing/seed.ts`: 16 categories, 20 services, 3 design-help options, 10 fictional orders, 3 quotes, 2 partners, 3 designers, proof, QC, refund, replacement and COD examples |
| Providers | `providers.ts`, `scanning.ts`, `file-links.ts`: mock payment/shipping, scanner boundary and session-bound expiring private links |
| Storefront | `src/components/printing/`: browsing, search, detail/order stepper, quote requests/acceptance, proof canvas preview, private downloads, orders/templates/support |
| Existing admin | `src/components/admin-printing.tsx` rendered within `src/app/admin/page.tsx`, existing sidebar, topbar, notifications and admin search |
| Navigation | Existing Navbar, home module cards, account menu and cart link to printing; module visibility respects its printing flag |
| Discoverability | Sitemap includes published services when storage is available; existing SEO admin route list includes printing; private routes are noindex/robots-excluded |
| Privacy | Privacy disclosure includes printing; service-worker upgrades preserve public/Study cached content while removing private pages and API responses |
| Assets | Lightweight local SVG mockups in `public/printing/previews/`; these are labeled illustrations |
| Validation | `tests/printing.test.mjs` executes domain functions, route handlers with auth/storage mocks, real local-store writes and service-worker cache behavior |

Existing Office/PDF, Fonts, software, Study and digital-order implementations remain in place. There is no new authentication system, frontend framework, ORM or UI library. Existing `GlassCard`, `SectionTitle`, root layout, typography, themes, `cn`, member sessions, admin guard, notification feed, audit helper and per-instance throttle are reused.

## Routes

- `/printing`: storefront and search by category, service, material, occasion, English/Bangla keywords and maximum unit price.
- `/printing/[slug]`: service detail, pricing/configuration, private artwork or design help, Bangladesh address, draft/review/submission.
- `/printing/orders`: authenticated order history, drafts, templates, proof preview/approval, demo payment, shipment history, support and return review.
- `/print-orders`: redirect to the authenticated order workspace.
- `/printing/quote`: authenticated quote form, optional reference artwork, questions/replies, offer history and acceptance/decline.
- `/printing/quote/[id]`: authenticated accepted quote checkout; quote revisions/expiration and duplicate conversion are checked server-side.
- `/printing/help`: file preparation and operational help.
- `/api/printing`, `/api/printing/flags`: public catalog/configuration visibility.
- `/api/printing/orders`, `/quotes`, `/uploads`, `/support`, `/notifications`: member-owned operations, guarded server-side.
- `/api/admin/printing`: existing configured-administrator session required for all admin reads/writes.

## Database and migration

Apply `docs/migrations/001-printing.sql` explicitly. It adds `bornolab_printing(id, value JSONB, updated_at)` without changing `bornolab_kv`, users, Study or digital orders. The printing aggregate is isolated and mutations use `SELECT ... FOR UPDATE`; submitted order financial/service snapshots cannot be edited through catalog changes. Quote conversion, approval and refund/reversal checks run inside the transaction.

Concepts are embedded typed records in the existing JSON storage style: categories, services, option/value metadata, quantity tiers/file requirements, order/customizations/address, uploads/rights, design versions, proof approvals, production jobs, QC, shipment events, return requests, refund/cost adjustments, quote line items/revision history, partners, designers, templates, tickets, notifications and audit entries. These are not separate ORM tables. Future creator design/royalty types are scaffolding, not an enabled publishing/payout service.

For a configured Postgres URL, migration/storage errors fail closed. The new repository does not use the existing JSON store's silent in-memory or filesystem fallback on a database outage. Without Postgres, development uses private `data/printing.json`; writes serialize within one process and replace the file atomically. Multi-process local deployments require Postgres.

## Environment and deployment

1. Run `npm ci` with the existing lockfile.
2. Set the existing `POSTGRES_URL` or `DATABASE_URL` to a pooled database connection. Apply the SQL migration through your approved database tool, or `psql` with `ON_ERROR_STOP=1`.
3. Set the existing member/admin secrets (`USER_JWT_SECRET` and/or `ADMIN_JWT_SECRET`), existing admin credentials (`ADMIN_EMAIL`, `ADMIN_PASSWORD`), and existing site URL settings. Private file signing requires a configured secret in production. Development uses an ephemeral signing key, which invalidates links after restart.
4. Use `npm run typecheck`, `npm run lint`, `node --test tests/*.test.mjs`, then `npm run build`.
5. Deploy through the project's existing Next.js/Vercel workflow. This does not deploy automatically. Production without printing storage shows an unavailable/preparation state.
6. On a **single-process self-host only**, `PRINTING_LOCAL_STORAGE=true` permits production file storage in a private persistent data directory. Do not enable this on Vercel or other ephemeral/multi-instance hosts.
7. Keep demo mode and all live integrations disabled. Do not add payment or courier credentials until real adapters, signed webhooks, idempotency, reconciliation and operational acceptance are implemented.

No new credentials for bKash, Nagad, SSLCommerz, Pathao, Steadfast, REDX or eCourier are required for the demo. No card data is accepted or stored. Existing SMTP settings are not used for printing messages.

## Admin usage

Open the existing `/admin` panel and select **Printing Services**.

1. **Overview:** all figures come from marked demo records. Received value/contribution is simulated. Choose the visible metrics in Settings; empty rate calculations show “Not yet measured.” The order export button creates an audited JSON download for the authenticated administrator.
2. **Catalog:** publish/unpublish services directly; the validated advanced JSON editor controls categories/localized text, positions, hide/archive state, prices in paisa, quantity tiers, minimum quantity, options/materials/sizes/finishing, per-unit adjustments, extra production days, file limits, proof requirement, images, search keywords and policies. Required options need available values. Existing submitted orders retain their snapshots.
3. **Settings:** module/payment/COD/quote/design-help/nationwide/Bangla flags, delivery/COD fees, delivery-day window, COD ceiling, VAT basis points, retention policy and design-help fees/days/revisions. Enable simulated payment failure to exercise failure/retry handling. Creator, supplier, courier and live-message flags cannot activate unfinished real providers. Orders snapshot production days (including option/design work) and delivery estimates at submission.
4. **Orders & proofs:** search/open an order; use explicit reason and customer-visible message fields. Download private customer artwork, review it, request changes or upload a proof. Choose the private proof upload, then send it for customer approval. Only the customer can approve the latest proof for the current artwork revision; an admin status dropdown cannot bypass that step. Customers can upload revisions during review/after changes are requested. Old approvals remain historical and cannot authorize new artwork.
5. Confirm COD eligibility separately. This sets `cod_confirmed`, never payment received. Record demo COD collection after delivery. The customer completes online demo payment from their order page.
6. Assign an active partner/approved designer. Assigned production jobs support acceptance, artwork check, printing, finishing, QC, packing, courier handoff and completion with history. Direct order updates also support an internally managed production workflow. Production requires payment/COD confirmation and the latest required proof approval.
7. Enter QC findings and record pass/fail. A passing QC result is required before dispatch; failed QC can start replacement or refund review. Dispatch creates a mock shipment. Transit/delivery/failure/return-to-sender changes are manual normalized demo events, not live tracking.
8. Design-help orders have version delivery and included revision counts. Final-file delivery must use the exact customer-approved proof file. Changed files need a fresh customer proof approval.
9. Financial snapshots stay unchanged. Append production, packaging, courier, replacement/designer costs or refunds with a reason. Refunds require simulated collected payment and approved refund review; total refunds cannot exceed the snapshot. Corrections append a reversal referencing the original entry. These are demo accounting entries, not gateway refunds.
10. **Quotes:** review contact/requirements/artwork, ask questions and read customer replies, then set an offer in paisa with production days and a delivery-day window. The quick UI offers one inclusive line and seven-day validity; the API supports multiple line items and expiration. Revisions retain offer versions and estimates. A customer must accept the displayed version; stale/expired offers and double conversion are rejected. Accepted quotes proceed through artwork/address checkout. Decline, cancel and expire actions record their reason.
11. **Partners & designers:** validated controlled record editor for capabilities, areas, capacity, materials/sizes, lead times, contact details and approval states. No partner login or customer-data sharing is enabled.
12. **Support:** reply/resolve in BornoLab; the customer sees the conversation in their order. **Audit** shows persisted printing operations; important admin operations also use the existing audit helper. All important changes are recorded in the same printing transaction.
13. The existing **SEO** section supports title/description/noindex, local Open Graph image paths and canonical paths for printing. Use `/printing` or a custom service path. Catalog JSON also supports localized service FAQs and additional gallery image paths. Removing SEO overrides replaces the map while preserving other existing configuration.

Signed-in customers receive printing updates through the shared notification bell/feed, checked every 30 seconds while the page is visible. Read state and linked order/quote access are owner-scoped. This is in-app delivery only; no external messages are sent.

## Security, backup and retention

Private originals are base64 bytes in the private printing aggregate for this small demo. They are never written under `public/`. PDF/PNG/JPEG extension/MIME/signature and upload-size checks run server-side; image headers enforce a 12,000-pixel edge and 50-megapixel ceiling. PDF preview rendering also has resource limits. Filenames are sanitized, ownership is enforced and rights/AI-use declarations are stored. Uploads remain `needs_review`. The scanner adapter explicitly returns unscanned in demo mode; no scan or professional print-ready review is claimed.

Downloads recheck the session and file/order ownership, then require a five-minute HMAC link bound to that same identity. Responses use private/no-store, attachment, nosniff and sandbox headers. Proof images/PDFs can be rendered on demand to a client canvas. No original artwork is sent to a third-party preview service. API traffic and private pages are excluded from service-worker caching. Client money is display-only; the server recalculates all normal order prices and snapshots accepted quote totals. Submission rejects a changed total with HTTP 409 and refreshes the pricing preview for another review.

The existing admin identity has full administration access. Staff permission delegation is not implemented by the existing admin guard; printing does not grant staff or supplier access through an alternate session. User routes always verify current active membership and record ownership. Writes reject cross-site browser requests and use the existing per-instance throttle. A distributed rate-limit backend is required for multi-instance production.

Back up the printing table together with existing users/session data so ownership remains resolvable. For Postgres use an approved `pg_dump`/managed snapshot procedure and test restore on a separate database. For local demo storage disable new printing requests, stop the process and copy `data/printing.json` to a private backup; do not put it under public assets or commit it. `data/printing-backups/` and atomic temp files are git-ignored. Verify restored order totals, latest proofs, approval identities, financial adjustments and audit histories before enabling requests. Re-enable only after a write/read smoke test.

`retentionDays` is an admin-controlled maintenance policy. There is no automatic purge job yet. Review completed/cancelled records, legal retention needs and linked proof/artwork files before an audited deletion operation. Financial snapshots and adjustment trails need retention separately from artwork. Handle account access/deletion requests through the existing contact process.

## Validation and remaining launch work

Automated coverage includes integer/tier/option/delivery/COD/VAT pricing, stale checkout totals, failed mock payments/retry, state gates, proof ownership/version/approval, production-job order, file validation, signed-link tampering/session/expiry, local transaction concurrency/failure, auth/CSRF rejection, catalog publication, artwork/order/payment/proof/QC/mock shipment, quote questions/expiry/versioning/conversion/idempotency, COD collection, refund/reversal limits, templates/support/notification ownership and offline-cache privacy/migration. Route integration tests use mocked auth/storage; local persistence tests use real isolated temporary files. They are not browser E2E or live Postgres tests.

Validation on 2026-10-15:

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `node --test tests/*.test.mjs` | 197 passed, 0 failed; includes 19 printing tests |
| `npm run lint` | No errors; existing Study/question-bank and site-widget warnings remain. The printing logout navigation warning was fixed and the affected file passed focused ESLint. |
| `npm run build` | Passed; printing pages and APIs compiled successfully |
| Local HTTP smoke | Storefront/detail/help/catalog/flags returned 200; unauthenticated order/quote pages emitted login redirects; member orders/notifications and admin printing APIs returned 401 |
| Browser E2E, mobile/visual/accessibility | Not run: no browser surface available |
| Live Postgres migration/restore | Not run: no configured staging database |

Before live launch:

- Run browser E2E and visual checks at 360/390/768/1280+ widths, light/dark, Bengali text expansion, keyboard focus, screen reader labels and contrast. No browser surface was available in this execution environment; HTTP smoke tests cannot replace these checks.
- Apply and verify the migration on a staging Postgres database; test real concurrent transactions, backups and restore. No configured database was available for a live migration test here.
- Move file bytes to private object storage with signed direct uploads, malware scanning and server-side image/PDF preflight. The aggregate and 20-file per-owner quota are for small demos; do not use them for a high-volume service. Serverless request-size limits may be lower than the configured 10 MB maximum.
- Implement real provider callbacks/webhook signatures, idempotent reservations, payment reconciliation/failure handling, COD settlement/refusal and courier fallback. A live adapter must not book a shipment before reserving a valid dispatch operation transactionally.
- Add granular staff permissions using existing roles, partner accounts with minimum job data, creator applications/moderation, royalty accounting/payout statements and rights/takedown operations before activating those flags.
- Complete form-based advanced catalog CMS, full Bangla UI, district/area serviceability rates, saved addresses, discounts/coupons, advanced variants, financial/reporting integrations and outbound notification delivery/retry workers. Gallery/FAQ metadata, configurable demo metrics and audited JSON exports are available now.
- Define the operational cancellation/returns/refund/SLA policies, configure real prices/production costs and replace fictional records before real commerce. Keep demo fixtures segregated from any future real transactions.

The release supplies the managed demo storefront and operational core. Full supplier/creator commerce, production-scale file handling and live integrations remain launch work.
