import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ROLE_EXHAUSTED_ERROR,
  appendDrawn,
  drawPool,
  drawSessionSchema,
  emptyDrawSession,
  exhaustRole,
  lastDrawnId,
  lastDrawnMantraRoles,
  parsePlayerIds,
  pickRequestSchema,
  playersInDrawOrder,
  remainingInDeck,
  remainingRoleCounts,
  resetDrawn,
  uniquePlayerIds,
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
    const drawn = [{ mantraRoles: ["A", "Pc"] }, { mantraRoles: ["Pc"] }];
    const remaining = remainingRoleCounts(roles, drawn);
    assert.deepEqual(remaining, [
      { role: "A", count: 1 },
      { role: "Pc", count: 0 },
    ]);
    assert.equal(
      remainingRoleCounts(roles, drawn).find((item) => item.role === "Pc")?.count,
      0,
    );
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
    assert.equal(
      remainingRoleCounts(roles, [], ["A"]).find((item) => item.role === "A")
        ?.count,
      0,
    );
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

describe("drawPool", () => {
  it("uses remaining for a selected role and the deck when none is selected", () => {
    const stats = {
      playerCount: 2,
      roles: [
        { role: "A", count: 1 },
        { role: "Pc", count: 1 },
      ],
    };
    const drawn = { drawnCount: 1, drawnPlayers: [{ mantraRoles: ["A"] }], exhaustedRoles: [] };
    const withRole = drawPool(stats, { role: "A", ...drawn });
    assert.equal(withRole.remaining, 0);
    assert.equal(withRole.roleExhausted, true);
    assert.equal(withRole.poolEmpty, true);
    assert.equal(withRole.deckExhausted, false);
    const open = drawPool(stats, { role: "", ...drawn });
    assert.equal(open.remainingDeck, 1);
    assert.equal(open.roleExhausted, false);
    assert.equal(open.poolEmpty, false);
    assert.equal(open.deckExhausted, false);
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
    const session = appendDrawn(appendDrawn(emptyDrawSession("A"), 1), 2);
    assert.equal(lastDrawnId(session), 2);
    assert.deepEqual(session.drawn, [1, 2]);
    assert.equal(
      playersInDrawOrder([1, 2], {
        1: testPlayer(1, ["A"]),
        2: testPlayer(2, ["Pc"]),
      }).at(-1)?.playerId,
      2,
    );
  });

  it("undo requires two draws and un-exhausts the removed player's roles", () => {
    const drawn = appendDrawn(appendDrawn(emptyDrawSession("A"), 1), 2);
    const exhausted = exhaustRole(drawn, "A");
    const undone = undoDrawn(exhausted, ["A"]);
    assert.deepEqual(undone.exhaustedRoles, []);
    assert.equal(lastDrawnId(undone), 1);
    const onlyFirst = appendDrawn(emptyDrawSession("A"), 1);
    assert.equal(undoDrawn(onlyFirst), onlyFirst);
  });

  it("reset keeps the selected role", () => {
    const session = appendDrawn(emptyDrawSession("Pc"), 1);
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
      drawn: [1],
      exhaustedRoles: ["Pc"],
    });
  });

  it("accepts already-debloated player ids", () => {
    assert.deepEqual(
      drawSessionSchema.parse({ role: "", drawn: [4, 8], exhaustedRoles: [] }).drawn,
      [4, 8],
    );
  });

  it("looks up last-drawn mantra roles from the catalog", () => {
    const first = testPlayer(1, ["Pc"]);
    const second = testPlayer(2, ["A"]);
    const session = appendDrawn(appendDrawn(emptyDrawSession("A"), 1), 2);
    assert.deepEqual(lastDrawnMantraRoles(session, { 1: first, 2: second }), ["A"]);
    assert.deepEqual(
      playersInDrawOrder([2, 1], new Map([[1, first], [2, second]])).map(
        (player) => player.playerId,
      ),
      [2, 1],
    );
  });
});

describe("player ids", () => {
  it("parses comma-separated and repeated query values", () => {
    assert.deepEqual(parsePlayerIds("4, 8,nope,4"), [4, 8, 4]);
    assert.deepEqual(parsePlayerIds(["1", "2"]), [1, 2]);
    assert.deepEqual(parsePlayerIds(null), []);
    assert.deepEqual(uniquePlayerIds([8, 4, 8, 4]), [8, 4]);
  });
});
