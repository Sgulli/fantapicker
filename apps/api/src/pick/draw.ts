import { arrayContains, count } from "drizzle-orm";
import { players } from "@fantapicker/db";
import {
  DECK_EXHAUSTED_ERROR,
  isEntropyDraw,
  ROLE_EXHAUSTED_ERROR,
  type Player,
} from "@fantapicker/shared";
import { db } from "../db.ts";
import { toPlayer } from "../player-map.ts";
import { withoutExcluded } from "./exclude.ts";
import { sampleWeight, weightedSample } from "./weighted-sample.ts";

export type DrawOk = { ok: true; player: Player };
export type DrawFail = { ok: false; status: 404 | 409; error: string };
export type DrawResult = DrawOk | DrawFail;

export async function drawPlayer(
  role: string,
  excludeIds: number[],
): Promise<DrawResult> {
  const rows = role
    ? await db
        .select()
        .from(players)
        .where(arrayContains(players.mantraRoles, [role]))
    : await db.select().from(players);

  if (rows.length === 0) {
    if (!role) return { ok: false, status: 409, error: "Nessun listone caricato" };
    const [total] = await db.select({ playerCount: count() }).from(players);
    if ((total?.playerCount ?? 0) === 0) {
      return { ok: false, status: 409, error: "Nessun listone caricato" };
    }
    return {
      ok: false,
      status: 404,
      error: `Nessun giocatore per il ruolo ${role}`,
    };
  }

  const pool = withoutExcluded(rows, excludeIds);
  if (pool.length === 0) {
    return {
      ok: false,
      status: 409,
      error: role ? ROLE_EXHAUSTED_ERROR : DECK_EXHAUSTED_ERROR,
    };
  }

  const entropy = Boolean(role) && isEntropyDraw(excludeIds.length + 1);
  return {
    ok: true,
    player: toPlayer(
      weightedSample(pool, (row) => (role ? sampleWeight(row, entropy) : 1)),
    ),
  };
}
