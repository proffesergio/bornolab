# BornoLab Admin Guide

Everything in the dashboard saves to the live site. There is no staging — what you save is what visitors see.

## 1. Access

| Item | Value |
|---|---|
| Login URL | `https://<your-domain>/admin/login` (locally: `http://localhost:3000/admin/login`) |
| Credentials | `ADMIN_EMAIL` + `ADMIN_PASSWORD` from the server environment (`.env.local` locally, Vercel dashboard in production) |
| Session | HTTP-only cookie, 7-day expiry. Use **Logout** (top-right) on shared machines. |

Unauthenticated visits to any `/admin/*` page (except `/admin/login`) redirect to the login screen.

> `503 "Admin not configured"` means `ADMIN_EMAIL`/`ADMIN_PASSWORD` are missing in the environment — see `docs/deploy-vercel.md`.

## 2. Dashboard tabs

### 📊 Overview
Traffic at a glance: total views, last-7-days views, pending-order count, a 14-day traffic chart, and top pages. Browse the site to record views if it shows "No traffic yet".

### 🧰 Tools — module visibility
Toggle each of the six modules (Converter, Fonts, Styler, Translator, Splitter, Software). A disabled tool **instantly disappears** from the nav and homepage. Changes save on click with a "✓ Saved" tick.

### 🔤 Fonts — catalog overrides + uploads
Per-font controls, applied on the Fonts page immediately:
- **Premium** — flipping this on routes the font through paid checkout.
- **৳ price** — the BDT price shown at checkout.
- **Visible** — hide a font without deleting it.

**Add a font — link or upload** (top of the Catalog tab):
1. Fill name (+ designer, encoding, category, বাংলা/English).
2. Either paste a **direct download link** (`https://…`) or **⬆ Upload file** from your computer (`.ttf/.otf/.woff/.woff2/.zip`, max 30 MB).
3. Tick **Premium** + ৳ price for paid faces, or leave free.
4. **+ Publish font** — it appears on `/fonts` instantly, with the same premium/price/visible controls as built-in fonts, plus **Delete**.
- Free fonts download directly; premium buyers check out and **you deliver the file after verifying payment** (Orders tab).
- Uploads are stored in `public/uploads/fonts/` (git-ignored). **On Vercel use direct links** — serverless filesystems are ephemeral, so uploaded files won't survive redeploys there.

### 📦 Software — store overrides + uploads
Per-item **৳ price** (`0` = Free) and **Visible** toggle for the Software page, plus an **Add software** form identical in spirit to fonts:
name, tagline, platform, version, size, price, then **direct link or ⬆ Upload** (`.zip/.exe/.msi/.dmg/.pkg/.apk`, max 300 MB).
Free apps with a real file download it directly; paid apps go through checkout with manual delivery.
Uploads live in `public/uploads/software/` (git-ignored) — same Vercel caveat: production uploads need direct links (Drive/R2/Dropbox direct URLs).

### 🧾 Orders — manual-payment fulfillment
Each order shows ID, item, amount, method (bKash/Nagad/Bank/Binance), sender number, transaction ID, and timestamp. Fulfillment flow:
1. Customer pays to your merchant account and submits sender + txn ID.
2. You verify the payment in your bKash/Nagad/bank app.
3. Set status: `pending` → `paid` → `delivered` (or `cancelled`).
4. Deliver the download/license to the customer.

The pending count badge appears on the Orders tab.

### 📢 Ads — ad slots
Three slots: **header**, **inFeed**, **footer**. Per slot: **Enabled** toggle, **network** label (e.g. AdSense), and raw **code** (HTML/JS snippet) rendered on the storefront. Keep snippets from trusted networks only.

### 🔍 SEO — search & analytics integrations
`title`, `description`, `keywords`, plus:
- **Google ID (`GTM-…` or `G-…`)** — one field, auto-detected. A `GTM-…` container loads Tag Manager; a `G-…` measurement ID loads GA4. Anything else is ignored (no broken scripts). Injected server-side on every page once saved — never pasted twice.
- **Google site-verification code** — the `googleXXXX…` token from Search Console → Settings, rendered as the `google-site-verification` meta tag. (File-based verification also works: drop the file in `public/`.)
- **AdSense client (`ca-pub-…`)** — the AdSense script auto-injects on every page once saved.

### ✨ AI SEO — content analyzer (offline)
Paste Bangla/English copy to get keyword suggestions, a ≤160-char meta description, and a readability score. Fully client-side — nothing is sent anywhere. Copy the output into the **SEO** tab.

### 💳 Payments — merchant accounts
The numbers/details buyers see at checkout: **bKash**, **Nagad**, **Bank account**, **Binance Pay ID/UID**. Double-check these — wrong numbers mean lost payments.

### ⚙️ Settings — brand & announcement
**Brand name**, **tagline**, and the **announcement bar** (toggle + text) shown above the nav on every page.

## 3. Config persistence — read this before relying on dashboard edits

Config lives in three layers (later wins):

1. **Code defaults** — `src/lib/site-config-shared.ts` (`DEFAULT_CONFIG`).
2. **`SITE_CONFIG_JSON` env seed** — durable overrides baked into each deployment.
3. **Dashboard edits** — written to `data/site-config.json` on disk (+ in-memory).

Persistence behavior:

| Hosting | Dashboard edits survive… |
|---|---|
| Local `npm run dev` / self-hosted Node | ✅ Yes — written to `data/site-config.json` |
| Vercel (serverless) | ⚠️ Only per instance (memory). Lost on redeploy, cold start, or scale-out. |

**Rule of thumb for production on Vercel:** use the dashboard for quick experiments, then bake anything you want to keep into `SITE_CONFIG_JSON` in the Vercel dashboard (Project → Settings → Environment Variables) and redeploy. A template is in `.env.example`.

## 4. Security notes

- Credentials live **only in environment variables** — never in the repo.
- Auth token is HMAC-signed (`ADMIN_JWT_SECRET`, or derived from `ADMIN_PASSWORD` if unset). Set an explicit `ADMIN_JWT_SECRET` in production.
- To rotate access: change `ADMIN_PASSWORD` (and ideally `ADMIN_JWT_SECRET`) in Vercel env vars and redeploy — all existing sessions invalidate.
- Cookie is `httpOnly` + `Secure` in production; always serve admin over HTTPS (Vercel does this by default).

## 5. Troubleshooting

| Symptom | Fix |
|---|---|
| `503 Admin not configured` on login | Set `ADMIN_EMAIL` + `ADMIN_PASSWORD` in env, redeploy/restart |
| `Invalid email or password` | Exact match required (email is case-insensitive, password is not) |
| Login loops back to `/admin/login` | Cookie blocked — allow cookies; check system clock (token expiry) |
| Dashboard change vanished on Vercel | Expected per §3 — persist via `SITE_CONFIG_JSON` |
| Orders not appearing | Orders share the same ephemeral store on Vercel — export/fulfill promptly |
