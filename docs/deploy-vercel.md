# Deploy BornoLab to Vercel (terminal)

GitHub Actions (`/.github/workflows/ci.yml`) runs `lint → typecheck → build` on every push/PR to `main`. Deploying itself is via the Vercel CLI below (or the optional Git integration in §6).

## 0. Prerequisites

```bash
node --version   # 18.18+, 20.9+, or 22 (CI uses 22)
npm --version
vercel --version # 59+ recommended; install with: npm i -g vercel
```

## 1. Log in and link the project

```bash
cd /home/billsbro/development
vercel login            # one-time, opens the browser
vercel link             # one-time: link to existing project or create a new one
```

`vercel link` writes `.vercel/` (git-ignored) — it never touches the repo.

## 2. Set environment variables

Required for admin; recommended for integrations:

```bash
# Admin (required for /admin — see docs/admin.md)
vercel env add ADMIN_EMAIL production
vercel env add ADMIN_PASSWORD production
vercel env add ADMIN_JWT_SECRET production   # recommended, any long random string

# Integrations (optional; empty = graceful mock/fallback in the UI)
vercel env add N8N_FORMAT_WEBHOOK_URL production
vercel env add N8N_TRANSLATE_WEBHOOK_URL production
vercel env add N8N_SPLIT_WEBHOOK_URL production
vercel env add N8N_API_KEY production

# Durable site-config seed (recommended — dashboard edits are
# ephemeral on serverless; see docs/admin.md §3)
vercel env add SITE_CONFIG_JSON production
# example value:
# {"seo":{"gaId":"G-XXXXXXX","adsenseClient":"ca-pub-XXXX"},"payments":{"bkash":"01XXXXXXXXX"}}
```

Repeat with `preview` instead of `production` if you want the same values on preview deploys, or run once and select all environments when prompted. To work locally:

```bash
npm run vercel:env   # pulls envs into .env.local (git-ignored)
```

## 3. Preview deploy (safe to share)

```bash
npm run vercel:preview   # == `vercel`
```

You get a unique `*.vercel.app` URL per deploy. Verify: homepage, `/convert`, `/fonts`, `/admin/login`.

## 4. Production deploy

```bash
npm run vercel:deploy    # == `vercel --prod`
```

This builds (`npm run build`) on Vercel and promotes the result to production. `vercel.json` pins the framework, build command, security headers, and long-lived font caching.

## 5. Custom domain (optional)

```bash
vercel domains add bornolab.com
```

Then add the `A`/`CNAME` records Vercel shows at your DNS provider. Vercel provisions HTTPS automatically.

## 6. Optional: GitHub auto-deploys

Vercel dashboard → Project → Settings → Git → connect `proffesergio/bornolab`. Then:

- every push to `main` → production deploy,
- every PR → preview deploy with a comment link.

Keep the Actions CI workflow as the quality gate (it runs regardless).

## 7. Day-to-day commands

```bash
vercel ls                  # list deployments
vercel inspect <url>       # build logs for one deployment
vercel logs <deployment>   # runtime logs (e.g. /api/* errors)
vercel rollback            # promote an older deployment to production
vercel env ls              # audit which vars exist per environment
```

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails on Vercel, passes locally | Match Node: Project → Settings → General → Node.js Version `22.x`; ensure vars are set for the right environment |
| `/admin/login` → `503 Admin not configured` | `ADMIN_EMAIL`/`ADMIN_PASSWORD` missing for that environment — `vercel env add …` then redeploy |
| Dashboard edits disappear | Expected on serverless — persist via `SITE_CONFIG_JSON` (§2, `docs/admin.md` §3) |
| `vercel link` points at the wrong project | `rm -rf .vercel && vercel link` |
| CLI asks to confirm everything | `vercel --yes --prod` for non-interactive use (CI-like shells) |
