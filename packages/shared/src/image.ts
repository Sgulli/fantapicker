export const CAMPIONCINO_BASE =
  "https://content.fantacalcio.it/web/campioncini/21/card" as const;

export function playerImageUrl(playerId: number): string {
  return `${CAMPIONCINO_BASE}/${playerId}.png`;
}
