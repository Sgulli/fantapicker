import * as z from "zod/mini";
import {
  drawnIdsSchema,
  type Player,
  type RoleCount,
  type StatsResponse,
} from "./schemas.ts";

export const drawSessionSchema = z.object({
  role: z.string(),
  drawn: drawnIdsSchema,
  exhaustedRoles: z._default(z.optional(z.array(z.string())), []),
});
export type DrawSessionState = z.infer<typeof drawSessionSchema>;

type PlayerById = Map<number, Player> | Record<number, Player>;
type HasMantraRoles = { mantraRoles: string[] };

export function emptyDrawSession(role = ""): DrawSessionState {
  return { role, drawn: [], exhaustedRoles: [] };
}

export function lastDrawnId(session: DrawSessionState): number | null {
  return session.drawn.at(-1) ?? null;
}

export function appendDrawn<T extends DrawSessionState>(
  session: T,
  playerId: number,
): T {
  return { ...session, drawn: [...session.drawn, playerId] };
}

export function undoDrawn<T extends DrawSessionState>(
  session: T,
  lastMantraRoles: string[] = [],
): T {
  if (session.drawn.length < 2) return session;
  return {
    ...session,
    drawn: session.drawn.slice(0, -1),
    exhaustedRoles: session.exhaustedRoles.filter(
      (role) => !lastMantraRoles.includes(role),
    ),
  };
}

export function resetDrawn<T extends DrawSessionState>(session: T): T {
  return { ...session, drawn: [], exhaustedRoles: [] };
}

export function exhaustRole<T extends DrawSessionState>(
  session: T,
  role: string,
): T {
  if (session.exhaustedRoles.includes(role)) return session;
  return { ...session, exhaustedRoles: [...session.exhaustedRoles, role] };
}

function playerAt(byId: PlayerById, id: number): Player | undefined {
  return byId instanceof Map ? byId.get(id) : byId[id];
}

export function indexPlayers(
  players: Player[],
  base: Record<number, Player> = {},
): Record<number, Player> {
  if (players.length === 0) return base;
  const next = { ...base };
  for (const player of players) next[player.playerId] = player;
  return next;
}

export function playersInDrawOrder(
  ids: number[],
  byId: PlayerById,
): Player[] {
  return ids.flatMap((id) => {
    const player = playerAt(byId, id);
    return player ? [player] : [];
  });
}

export function lastDrawnMantraRoles(
  session: DrawSessionState,
  byId: PlayerById,
): string[] {
  const id = lastDrawnId(session);
  return id == null ? [] : (playerAt(byId, id)?.mantraRoles ?? []);
}

export function remainingRoleCounts(
  roles: RoleCount[],
  drawn: HasMantraRoles[],
  exhaustedRoles: string[] = [],
): RoleCount[] {
  const drawnByRole = new Map<string, number>();
  for (const player of drawn) {
    for (const role of player.mantraRoles) {
      drawnByRole.set(role, (drawnByRole.get(role) ?? 0) + 1);
    }
  }
  return roles.map((item) => ({
    role: item.role,
    count: exhaustedRoles.includes(item.role)
      ? 0
      : Math.max(0, item.count - (drawnByRole.get(item.role) ?? 0)),
  }));
}

export function remainingInDeck(playerCount: number, drawnCount: number): number {
  return Math.max(0, playerCount - drawnCount);
}

export type DrawPool = {
  liveRoles: RoleCount[];
  remaining: number;
  remainingDeck: number;
  roleExhausted: boolean;
  deckExhausted: boolean;
  poolEmpty: boolean;
};

export function drawPool(
  stats: Pick<StatsResponse, "playerCount" | "roles"> | null,
  session: {
    role: string;
    drawnCount: number;
    drawnPlayers: HasMantraRoles[];
    exhaustedRoles: string[];
  },
): DrawPool {
  const liveRoles = remainingRoleCounts(
    stats?.roles ?? [],
    session.drawnPlayers,
    session.exhaustedRoles,
  );
  const remainingDeck = remainingInDeck(
    stats?.playerCount ?? 0,
    session.drawnCount,
  );
  const remaining =
    liveRoles.find((item) => item.role === session.role)?.count ?? 0;
  const playerCount = stats?.playerCount ?? 0;
  const poolEmpty = session.role ? remaining === 0 : remainingDeck === 0;
  return {
    liveRoles,
    remaining,
    remainingDeck,
    roleExhausted: Boolean(session.role) && remaining === 0,
    deckExhausted:
      playerCount > 0 &&
      session.drawnCount > 0 &&
      (session.role
        ? liveRoles.every((item) => item.count === 0)
        : remainingDeck === 0),
    poolEmpty,
  };
}
