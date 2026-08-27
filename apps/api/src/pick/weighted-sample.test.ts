import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ENTROPY_BLEND,
  atLeast,
  entropyWeight,
  logFlatten,
  mixTowardUniform,
  nonnegative,
  playerScore,
  playerWeight,
  sampleWeight,
  weightedSample,
} from "./weighted-sample.ts";
import { ENTROPY_EVERY, isEntropyDraw } from "@fantapicker/shared";

describe("nonnegative", () => {
  it("keeps values >= 0", () => {
    assert.equal(nonnegative(0), 0);
    assert.equal(nonnegative(12), 12);
  });

  it("drops null and negatives", () => {
    assert.equal(nonnegative(null), null);
    assert.equal(nonnegative(-1), null);
  });
});

describe("playerScore", () => {
  it("prefers FVM over quotation", () => {
    assert.equal(playerScore({ fvm: 370, quotationCurrent: 35 }), 370);
  });

  it("falls back to quotation then zero", () => {
    assert.equal(playerScore({ fvm: null, quotationCurrent: 12 }), 12);
    assert.equal(playerScore({ fvm: null, quotationCurrent: null }), 0);
  });
});

describe("playerWeight", () => {
  it("keeps zero-score players drawable", () => {
    assert.equal(playerWeight({ fvm: 0, quotationCurrent: 0 }), 1);
    assert.equal(playerWeight({ fvm: 370, quotationCurrent: 35 }), 371);
  });
});

describe("entropy helpers", () => {
  it("flattens and blends toward uniform", () => {
    assert.ok(logFlatten(371) < 371);
    assert.equal(mixTowardUniform(4, 0.5), 2.5);
    assert.equal(atLeast(-1, 0.01), 0.01);
    assert.equal(ENTROPY_BLEND, 0.75);
  });
});

describe("weightedSample", () => {
  it("always returns the only item", () => {
    assert.equal(weightedSample(["only"], () => 1, () => 0.5), "only");
  });

  it("can still pick the lowest weight", () => {
    const items = [
      { name: "star", fvm: 370, quotationCurrent: 35 },
      { name: "bench", fvm: 0, quotationCurrent: 1 },
    ];
    const picked = weightedSample(items, playerWeight, () => 0.999);
    assert.equal(picked.name, "bench");
  });

  it("favors the high score when rng lands early", () => {
    const items = [
      { name: "star", fvm: 370, quotationCurrent: 35 },
      { name: "bench", fvm: 0, quotationCurrent: 1 },
    ];
    const picked = weightedSample(items, playerWeight, () => 0);
    assert.equal(picked.name, "star");
  });
});

describe("isEntropyDraw", () => {
  it("fires on every Nth successful pick", () => {
    assert.equal(isEntropyDraw(0, ENTROPY_EVERY), false);
    assert.equal(isEntropyDraw(4, ENTROPY_EVERY), false);
    assert.equal(isEntropyDraw(5, ENTROPY_EVERY), true);
    assert.equal(isEntropyDraw(6, ENTROPY_EVERY), false);
    assert.equal(isEntropyDraw(10, ENTROPY_EVERY), true);
  });
});

describe("entropyWeight", () => {
  it("flattens high vs low scores toward uniform", () => {
    const star = playerWeight({ fvm: 370, quotationCurrent: 35 });
    const bench = playerWeight({ fvm: 0, quotationCurrent: 1 });
    const ratio = star / bench;
    const entropyRatio = entropyWeight(star) / entropyWeight(bench);
    assert.ok(entropyRatio < ratio / 2);
    assert.ok(entropyRatio > 1);
  });

  it("raises the chance of picking the low-weight player", () => {
    const items = [
      { name: "star", fvm: 370, quotationCurrent: 35 },
      { name: "bench", fvm: 0, quotationCurrent: 1 },
    ];
    const steps = [0.5, 0.6, 0.7, 0.8, 0.9];
    const weighted = steps.map((p) =>
      weightedSample(items, playerWeight, () => p).name,
    );
    const wild = steps.map((p) =>
      weightedSample(items, (item) => sampleWeight(item, true), () => p).name,
    );
    assert.ok(
      wild.filter((name) => name === "bench").length >
        weighted.filter((name) => name === "bench").length,
    );
  });
});
