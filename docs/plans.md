# BornoLab — Product & Automation Plans (n8n-ready)

> One-glance spec so any tool (human or agent) can pick up requirements.
> Stack: **Next.js 14 App Router + TypeScript**, Tailwind v4, Framer Motion, lucide-react, pdf-lib, docx/docxtemplater, mammoth, pdfjs-dist, jszip. Client-first; heavy jobs → n8n webhooks via `/api/n8n/*` proxy.

## 0. Naming
**BornoLab** (বর্ণল্যাব) — `borno` = letter, `lab` = workshop. Short, spellable, brandable. Alternatives considered: LipiLab, AkhorHub, LekhaForge, LipiGhar, Mudran, KagojKit.

## 1. MVP (shipped in this repo)
1. **Unicode ⇆ Bijoy converter** (`/convert`, `src/lib/bijoy.ts`)
   - Pre-kar reorder (ি/ে/ৈ), ো→ে+া / ৌ→ৈ+া split, reph `©`, ya-fala `¨`, hasanta `&`, ligature `ক্ষ→ÿ`. Reversible greedy tokenizer. English/URL passthrough.
2. **Font directory** (`/fonts`, `src/lib/fonts-data.ts`)
   - Schema: name, designer, license (Free/Paid), type (Unicode/ANSI/Dual), category (Serif/Sans-Serif/Display/Stylized), bangla bool, fileUrl, fallbackUrl.
   - Download = blob save / `/api/fonts` attachment proxy (never navigate away).
3. **Decorator & Styler** (`/styler`, `src/lib/styler.ts`) — math bold/italic/mono, bracket frames, wings/stars, mirror, outline/neon/gradient/glitch CSS + copy.
4. **PDF ⇆ DOCX** (`/translate`) — pdfjs text-node → docx clean paragraphs (no textbox soup); docx → print HTML → Save-as-PDF.
5. **PDF splitter** (`/split`) — thumbnails, checkboxes, `1-3, 5, 7-12` ranges → PDF / PNG-JPG zip / DOCX.
6. **Admin backend** (`/admin`, `.env` credentials) — cookie JWT, module toggles, font/software catalog overrides, orders, ad slots, SEO/GA, AI SEO tools, payments, traffic analytics (`/api/track` + dashboard).
7. **Software store** (`/software`) + **premium fonts** — bKash/Nagad/Bank/Binance manual-payment checkout (`CheckoutModal` → `/api/orders`).

## 1b. Ops notes
- Admin: set `ADMIN_EMAIL`/`ADMIN_PASSWORD` (+ optional `ADMIN_JWT_SECRET`) in `.env.local`, sign in at `/admin/login`. Middleware guards `/admin/*`.
- Runtime state lives in `data/*.json` (site-config, analytics, orders) with in-memory fallback — swap for Postgres/R2 before serious scale.
- Bijoy preview: browsers need SutonnyMJ installed to render ANSI codes as Bangla. The converter detects `document.fonts.check('16px "SutonnyMJ"')` and shows an explainer + auto-converted Unicode ghost preview when missing. Ship `public/fonts/SutonnyMJ.ttf` (licensed) to fix fully.

## 2. Post-MVP: Auto-Formatting Layout Engine (n8n) — PRIORITY
Goal: upload messy `.docx` → get **print-ready** Journal / Book (EN and BN pipelines separate because of font variation).

### 2.1 Inputs
- Source `.docx` (any styling), optional **reference formatted doc** OR **Word template `.dotx`**, plus JSON params override.

### 2.2 Parameters (per jobType: `journal` | `book-en` | `book-bn`)
- Page size: A4 / B5 / Crown / Demy + orientation; margins (top/bottom/inside/outside + gutter for binding).
- Sections: front-matter (title/copyright/dedication/ToC), chapters, headers/footers, page-number styles (roman→arabic), footnotes/endnotes.
- Headings H1–H4: font name/size/color/bold, space-before/after, keep-with-next, numbering (১,২ / 1.2.3).
- Body: font name (EN: e.g. Times/Inter; BN: e.g. SolaimanLipi/Kalpurush/Nikosh — **never mix pipelines**), size, line-spacing (1.15/1.5), alignment (justify BN with kashida off), first-line indent vs space-after.
- Font variations: regular/bold/italic/bold-italic mapping per script; fallback chain (Nikosh→SolaimanLipi→Noto).
- Tables: custom border styles/weights/colors, header shading, repeat-header-row, cell merging rules (merge identical vertical cells, split on page break), caption numbering (Table ১.১).
- Images: max-width, caption style, DPI check (≥300 for print), grayscale option.
- Output: cleaned `.docx` + print PDF (LibreOffice headless) + report.json (fonts replaced, pages, warnings).

### 2.3 n8n workflows (to build)
- `webhook:/format-docx` → **Ingest** (binary) → **Classify** (EN/BN via U+0980–U+09FF density + font names) → **Parse reference** (python-docx: styles.xml) → **Apply rules** (docxtemplater/python node) → **QA** (missing fonts, overflow tables) → **Export** (LibreOffice `soffice --headless --convert-to pdf`) → **Respond** (signed R2 URLs + report).
- `webhook:/translate-doc` (PDF⇆DOCX OCR branch: Tesseract ben+eng for scanned pages).
- `webhook:/split-pdf` (server-side for >100MB files; client handles small).
- All webhooks: header auth `X-API-Key`, Zod-validated in `/api/n8n/*`, Respond-to-Webhook with `{ success, outputUrl, report }`.

### 2.4 BN vs EN split — why separate
- Shaping: যুক্তবর্ণ/কার line-height needs +8–12%; justification differs; hyphenation off for BN.
- Font metrics: SutonnyMJ (ANSI legacy) must be converted to Unicode first (Module 01) before formatting; never apply EN serif metrics to BN glyphs.
- Numbering: BN uses ০-৯ / ক খ গ; ToC dotted leaders need BN font or dots misalign.

## 3. More automation ideas (backlog)
- Batch Bijoy→Unicode for whole `.docx/.xlsx` preserving runs (font-aware classifier like banglakit).
- Cover generator (title/author → print cover PDF with spine calc).
- ISBN/barcode + copyright page auto-fill; journal DOI/Crossref export.
- Scheduled n8n: watch Drive folder → auto-format → email proof.
- AI proofread (LLM node, ben+eng) with tracked-changes `.docx`.

## 4. Env & deploy
- `.env`: `N8N_FORMAT_WEBHOOK_URL`, `N8N_TRANSLATE_WEBHOOK_URL`, `N8N_SPLIT_WEBHOOK_URL`, `N8N_API_KEY`, `S3/R2_*`.
- Deploy: Vercel (web) + self-host Docker alongside n8n; `soffice` sidecar for PDF fidelity.
- Memory tools: **graphify** recommended (`graphify-out/` knowledge graph); code-review-graph optional. Ask before installing — see §5.

## 5. Codebase memory tools
- If repo grows past MVP, init `graphify` (`/graphify` skill) for god-nodes/communities + query/path/explain.
- Optional: code-review-graph for PR risk. Confirm with maintainer before adding hooks (keeps tree clean per AGENTS.md).
