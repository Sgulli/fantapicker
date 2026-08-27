# FantaPicker

Turbo monorepo: React + Vite frontend, Fastify API, Drizzle + Postgres.

## Setup

```bash
cp .env.example .env
# set BETTER_AUTH_SECRET (openssl rand -base64 32) and ADMIN_PASSWORD
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm seed:admin
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3001
- Postgres: localhost:5433 (5432 is often already in use)

Log in at `/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`, then upload `Quotazioni_Fantacalcio_Stagione_2026_27.xlsx` on `/import`. The picker on `/` stays public. Signup is disabled; use `pnpm seed:admin` to create the local admin.

## Deploy (Vercel + Neon)

Single Vercel project: Vite SPA from `apps/web/dist`, Fastify via `buildApp()` as one Node function (`api/[[...path]].ts`). Browser calls same-origin `/api` (not localhost:3001). Do not auto-migrate on cold start.

1. Create a [Neon](https://neon.com) project. Copy the **pooled** connection string into `DATABASE_URL` (`-pooler` host, `sslmode=require`) and the **unpooled/direct** string into `DIRECT_URL`.
2. From this repo, with those URLs in `.env` (do not commit them):

   ```bash
   pnpm db:migrate
   pnpm seed:admin
   ```

   Use a strong `ADMIN_PASSWORD` in production. Seed once; signup stays disabled.

3. Import the Git repo on [Vercel](https://vercel.com). Root directory = repository root. Install/build/output are in `vercel.json` (`pnpm`, `pnpm vercel-build`, `apps/web/dist`).
4. Set Vercel env (Production, and Preview if you use it):

   | Variable             | Value                                                   |
   | -------------------- | ------------------------------------------------------- |
   | `DATABASE_URL`       | Neon **pooled** URL                                     |
   | `DIRECT_URL`         | Neon **unpooled** URL (migrate locally/CI only)         |
   | `BETTER_AUTH_SECRET` | `openssl rand -base64 32`                               |
   | `BETTER_AUTH_URL`    | Public HTTPS origin, e.g. `https://your-app.vercel.app` |
   | `WEB_ORIGIN`         | Same as `BETTER_AUTH_URL`                               |
   | `NODE_ENV`           | `production` (Vercel usually sets this)                 |

   Do not put `ADMIN_PASSWORD` in Vercel unless you will run seed against production from your machine. Never commit Neon/Vercel tokens.

5. Deploy. After the first production URL is known, confirm `BETTER_AUTH_URL` / `WEB_ORIGIN` match it (custom domain included).

Excel import is capped at 10 MB in Fastify; Vercel Hobby request bodies are smaller (~4.5 MB). Import a reasonably sized listone, or host the API as a long-lived Node process (Fly/Railway/Render) and point `WEB_ORIGIN` at the Vercel site if the serverless wrap is too tight for uploads.
