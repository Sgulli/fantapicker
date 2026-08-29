import type { FastifyInstance } from "fastify";
import { registerImportRoute } from "./import.ts";
import { registerPickRoute } from "./pick.ts";
import { registerPlayersRoute } from "./players.ts";
import { registerRoomsRoute } from "./rooms.ts";
import { registerStatsRoute } from "./stats.ts";

export default async function apiRoutes(app: FastifyInstance) {
  await app.register(registerImportRoute);
  await app.register(registerPickRoute);
  await app.register(registerPlayersRoute);
  await app.register(registerRoomsRoute);
  await app.register(registerStatsRoute);
}
