export const MIN_TOUCH_TARGET_PX = 44;
export const MIN_IPAD_WEB_VIEWPORT = 768;

export function hasComfortableTouchTarget(px) {
  return Number.isFinite(px) && px >= MIN_TOUCH_TARGET_PX;
}

export function isTabletViewport(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return false;
  }

  const shortestSide = Math.min(width, height);
  return shortestSide >= MIN_IPAD_WEB_VIEWPORT;
}

export function getLayoutMode(width, height) {
  return isTabletViewport(width, height) ? "tablet" : "compact";
}
