import type { FastifyInstance } from "fastify";
import { pickRequestSchema } from "@fantapicker/shared";
import { drawPlayer } from "../pick/draw.ts";

export async function registerPickRoute(app: FastifyInstance) {
  app.post("/pick", async (request, reply) => {
    const parsed = pickRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Ruolo non valido" });
    }
    const result = await drawPlayer(parsed.data.role, parsed.data.excludeIds);
    if (!result.ok) return reply.code(result.status).send({ error: result.error });
    return { player: result.player };
  });
}
