# Admin workspaces and showcase uploads

Implemented 2026-10-17. The existing configured administrator signs in at `/admin/login`. This release reorganizes the existing application and adds working catalog/media/learning controls; it does not introduce supplier logins or live payment providers.

## Direct links

| Workspace | Address |
| --- | --- |
| Overview | `/admin?section=dashboard` |
| Printing catalog | `/admin?section=printing&view=Catalog` |
| Service editor | `/admin?section=printing&view=Catalog&record=business-cards` |
| Category editor | `/admin?section=printing&view=Catalog&record=category:business-cards` (use the actual category ID) |
| Printing mockups | `/admin?section=printing&view=Mockups` |
| Public media library | `/admin?section=media` |
| Print orders/proofs | `/admin?section=printing&view=Orders%20%26%20proofs` |
| Quotes | `/admin?section=printing&view=Quotes` |
| Partners/designers | `/admin?section=printing&view=Partners%20%26%20designers` |
| Printing settings | `/admin?section=printing&view=Settings` |
| Learning organization | `/admin?section=study&view=organization` |
| Study resources | `/admin?section=study&view=resources` |
| Question bank | `/admin?section=study&view=questions` |
| Learning review/import | `/admin?section=study&view=review` |

Fonts/software, document-tool controls, existing digital orders, customers, memberships, SEO, ads and system settings remain available in the grouped sidebar. Global search includes workspace shortcuts. Admin navigation uses URL query state and supports browser Back/Forward. Catalog and learning editors warn before leaving unsaved work or refreshing.

## Upload and showcase a mockup

1. Open **Media library → Upload image** (also available inside a catalog image picker).
2. Choose PNG, JPEG or WebP up to **2 MB**, enter a title and meaningful image description, and select optional category/service associations. Tags help library search.
3. Keep the image draft while preparing it. Check **Publish image for public display** before selecting it for a catalog cover/gallery. Publication makes the image URL public; private customer artwork is never drawn into this library.
4. Open **Printing catalog**, edit a service, choose **Images & designs**, then select the image as the cover or add it to the gallery. A gallery allows eight images, descriptions and ordering controls.
5. Optionally enable choosing a gallery design as the customer's starting reference. It does not replace artwork/design-help requirements or proof approval. The server validates the choice and snapshots its image/description on the order.
6. Use **Preview changes**, review pricing/options/policies, set storefront publication and **Save catalog changes**. Category images and category visibility/order are edited under **Categories**.

Catalog lists support text/category/status filtering, duplication and selecting multiple services for publication changes. Catalog changes do not rewrite earlier orders. Stale catalog/media/learning saves are rejected when their versions have changed.

Archives remove media from the active library while existing public references keep working. Unpublishing an image referenced by a category, service or historical order is blocked. Replace its references deliberately; there is no destructive media purge button in this release.

## Storage and setup

**No additional migration or storage account is required.** Showcase media uses isolated `public-media:index` and `public-media:file:<id>` rows in the existing `bornolab_kv` table. The already-migrated printing table remains unchanged. Learning organization uses a separate `study:navigation` KV record. Production reads/writes fail closed when this storage is unavailable.

The media backend is bounded to **250 images / 128 MB** of encoded image bytes. The server decodes accepted image formats, limits source pixels, removes metadata and stores a WebP resized within 2000 × 2000 pixels. Bytes are separate from printing order data and from the lightweight metadata index. Upload, metadata changes and media audit records commit transactionally with a locked index. Published media is served through `/api/media/[id]`; draft bytes require the existing admin session. Responses and the service worker do not cache this API.

This uses existing infrastructure to make live mockup uploads work without another provider setup. Large-scale media hosting should replace the byte-storage adapter with object storage; this bounded library is not intended for editable PSD/AI files, original print artwork or large software packages. Existing Study/font/software binary uploads remain local/self-host features; use durable external file links for those production files.

Development without a database uses ignored `data/showcase-media/` and `data/study-navigation.json`. Never enable a local-storage production fallback on Vercel. Back up the public-media and navigation KV records with the existing database backup procedure; order snapshots can reference published assets.

## Organize Study

The public hub uses **Explore learning**, **Resource library** and **My learning**. Goals lead to subjects and chapter links. Resources and personal progress no longer compete with multiple repeated module rails on the initial screen. Existing lesson/resource/exam URLs and attempt history are preserved. Older topic/flashcard practice remains at `/study/guided-practice`.

In **Learning → Goals & organization**:

- Create, name, reorder, show or hide learning goals.
- Assign existing subjects, resource categories and an optional department or question-bank department to a goal.
- Edit subject labels/visibility and chapter listing titles/visibility. These control discovery; they do not revoke access to a previously shared lesson URL.
- Show/hide resource, question and practice entry points.
- Save explicitly; changes appear in the public hub. Concurrent saves use version checks and a primary audit history.

**Study resources** supports editing existing custom resources as well as creating them, with department/subject/category, access, price, preview length and visibility controls. **Question bank** and **Review & imports** have their own workspace. Source/provenance and unreviewed OCR limitations remain in place; organizing a resource does not make its answers verified.

## Verification

The automated suite covers actual image decoding/persistence, draft privacy, publication, usage/unpublish protection, local-write serialization, production fail-closed behavior, valid learning relationships, Masters resource gating, catalog version checks and selected-design snapshots, alongside existing pricing/proof/production tests.

An authenticated local HTTP workflow exercised login, media upload, draft denial, publication, catalog assignment, public image/catalog reads, learning-setting updates, stale-save rejection and affected page routes; original local data was restored afterward. Browser/mobile visual and accessibility review was unavailable because no browser surface was attached. The shared handoff records final build/lint/test and production deployment evidence.
