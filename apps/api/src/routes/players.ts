import type { FastifyInstance } from "fastify";
import { parsePlayerIds, playersResponseSchema } from "@fantapicker/shared";
import { loadPlayersByIds } from "../pick/players.ts";

function queryIds(query: unknown): unknown {
  if (typeof query !== "object" || !query || !("ids" in query)) return null;
  return query.ids;
}

export async function registerPlayersRoute(app: FastifyInstance) {
  app.get("/players", async (request) => {
    const players = await loadPlayersByIds(parsePlayerIds(queryIds(request.query)));
    return playersResponseSchema.parse({ players });
  });
}
