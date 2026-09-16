# BornoLab — বাংলা Font & Document Suite

Next.js 14 + TypeScript • Tailwind v4 • Framer Motion • dark-first glassmorphism • client-fast • n8n-ready.

## Quickstart

```bash
npm install
npm run dev   # http://localhost:3000
npm run build && npm start
```

No env needed to run — fonts list, converter, styler, translator, splitter all work with mock data + in-browser libs.

## Modules

| Route | What |
|---|---|
| `/convert` | Unicode ⇆ Bijoy (SutonnyMJ) — pre-kar/reph/ya-fala engine (`src/lib/bijoy.ts`) |
| `/fonts` | Font directory + live preview + filters + attachment download (`/api/fonts`) |
| `/styler` | Decorator: neon/outline/gradient/glitch + frames + math transforms |
| `/translate` | PDF→DOCX (pdfjs→clean paragraphs) / DOCX→PDF (print flow) |
| `/split` | PDF thumbnails + `1-3, 5, 7-12` ranges → PDF / PNG-JPG zip / DOCX |

## n8n bridge

- `POST /api/n8n/format` — proxies to `N8N_FORMAT_WEBHOOK_URL` (header `X-API-Key: $N8N_API_KEY`). Without env, returns a mock execution plan so UI never breaks.
- Copy `.env.example` → `.env.local` and set webhook URLs to go live.
- Full print-automation spec (Journals/Books EN+BN separate, reference `.dotx`, tables/borders/merges): **`docs/plans.md`**.

## Scripts

- `npm run dev` / `build` / `start` / `lint`

## Notes

- Drop real `.ttf` files into `public/fonts/` (Kalpurush, SolaimanLipi, Nikosh, SutonnyMJ…) — UI falls back gracefully until then.
- Scanned PDFs need OCR — use the n8n OCR branch described in `docs/plans.md`.
