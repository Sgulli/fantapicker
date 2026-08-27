## Learned User Preferences

- Writes in Italian; keep product UI copy Italian.
- Put shadcn/ui primitives in `packages/ui`, not in `apps/web`.
- Never show Mix wild, entropy badges, or copy that reveals boosted randomization.
- Once a player is drawn in a session, discard them — never pick the same player again.
- Use Zod 4 Mini (`import * as z from "zod/mini"`) in shared schemas to keep the frontend bundle small.
- Keep `design-system/fantapicker/MASTER.md`; do not regenerate it with `--force`.
- UI is mobile-first; selected Mantra role chips must be visually obvious vs unselected.

## Learned Workspace Facts

- pnpm + Turbo monorepo: `apps/web` (React Vite), `apps/api` (Fastify), `packages/db` (Drizzle), `packages/ui` (shadcn), `packages/shared` (Zod Mini).
- Postgres is Docker-mapped to host port 5433; API `:3001`, web `:5173`.
- Player cards: `https://content.fantacalcio.it/web/campioncini/21/card/${playerId}.png` (Excel `Id` → `playerId`).
- Weighted pick by Mantra role (RM can be multi-role like `C;T`); higher FVM more likely, fondi lista still possible.
- Excel import may have a title row before headers; normalize Fantacalcio column names.
- Cinema dark tokens: background `#0F0F23`, CTA `#F97316`; fonts Russo One + Chakra Petch.
- Draw loop: 5s countdown between auto-extracts, with fast-skip and pause; first draw is explicit Estrai.
