import test from "node:test";
import assert from "node:assert/strict";

import { applyAction, createInitialState, sanitizeTitle } from "../src/modules/interaction-state.js";

test("createInitialState returns safe defaults", () => {
  assert.deepEqual(createInitialState(), {
    title: "Butt Wiggle: Rainbow Version",
    round: 1,
    score: 0,
    rainbowMeter: 0,
    lastZone: null
  });
});

test("APPLY_JUDGMENT does not mutate previous state", () => {
  const before = createInitialState();
  const after = applyAction(before, { type: "APPLY_JUDGMENT", zone: "good" });

  assert.equal(before.score, 0);
  assert.equal(before.rainbowMeter, 0);
  assert.equal(after.score, 2);
  assert.equal(after.rainbowMeter, 12);
  assert.equal(after.round, 2);
  assert.equal(after.lastZone, "good");
});

test("perfect increases meter and clamps at 100", () => {
  const before = createInitialState({ rainbowMeter: 95, score: 0 });
  const after = applyAction(before, { type: "APPLY_JUDGMENT", zone: "perfect" });

  assert.equal(after.rainbowMeter, 100);
  assert.equal(after.score, 3);
});

test("miss can reduce meter but never below zero", () => {
  const before = createInitialState({ rainbowMeter: 2 });
  const after = applyAction(before, { type: "APPLY_JUDGMENT", zone: "miss" });

  assert.equal(after.rainbowMeter, 0);
  assert.equal(after.score, 0);
});

test("sanitizeTitle trims and limits text", () => {
  const title = sanitizeTitle("   This    is a very long title for game night edition   ");
  assert.equal(title.startsWith("This is a very long title for game night"), true);
  assert.ok(title.length <= 40);
});
