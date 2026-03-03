import test from "node:test";
import assert from "node:assert/strict";

import { getBeatDurationMs } from "../src/modules/disco-sfx.js";

test("music beat duration stays stable for rhythm alignment", () => {
  assert.equal(getBeatDurationMs(), 500);
});
