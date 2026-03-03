export const PERFECT_WINDOW_MS = 90;
export const GOOD_WINDOW_MS = 220;

export function judgeTiming(deltaMs) {
  if (!Number.isFinite(deltaMs)) {
    return "miss";
  }

  const distance = Math.abs(deltaMs);

  if (distance <= PERFECT_WINDOW_MS) {
    return "perfect";
  }

  if (distance <= GOOD_WINDOW_MS) {
    return "good";
  }

  return "miss";
}
