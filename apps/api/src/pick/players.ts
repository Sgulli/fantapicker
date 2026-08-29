import { inArray } from "drizzle-orm";
import { players } from "@fantapicker/db";
import { playersInDrawOrder, uniquePlayerIds, type Player } from "@fantapicker/shared";
import { db } from "../db.ts";
import { toPlayer } from "../player-map.ts";

export async function loadPlayersByIds(ids: number[]): Promise<Player[]> {
  const unique = uniquePlayerIds(ids);
  if (unique.length === 0) return [];
  const rows = await db
    .select()
    .from(players)
    .where(inArray(players.playerId, unique));
  return playersInDrawOrder(
    ids,
    new Map(rows.map((row) => [row.playerId, toPlayer(row)])),
  );
}

export async function loadMantraRoles(playerId: number): Promise<string[]> {
  return (await loadPlayersByIds([playerId]))[0]?.mantraRoles ?? [];
}
