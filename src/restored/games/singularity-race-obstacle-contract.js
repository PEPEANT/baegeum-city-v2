import {
  RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID,
  RESTORED_MARATHON_TRAIL_MAP_IDS
} from "./marathon-trail-map-catalog.js";
import { mergeSingularityRaceMapDraft } from "./singularity-race-map-draft-contract.js";

export const SINGULARITY_RACE_OBSTACLE_CONTRACT_VERSION = "singularity-race-obstacle-contract-001";

const DEFAULT_LANE_HALF_WIDTH_PX = 232;
const DEFAULT_PROGRESS_RADIUS = 0.46;
const DEFAULT_LANE_RADIUS_PX = 58;
const DEFAULT_PROGRESS_BOUNCE = 0.22;
const DEFAULT_LANE_BOUNCE_PX = 34;
const DEFAULT_OBSTACLE_SLOW_MS = 260;

// kind 안내: cone/barrier = 피해야 하는 단단한 장애물(부딪히면 튕김+감속).
//           crate = 부수면 자동차가 나오는 보상 상자. energy = 즉시 가속 에너지 드링크.
// crate/energy는 클라이언트가 kind로 보상 처리하므로 충돌 반경만 픽업처럼 넉넉하게 둔다.
const OBSTACLES_BY_MAP_ID = Object.freeze({
  [RESTORED_MARATHON_TRAIL_MAP_IDS.BASIC]: freezeObstacles([
    obstacle("basic:energy-01", "energy", 9.0, 70, "에너지 드링크", 0.6, 0.5, 60, 1),
    obstacle("basic:cone-01", "cone", 13.2, -88, "콘", 1, 0.42, 52, -1),
    obstacle("basic:crate-01", "crate", 21.0, 150, "상자", 0.7, 0.52, 64, 1),
    obstacle("basic:barrier-01", "barrier", 24.6, 84, "방호벽", 1.08, 0.5, 66, 1),
    obstacle("basic:crate-02", "crate", 37.8, -18, "상자", 0.7, 0.52, 64, -1),
    obstacle("basic:energy-02", "energy", 45.4, -150, "에너지 드링크", 0.6, 0.5, 60, -1),
    obstacle("basic:cone-02", "cone", 52.4, 116, "콘", 0.96, 0.42, 54, 1),
    obstacle("basic:crate-03", "crate", 60.2, 40, "상자", 0.7, 0.52, 64, 1),
    obstacle("basic:barrier-02", "barrier", 68.6, -126, "방호벽", 1.1, 0.5, 66, -1),
    obstacle("basic:energy-03", "energy", 76.8, 104, "에너지 드링크", 0.6, 0.5, 60, 1),
    obstacle("basic:crate-04", "crate", 84.8, 26, "상자", 0.7, 0.52, 64, 1)
  ]),
  [RESTORED_MARATHON_TRAIL_MAP_IDS.SQUARE]: freezeObstacles([
    obstacle("square:energy-01", "energy", 10.4, 96, "에너지 드링크", 0.6, 0.5, 60, 1),
    obstacle("square:barrier-01", "barrier", 16.8, 0, "방호벽", 1.1, 0.5, 68, 1),
    obstacle("square:crate-01", "crate", 24.2, -150, "상자", 0.7, 0.52, 64, -1),
    obstacle("square:cone-01", "cone", 31.6, -132, "콘", 0.96, 0.42, 52, -1),
    obstacle("square:crate-02", "crate", 47.4, 122, "상자", 0.7, 0.52, 64, 1),
    obstacle("square:energy-02", "energy", 56.0, -60, "에너지 드링크", 0.6, 0.5, 60, -1),
    obstacle("square:cone-02", "cone", 64.2, -42, "콘", 0.98, 0.42, 54, -1),
    obstacle("square:crate-03", "crate", 73.4, 150, "상자", 0.7, 0.52, 64, 1),
    obstacle("square:barrier-02", "barrier", 82.6, 96, "방호벽", 1.12, 0.5, 68, 1)
  ]),
  [RESTORED_MARATHON_TRAIL_MAP_IDS.MAZE]: freezeObstacles([
    obstacle("maze:cone-01", "cone", 10.8, -72, "콘", 0.94, 0.4, 50, -1),
    obstacle("maze:energy-01", "energy", 15.0, 150, "에너지 드링크", 0.6, 0.5, 60, 1),
    obstacle("maze:crate-01", "crate", 19.4, 78, "상자", 0.7, 0.48, 64, 1),
    obstacle("maze:barrier-01", "barrier", 30.8, -116, "방호벽", 1.1, 0.5, 66, -1),
    obstacle("maze:crate-02", "crate", 36.6, 150, "상자", 0.7, 0.48, 64, 1),
    obstacle("maze:cone-02", "cone", 42.2, 112, "콘", 0.96, 0.42, 54, 1),
    obstacle("maze:energy-02", "energy", 48.4, -150, "에너지 드링크", 0.6, 0.5, 60, -1),
    obstacle("maze:crate-03", "crate", 54.6, -22, "상자", 0.7, 0.5, 64, -1),
    obstacle("maze:barrier-02", "barrier", 66.8, 132, "방호벽", 1.12, 0.5, 68, 1),
    obstacle("maze:crate-04", "crate", 72.0, -90, "상자", 0.7, 0.48, 64, -1),
    obstacle("maze:cone-03", "cone", 78.4, -108, "콘", 0.94, 0.42, 52, -1),
    obstacle("maze:energy-03", "energy", 84.0, 60, "에너지 드링크", 0.6, 0.5, 60, 1),
    obstacle("maze:crate-05", "crate", 90.2, 34, "상자", 0.7, 0.48, 64, 1)
  ])
});

export function listSingularityRaceMapObstacles(mapId = RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID, mapDraft = null) {
  const normalizedMapId = normalizeObstacleMapId(mapId);
  const obstacles = OBSTACLES_BY_MAP_ID[normalizedMapId] || OBSTACLES_BY_MAP_ID[RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID];
  if (!mapDraft) return obstacles;
  return mergeSingularityRaceMapDraft({
    mapId: normalizedMapId,
    obstacles,
    spectators: []
  }, mapDraft).obstacles;
}

export function resolveSingularityRaceObstacleCollision(runnerInput = {}, options = {}) {
  const runner = { ...runnerInput };
  if (options.raceStarted === false) return collisionResult(runner, null, 0);
  const laneHalfWidthPx = positiveNumber(options.laneHalfWidthPx, DEFAULT_LANE_HALF_WIDTH_PX);
  const minProgress = finiteNumber(options.minProgress, 0);
  const maxProgress = finiteNumber(options.maxProgress, 100);
  const progress = clampNumber(runner.progress, minProgress, maxProgress);
  const laneOffsetPx = clampNumber(runner.laneOffsetPx, -laneHalfWidthPx, laneHalfWidthPx);
  const hit = findObstacleHit(progress, laneOffsetPx, options);
  if (!hit) {
    return collisionResult({ ...runner, progress, laneOffsetPx }, null, 0);
  }

  const obstacle = hit.obstacle;
  const progressDirection = Math.abs(progress - obstacle.progress) > 0.001
    ? Math.sign(progress - obstacle.progress)
    : -1;
  const laneDirection = Math.abs(laneOffsetPx - obstacle.laneOffsetPx) > 0.5
    ? Math.sign(laneOffsetPx - obstacle.laneOffsetPx)
    : obstacle.pushLaneDirection;
  const nextProgress = clampNumber(
    progress + (progressDirection * obstacle.progressBounce * hit.intensity),
    minProgress,
    maxProgress
  );
  const nextLaneOffsetPx = clampNumber(
    laneOffsetPx + (laneDirection * obstacle.laneBouncePx * hit.intensity),
    -laneHalfWidthPx,
    laneHalfWidthPx
  );
  const nowMs = Math.max(0, Number(options.nowMs || 0));
  return collisionResult({
    ...runner,
    progress: nextProgress,
    laneOffsetPx: nextLaneOffsetPx,
    collisionAtMs: nowMs || runner.collisionAtMs || 0,
    obstacleCollisionId: obstacle.id,
    obstacleCollisionAtMs: nowMs || runner.obstacleCollisionAtMs || 0,
    slowUntilMs: nowMs ? Math.max(Number(runner.slowUntilMs || 0), nowMs + obstacle.slowMs) : runner.slowUntilMs
  }, obstacle, hit.intensity);
}

export function validateSingularityRaceObstacleContract() {
  const errors = [];
  for (const mapId of Object.values(RESTORED_MARATHON_TRAIL_MAP_IDS)) {
    if (listSingularityRaceMapObstacles(mapId).length < 5) errors.push(`${mapId} should keep several obstacle placements`);
  }
  const blocked = resolveSingularityRaceObstacleCollision({
    progress: 13.2,
    laneOffsetPx: -88,
    collisionAtMs: 0
  }, {
    mapId: RESTORED_MARATHON_TRAIL_MAP_IDS.BASIC,
    nowMs: 1000
  });
  if (!blocked.collided || blocked.runner.progress >= 13.2 || blocked.runner.laneOffsetPx >= -88) {
    errors.push("direct obstacle contact should push the runner back and sideways");
  }
  const clear = resolveSingularityRaceObstacleCollision({
    progress: 13.2,
    laneOffsetPx: 190
  }, {
    mapId: RESTORED_MARATHON_TRAIL_MAP_IDS.BASIC,
    nowMs: 1000
  });
  if (clear.collided) errors.push("wide lane dodge should not hit the obstacle");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function findObstacleHit(progress, laneOffsetPx, options) {
  return listSingularityRaceMapObstacles(options.mapId, options.mapDraft)
    .map((obstacle) => {
      const progressGap = Math.abs(progress - obstacle.progress);
      const laneGap = Math.abs(laneOffsetPx - obstacle.laneOffsetPx);
      if (progressGap > obstacle.progressRadius || laneGap > obstacle.laneRadiusPx) return null;
      const progressOverlap = 1 - (progressGap / obstacle.progressRadius);
      const laneOverlap = 1 - (laneGap / obstacle.laneRadiusPx);
      return {
        obstacle,
        intensity: clampNumber(progressOverlap * laneOverlap * obstacle.severity, 0.18, 1.25)
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.intensity - left.intensity)[0] || null;
}

function obstacle(id, kind, progress, laneOffsetPx, label, severity, progressRadius, laneRadiusPx, pushLaneDirection) {
  return Object.freeze({
    id,
    kind,
    progress,
    laneOffsetPx,
    label,
    severity: positiveNumber(severity, 1),
    progressRadius: positiveNumber(progressRadius, DEFAULT_PROGRESS_RADIUS),
    laneRadiusPx: positiveNumber(laneRadiusPx, DEFAULT_LANE_RADIUS_PX),
    progressBounce: DEFAULT_PROGRESS_BOUNCE,
    laneBouncePx: DEFAULT_LANE_BOUNCE_PX,
    slowMs: DEFAULT_OBSTACLE_SLOW_MS,
    pushLaneDirection: pushLaneDirection < 0 ? -1 : 1
  });
}

function freezeObstacles(items) {
  return Object.freeze(items.map((item) => Object.freeze(item)));
}

function collisionResult(runner, obstacle, intensity) {
  return Object.freeze({
    runner: Object.freeze(runner),
    obstacle,
    intensity,
    collided: Boolean(obstacle)
  });
}

function normalizeObstacleMapId(mapId) {
  const value = String(mapId || "").trim();
  return Object.values(RESTORED_MARATHON_TRAIL_MAP_IDS).includes(value)
    ? value
    : RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID;
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, finiteNumber(value, min)));
}
