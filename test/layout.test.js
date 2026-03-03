import test from "node:test";
import assert from "node:assert/strict";

import {
  MIN_TOUCH_TARGET_PX,
  getLayoutMode,
  hasComfortableTouchTarget,
  isTabletViewport
} from "../src/modules/layout.js";

test("touch targets meet iPad web minimum", () => {
  assert.equal(MIN_TOUCH_TARGET_PX, 44);
  assert.equal(hasComfortableTouchTarget(44), true);
  assert.equal(hasComfortableTouchTarget(32), false);
});

test("tablet mode is selected for iPad-like viewport", () => {
  assert.equal(isTabletViewport(768, 1024), true);
  assert.equal(getLayoutMode(768, 1024), "tablet");
});

test("compact mode is selected for small phone viewport", () => {
  assert.equal(isTabletViewport(390, 844), false);
  assert.equal(getLayoutMode(390, 844), "compact");
});
