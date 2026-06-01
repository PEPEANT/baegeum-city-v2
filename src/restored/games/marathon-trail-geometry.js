import { sampleSmoothTrailPoints } from "./marathon-trail-smoothing.js";
import { validateRestoredMarathonTrailGeometryContractWith } from "./marathon-trail-geometry-validation.js";
import {
  RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID,
  RESTORED_MARATHON_TRAIL_MAP_DEFINITIONS
} from "./marathon-trail-map-catalog.js";

export {
  RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID,
  RESTORED_MARATHON_TRAIL_MAP_IDS,
  RESTORED_MARATHON_TRAIL_SAVE_POINTS
} from "./marathon-trail-map-catalog.js";

export const RESTORED_MARATHON_TRAIL_GEOMETRY_VERSION = "restored-marathon-trail-geometry-009";

const RESTORED_MARATHON_TRAILS_BY_ID = new Map(RESTORED_MARATHON_TRAIL_MAP_DEFINITIONS.map((definition) => {
  const points = Object.freeze(sampleSmoothTrailPoints(definition.controlPoints, 8));
  const trail = buildTrail(points);
  return [definition.id, Object.freeze({
    ...definition,
    points,
    trail,
    tangentSampleDistance: trail.totalLength * 0.004
  })];
}));

export const RESTORED_MARATHON_WORLD_WIDTH = 4600;
export const RESTORED_MARATHON_WORLD_HEIGHT = 3600;

export function listRestoredMarathonTrailMaps() {
  return Object.freeze(RESTORED_MARATHON_TRAIL_MAP_DEFINITIONS.map((definition) => {
    const record = getTrailRecord(definition.id);
    return Object.freeze({
      id: definition.id,
      label: definition.label,
      shortLabel: definition.shortLabel,
      description: definition.description,
      savePoints: definition.savePoints,
      pathLength: round2(record.trail.totalLength)
    });
  }));
}

export function normalizeRestoredMarathonTrailMapId(mapId = RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID) {
  const raw = typeof mapId === "object" && mapId ? mapId.mapId : mapId;
  const value = String(raw || "").trim();
  return RESTORED_MARATHON_TRAILS_BY_ID.has(value) ? value : RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID;
}

export function getRestoredMarathonTrailMap(mapId = RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID) {
  const record = getTrailRecord(mapId);
  return Object.freeze({
    id: record.id,
    label: record.label,
    shortLabel: record.shortLabel,
    description: record.description,
    savePoints: record.savePoints,
    pathLength: round2(record.trail.totalLength)
  });
}

export function listRestoredMarathonTrailSavePoints(mapId = RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID) {
  const record = getTrailRecord(mapId);
  return Object.freeze(record.savePoints.map((savePoint) => {
    const point = progressToRestoredMarathonTrailPoint(savePoint.progressPercent, record.id);
    return Object.freeze({ ...savePoint, ...point, tick: createSavePointTick(point) });
  }));
}

export function createRestoredMarathonTrailSvgPath(steps = 92, mapId = RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID) {
  const count = Math.max(36, steps) + 1;
  const normalizedMapId = normalizeRestoredMarathonTrailMapId(mapId);
  const points = Array.from({ length: count }, (_, index) => (
    progressToRestoredMarathonTrailPoint((index / (count - 1)) * 100, normalizedMapId)
  ));
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${round2(point.x)} ${round2(point.y)}`).join(" ");
}

export function createRestoredMarathonTrailWallSvgPaths(steps = 92, options = {}) {
  const offsetPx = Math.max(80, Math.min(420, Number(options.offsetPx) || 286));
  const mapId = normalizeRestoredMarathonTrailMapId(options.mapId);
  return Object.freeze({
    left: createRestoredMarathonTrailOffsetSvgPath(offsetPx, steps, mapId),
    right: createRestoredMarathonTrailOffsetSvgPath(-offsetPx, steps, mapId)
  });
}

export function calculateRestoredMarathonSpeedScale(tangent) {
  const t = tangent || { x: 1, y: 0 };
  const pixelLengthFactor = Math.hypot(t.x * RESTORED_MARATHON_WORLD_WIDTH, t.y * RESTORED_MARATHON_WORLD_HEIGHT);
  return pixelLengthFactor > 0 ? (RESTORED_MARATHON_WORLD_WIDTH / pixelLengthFactor) : 1;
}

export function progressToRestoredMarathonTrailPoint(progressPercent = 0, mapId = RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID) {
  const record = getTrailRecord(mapId);
  const targetDistance = record.trail.totalLength * clamp(Number(progressPercent) / 100, 0, 1);
  const point = interpolateTrailPointAtDistance(targetDistance, record.id);
  const before = interpolateTrailPointAtDistance(targetDistance - record.tangentSampleDistance, record.id);
  const after = interpolateTrailPointAtDistance(targetDistance + record.tangentSampleDistance, record.id);
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
  const point = progressToRestoredMarathonTrailPoint(progressPercent, options.mapId);
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

export function estimateRestoredMarathonTrailProgressFromPoint(x = 0, y = 0, mapId = RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID) {
  const normalizedMapId = normalizeRestoredMarathonTrailMapId(mapId);
  let best = { progressPercent: 0, distanceSq: Infinity };
  for (let progress = 0; progress <= 100; progress += 1) {
    const point = progressToRestoredMarathonTrailPoint(progress, normalizedMapId);
    const distanceSq = Math.pow(point.x - Number(x), 2) + Math.pow(point.y - Number(y), 2);
    if (distanceSq < best.distanceSq) best = { progressPercent: progress, distanceSq };
  }
  return best.progressPercent;
}

export function createRestoredMarathonTrailSaveCheckpointMeters(distanceMeters = 42195, mapId = RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID) {
  const distance = clamp(Number(distanceMeters), 100, 100000);
  return Object.freeze(getTrailRecord(mapId).savePoints.map((savePoint) => Math.round(distance * savePoint.progressPercent / 100)));
}

export function validateRestoredMarathonTrailGeometryContract() {
  return validateRestoredMarathonTrailGeometryContractWith({ listRestoredMarathonTrailMaps, listRestoredMarathonTrailSavePoints, createRestoredMarathonTrailSvgPath, createRestoredMarathonTrailWallSvgPaths, progressToRestoredMarathonTrailPoint, progressToRestoredMarathonMapPoint, trailLength: (mapId) => getTrailRecord(mapId).trail.totalLength, worldWidth: RESTORED_MARATHON_WORLD_WIDTH, worldHeight: RESTORED_MARATHON_WORLD_HEIGHT });
}

function getTrailRecord(mapId) {
  return RESTORED_MARATHON_TRAILS_BY_ID.get(normalizeRestoredMarathonTrailMapId(mapId))
    || RESTORED_MARATHON_TRAILS_BY_ID.get(RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID);
}

function createRestoredMarathonTrailOffsetSvgPath(offsetPx, steps = 92, mapId = RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID) {
  const count = Math.max(36, steps) + 1;
  const normalizedMapId = normalizeRestoredMarathonTrailMapId(mapId);
  const points = Array.from({ length: count }, (_, index) => {
    const point = progressToRestoredMarathonTrailPoint((index / (count - 1)) * 100, normalizedMapId);
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

function findTrailSegment(distance, mapId = RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID) {
  const trail = getTrailRecord(mapId).trail;
  const clamped = clamp(distance, 0, trail.totalLength);
  for (const segment of trail.segments) {
    if (clamped <= segment.startDistance + segment.length) return segment;
  }
  return trail.segments.at(-1);
}

function interpolateTrailPointAtDistance(distance, mapId = RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID) {
  const trail = getTrailRecord(mapId).trail;
  const segment = findTrailSegment(distance, mapId);
  const clamped = clamp(distance, 0, trail.totalLength);
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
