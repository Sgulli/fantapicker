## Learned User Preferences

- Writes in Italian; keep product UI copy Italian.
- Put shadcn/ui primitives in `packages/ui`, not in `apps/web`.
- Never show Mix wild, entropy badges, or copy that reveals boosted randomization.
- Once a player is drawn in a session, discard them — never pick the same player again.
- Use Zod 4 Mini (`import * as z from "zod/mini"`) in shared schemas to keep the frontend bundle small.
- Keep `design-system/fantapicker/MASTER.md`; do not regenerate it with `--force`.
- UI is mobile-first; selected Mantra role chips must be visually obvious vs unselected.
- Prefer small, DRY, composable helpers over nested ternaries and large functions.
- Do not preselect a Mantra role; empty selection is uniform random over the remaining listone, not FVM-weighted.
- Confirm Nuova estrazione before wiping a draw; pause the countdown while that dialog is open.

## Learned Workspace Facts

- pnpm + Turbo monorepo: `apps/web` (React Vite), `apps/api` (Fastify), `packages/db` (Drizzle), `packages/ui` (shadcn), `packages/shared` (Zod Mini).
- Local Postgres is Docker-mapped to host port 5433; API `:3001`, web `:5173`. Production uses Neon: pooled `DATABASE_URL` at runtime, unpooled `DIRECT_URL` / `DATABASE_URL_UNPOOLED` for migrations.
- Player cards: `https://content.fantacalcio.it/web/campioncini/21/card/${playerId}.png` (Excel `Id` → `playerId`).
- With a Mantra role selected, weighted pick (RM can be multi-role like `C;T`); higher FVM more likely, fondi lista still possible. With no role, uniform random over remaining players.
- Excel import may have a title row before headers; normalize Fantacalcio column names.
- Cinema dark tokens: background `#0F0F23`, CTA `#F97316`; fonts Russo One + Chakra Petch.
- Draw loop: 5s countdown between auto-extracts, with fast-skip and pause; first draw is explicit Estrai.
- Root `api/` is the Vercel serverless adapter: esbuild-bundle Fastify and rewrite nested `/api/*` through `api/index.ts`.
- Live rooms: Postgres snapshot + ~800ms poll (no WebSocket on Vercel); host token for skip/pause/reset, guests read-only; QR encodes the join URL.
