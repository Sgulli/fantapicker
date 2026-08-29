import * as z from "zod/mini";

export const ROLE_EXHAUSTED_ERROR =
  "Ruolo esaurito: tutti i giocatori di questo ruolo sono già usciti";

export const DECK_EXHAUSTED_ERROR =
  "Mazzo esaurito: tutti i giocatori sono già usciti";

export const MAX_DRAWN_IDS = 5000;

const nonnegativeInt = z.int().check(z.nonnegative());
const positiveInt = z.int().check(z.positive());

export const pickRequestSchema = z.object({
  role: z._default(
    z.optional(z.string().check(z.trim(), z.maxLength(16))),
    "",
  ),
  excludeIds: z._default(
    z.optional(z.array(positiveInt).check(z.maxLength(MAX_DRAWN_IDS))),
    [],
  ),
});
export type PickRequest = z.infer<typeof pickRequestSchema>;

export const drawnIdSchema = z.pipe(
  z.union([positiveInt, z.object({ playerId: positiveInt })]),
  z.transform((item) => (typeof item === "number" ? item : item.playerId)),
);
export const drawnIdsSchema = z
  .array(drawnIdSchema)
  .check(z.maxLength(MAX_DRAWN_IDS));

export function parsePlayerIds(raw: unknown): number[] {
  if (raw == null) return [];
  const text = Array.isArray(raw) ? raw.join(",") : String(raw);
  return text
    .split(",")
    .flatMap((part) => {
      const id = Number(part);
      return Number.isInteger(id) && id > 0 ? [id] : [];
    })
    .slice(0, MAX_DRAWN_IDS);
}

export function uniquePlayerIds(ids: number[]): number[] {
  return [...new Set(ids)].slice(0, MAX_DRAWN_IDS);
}

export const playerSchema = z.object({
  playerId: positiveInt,
  name: z.string().check(z.minLength(1)),
  team: z.nullable(z.string()),
  classicRole: z.nullable(z.string()),
  mantraRoles: z.array(z.string()),
  quotationCurrent: z.nullable(z.int()),
  quotationInitial: z.nullable(z.int()),
  quotationDiff: z.nullable(z.int()),
  fvm: z.nullable(z.int()),
  imageUrl: z.url(),
});
export type Player = z.infer<typeof playerSchema>;

export const pickResponseSchema = z.object({
  player: playerSchema,
});
export type PickResponse = z.infer<typeof pickResponseSchema>;

export const playersResponseSchema = z.object({
  players: z.array(playerSchema),
});
export type PlayersResponse = z.infer<typeof playersResponseSchema>;

export const importResponseSchema = z.object({
  imported: nonnegativeInt,
  skipped: nonnegativeInt,
  headerRow: positiveInt,
});
export type ImportResponse = z.infer<typeof importResponseSchema>;

export const roleCountSchema = z.object({
  role: z.string(),
  count: nonnegativeInt,
});
export type RoleCount = z.infer<typeof roleCountSchema>;

export const statsResponseSchema = z.object({
  playerCount: nonnegativeInt,
  roles: z.array(roleCountSchema),
});
export type StatsResponse = z.infer<typeof statsResponseSchema>;

export const ENTROPY_EVERY = 5;

export function isEntropyDraw(
  drawCount: number,
  every: number = ENTROPY_EVERY,
): boolean {
  return every > 0 && drawCount > 0 && drawCount % every === 0;
}
