import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildColumnMap,
  canonicalFromHeader,
  findHeaderRow,
  normalizeHeader,
  toDbColumnName,
} from "./headers.ts";

describe("normalizeHeader", () => {
  it("collapses spacing and case", () => {
    assert.equal(normalizeHeader("  Qt.A  "), "qt.a");
  });
});

describe("toDbColumnName", () => {
  it("turns excel headers into snake columns", () => {
    assert.equal(toDbColumnName("Qt.A"), "qt_a");
    assert.equal(toDbColumnName("FVM / 1000"), "fvm_1000");
  });
});

describe("canonicalFromHeader", () => {
  it("maps Id to playerId", () => {
    assert.equal(canonicalFromHeader("Id"), "playerId");
    assert.equal(canonicalFromHeader("RM"), "mantraRoles");
  });
});

describe("findHeaderRow", () => {
  it("skips a title row", () => {
    const grid = [
      ["Quotazioni Fantacalcio", null, null, null, null],
      ["Id", "R", "RM", "Nome", "Squadra"],
    ];
    assert.equal(findHeaderRow(grid), 1);
  });
});

describe("buildColumnMap", () => {
  it("prefers Mantra FVM when Classic and Mantra both exist", () => {
    const grid = [
      [null, null, null, null, null, "Classic", null, "Mantra"],
      ["Id", "R", "RM", "Nome", "Squadra", "FVM", "Qt.A", "FVM"],
    ];
    const map = buildColumnMap(grid, 1);
    assert.equal(map.fvm, 7);
    assert.equal(map.playerId, 0);
  });
});
