import test from "node:test";
import assert from "node:assert/strict";

import {
  applyAction,
  createInitialState,
  getRainbowLevel,
  sanitizeTitle
} from "../src/modules/interaction-state.js";

test("createInitialState returns safe defaults", () => {
  assert.deepEqual(createInitialState(), {
    title: "Butt Wiggle: Rainbow Version",
    round: 1,
    score: 0,
    rainbowMeter: 0,
    rainbowLevel: "Tiny Rainbow",
    lastZone: null,
    ownedItems: []
  });
});

test("APPLY_JUDGMENT does not mutate previous state", () => {
  const before = createInitialState();
  const after = applyAction(before, { type: "APPLY_JUDGMENT", zone: "good" });

  assert.equal(before.score, 0);
  assert.equal(before.rainbowMeter, 0);
  assert.equal(after.score, 2);
  assert.equal(after.rainbowMeter, 12);
  assert.equal(after.rainbowLevel, "Tiny Rainbow");
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

test("APPLY_COMBO adds base and bonus points for full perfect combo", () => {
  const before = createInitialState();
  const after = applyAction(before, { type: "APPLY_COMBO", zones: ["perfect", "perfect", "perfect"] });

  assert.equal(after.score, 17);
  assert.equal(after.rainbowMeter, 76);
  assert.equal(after.rainbowLevel, "Mega Rainbow");
  assert.equal(after.lastZone, "perfect");
  assert.equal(after.round, 2);
});

test("APPLY_COMBO clamps low meter for all-miss combo", () => {
  const before = createInitialState({ rainbowMeter: 5 });
  const after = applyAction(before, { type: "APPLY_COMBO", zones: ["miss", "miss", "miss"] });

  assert.equal(after.rainbowMeter, 0);
  assert.equal(after.score, 0);
  assert.equal(after.lastZone, "miss");
});

test("BUY_ITEM spends score and records ownership once", () => {
  const before = createInitialState({ score: 20, ownedItems: [] });
  const after = applyAction(before, { type: "BUY_ITEM", itemId: "neon-collar", cost: 10 });
  const duplicate = applyAction(after, { type: "BUY_ITEM", itemId: "neon-collar", cost: 10 });

  assert.equal(after.score, 10);
  assert.deepEqual(after.ownedItems, ["neon-collar"]);
  assert.equal(duplicate.score, 10);
  assert.deepEqual(duplicate.ownedItems, ["neon-collar"]);
});

test("getRainbowLevel maps thresholds", () => {
  assert.equal(getRainbowLevel(0), "Tiny Rainbow");
  assert.equal(getRainbowLevel(25), "Shimmer Rainbow");
  assert.equal(getRainbowLevel(50), "Vibrant Rainbow");
  assert.equal(getRainbowLevel(75), "Mega Rainbow");
  assert.equal(getRainbowLevel(100), "Cosmic Rainbow");
});
