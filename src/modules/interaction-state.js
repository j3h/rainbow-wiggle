const DEFAULT_TITLE = "Butt Wiggle: Rainbow Version";
export const RAINBOW_LEVELS = ["Violet", "Indigo", "Blue", "Green", "Yellow", "Orange", "Red"];
const LAST_LEVEL_INDEX = RAINBOW_LEVELS.length - 1;

const ZONE_EFFECTS = {
  miss: { score: 0, meter: -6 },
  good: { score: 2, meter: 16 },
  perfect: { score: 3, meter: 24 }
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function applyRainbowDelta(state, meterDelta) {
  if (state.hasWon) {
    return {
      rainbowStageIndex: state.rainbowStageIndex,
      rainbowMeter: state.rainbowMeter,
      hasWon: true
    };
  }

  let stage = state.rainbowStageIndex;
  let meter = state.rainbowMeter + meterDelta;

  while (meter >= 100 && stage < LAST_LEVEL_INDEX) {
    meter -= 100;
    stage += 1;
  }

  if (stage === LAST_LEVEL_INDEX) {
    meter = clamp(meter, 0, 100);
    const hasWon = meter >= 100;
    return { rainbowStageIndex: stage, rainbowMeter: meter, hasWon };
  }

  meter = clamp(meter, 0, 99);
  return { rainbowStageIndex: stage, rainbowMeter: meter, hasWon: false };
}

export function sanitizeTitle(value) {
  if (typeof value !== "string") {
    return DEFAULT_TITLE;
  }

  const cleaned = value.trim().replace(/\s+/g, " ");
  if (cleaned.length === 0) {
    return DEFAULT_TITLE;
  }

  return cleaned.slice(0, 40);
}

export function createInitialState(overrides = {}) {
  const rainbowStageIndex = Number.isInteger(overrides.rainbowStageIndex)
    ? clamp(overrides.rainbowStageIndex, 0, LAST_LEVEL_INDEX)
    : 0;
  const rainbowMeter = Number.isInteger(overrides.rainbowMeter) ? clamp(overrides.rainbowMeter, 0, 100) : 0;
  const hasWon = Boolean(overrides.hasWon) || (rainbowStageIndex === LAST_LEVEL_INDEX && rainbowMeter >= 100);

  return {
    title: sanitizeTitle(overrides.title ?? DEFAULT_TITLE),
    round: Number.isInteger(overrides.round) && overrides.round > 0 ? overrides.round : 1,
    score: Number.isInteger(overrides.score) && overrides.score >= 0 ? overrides.score : 0,
    rainbowStageIndex,
    rainbowMeter,
    hasWon,
    lastZone: ["miss", "good", "perfect"].includes(overrides.lastZone) ? overrides.lastZone : null,
    ownedItems: Array.isArray(overrides.ownedItems)
      ? overrides.ownedItems.filter((item) => typeof item === "string")
      : []
  };
}

export function applyAction(state, action) {
  if (!state || typeof state !== "object") {
    throw new Error("state must be an object");
  }

  if (!action || typeof action !== "object") {
    throw new Error("action must be an object");
  }

  switch (action.type) {
    case "APPLY_JUDGMENT": {
      const zone = ["miss", "good", "perfect"].includes(action.zone) ? action.zone : "miss";
      const nextScore = state.score + ZONE_EFFECTS[zone].score;
      const rainbow = applyRainbowDelta(state, ZONE_EFFECTS[zone].meter);

      return {
        ...state,
        round: state.round + 1,
        score: nextScore,
        rainbowStageIndex: rainbow.rainbowStageIndex,
        rainbowMeter: rainbow.rainbowMeter,
        hasWon: rainbow.hasWon,
        lastZone: zone
      };
    }
    case "APPLY_COMBO": {
      const zones = Array.isArray(action.zones) ? action.zones : [];
      const safeZones = zones
        .map((zone) => (["miss", "good", "perfect"].includes(zone) ? zone : "miss"))
        .slice(0, 8);
      if (safeZones.length === 0) {
        return state;
      }

      const base = safeZones.reduce(
        (acc, zone) => ({
          score: acc.score + ZONE_EFFECTS[zone].score,
          meter: acc.meter + ZONE_EFFECTS[zone].meter
        }),
        { score: 0, meter: 0 }
      );

      let bonusScore = 0;
      let bonusMeter = 0;
      let comboRank = "miss";

      if (safeZones.length === 1) {
        comboRank = safeZones[0];
      } else {
        const perfectCount = safeZones.filter((zone) => zone === "perfect").length;
        const goodCount = safeZones.filter((zone) => zone === "good").length;
        const missCount = safeZones.length - perfectCount - goodCount;

        if (perfectCount === safeZones.length) {
          bonusScore = 8;
          bonusMeter = 16;
          comboRank = "perfect";
        } else if (perfectCount >= 2) {
          bonusScore = 4;
          bonusMeter = 10;
          comboRank = "good";
        } else if (goodCount >= 2) {
          bonusScore = 2;
          bonusMeter = 6;
          comboRank = "good";
        } else if (missCount === safeZones.length) {
          bonusMeter = -8;
          comboRank = "miss";
        } else {
          comboRank = goodCount > 0 || perfectCount > 0 ? "good" : "miss";
        }
      }

      const rainbow = applyRainbowDelta(state, base.meter + bonusMeter);
      return {
        ...state,
        round: state.round + 1,
        score: state.score + base.score + bonusScore,
        rainbowStageIndex: rainbow.rainbowStageIndex,
        rainbowMeter: rainbow.rainbowMeter,
        hasWon: rainbow.hasWon,
        lastZone: comboRank
      };
    }
    case "BUY_ITEM": {
      const itemId = typeof action.itemId === "string" ? action.itemId : "";
      const cost = Number.isInteger(action.cost) && action.cost > 0 ? action.cost : 0;
      if (!itemId || cost <= 0 || state.score < cost || state.ownedItems.includes(itemId)) {
        return state;
      }

      return {
        ...state,
        score: state.score - cost,
        ownedItems: [...state.ownedItems, itemId]
      };
    }
    case "SET_TITLE":
      return { ...state, title: sanitizeTitle(action.title) };
    default:
      return state;
  }
}
