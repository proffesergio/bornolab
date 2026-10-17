# BornoLab admin and Study redesign proposal

Research and repository audit: 2026-10-17. The maintainer approved implementation. The core now has form-based printing catalogs/settings/partner records, durable showcase media, selectable design references, unified admin URLs and goal-based Study discovery. See [admin-workspaces.md](admin-workspaces.md) for implemented behavior; broader conditional work below remains a roadmap.

## Request and current state

The maintainer reported limited admin controls, no practical way to upload category/service mockups, and a crowded Study Hub. The requested direction is a broader, structured admin with easy access to each service and tool. Online research and clarification precede the redesign.

The maintainer reports completing the printing migration. Read-only production verification now confirms `/api/printing` returns 200 with 20 services, 16 categories and `demo: true`; `/api/printing/flags` returns `enabled: true`. This verifies current application reads, not the full schema, concurrent writes or restore behavior.

## Repository findings

| Area | Evidence | Consequence |
| --- | --- | --- |
| Admin shell | `src/app/admin/page.tsx` holds the selected section in React state, with broad Manage/Tools/Grow/System groups | A panel cannot currently be bookmarked through its own admin URL; workflow navigation needs a consistent route model |
| Printing catalog | `src/components/admin-printing.tsx` offers service visibility and an advanced JSON textarea | Common changes such as descriptions, category assignment, options, galleries and pricing lack focused forms |
| Image validation | `src/app/api/admin/printing/route.ts` accepts local `service.image` and gallery paths only | Simply adding a cloud upload button would still fail catalog validation; the image policy and rendering must change together |
| Category model | `PrintCategory` has localized name, order and visibility, but no category image or showcase associations | Category mockups need explicit media/design records and relationships |
| Uploads | `src/app/api/admin/uploads/route.ts` writes to `public/uploads` on local disk; the media kind is a QR-oriented folder | Existing uploads are unsuitable as durable Vercel catalog media; there is no complete reusable mockup workflow |
| Study discovery | `src/app/study/page.tsx` combines category, department, subject and subtopic filters, featured materials, resource cards, question-bank departments, preparation modules and practice | Learners encounter overlapping entry points rather than one primary progression |
| Study controls | Resources, question-bank administration and platform review/import are combined within the Study administration area; several taxonomies and module cards are source constants | Editing content does not give the administrator full control of navigation, taxonomy or section composition |
| Permissions | Printing relies on the existing configured admin identity; the runbook explicitly defers granular staff access | A future staff interface requires server-enforced authorization, not only hidden navigation items |

No browser surface was available during this audit. Findings come from source review and live HTTP/API reads, not screenshot or authenticated browser testing. No redesign code has been applied.

## Research and application

These are design references, not proposals to replace the existing stack or install these products.

| Primary source | Relevant pattern | Proposed BornoLab application |
| --- | --- | --- |
| [Medusa product creation](https://docs.medusajs.com/user-guide/products/create) | Guided details, organization and variant editing, with media and thumbnails | Form-based service editor with a clear publishing action and sections for details, organization, media, pricing/options and policies |
| [Shopify file management](https://help.shopify.com/en/manual/shopify-admin/productivity-tools/file-uploads) | Shared files, reusable picker, search, usage references and saved views | Reusable media library; category/service assignment; cover selection, ordering and alt text; show where each asset is used |
| [IBM Carbon data tables](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines) | Search/filter/toolbars and selection-based batch actions | Consistent admin list screens with status filters, clear primary actions, pagination and relevant bulk operations |
| [Moodle Dashboard](https://docs.moodle.org/en/Dashboard) and [course index](https://docs.moodle.org/en/Course_index) | Progress-oriented dashboard and contextual section/resource navigation | Separate discovery from the learner's personal progress; provide a goal/subject/chapter context while learning |
| [Vercel Blob client uploads](https://vercel.com/docs/vercel-blob/client-upload) | Direct browser uploads using server-authorized upload tokens and completion handling | Durable media upload adapter suitable for the existing host, with admin authorization, type/size rules and persisted asset metadata |

These recommendations are a synthesis of those patterns and the repository findings; the sources do not establish BornoLab's business requirements.

## Proposed admin structure

Keep the existing BornoLab application, identity, themes and domain rules. Retain the brand's cyan/purple accents and light/dark support; use quieter working surfaces, consistent spacing, compact tables and stronger section hierarchy for routine administration.

```text
Overview              Work queues, relevant metrics and quick actions
Services & catalog    Printing services, categories, designs/mockups, fonts, software
Orders & operations   Print orders, quotes, artwork/proofs, production, digital orders
Learning              Goals/exams, subjects/chapters, lessons/resources, question bank, review
Media library         Public showcase assets and reusable pickers
Customers             Accounts, memberships and activity
Site & marketing      Navigation, page content, SEO and ads
System                Integrations, access/permissions, audit and settings
```

Each module should use the same working pattern: list → filter/search → detail editor → preview → save/publish. Prefer dedicated URLs, breadcrumbs, active navigation, clear save status and unsaved-change protection. Keep record-specific operations in the detail screen. A small overview should expose work needing attention rather than repeat all catalog content.

### Capability priorities

| Module | Initial capabilities | Later or conditional work |
| --- | --- | --- |
| Printing catalog | Create/edit/duplicate/archive, categories and ordering, descriptions, cover/gallery, visibility, options, quantity tiers, lead time, policies, FAQs and preview | Design-template commerce and licensing only if requested |
| Designs/mockups | Upload/select reusable assets, title/alt text/tags, category and service assignments, cover/gallery ordering, draft/published state, usage references | Selectable design variants and private editable originals depend on the clarification answer |
| Printing operations | Dedicated order/quote lists, status filters, clear detail actions, proof/version history, assignments, production/QC and support | Keep payment/shipping integrations in demo mode until real provider work is separately defined |
| Learning | Manage the chosen hierarchy, content relationships, visibility, featured/order controls, source/review state and preview | Paid courses, certificates and new exam types require separate business requirements |
| Fonts/software | Consistent list/detail layout for existing catalog functions, media picker and visibility/pricing controls | Avoid inventing unrelated subscription or fulfillment behavior |
| Document tools | Clear links, visibility, existing usage/caps/integration settings | Expose actual configurable behavior; do not create settings that have no backend effect |
| Shared administration | Search, reusable filters, stable URLs, consistent error/loading/empty states, audit and relevant bulk operations | Staff workflows only with server-enforced permissions |

## Durable mockup workflow

```text
Upload public mockup → validate/store → create media record
  → assign category/services → choose cover/order gallery
  → preview → publish → display on storefront
```

Public mockup previews and customer artwork have different access requirements. The public media picker must never expose private artwork, order proofs or editable originals. If designs become selectable, store the chosen design identity/version in the order snapshot rather than inferring it from the current gallery later.

Recommend evaluating Vercel Blob first because the application already uses Vercel; retain a provider boundary so an existing R2/S3/other store can be used instead. Provider choice, existing account and acceptable storage costs remain open. Do not create paid resources or weaken storage privacy as part of this research step.

The implementation needs persistent asset metadata, authenticated upload authorization, server-side file checks, a narrow accepted host/path policy, and compatible Next.js image handling. External-URL support alone is only an interim path. Removing a referenced asset should not silently break published services; provide usage information and a deliberate replacement/archive workflow.

## Proposed Study experience

Default candidate, pending the learner-hierarchy answer:

```text
Study home
  Search + choose a goal/exam
  Continue learning, when signed in and progress exists
    Goal → subject → chapter
      Lessons | Resources | Solved questions | Practice | Tests
  My learning: progress, saved items and review due
```

Show filtered navigation and contextual resources after choosing a goal. Keep personal progress separate from the public catalog. Avoid repeating the same lesson/resource as a featured card, category card and separate preparation section on the initial screen.

Admin should control taxonomy, ordering, visibility and content relationships through forms. Preserve existing resource/question/attempt IDs and links; map existing categories/departments to the agreed hierarchy before changing URLs. Preserve original source and review limitations for extracted material.

## Clarifications requested

Three questions were sent through the user-question tool:

1. Scope: unified administration with Printing/Study rebuilt first, a focused Printing/Study release, or all modules/public pages in one release?
2. Mockups: portfolio only, selectable designs for printing/quotes, or selectable designs plus editable-template sales/downloads?
3. Study: goal/exam → subject → chapter, department/post → subject → chapter, or resource-library-first?

The maintainer subsequently approved the plan and requested implementation. The release follows the recommended unified admin / selectable printing references / goal-based Study direction. It retains the existing owner-admin access model and bilingual catalog editing; no template-download sales, new staff roles or live payment/courier integration was inferred.

For working live uploads without creating another service account, the implementation uses bounded public-media KV storage on the existing PostgreSQL connection, behind a separate media repository. Vercel Blob remains a future scaling option. This requires no new migration or provider secrets. Public mockups are not stored with private customer artwork.

## Suggested delivery sequence

1. Confirm the three product choices and turn them into a route map and editor field inventory.
2. Establish reusable admin list/editor/media patterns and durable uploads; complete printing catalog and mockup management end to end.
3. Restructure Study discovery and its corresponding admin controls with backward-compatible content mapping.
4. Apply shared patterns to the remaining agreed modules; implement any scoped staff permissions on the server.
5. Validate against production-like storage, preview the interface, then deploy and update the shared handoff.

## Acceptance checks

- An owner can create a category/service, upload a mockup, select a cover, reorder gallery items, preview and publish without editing JSON or the repository.
- Uploaded public media remains available after a Vercel redeployment. Private files remain owner-scoped and absent from public media responses.
- Real save/publish results, failures and unsaved changes are visible; actions persist, appear in audit and survive reload.
- Each module/editor has a stable URL; search, filters and bulk operations behave consistently and empty states lead to a useful next action.
- A learner can select the agreed goal/department, reach a chapter and access lessons/resources/practice without navigating competing hierarchies.
- Admin taxonomy/order/visibility changes are reflected in the public Study experience, while existing resource links and learning history remain valid.
- Current proof, price snapshot, payment/COD and production rules remain enforced. Payments/couriers remain demo providers.
- Cover automated domain/route behavior, authorization, persistent media linking and data compatibility; run the required typecheck/lint/tests/build release checks.
- Perform authenticated upload→publish→public-view and learner/admin browser flows, including narrow widths, light/dark, Bangla text, keyboard focus and accessibility. HTTP-only checks are insufficient for the layout complaint.
