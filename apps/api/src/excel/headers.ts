export type CanonicalKey =
  | "playerId"
  | "classicRole"
  | "mantraRoles"
  | "name"
  | "team"
  | "quotationCurrent"
  | "quotationInitial"
  | "quotationDiff"
  | "fvm";

export type ColumnMap = Partial<Record<CanonicalKey, number>>;

const HEADER_ALIASES: Record<string, CanonicalKey> = {
  id: "playerId",
  r: "classicRole",
  ruolo: "classicRole",
  rm: "mantraRoles",
  "ruolo mantra": "mantraRoles",
  mantra: "mantraRoles",
  nome: "name",
  calciatore: "name",
  name: "name",
  squadra: "team",
  sq: "team",
  team: "team",
  "qt.a": "quotationCurrent",
  qta: "quotationCurrent",
  qa: "quotationCurrent",
  "qt a": "quotationCurrent",
  "quotazione attuale": "quotationCurrent",
  "qt.i": "quotationInitial",
  qti: "quotationInitial",
  qi: "quotationInitial",
  "qt i": "quotationInitial",
  "quotazione iniziale": "quotationInitial",
  "diff.": "quotationDiff",
  diff: "quotationDiff",
  differenza: "quotationDiff",
  fvm: "fvm",
  "fvm / 1000": "fvm",
  fantavalore: "fvm",
};

export function normalizeHeader(raw: string): string {
  return raw.toLowerCase().replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function toDbColumnName(header: string): string {
  return normalizeHeader(header)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function canonicalFromHeader(raw: string): CanonicalKey | null {
  return HEADER_ALIASES[normalizeHeader(raw)] ?? null;
}

export function findHeaderRow(grid: (string | number | null)[][]): number {
  let bestIndex = -1;
  let bestScore = -1;
  const limit = Math.min(40, grid.length);
  for (let i = 0; i < limit; i++) {
    const row = grid[i];
    if (!row) continue;
    const hits = new Set<CanonicalKey>();
    for (const cell of row) {
      if (typeof cell !== "string") continue;
      const canonical = canonicalFromHeader(cell);
      if (canonical) hits.add(canonical);
    }
    if (!hits.has("playerId") || !hits.has("name")) continue;
    if (hits.size < 4) continue;
    if (hits.size > bestScore) {
      bestScore = hits.size;
      bestIndex = i;
    }
  }
  if (bestIndex < 0) {
    throw new Error(
      "Intestazioni Excel non riconosciute: servono almeno Id e Nome",
    );
  }
  return bestIndex;
}

function groupLabel(
  grid: (string | number | null)[][],
  headerRow: number,
  col: number,
): string | null {
  for (let up = 1; up <= 2; up++) {
    const row = grid[headerRow - up];
    if (!row) continue;
    const cell = row[col];
    if (typeof cell === "string" && /classic|mantra/i.test(cell)) return cell;
  }
  return null;
}

export function buildColumnMap(
  grid: (string | number | null)[][],
  headerRow: number,
): ColumnMap {
  const header = grid[headerRow] ?? [];
  const assigned = new Map<CanonicalKey, { col: number; mantra: boolean }>();
  const columnMap: ColumnMap = {};

  header.forEach((cell, col) => {
    if (typeof cell !== "string") return;
    const canonical = canonicalFromHeader(cell);
    if (!canonical) return;
    const group = groupLabel(grid, headerRow, col);
    const mantra = typeof group === "string" && /mantra/i.test(group);
    const existing = assigned.get(canonical);
    if (!existing || (mantra && !existing.mantra)) {
      assigned.set(canonical, { col, mantra });
      columnMap[canonical] = col;
    }
  });

  return columnMap;
}
