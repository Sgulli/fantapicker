import type { PlayerRow } from "@fantapicker/db";
import { playerImageUrl, type Player } from "@fantapicker/shared";

export function toPlayer(row: PlayerRow): Player {
  return {
    playerId: row.playerId,
    name: row.name,
    team: row.team,
    classicRole: row.classicRole,
    mantraRoles: row.mantraRoles,
    quotationCurrent: row.quotationCurrent,
    quotationInitial: row.quotationInitial,
    quotationDiff: row.quotationDiff,
    fvm: row.fvm,
    imageUrl: playerImageUrl(row.playerId),
  };
}
