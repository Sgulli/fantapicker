import { arrayContains, count } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { players } from "@fantapicker/db";
import { isEntropyDraw, pickRequestSchema, ROLE_EXHAUSTED_ERROR } from "@fantapicker/shared";
import { db } from "../db.ts";
import { withoutExcluded } from "../pick/exclude.ts";
import { sampleWeight, weightedSample } from "../pick/weighted-sample.ts";
import { toPlayer } from "../player-map.ts";

export async function registerPickRoute(app: FastifyInstance) {
  app.post("/pick", async (request, reply) => {
    const parsed = pickRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Ruolo non valido" });
    }

    const rows = await db
      .select()
      .from(players)
      .where(arrayContains(players.mantraRoles, [parsed.data.role]));

    if (rows.length === 0) {
      const [total] = await db.select({ playerCount: count() }).from(players);
      if ((total?.playerCount ?? 0) === 0) {
        return reply.code(409).send({ error: "Nessun listone caricato" });
      }
      return reply
        .code(404)
        .send({ error: `Nessun giocatore per il ruolo ${parsed.data.role}` });
    }

    const pool = withoutExcluded(rows, parsed.data.excludeIds);
    if (pool.length === 0) {
      return reply.code(409).send({ error: ROLE_EXHAUSTED_ERROR });
    }

    const entropy = isEntropyDraw(parsed.data.excludeIds.length + 1);
    const player = toPlayer(
      weightedSample(pool, (row) => sampleWeight(row, entropy)),
    );
    return { player };
  });
}
