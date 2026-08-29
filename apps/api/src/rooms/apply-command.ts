import {
  DRAW_COOLDOWN_MS,
  DECK_EXHAUSTED_ERROR,
  ROLE_EXHAUSTED_ERROR,
  appendDrawn,
  exhaustRole,
  lastDrawnId,
  resetDrawn,
  undoDrawn,
  type RoomCommand,
  type RoomState,
} from "@fantapicker/shared";
import type { DrawResult } from "../pick/draw.ts";

export type CommandApply =
  | { ok: true; state: RoomState }
  | { ok: false; status: 404 | 409; error: string };

export type RolesOf = (playerId: number) => Promise<string[]>;

export async function applyRoomCommand(
  state: RoomState,
  command: RoomCommand,
  now: number,
  pick: (role: string, excludeIds: number[]) => Promise<DrawResult>,
  rolesOf: RolesOf = async () => [],
): Promise<CommandApply> {
  switch (command.type) {
    case "setRole":
      return { ok: true, state: { ...state, role: command.role } };
    case "draw":
      return applyDraw(state, now, pick);
    case "pause":
      return {
        ok: true,
        state:
          state.cooldownEndsAt == null
            ? state
            : {
                ...state,
                paused: true,
                pausedMs: Math.max(0, state.cooldownEndsAt - now),
                cooldownEndsAt: null,
              },
      };
    case "resume":
      return {
        ok: true,
        state:
          !state.paused || state.pausedMs == null
            ? state
            : {
                ...state,
                paused: false,
                cooldownEndsAt: now + state.pausedMs,
                pausedMs: null,
              },
      };
    case "reset":
      return { ok: true, state: stopCooldown(resetDrawn(state)) };
    case "undo": {
      const lastId = lastDrawnId(state);
      const lastMantraRoles = lastId == null ? [] : await rolesOf(lastId);
      return {
        ok: true,
        state: stopCooldown(undoDrawn(state, lastMantraRoles)),
      };
    }
    default: {
      const _never: never = command;
      return _never;
    }
  }
}

function stopCooldown(state: RoomState): RoomState {
  return { ...state, paused: false, cooldownEndsAt: null, pausedMs: null };
}

async function applyDraw(
  state: RoomState,
  now: number,
  pick: (role: string, excludeIds: number[]) => Promise<DrawResult>,
): Promise<CommandApply> {
  const result = await pick(state.role, state.drawn);
  if (!result.ok) {
    if (result.error === ROLE_EXHAUSTED_ERROR && state.role) {
      return { ok: true, state: stopCooldown(exhaustRole(state, state.role)) };
    }
    if (result.error === DECK_EXHAUSTED_ERROR) {
      return { ok: true, state: stopCooldown(state) };
    }
    return result;
  }
  return {
    ok: true,
    state: {
      ...appendDrawn(state, result.player.playerId),
      paused: false,
      pausedMs: null,
      cooldownEndsAt: now + DRAW_COOLDOWN_MS,
    },
  };
}
