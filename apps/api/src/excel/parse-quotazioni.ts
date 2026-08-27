import type { NewPlayerRow } from "@fantapicker/db";
import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import { cellScalar, parseIntLoose, parseMantraRoles } from "./cell.ts";
import {
  buildColumnMap,
  findHeaderRow,
  toDbColumnName,
  type CanonicalKey,
  type ColumnMap,
} from "./headers.ts";

export type ParsedPlayer = Omit<NewPlayerRow, "id">;

export type ParseQuotazioniResult = {
  players: ParsedPlayer[];
  headerRow: number;
  columnMap: ColumnMap;
  skipped: number;
};

function pickSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet {
  const match = workbook.worksheets.find((ws) =>
    /tutti|quotaz|lista/i.test(ws.name),
  );
  const sheet = match ?? workbook.worksheets[0];
  if (!sheet) throw new Error("Il file Excel non contiene fogli");
  return sheet;
}

function sheetToGrid(sheet: ExcelJS.Worksheet): (string | number | null)[][] {
  const grid: (string | number | null)[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const values: (string | number | null)[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      values[colNumber - 1] = cellScalar(cell.value);
    });
    grid[rowNumber - 1] = values;
  });
  return grid;
}

function cellString(value: string | number | null): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function extrasFromRow(
  row: (string | number | null)[],
  header: (string | number | null)[],
  mappedCols: Set<number>,
): Record<string, string | number | null> {
  const extras: Record<string, string | number | null> = {};
  header.forEach((title, col) => {
    if (mappedCols.has(col) || typeof title !== "string" || !title.trim())
      return;
    const key = toDbColumnName(title);
    if (!key || key in extras) return;
    extras[key] = row[col] ?? null;
  });
  return extras;
}

function parseRow(
  row: (string | number | null)[],
  header: (string | number | null)[],
  columnMap: ColumnMap,
): ParsedPlayer | null {
  const at = (key: CanonicalKey) => {
    const col = columnMap[key];
    return col == null ? null : (row[col] ?? null);
  };
  const playerId = parseIntLoose(at("playerId"));
  const name = cellString(at("name"));
  if (playerId == null || playerId <= 0 || !name) return null;
  const mantraRolesRaw = cellString(at("mantraRoles"));
  const mappedCols = new Set(
    Object.values(columnMap).filter((col): col is number => col != null),
  );
  return {
    playerId,
    name,
    team: cellString(at("team")),
    classicRole: cellString(at("classicRole")),
    mantraRolesRaw,
    mantraRoles: parseMantraRoles(mantraRolesRaw),
    quotationCurrent: parseIntLoose(at("quotationCurrent")),
    quotationInitial: parseIntLoose(at("quotationInitial")),
    quotationDiff: parseIntLoose(at("quotationDiff")),
    fvm: parseIntLoose(at("fvm")),
    extras: extrasFromRow(row, header, mappedCols),
  };
}

export async function parseQuotazioniXlsx(
  buffer: Buffer,
): Promise<ParseQuotazioniResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.read(Readable.from(buffer));
  const grid = sheetToGrid(pickSheet(workbook));
  const headerIndex = findHeaderRow(grid);
  const header = grid[headerIndex] ?? [];
  const columnMap = buildColumnMap(grid, headerIndex);
  const seen = new Set<number>();
  const players: ParsedPlayer[] = [];
  let skipped = 0;

  for (let i = headerIndex + 1; i < grid.length; i++) {
    const row = grid[i];
    if (!row) continue;
    const parsed = parseRow(row, header, columnMap);
    if (!parsed) {
      skipped += 1;
      continue;
    }
    if (seen.has(parsed.playerId)) {
      skipped += 1;
      continue;
    }
    seen.add(parsed.playerId);
    players.push(parsed);
  }

  if (players.length === 0) {
    throw new Error("Nessun giocatore valido trovato nel file");
  }

  return {
    players,
    headerRow: headerIndex + 1,
    columnMap,
    skipped,
  };
}
