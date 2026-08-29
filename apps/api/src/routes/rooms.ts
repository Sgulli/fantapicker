import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { rooms } from "@fantapicker/db";
import {
  emptyRoomState,
  isRoomCode,
  normalizeRoomCode,
  roomCommandSchema,
  roomStateSchema,
  ROOM_TTL_MS,
  type RoomSnapshot,
  type RoomState,
} from "@fantapicker/shared";
import { db } from "../db.ts";
import { env } from "../env.ts";
import { drawPlayer } from "../pick/draw.ts";
import { applyRoomCommand } from "../rooms/apply-command.ts";
import {
  bearerToken,
  createHostToken,
  generateRoomCode,
  hashHostToken,
  hostTokenMatches,
} from "../rooms/token.ts";

const CREATE_TRIES = 8;

function paramCode(params: unknown): string {
  if (typeof params !== "object" || !params || !("code" in params)) return "";
  return normalizeRoomCode(String(params.code));
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code = "code" in error ? error.code : undefined;
  const cause =
    "cause" in error && typeof error.cause === "object" ? error.cause : null;
  const nested = cause && "code" in cause ? cause.code : undefined;
  return code === "23505" || nested === "23505";
}

function toSnapshot(
  code: string,
  version: number,
  updatedAt: Date,
  state: RoomState,
): RoomSnapshot {
  return {
    code,
    version,
    updatedAt: updatedAt.getTime(),
    role: state.role,
    drawn: state.drawn,
    exhaustedRoles: state.exhaustedRoles,
    paused: state.paused,
    cooldownEndsAt: state.cooldownEndsAt,
    pausedMs: state.pausedMs,
  };
}

function parseState(raw: unknown): RoomState | null {
  const parsed = roomStateSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function registerRoomsRoute(app: FastifyInstance) {
  app.post("/rooms", async (_request, reply) => {
    const hostToken = createHostToken();
    const hostTokenHash = hashHostToken(hostToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ROOM_TTL_MS);
    const state = emptyRoomState();

    for (let attempt = 0; attempt < CREATE_TRIES; attempt++) {
      const code = generateRoomCode();
      try {
        await db.insert(rooms).values({
          code,
          hostTokenHash,
          state,
          version: 0,
          createdAt: now,
          updatedAt: now,
          expiresAt,
        });
        return {
          code,
          hostToken,
          joinUrl: `${env.WEB_ORIGIN}/s/${code}`,
        };
      } catch (error) {
        if (!isUniqueViolation(error) || attempt === CREATE_TRIES - 1) throw error;
      }
    }
    return reply.code(500).send({ error: "Impossibile creare la stanza" });
  });

  app.get("/rooms/:code", async (request, reply) => {
    const code = paramCode(request.params);
    if (!isRoomCode(code)) {
      return reply.code(404).send({ error: "Stanza non trovata" });
    }
    const [row] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
    if (!row) return reply.code(404).send({ error: "Stanza non trovata" });
    if (row.expiresAt.getTime() <= Date.now()) {
      return reply.code(410).send({ error: "Stanza scaduta" });
    }
    const state = parseState(row.state);
    if (!state) return reply.code(500).send({ error: "Stanza non valida" });
    return toSnapshot(row.code, row.version, row.updatedAt, state);
  });

  app.post("/rooms/:code/command", async (request, reply) => {
    const code = paramCode(request.params);
    if (!isRoomCode(code)) {
      return reply.code(404).send({ error: "Stanza non trovata" });
    }
    const token = bearerToken(request.headers.authorization);
    if (!token) return reply.code(403).send({ error: "Comando non autorizzato" });

    const parsed = roomCommandSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Comando non valido" });
    }

    const [row] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
    if (!row) return reply.code(404).send({ error: "Stanza non trovata" });
    if (row.expiresAt.getTime() <= Date.now()) {
      return reply.code(410).send({ error: "Stanza scaduta" });
    }
    if (!hostTokenMatches(token, row.hostTokenHash)) {
      return reply.code(403).send({ error: "Comando non autorizzato" });
    }
    const state = parseState(row.state);
    if (!state) return reply.code(500).send({ error: "Stanza non valida" });

    const applied = await applyRoomCommand(
      state,
      parsed.data,
      Date.now(),
      drawPlayer,
    );
    if (!applied.ok) {
      return reply.code(applied.status).send({ error: applied.error });
    }

    const updatedAt = new Date();
    const nextVersion = row.version + 1;
    const updated = await db
      .update(rooms)
      .set({
        state: applied.state,
        version: nextVersion,
        updatedAt,
      })
      .where(and(eq(rooms.code, code), eq(rooms.version, row.version)))
      .returning({ version: rooms.version, updatedAt: rooms.updatedAt });

    if (updated.length === 0) {
      return reply.code(409).send({ error: "Stanza aggiornata, riprova" });
    }
    const saved = updated[0];
    if (!saved) return reply.code(409).send({ error: "Stanza aggiornata, riprova" });
    return toSnapshot(code, saved.version, saved.updatedAt, applied.state);
  });
}
