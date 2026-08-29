import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DRAW_COOLDOWN_MS,
  ROLE_EXHAUSTED_ERROR,
  emptyRoomState,
  isRoomCode,
  normalizeRoomCode,
  remainingMs,
  roomCommandSchema,
  roomStateSchema,
  type Player,
} from "@fantapicker/shared";
import { applyRoomCommand } from "./apply-command.ts";
import {
  bearerToken,
  createHostToken,
  generateRoomCode,
  hashHostToken,
  hostTokenMatches,
} from "./token.ts";

function testPlayer(playerId: number): Player {
  return {
    playerId,
    name: `P${playerId}`,
    team: "Test",
    classicRole: "A",
    mantraRoles: ["A"],
    quotationCurrent: 10,
    quotationInitial: 10,
    quotationDiff: 0,
    fvm: 100,
    imageUrl: `https://example.com/${playerId}.png`,
  };
}

describe("room code", () => {
  it("normalizes case and strips separators", () => {
    assert.equal(normalizeRoomCode("ab-c 12"), "ABC12");
  });

  it("accepts generated codes", () => {
    const code = generateRoomCode();
    assert.equal(code.length, 5);
    assert.equal(isRoomCode(code), true);
    assert.equal(isRoomCode("IOIOI"), false);
  });
});

describe("remainingMs", () => {
  it("prefers pausedMs and never goes negative", () => {
    assert.equal(remainingMs(1000, 400, 0), 400);
    assert.equal(remainingMs(1500, null, 1000), 500);
    assert.equal(remainingMs(500, null, 800), 0);
    assert.equal(remainingMs(null, null, 1), 0);
  });
});

describe("roomStateSchema", () => {
  it("parses legacy drawn player objects as ids", () => {
    const parsed = roomStateSchema.parse({
      role: "A",
      drawn: [testPlayer(7)],
      exhaustedRoles: [],
      paused: false,
      cooldownEndsAt: null,
      pausedMs: null,
    });
    assert.deepEqual(parsed.drawn, [7]);
  });
});

describe("roomCommandSchema", () => {
  it("accepts host commands and rejects unknown types", () => {
    assert.equal(roomCommandSchema.parse({ type: "draw" }).type, "draw");
    assert.equal(
      roomCommandSchema.parse({ type: "setRole", role: "Por" }).type,
      "setRole",
    );
    assert.equal(roomCommandSchema.safeParse({ type: "skip" }).success, false);
  });
});

describe("host token", () => {
  it("matches only the original token", () => {
    const token = createHostToken();
    const hash = hashHostToken(token);
    assert.equal(hostTokenMatches(token, hash), true);
    assert.equal(hostTokenMatches("nope", hash), false);
    assert.equal(bearerToken("Bearer abc"), "abc");
    assert.equal(bearerToken("Basic abc"), "");
  });
});

describe("applyRoomCommand", () => {
  const player = testPlayer(1);

  it("draws, pauses, resumes, then undoes", async () => {
    const drawn = await applyRoomCommand(
      emptyRoomState("A"),
      { type: "draw" },
      1000,
      async () => ({ ok: true, player }),
    );
    assert.equal(drawn.ok, true);
    if (!drawn.ok) return;
    assert.equal(drawn.state.drawn[0], 1);
    assert.equal(drawn.state.cooldownEndsAt, 1000 + DRAW_COOLDOWN_MS);

    const paused = await applyRoomCommand(
      drawn.state,
      { type: "pause" },
      2000,
      async () => ({ ok: true, player }),
    );
    assert.equal(paused.ok, true);
    if (!paused.ok) return;
    assert.equal(paused.state.paused, true);
    assert.equal(paused.state.pausedMs, 1000 + DRAW_COOLDOWN_MS - 2000);

    const resumed = await applyRoomCommand(
      paused.state,
      { type: "resume" },
      3000,
      async () => ({ ok: true, player }),
    );
    assert.equal(resumed.ok, true);
    if (!resumed.ok) return;
    assert.equal(resumed.state.paused, false);
    assert.equal(resumed.state.cooldownEndsAt, 3000 + (paused.state.pausedMs ?? 0));

    const second = testPlayer(2);
    const twice = await applyRoomCommand(
      { ...resumed.state, cooldownEndsAt: null, pausedMs: null },
      { type: "draw" },
      4000,
      async () => ({ ok: true, player: second }),
    );
    assert.equal(twice.ok, true);
    if (!twice.ok) return;
    const undone = await applyRoomCommand(
      twice.state,
      { type: "undo" },
      5000,
      async () => ({ ok: true, player }),
    );
    assert.equal(undone.ok, true);
    if (!undone.ok) return;
    assert.equal(undone.state.drawn.length, 1);
  });

  it("marks the role exhausted without throwing", async () => {
    const result = await applyRoomCommand(
      emptyRoomState("A"),
      { type: "draw" },
      0,
      async () => ({ ok: false, status: 409, error: ROLE_EXHAUSTED_ERROR }),
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.state.exhaustedRoles, ["A"]);
  });

  it("undo un-exhausts the last player's roles", async () => {
    const twice = {
      ...emptyRoomState("A"),
      drawn: [1, 2],
      exhaustedRoles: ["A"],
    };
    const undone = await applyRoomCommand(
      twice,
      { type: "undo" },
      0,
      async () => ({ ok: true, player: testPlayer(3) }),
      async (id) => (id === 2 ? ["A"] : []),
    );
    assert.equal(undone.ok, true);
    if (!undone.ok) return;
    assert.deepEqual(undone.state.drawn, [1]);
    assert.deepEqual(undone.state.exhaustedRoles, []);
  });
});
