import test from "node:test";
import assert from "node:assert/strict";

import { applyAction, createInitialState, RAINBOW_LEVELS, sanitizeTitle } from "../src/modules/interaction-state.js";

test("createInitialState returns safe defaults", () => {
  assert.deepEqual(createInitialState(), {
    title: "Butt Wiggle: Rainbow Version",
    round: 1,
    score: 0,
    rainbowStageIndex: 0,
    rainbowMeter: 0,
    hasWon: false,
    lastZone: null,
    ownedItems: [],
    enabledItems: []
  });
});

test("APPLY_JUDGMENT increments score and meter immutably", () => {
  const before = createInitialState();
  const after = applyAction(before, { type: "APPLY_JUDGMENT", zone: "good" });

  assert.equal(before.score, 0);
  assert.equal(before.rainbowMeter, 0);
  assert.equal(after.score, 2);
  assert.equal(after.rainbowMeter, 8);
  assert.equal(after.round, 2);
  assert.equal(after.lastZone, "good");
});

test("rainbow progression advances through ordered levels and wins at Red", () => {
  let state = createInitialState({ rainbowStageIndex: RAINBOW_LEVELS.length - 2, rainbowMeter: 90 });
  state = applyAction(state, { type: "APPLY_JUDGMENT", zone: "perfect" });

  assert.equal(state.rainbowStageIndex, RAINBOW_LEVELS.length - 1);
  assert.equal(state.rainbowMeter, 3);
  assert.equal(state.hasWon, false);

  state = createInitialState({ rainbowStageIndex: RAINBOW_LEVELS.length - 1, rainbowMeter: 96 });
  state = applyAction(state, { type: "APPLY_JUDGMENT", zone: "perfect" });

  assert.equal(state.rainbowStageIndex, RAINBOW_LEVELS.length - 1);
  assert.equal(state.rainbowMeter, 100);
  assert.equal(state.hasWon, true);
});

test("BUY_ITEM spends score and records ownership once", () => {
  const before = createInitialState({ score: 20, ownedItems: [] });
  const after = applyAction(before, { type: "BUY_ITEM", itemId: "neon-collar", cost: 10 });
  const duplicate = applyAction(after, { type: "BUY_ITEM", itemId: "neon-collar", cost: 10 });

  assert.equal(after.score, 10);
  assert.deepEqual(after.ownedItems, ["neon-collar"]);
   assert.deepEqual(after.enabledItems, ["neon-collar"]);
  assert.equal(duplicate.score, 10);
  assert.deepEqual(duplicate.ownedItems, ["neon-collar"]);
  assert.deepEqual(duplicate.enabledItems, ["neon-collar"]);
});

test("sanitizeTitle trims and limits text", () => {
  const title = sanitizeTitle("   This    is a very long title for game night edition   ");
  assert.equal(title.startsWith("This is a very long title for game night"), true);
  assert.ok(title.length <= 40);
});

test("BUY_ITEM does nothing when score is insufficient", () => {
  const before = createInitialState({ score: 4, ownedItems: [] });
  const after = applyAction(before, { type: "BUY_ITEM", itemId: "party-lasers", cost: 36 });

  assert.equal(after.score, 4);
  assert.deepEqual(after.ownedItems, []);
  assert.deepEqual(after.enabledItems, []);
});

test("BUY_ITEM can unlock disco-ball when affordable", () => {
  const before = createInitialState({ score: 50, ownedItems: [] });
  const after = applyAction(before, { type: "BUY_ITEM", itemId: "disco-ball", cost: 44 });

  assert.equal(after.score, 6);
  assert.deepEqual(after.ownedItems, ["disco-ball"]);
  assert.deepEqual(after.enabledItems, ["disco-ball"]);
});

test("TOGGLE_ITEM turns owned effects off and on", () => {
  const before = createInitialState({ ownedItems: ["party-lasers"], enabledItems: ["party-lasers"] });
  const off = applyAction(before, { type: "TOGGLE_ITEM", itemId: "party-lasers" });
  const on = applyAction(off, { type: "TOGGLE_ITEM", itemId: "party-lasers" });

  assert.deepEqual(off.ownedItems, ["party-lasers"]);
  assert.deepEqual(off.enabledItems, []);
  assert.deepEqual(on.enabledItems, ["party-lasers"]);
});
