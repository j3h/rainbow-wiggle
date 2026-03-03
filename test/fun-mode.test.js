import test from "node:test";
import assert from "node:assert/strict";

import { getEnergyLevel, getHypeText } from "../src/modules/fun-mode.js";

test("getEnergyLevel maps rainbow meter to stable bands", () => {
  assert.equal(getEnergyLevel(0), 0);
  assert.equal(getEnergyLevel(30), 1);
  assert.equal(getEnergyLevel(65), 2);
  assert.equal(getEnergyLevel(90), 3);
  assert.equal(getEnergyLevel(100), 4);
});

test("getHypeText escalates with rank and streak", () => {
  assert.equal(getHypeText("miss", 0), "Keep the wiggle going");
  assert.equal(getHypeText("good", 1), "NICE GROOVE!");
  assert.equal(getHypeText("good", 2), "GROOVE STREAK!");
  assert.equal(getHypeText("perfect", 1), "PERFECT COMBO!");
  assert.equal(getHypeText("perfect", 3), "RAINBOW FEVER!");
});
