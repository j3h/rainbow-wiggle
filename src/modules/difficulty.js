const PATTERNS = {
  chill: [3, 2, 3, 2, 2, 3],
  party: [2, 2, 1, 2, 1, 2, 3, 1],
  legend: [1, 2, 1, 1, 2, 1, 3, 1, 2]
};

const METER_SCALES = {
  chill: 1,
  party: 0.8,
  legend: 0.65
};

export const DIFFICULTY_MODES = ["auto", "chill", "party", "legend"];

export function resolveDifficultyTier(mode, rainbowStageIndex) {
  if (mode === "chill" || mode === "party" || mode === "legend") {
    return mode;
  }

  const stage = Number.isInteger(rainbowStageIndex) ? rainbowStageIndex : 0;
  if (stage >= 4) {
    return "legend";
  }
  if (stage >= 2) {
    return "party";
  }
  return "chill";
}

export function getDifficultySettings(mode, rainbowStageIndex) {
  const tier = resolveDifficultyTier(mode, rainbowStageIndex);
  return {
    tier,
    tapPattern: PATTERNS[tier],
    meterScale: METER_SCALES[tier]
  };
}

export function getDifficultyLabel(mode, rainbowStageIndex) {
  if (mode !== "auto") {
    return mode.toUpperCase();
  }
  const tier = resolveDifficultyTier(mode, rainbowStageIndex);
  return `AUTO:${tier.toUpperCase()}`;
}

export function getNextDifficultyMode(currentMode) {
  const index = DIFFICULTY_MODES.indexOf(currentMode);
  if (index === -1) {
    return DIFFICULTY_MODES[0];
  }
  return DIFFICULTY_MODES[(index + 1) % DIFFICULTY_MODES.length];
}
