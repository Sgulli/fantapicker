import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolve } from "node:path";
import ExcelJS from "exceljs";
import { parseQuotazioniXlsx } from "./parse-quotazioni.ts";

async function xlsxFromRows(rows: (string | number | null)[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Tutti");
  for (const row of rows) sheet.addRow(row);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

describe("parseQuotazioniXlsx", () => {
  it("maps Id to playerId and splits mantra roles", async () => {
    const buffer = await xlsxFromRows([
      ["Quotazioni 2026/27"],
      ["Id", "R", "RM", "Nome", "Squadra", "Qt.A", "Qt.I", "Diff.", "FVM", "Note"],
      [2488, "A", "A;Pc", "Martinez L.", "Inter", 35, 35, 0, 370, "top"],
      [null, "P", "Por", "", "Milan", 10, 10, 0, 1, null],
    ]);
    const result = await parseQuotazioniXlsx(buffer);
    assert.equal(result.players.length, 1);
    const [player] = result.players;
    assert.equal(player?.playerId, 2488);
    assert.equal(player?.name, "Martinez L.");
    assert.deepEqual(player?.mantraRoles, ["A", "Pc"]);
    assert.equal(player?.fvm, 370);
    assert.equal(player?.extras.note, "top");
    assert.equal(result.headerRow, 2);
  });

  it("parses the official 2026/27 listone", async () => {
    const file = resolve(
      import.meta.dirname,
      "../../../../Quotazioni_Fantacalcio_Stagione_2026_27.xlsx",
    );
    if (!existsSync(file)) return;
    const result = await parseQuotazioniXlsx(readFileSync(file));
    assert.ok(result.players.length > 100, `imported ${result.players.length}`);
    const first = result.players[0];
    assert.ok(first && first.playerId > 0);
    assert.ok(first.name.length > 0);
    assert.ok(result.columnMap.playerId != null);
    const withMantra = result.players.filter((p) => p.mantraRoles.length > 0);
    assert.ok(withMantra.length > 50, `mantra ${withMantra.length}`);
    const imageId = first.playerId;
    assert.match(
      `https://content.fantacalcio.it/web/campioncini/21/card/${imageId}.png`,
      /\/card\/\d+\.png$/,
    );
  });
});
