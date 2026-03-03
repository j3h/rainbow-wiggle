const DEFAULT_TITLE = "Butt Wiggle: Rainbow Version";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  return {
    title: sanitizeTitle(overrides.title ?? DEFAULT_TITLE),
    round: Number.isInteger(overrides.round) && overrides.round > 0 ? overrides.round : 1,
    score: Number.isInteger(overrides.score) && overrides.score >= 0 ? overrides.score : 0,
    rainbowMeter: Number.isInteger(overrides.rainbowMeter)
      ? clamp(overrides.rainbowMeter, 0, 100)
      : 0,
    lastZone: ["miss", "good", "perfect"].includes(overrides.lastZone) ? overrides.lastZone : null
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
      const effects = {
        miss: { score: 0, meter: -4 },
        good: { score: 2, meter: 12 },
        perfect: { score: 3, meter: 20 }
      };

      const nextScore = state.score + effects[zone].score;
      const nextMeter = clamp(state.rainbowMeter + effects[zone].meter, 0, 100);

      return {
        ...state,
        round: state.round + 1,
        score: nextScore,
        rainbowMeter: nextMeter,
        lastZone: zone
      };
    }
    case "SET_TITLE":
      return { ...state, title: sanitizeTitle(action.title) };
    default:
      return state;
  }
}
