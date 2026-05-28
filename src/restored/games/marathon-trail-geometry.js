export const RESTORED_MARATHON_TRAIL_GEOMETRY_VERSION = "restored-marathon-trail-geometry-002";

export const RESTORED_MARATHON_TRAIL_SAVE_POINTS = Object.freeze([
  Object.freeze({ index: 1, progressPercent: 28 }),
  Object.freeze({ index: 2, progressPercent: 58 }),
  Object.freeze({ index: 3, progressPercent: 88 })
]);

export function listRestoredMarathonTrailSavePoints() {
  return Object.freeze(RESTORED_MARATHON_TRAIL_SAVE_POINTS.map((savePoint) => {
    const point = progressToRestoredMarathonTrailPoint(savePoint.progressPercent);
    return Object.freeze({ ...savePoint, ...point, tick: createSavePointTick(point) });
  }));
}

export function createRestoredMarathonTrailSvgPath(steps = 92) {
  const count = Math.max(8, steps) + 1;
  const points = Array.from({ length: count }, (_, index) => (
    progressToRestoredMarathonTrailPoint((index / (count - 1)) * 100)
  ));
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${round2(point.x)} ${round2(point.y)}`).join(" ");
}

export function progressToRestoredMarathonTrailPoint(progressPercent = 0) {
  const t = clamp(Number(progressPercent) / 100, 0, 1);
  const x = 2 + 92 * (1 - Math.pow(1 - t, 3.1));
  const y = 88 - 84 * Math.pow(t, 5.2);
  const tangent = estimateTangent(t);
  const normal = normalizeVector({ x: -tangent.y, y: tangent.x });
  return Object.freeze({
    x: round2(x),
    y: round2(y),
    tangent: Object.freeze(tangent),
    normal: Object.freeze(normal)
  });
}

export function progressToRestoredMarathonMapPoint(progressPercent = 0, options = {}) {
  const point = progressToRestoredMarathonTrailPoint(progressPercent);
  const worldWidth = Math.max(1, Number(options.worldWidth) || 100);
  const worldHeight = Math.max(1, Number(options.worldHeight) || 100);
  const laneHalfWidthPx = Number.isFinite(Number(options.laneHalfWidthPx))
    ? Math.abs(Number(options.laneHalfWidthPx))
    : Infinity;
  const laneOffsetPx = clamp(Number(options.laneOffsetPx) || 0, -laneHalfWidthPx, laneHalfWidthPx);
  const minPercent = Number.isFinite(Number(options.minPercent)) ? Number(options.minPercent) : 0;
  const maxPercent = Number.isFinite(Number(options.maxPercent)) ? Number(options.maxPercent) : 100;
  return Object.freeze({
    x: round2(clamp(point.x + (point.normal.x * laneOffsetPx / worldWidth * 100), minPercent, maxPercent)),
    y: round2(clamp(point.y + (point.normal.y * laneOffsetPx / worldHeight * 100), minPercent, maxPercent)),
    tangent: point.tangent,
    normal: point.normal
  });
}

export function estimateRestoredMarathonTrailProgressFromPoint(x = 0, y = 0) {
  let best = { progressPercent: 0, distanceSq: Infinity };
  for (let progress = 0; progress <= 100; progress += 1) {
    const point = progressToRestoredMarathonTrailPoint(progress);
    const distanceSq = Math.pow(point.x - Number(x), 2) + Math.pow(point.y - Number(y), 2);
    if (distanceSq < best.distanceSq) best = { progressPercent: progress, distanceSq };
  }
  return best.progressPercent;
}

export function createRestoredMarathonTrailSaveCheckpointMeters(distanceMeters = 42195) {
  const distance = clamp(Number(distanceMeters), 100, 100000);
  return Object.freeze(RESTORED_MARATHON_TRAIL_SAVE_POINTS.map((savePoint) => Math.round(distance * savePoint.progressPercent / 100)));
}

export function validateRestoredMarathonTrailGeometryContract() {
  const errors = [];
  const savePoints = listRestoredMarathonTrailSavePoints();
  const path = createRestoredMarathonTrailSvgPath();
  if (savePoints.length !== 3) errors.push("trail must expose exactly three save points");
  if (!path.startsWith("M") || !path.includes("L")) errors.push("trail path must be SVG-ready");
  for (let index = 1; index < savePoints.length; index += 1) {
    if (savePoints[index].progressPercent <= savePoints[index - 1].progressPercent) errors.push("save points must be ordered");
  }
  const start = progressToRestoredMarathonTrailPoint(0);
  const finish = progressToRestoredMarathonTrailPoint(100);
  if (finish.x <= start.x || finish.y >= start.y) errors.push("trail must run from lower-left to upper-right");
  if (savePoints.at(-1).y > 45) errors.push("third save point should sit on the vertical climb");
  const mappedCenter = progressToRestoredMarathonMapPoint(58, { worldWidth: 7600, worldHeight: 2600, laneOffsetPx: 0, laneHalfWidthPx: 232, minPercent: 2, maxPercent: 98 });
  const mappedLane = progressToRestoredMarathonMapPoint(58, { worldWidth: 7600, worldHeight: 2600, laneOffsetPx: 232, laneHalfWidthPx: 232, minPercent: 2, maxPercent: 98 });
  if (mappedCenter.x === mappedLane.x && mappedCenter.y === mappedLane.y) errors.push("map point lane offset must affect marker placement");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function createSavePointTick(point) {
  const half = 3.8;
  return Object.freeze({
    x1: round2(point.x - point.normal.x * half),
    y1: round2(point.y - point.normal.y * half),
    x2: round2(point.x + point.normal.x * half),
    y2: round2(point.y + point.normal.y * half)
  });
}

function estimateTangent(t) {
  const delta = 0.004;
  const before = rawPoint(clamp(t - delta, 0, 1));
  const after = rawPoint(clamp(t + delta, 0, 1));
  return normalizeVector({ x: after.x - before.x, y: after.y - before.y });
}

function rawPoint(t) {
  return { x: 2 + 92 * (1 - Math.pow(1 - t, 3.1)), y: 88 - 84 * Math.pow(t, 5.2) };
}

function normalizeVector(vector) {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: round4(vector.x / length), y: round4(vector.y / length) };
}

function clamp(value, min, max) {
  const number = Number.isFinite(Number(value)) ? Number(value) : min;
  return Math.max(min, Math.min(max, number));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function round4(value) {
  return Math.round(value * 10000) / 10000;
}
