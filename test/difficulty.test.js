import test from "node:test";
import assert from "node:assert/strict";

import {
  DIFFICULTY_MODES,
  getDifficultyLabel,
  getDifficultySettings,
  getNextDifficultyMode,
  resolveDifficultyTier
} from "../src/modules/difficulty.js";

test("resolveDifficultyTier maps auto mode to stage-based tiers", () => {
  assert.equal(resolveDifficultyTier("auto", 0), "chill");
  assert.equal(resolveDifficultyTier("auto", 2), "party");
  assert.equal(resolveDifficultyTier("auto", 5), "legend");
});

test("getDifficultySettings returns expected pattern and meter scale", () => {
  const chill = getDifficultySettings("chill", 0);
  const legend = getDifficultySettings("legend", 0);

  assert.equal(chill.meterScale, 1);
  assert.equal(legend.meterScale, 0.65);
  assert.equal(chill.hazardRate < legend.hazardRate, true);
  assert.equal(Array.isArray(chill.tapPattern), true);
  assert.equal(chill.tapPattern.length > 0, true);
});

test("getNextDifficultyMode cycles through all modes", () => {
  let mode = DIFFICULTY_MODES[0];
  for (let i = 0; i < DIFFICULTY_MODES.length; i += 1) {
    mode = getNextDifficultyMode(mode);
  }
  assert.equal(mode, DIFFICULTY_MODES[0]);
});

test("getDifficultyLabel formats auto and manual labels", () => {
  assert.equal(getDifficultyLabel("party", 0), "PARTY");
  assert.equal(getDifficultyLabel("auto", 5), "AUTO:LEGEND");
});
