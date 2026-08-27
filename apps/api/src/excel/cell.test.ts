import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cellScalar, parseIntLoose, parseMantraRoles } from "./cell.ts";

describe("cellScalar", () => {
  it("unwraps excel formula results", () => {
    assert.equal(cellScalar({ result: 35 }), 35);
    assert.equal(cellScalar({ text: "Lautaro" }), "Lautaro");
  });
});

describe("parseIntLoose", () => {
  it("accepts italian decimals and dashes", () => {
    assert.equal(parseIntLoose("35,4"), 35);
    assert.equal(parseIntLoose("-"), null);
    assert.equal(parseIntLoose(370), 370);
  });
});

describe("parseMantraRoles", () => {
  it("splits multi-role mantra cells", () => {
    assert.deepEqual(parseMantraRoles("C;T"), ["C", "T"]);
    assert.deepEqual(parseMantraRoles("A/Pc"), ["A", "Pc"]);
    assert.deepEqual(parseMantraRoles("Dc"), ["Dc"]);
  });
});
