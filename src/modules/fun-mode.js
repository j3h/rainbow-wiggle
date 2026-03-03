export function getEnergyLevel(rainbowMeter) {
  if (!Number.isFinite(rainbowMeter) || rainbowMeter <= 0) {
    return 0;
  }
  if (rainbowMeter >= 100) {
    return 4;
  }
  if (rainbowMeter >= 75) {
    return 3;
  }
  if (rainbowMeter >= 50) {
    return 2;
  }
  if (rainbowMeter >= 25) {
    return 1;
  }
  return 0;
}

export function getHypeText(comboRank, comboStreak) {
  if (comboRank === "perfect" && comboStreak >= 3) {
    return "RAINBOW FEVER!";
  }
  if (comboRank === "perfect") {
    return "PERFECT COMBO!";
  }
  if (comboRank === "good") {
    return comboStreak >= 2 ? "GROOVE STREAK!" : "NICE GROOVE!";
  }
  return "Keep the wiggle going";
}
