import * as z from "zod/mini";
import { emptyDrawSession } from "./draw-session.ts";
import { playerSchema } from "./schemas.ts";

export const DRAW_COOLDOWN_MS = 5000;
export const ROOM_POLL_MS = 800;
export const ROOM_TTL_MS = 6 * 60 * 60 * 1000;

export const roomStateSchema = z.object({
  role: z.string(),
  drawn: z.array(playerSchema),
  exhaustedRoles: z._default(z.optional(z.array(z.string())), []),
  paused: z._default(z.optional(z.boolean()), false),
  cooldownEndsAt: z._default(z.optional(z.nullable(z.int())), null),
  pausedMs: z._default(z.optional(z.nullable(z.int())), null),
});
export type RoomState = z.infer<typeof roomStateSchema>;

export const roomSnapshotSchema = z.object({
  code: z.string(),
  updatedAt: z.int(),
  version: z.int().check(z.nonnegative()),
  role: z.string(),
  drawn: z.array(playerSchema),
  exhaustedRoles: z.array(z.string()),
  paused: z.boolean(),
  cooldownEndsAt: z.nullable(z.int()),
  pausedMs: z.nullable(z.int()),
});
export type RoomSnapshot = z.infer<typeof roomSnapshotSchema>;

export const roomCreateResponseSchema = z.object({
  code: z.string(),
  hostToken: z.string(),
  joinUrl: z.string(),
});
export type RoomCreateResponse = z.infer<typeof roomCreateResponseSchema>;

export const roomCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("setRole"),
    role: z.string().check(z.trim(), z.maxLength(16)),
  }),
  z.object({ type: z.literal("draw") }),
  z.object({ type: z.literal("pause") }),
  z.object({ type: z.literal("resume") }),
  z.object({ type: z.literal("reset") }),
  z.object({ type: z.literal("undo") }),
]);
export type RoomCommand = z.infer<typeof roomCommandSchema>;

export function emptyRoomState(role = ""): RoomState {
  return {
    ...emptyDrawSession(role),
    paused: false,
    cooldownEndsAt: null,
    pausedMs: null,
  };
}

export function remainingMs(
  cooldownEndsAt: number | null,
  pausedMs: number | null,
  now: number,
): number {
  if (pausedMs != null) return pausedMs;
  if (cooldownEndsAt == null) return 0;
  return Math.max(0, cooldownEndsAt - now);
}
