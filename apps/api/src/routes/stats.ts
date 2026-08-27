import { count, sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { players } from "@fantapicker/db";
import { db } from "../db.ts";

export async function registerStatsRoute(app: FastifyInstance) {
  app.get("/stats", async () => {
    const [totals, roleRows] = await Promise.all([
      db.select({ playerCount: count() }).from(players),
      db.execute<{ role: string; count: number }>(sql`
        SELECT role, COUNT(*)::int AS count
        FROM players, unnest(mantra_roles) AS role
        GROUP BY role
        ORDER BY role
      `),
    ]);

    return {
      playerCount: totals[0]?.playerCount ?? 0,
      roles: [...roleRows],
    };
  });
}
