# Deploy BornoLab to Vercel (terminal)

GitHub Actions (`/.github/workflows/ci.yml`) runs `lint → typecheck → build` on every push/PR to `main`. Deploying itself is via the Vercel CLI below (or the optional Git integration in §6).

## 0. Prerequisites

```bash
node --version   # Next.js requires 20.9+; CI uses 22, current Vercel project uses 24.x
npm --version
vercel --version # 59+ recommended; install with: npm i -g vercel
```

## 1. Log in and link the project

```bash
cd /path/to/bornolab
vercel login            # one-time, opens the browser
vercel link --yes --project bornolab --scope newellx
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

# Durable storage for accounts, settings, Study and orders
vercel env add POSTGRES_URL production  # or DATABASE_URL; use a pooled URL

# Optional bootstrap site-config seed (database-backed dashboard edits
# are durable when the existing PostgreSQL store is configured)
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

Run `npm run typecheck`, `npm run lint`, `node --test tests/*.test.mjs` and `npm run build` first. Verify the workspace is linked to `newellx/bornolab`, whose production alias is `https://bornolab.vercel.app`.

Printing requires an explicit additive migration. Pull production settings into an ignored file and run the migration in production mode so it loads that file instead of development settings:

```powershell
vercel env pull .env.production.local --environment=production --yes
$env:NODE_ENV = 'production'
npm run db:migrate:printing
npm run db:migrate:printing -- --check
Remove-Item Env:NODE_ENV
```

In a POSIX shell, prefix each migration command with `NODE_ENV=production`. Never commit or print the downloaded environment file. Do not enable `PRINTING_LOCAL_STORAGE` on Vercel. This migration adds only `bornolab_printing`; it does not rewrite existing accounts, Study or digital orders.

Sensitive production variables cannot be read back through the CLI/API ([Vercel documentation](https://vercel.com/docs/environment-variables/sensitive-environment-variables)). In this project the production database URLs are sensitive; an export can contain empty placeholders. If the migration says no database is configured, run the reviewed SQL in the production database console or supply the connection through a trusted local secret manager. Do not weaken the variables' protection or add a public migration endpoint. Until the table is available, printing stays unavailable while the other modules can deploy normally.

```bash
npm run vercel:deploy -- --yes    # == `vercel --prod --yes`
```

This builds (`npm run build`) on Vercel and promotes the result to production. `vercel.json` pins the framework, build command, security headers, and long-lived font caching.

Wait for a Ready deployment, then smoke-test the production alias: homepage, `/study`, `/study/question-bank`, `/printing`, a published service, `/printing/help`, public catalog/flags and unauthenticated member/admin API rejection. Keep printing in demo mode. Record the immutable deployment URL, revision and actual checks in [ai-handoff.md](ai-handoff.md).

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
| Build fails on Vercel, passes locally | Check the actual configured Node version (currently `24.x`; CI uses 22) and environment variables; reproduce with the same runtime |
| `/admin/login` → `503 Admin not configured` | `ADMIN_EMAIL`/`ADMIN_PASSWORD` missing for that environment — `vercel env add …` then redeploy |
| Dashboard edits disappear | Verify PostgreSQL connectivity; the legacy store can fall back to ephemeral files/memory on failure. `SITE_CONFIG_JSON` is a bootstrap option, not a substitute for durable runtime storage |
| `vercel link` points at the wrong project | Re-run the explicit `vercel link --yes --project bornolab --scope newellx` and verify `.vercel/project.json` before deploying |
| CLI asks to confirm everything | `vercel --yes --prod` for non-interactive use (CI-like shells) |

## 9. File storage: local disk vs object storage

Admin uploads (`/api/admin/uploads` → `public/uploads/…`) persist on local/self-hosted
Node but are **ephemeral on Vercel** (per-instance filesystem) and serverless
functions cap request sizes — large font/software bundles will fail or vanish
in production.

Rules of thumb:

| Case | Recommendation |
|---|---|
| Dev / self-host | Local disk uploads work as-is (fonts ≤30 MB, software ≤300 MB, study ≤100 MB, QR ≤5 MB). |
| Production files | Host on object storage (Supabase Storage, Cloudflare R2, S3) and paste the **external URL** into the admin link fields — every catalog form accepts links as well as uploads. |
| bKash QR, small images | Upload anywhere durable (or commit tiny files to git like the BUET guides). |

The Media Library (Admin → Tools → Media) flags orphaned files; on Vercel it
reflects the current instance only — treat external URLs as the source of
truth for production downloads.
