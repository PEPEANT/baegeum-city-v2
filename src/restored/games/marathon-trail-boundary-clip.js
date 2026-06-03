import { createMarathonTrailWallVisibilityPoints } from "./marathon-trail-wall-clip.js";

export const RESTORED_MARATHON_TRAIL_BOUNDARY_CLIP_VERSION = "restored-marathon-trail-boundary-clip-001";

const DEFAULT_WALL_OFFSET_PX = 286;
const DEFAULT_VISIBILITY_STEPS = 92;
const boundaryClipCache = new Map();

export function isRestoredMarathonTrailLaneBoundaryClippedWith(progressPercent = 0, boundarySide = "none", options = {}) {
  const points = getBoundaryVisibilityPoints(boundarySide, options);
  if (!points.length) return false;
  return Boolean(closestWallVisibilityPoint(progressPercent, points)?.hidden);
}

function getBoundaryVisibilityPoints(boundarySide, options) {
  const mapId = String(options.mapId || "default");
  const offsetPx = laneBoundarySideToWallOffsetPx(boundarySide, options.offsetPx);
  if (!offsetPx || typeof options.progressToPoint !== "function") return Object.freeze([]);
  const worldWidth = Math.max(1, Number(options.worldWidth) || 100);
  const worldHeight = Math.max(1, Number(options.worldHeight) || 100);
  const key = `${mapId}:${offsetPx}:${worldWidth}:${worldHeight}`;
  if (boundaryClipCache.has(key)) return boundaryClipCache.get(key);
  const count = Math.max(36, Number(options.steps) || DEFAULT_VISIBILITY_STEPS) + 1;
  const points = Array.from({ length: count }, (_, index) => {
    const progress = (index / (count - 1)) * 100;
    return Object.freeze({
      ...offsetTrailPoint(options.progressToPoint(progress), offsetPx, worldWidth, worldHeight),
      progress
    });
  });
  const visibilityPoints = createMarathonTrailWallVisibilityPoints(points, {
    mapId,
    progressToPoint: options.progressToPoint,
    worldWidth,
    worldHeight,
    round: round2
  });
  boundaryClipCache.set(key, visibilityPoints);
  return visibilityPoints;
}

function laneBoundarySideToWallOffsetPx(boundarySide, offsetInput) {
  const offsetPx = Math.max(80, Math.min(420, Number(offsetInput) || DEFAULT_WALL_OFFSET_PX));
  if (boundarySide === "left") return -offsetPx;
  if (boundarySide === "right") return offsetPx;
  return 0;
}

function offsetTrailPoint(point, offsetPx, worldWidth, worldHeight) {
  return Object.freeze({
    x: round2(clamp(point.x + (point.normal.x * offsetPx / worldWidth * 100), 0, 100)),
    y: round2(clamp(point.y + (point.normal.y * offsetPx / worldHeight * 100), 0, 100))
  });
}

function closestWallVisibilityPoint(progressPercent, points) {
  const progress = clamp(Number(progressPercent), 0, 100);
  return points.reduce((closest, point) => (
    Math.abs(point.progress - progress) < Math.abs(closest.progress - progress) ? point : closest
  ), points[0]);
}

function clamp(value, min, max) {
  const number = Number.isFinite(Number(value)) ? Number(value) : min;
  return Math.max(min, Math.min(max, number));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}
