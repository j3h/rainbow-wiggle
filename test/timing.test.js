import test from "node:test";
import assert from "node:assert/strict";

import { GOOD_WINDOW_MS, PERFECT_WINDOW_MS, judgeTiming } from "../src/modules/timing.js";

test("judgeTiming returns perfect within perfect window", () => {
  assert.equal(PERFECT_WINDOW_MS, 90);
  assert.equal(judgeTiming(0), "perfect");
  assert.equal(judgeTiming(90), "perfect");
  assert.equal(judgeTiming(-90), "perfect");
});

test("judgeTiming returns good outside perfect but within good window", () => {
  assert.equal(GOOD_WINDOW_MS, 220);
  assert.equal(judgeTiming(140), "good");
  assert.equal(judgeTiming(-220), "good");
});

test("judgeTiming returns miss outside good window", () => {
  assert.equal(judgeTiming(221), "miss");
  assert.equal(judgeTiming(-999), "miss");
  assert.equal(judgeTiming(Number.NaN), "miss");
});
