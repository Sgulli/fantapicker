import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ROLE_EXHAUSTED_ERROR,
  appendDrawn,
  drawSessionSchema,
  emptyDrawSession,
  exhaustRole,
  pickRequestSchema,
  remainingForRole,
  remainingInDeck,
  remainingRoleCounts,
  resetDrawn,
  sessionPlayer,
  undoDrawn,
  type Player,
} from "@fantapicker/shared";
import { withoutExcluded } from "./exclude.ts";

describe("pickRequestSchema", () => {
  it("defaults excludeIds", () => {
    const parsed = pickRequestSchema.parse({ role: "Pc" });
    assert.deepEqual(parsed.excludeIds, []);
  });

  it("accepts an exclusion list", () => {
    const parsed = pickRequestSchema.parse({
      role: "A",
      excludeIds: [2488, 2012],
    });
    assert.deepEqual(parsed.excludeIds, [2488, 2012]);
  });

  it("defaults to an empty role for unfiltered picks", () => {
    const parsed = pickRequestSchema.parse({ excludeIds: [1] });
    assert.equal(parsed.role, "");
    assert.deepEqual(parsed.excludeIds, [1]);
  });

  it("accepts an explicit empty role", () => {
    assert.equal(pickRequestSchema.parse({ role: "" }).role, "");
  });

  it("rejects roles longer than 16 characters", () => {
    assert.equal(pickRequestSchema.safeParse({ role: "x".repeat(17) }).success, false);
  });
});

describe("withoutExcluded", () => {
  const rows = [
    { playerId: 1, name: "a" },
    { playerId: 2, name: "b" },
    { playerId: 3, name: "c" },
  ];

  it("returns all rows when excludeIds is empty", () => {
    assert.deepEqual(withoutExcluded(rows, []), rows);
  });

  it("drops already drawn playerIds", () => {
    assert.deepEqual(withoutExcluded(rows, [2]), [
      { playerId: 1, name: "a" },
      { playerId: 3, name: "c" },
    ]);
  });

  it("yields an empty pool when every id is excluded", () => {
    assert.deepEqual(withoutExcluded(rows, [1, 2, 3]), []);
  });
});

describe("remainingRoleCounts", () => {
  it("subtracts globally discarded players from overlapping roles", () => {
    const roles = [
      { role: "A", count: 2 },
      { role: "Pc", count: 2 },
    ];
    const remaining = remainingRoleCounts(roles, [
      ["A", "Pc"],
      ["Pc"],
    ]);
    assert.deepEqual(remaining, [
      { role: "A", count: 1 },
      { role: "Pc", count: 0 },
    ]);
    assert.equal(remainingForRole(roles, [["A", "Pc"], ["Pc"]], "Pc"), 0);
  });

  it("zeros roles marked exhausted even if local remaining is stale", () => {
    const roles = [
      { role: "A", count: 2 },
      { role: "Pc", count: 1 },
    ];
    assert.deepEqual(remainingRoleCounts(roles, [], ["A"]), [
      { role: "A", count: 0 },
      { role: "Pc", count: 1 },
    ]);
    assert.equal(remainingForRole(roles, [], "A", ["A"]), 0);
  });
});

describe("ROLE_EXHAUSTED_ERROR", () => {
  it("is Italian and explicit", () => {
    assert.match(ROLE_EXHAUSTED_ERROR, /Ruolo esaurito/);
  });
});

describe("remainingInDeck", () => {
  it("subtracts drawn players and never goes negative", () => {
    assert.equal(remainingInDeck(10, 3), 7);
    assert.equal(remainingInDeck(2, 2), 0);
    assert.equal(remainingInDeck(1, 4), 0);
  });
});

function testPlayer(playerId: number, mantraRoles: string[]): Player {
  return {
    playerId,
    name: `P${playerId}`,
    team: "Test",
    classicRole: "A",
    mantraRoles,
    quotationCurrent: 10,
    quotationInitial: 10,
    quotationDiff: 0,
    fvm: 100,
    imageUrl: `https://example.com/${playerId}.png`,
  };
}

describe("draw session", () => {
  it("treats the current player as the last drawn", () => {
    const first = testPlayer(1, ["A"]);
    const second = testPlayer(2, ["Pc"]);
    const session = appendDrawn(appendDrawn(emptyDrawSession("A"), first), second);
    assert.equal(sessionPlayer(session)?.playerId, 2);
    assert.equal(session.drawn.length, 2);
  });

  it("undo requires two draws and un-exhausts the removed player's roles", () => {
    const first = testPlayer(1, ["Pc"]);
    const second = testPlayer(2, ["A"]);
    const drawn = appendDrawn(appendDrawn(emptyDrawSession("A"), first), second);
    const exhausted = exhaustRole(drawn, "A");
    const undone = undoDrawn(exhausted);
    assert.deepEqual(undone.exhaustedRoles, []);
    assert.equal(sessionPlayer(undone)?.playerId, 1);
    const onlyFirst = appendDrawn(emptyDrawSession("A"), first);
    assert.equal(undoDrawn(onlyFirst), onlyFirst);
  });

  it("reset keeps the selected role", () => {
    const session = appendDrawn(emptyDrawSession("Pc"), testPlayer(1, ["Pc"]));
    assert.deepEqual(resetDrawn(session), emptyDrawSession("Pc"));
  });

  it("starts with no role selected", () => {
    assert.equal(emptyDrawSession().role, "");
  });

  it("loads a legacy persisted payload by keeping only the source of truth", () => {
    const player = testPlayer(1, ["A"]);
    const parsed = drawSessionSchema.parse({
      role: "A",
      drawCount: 3,
      drawn: [player],
      player,
      drawId: 3,
      exhaustedRoles: ["Pc"],
    });
    assert.deepEqual(parsed, {
      role: "A",
      drawn: [player],
      exhaustedRoles: ["Pc"],
    });
  });
});
