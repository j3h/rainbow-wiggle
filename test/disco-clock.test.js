import test from "node:test";
import assert from "node:assert/strict";

import { getBeatDurationMs, isMasterMuted, setMasterMuted, toggleMasterMuted } from "../src/modules/disco-sfx.js";

test("music beat duration stays stable for rhythm alignment", () => {
  assert.equal(getBeatDurationMs(), 500);
});

test("master mute toggles independently of loop state", () => {
  setMasterMuted(false);
  assert.equal(isMasterMuted(), false);

  toggleMasterMuted();
  assert.equal(isMasterMuted(), true);

  setMasterMuted(false);
  assert.equal(isMasterMuted(), false);
});
