import {
  DRAW_COOLDOWN_MS,
  DECK_EXHAUSTED_ERROR,
  ROLE_EXHAUSTED_ERROR,
  appendDrawn,
  exhaustRole,
  resetDrawn,
  undoDrawn,
  type RoomCommand,
  type RoomState,
} from "@fantapicker/shared";
import type { DrawResult } from "../pick/draw.ts";

export type CommandApply =
  | { ok: true; state: RoomState }
  | { ok: false; status: 404 | 409; error: string };

export async function applyRoomCommand(
  state: RoomState,
  command: RoomCommand,
  now: number,
  pick: (role: string, excludeIds: number[]) => Promise<DrawResult>,
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
      return {
        ok: true,
        state: {
          ...resetDrawn(state),
          paused: false,
          cooldownEndsAt: null,
          pausedMs: null,
        },
      };
    case "undo":
      return {
        ok: true,
        state: {
          ...undoDrawn(state),
          paused: false,
          cooldownEndsAt: null,
          pausedMs: null,
        },
      };
    default: {
      const _never: never = command;
      return _never;
    }
  }
}

async function applyDraw(
  state: RoomState,
  now: number,
  pick: (role: string, excludeIds: number[]) => Promise<DrawResult>,
): Promise<CommandApply> {
  const result = await pick(
    state.role,
    state.drawn.map((item) => item.playerId),
  );
  if (!result.ok) {
    if (result.error === ROLE_EXHAUSTED_ERROR && state.role) {
      return {
        ok: true,
        state: {
          ...exhaustRole(state, state.role),
          paused: false,
          cooldownEndsAt: null,
          pausedMs: null,
        },
      };
    }
    if (result.error === DECK_EXHAUSTED_ERROR) {
      return {
        ok: true,
        state: { ...state, paused: false, cooldownEndsAt: null, pausedMs: null },
      };
    }
    return result;
  }
  return {
    ok: true,
    state: {
      ...appendDrawn(state, result.player),
      paused: false,
      pausedMs: null,
      cooldownEndsAt: now + DRAW_COOLDOWN_MS,
    },
  };
}
