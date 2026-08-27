import * as z from "zod/mini";
import { playerSchema, type Player, type RoleCount } from "./schemas.ts";

export const drawSessionSchema = z.object({
  role: z.string(),
  drawn: z.array(playerSchema),
  exhaustedRoles: z._default(z.optional(z.array(z.string())), []),
});
export type DrawSessionState = z.infer<typeof drawSessionSchema>;

export function emptyDrawSession(role = ""): DrawSessionState {
  return { role, drawn: [], exhaustedRoles: [] };
}

export function sessionPlayer(session: DrawSessionState): Player | null {
  return session.drawn[session.drawn.length - 1] ?? null;
}

export function appendDrawn(
  session: DrawSessionState,
  player: Player,
): DrawSessionState {
  return { ...session, drawn: [...session.drawn, player] };
}

export function undoDrawn(session: DrawSessionState): DrawSessionState {
  if (session.drawn.length < 2) return session;
  const last = session.drawn[session.drawn.length - 1];
  if (!last) return session;
  return {
    ...session,
    drawn: session.drawn.slice(0, -1),
    exhaustedRoles: session.exhaustedRoles.filter(
      (role) => !last.mantraRoles.includes(role),
    ),
  };
}

export function resetDrawn(session: DrawSessionState): DrawSessionState {
  return emptyDrawSession(session.role);
}

export function exhaustRole(
  session: DrawSessionState,
  role: string,
): DrawSessionState {
  if (session.exhaustedRoles.includes(role)) return session;
  return { ...session, exhaustedRoles: [...session.exhaustedRoles, role] };
}

export function remainingRoleCounts(
  roles: RoleCount[],
  drawnMantraRoles: string[][],
  exhaustedRoles: string[] = [],
): RoleCount[] {
  return roles.map((item) => ({
    role: item.role,
    count: exhaustedRoles.includes(item.role)
      ? 0
      : Math.max(
          0,
          item.count -
            drawnMantraRoles.filter((list) => list.includes(item.role)).length,
        ),
  }));
}

export function remainingForRole(
  roles: RoleCount[],
  drawnMantraRoles: string[][],
  role: string,
  exhaustedRoles: string[] = [],
): number {
  return (
    remainingRoleCounts(roles, drawnMantraRoles, exhaustedRoles).find(
      (item) => item.role === role,
    )?.count ?? 0
  );
}
