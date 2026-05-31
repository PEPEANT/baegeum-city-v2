import { sampleSmoothTrailPoints } from "./marathon-trail-smoothing.js";

export const RESTORED_MARATHON_TRAIL_GEOMETRY_VERSION = "restored-marathon-trail-geometry-008";

export const RESTORED_MARATHON_TRAIL_SAVE_POINTS = Object.freeze([
  Object.freeze({ index: 1, progressPercent: 28 }),
  Object.freeze({ index: 2, progressPercent: 58 }),
  Object.freeze({ index: 3, progressPercent: 88 })
]);

const RESTORED_MARATHON_TRAIL_CONTROL_POINTS = Object.freeze([
  point(6, 88),
  point(88, 88),
  point(96, 80),
  point(96, 72),
  point(18, 72),
  point(8, 64),
  point(8, 56),
  point(74, 56),
  point(88, 48),
  point(88, 40),
  point(24, 40),
  point(14, 32),
  point(14, 24),
  point(92, 24),
  point(96, 14),
  point(98, 10)
]);

const RESTORED_MARATHON_TRAIL_POINTS = Object.freeze(sampleSmoothTrailPoints(RESTORED_MARATHON_TRAIL_CONTROL_POINTS, 8));

const RESTORED_MARATHON_TRAIL = buildTrail(RESTORED_MARATHON_TRAIL_POINTS);
const TANGENT_SAMPLE_DISTANCE = RESTORED_MARATHON_TRAIL.totalLength * 0.004;

export function listRestoredMarathonTrailSavePoints() {
  return Object.freeze(RESTORED_MARATHON_TRAIL_SAVE_POINTS.map((savePoint) => {
    const point = progressToRestoredMarathonTrailPoint(savePoint.progressPercent);
    return Object.freeze({ ...savePoint, ...point, tick: createSavePointTick(point) });
  }));
}

export function createRestoredMarathonTrailSvgPath(steps = 92) {
  const count = Math.max(36, steps) + 1;
  const points = Array.from({ length: count }, (_, index) => (
    progressToRestoredMarathonTrailPoint((index / (count - 1)) * 100)
  ));
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${round2(point.x)} ${round2(point.y)}`).join(" ");
}

export function createRestoredMarathonTrailWallSvgPaths(steps = 92, options = {}) {
  const offsetPx = Math.max(80, Math.min(420, Number(options.offsetPx) || 286));
  return Object.freeze({
    left: createRestoredMarathonTrailOffsetSvgPath(offsetPx, steps),
    right: createRestoredMarathonTrailOffsetSvgPath(-offsetPx, steps)
  });
}

export const RESTORED_MARATHON_WORLD_WIDTH = 4600;
export const RESTORED_MARATHON_WORLD_HEIGHT = 3600;

export function calculateRestoredMarathonSpeedScale(tangent) {
  const t = tangent || { x: 1, y: 0 };
  const pixelLengthFactor = Math.hypot(t.x * RESTORED_MARATHON_WORLD_WIDTH, t.y * RESTORED_MARATHON_WORLD_HEIGHT);
  return pixelLengthFactor > 0 ? (RESTORED_MARATHON_WORLD_WIDTH / pixelLengthFactor) : 1;
}

export function progressToRestoredMarathonTrailPoint(progressPercent = 0) {
  const targetDistance = RESTORED_MARATHON_TRAIL.totalLength * clamp(Number(progressPercent) / 100, 0, 1);
  const point = interpolateTrailPointAtDistance(targetDistance);
  const before = interpolateTrailPointAtDistance(targetDistance - TANGENT_SAMPLE_DISTANCE);
  const after = interpolateTrailPointAtDistance(targetDistance + TANGENT_SAMPLE_DISTANCE);
  const tangent = normalizeVector({
    x: after.x - before.x,
    y: after.y - before.y
  });
  const normal = normalizeVector({ x: -tangent.y, y: tangent.x });
  return Object.freeze({
    x: round4(point.x),
    y: round4(point.y),
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
  const wallPaths = createRestoredMarathonTrailWallSvgPaths();
  if (RESTORED_MARATHON_TRAIL.totalLength < 430) errors.push("song-length maze race trail should stay long enough for a full run");
  if (maxTrailTurnDeltaDegrees() > 28) errors.push("race trail should not contain hard right-angle direction snaps");
  for (let index = 1; index < savePoints.length; index += 1) {
    if (savePoints[index].progressPercent <= savePoints[index - 1].progressPercent) errors.push("save points must be ordered");
  }
  const start = progressToRestoredMarathonTrailPoint(0);
  const finish = progressToRestoredMarathonTrailPoint(100);
  if (finish.x <= start.x || finish.y >= start.y) errors.push("trail must run from lower-left to upper-right");
  if (!wallPaths.left.startsWith("M") || !wallPaths.right.startsWith("M")) errors.push("trail wall paths must be SVG-ready");
  const mappedCenter = progressToRestoredMarathonMapPoint(58, { worldWidth: 7600, worldHeight: 2600, laneOffsetPx: 0, laneHalfWidthPx: 232, minPercent: 2, maxPercent: 98 });
  const mappedLane = progressToRestoredMarathonMapPoint(58, { worldWidth: 7600, worldHeight: 2600, laneOffsetPx: 232, laneHalfWidthPx: 232, minPercent: 2, maxPercent: 98 });
  if (mappedCenter.x === mappedLane.x && mappedCenter.y === mappedLane.y) errors.push("map point lane offset must affect marker placement");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function createRestoredMarathonTrailOffsetSvgPath(offsetPx, steps = 92) {
  const count = Math.max(36, steps) + 1;
  const points = Array.from({ length: count }, (_, index) => {
    const point = progressToRestoredMarathonTrailPoint((index / (count - 1)) * 100);
    return offsetTrailPoint(point, offsetPx);
  });
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${round2(point.x)} ${round2(point.y)}`).join(" ");
}

function offsetTrailPoint(point, offsetPx) {
  return Object.freeze({
    x: round2(clamp(point.x + (point.normal.x * offsetPx / RESTORED_MARATHON_WORLD_WIDTH * 100), 0, 100)),
    y: round2(clamp(point.y + (point.normal.y * offsetPx / RESTORED_MARATHON_WORLD_HEIGHT * 100), 0, 100))
  });
}

function maxTrailTurnDeltaDegrees() {
  let max = 0;
  let previous = trailAngleAt(0);
  for (let progress = 0.1; progress <= 100; progress += 0.1) {
    const next = trailAngleAt(progress);
    max = Math.max(max, Math.abs(radiansToDegrees(normalizeAngle(next - previous))));
    previous = next;
  }
  return max;
}

function trailAngleAt(progress) {
  const point = progressToRestoredMarathonTrailPoint(progress);
  return Math.atan2(point.tangent.y * RESTORED_MARATHON_WORLD_HEIGHT, point.tangent.x * RESTORED_MARATHON_WORLD_WIDTH);
}

function normalizeAngle(angle) {
  let value = angle;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}

function radiansToDegrees(radians) {
  return radians * 180 / Math.PI;
}

function buildTrail(points) {
  const segments = [];
  let totalLength = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    segments.push(Object.freeze({ start, end, length, startDistance: totalLength }));
    totalLength += length;
  }
  return Object.freeze({ points, segments: Object.freeze(segments), totalLength });
}

function findTrailSegment(distance) {
  const clamped = clamp(distance, 0, RESTORED_MARATHON_TRAIL.totalLength);
  for (const segment of RESTORED_MARATHON_TRAIL.segments) {
    if (clamped <= segment.startDistance + segment.length) return segment;
  }
  return RESTORED_MARATHON_TRAIL.segments.at(-1);
}

function interpolateTrailPointAtDistance(distance) {
  const segment = findTrailSegment(distance);
  const clamped = clamp(distance, 0, RESTORED_MARATHON_TRAIL.totalLength);
  const localDistance = clamped - segment.startDistance;
  const ratio = segment.length <= 0 ? 0 : clamp(localDistance / segment.length, 0, 1);
  return Object.freeze({
    x: segment.start.x + ((segment.end.x - segment.start.x) * ratio),
    y: segment.start.y + ((segment.end.y - segment.start.y) * ratio)
  });
}

function createSavePointTick(point) {
  const half = 3.8;
  return Object.freeze({ x1: round2(point.x - point.normal.x * half), y1: round2(point.y - point.normal.y * half), x2: round2(point.x + point.normal.x * half), y2: round2(point.y + point.normal.y * half) });
}

function normalizeVector(vector) {
  const length = Math.hypot(vector.x, vector.y) || 1;
  return { x: round4(vector.x / length), y: round4(vector.y / length) };
}

function point(x, y) {
  return Object.freeze({ x, y });
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
