import { calculateRestoredMarathonSpeedScale, progressToRestoredMarathonTrailPoint } from "./marathon-trail-geometry.js";
import { resolveSingularityRaceInputMovement, resolveSingularityRaceLaneBoundary } from "./singularity-race-movement-vector.js";
import { resolveSingularityRaceObstacleCollision } from "./singularity-race-obstacle-contract.js";

export const SINGULARITY_RACE_PREDICTION_VERSION = "singularity-race-prediction-002";

const DEFAULT_RUN_PROGRESS_PER_SECOND = 0.58;
const DEFAULT_SPRINT_PROGRESS_PER_SECOND = 0.76;
const DEFAULT_LANE_SPEED_PX_PER_SECOND = 122;
const DEFAULT_LANE_SPRINT_SPEED_PX_PER_SECOND = 160;
const DEFAULT_MIN_PROGRESS = 2.5;
const DEFAULT_MAX_PROGRESS = 100;
const DEFAULT_LANE_HALF_WIDTH_PX = 232;
const DEFAULT_PROGRESS_SNAP_THRESHOLD = 3.5;
const DEFAULT_LANE_SNAP_THRESHOLD_PX = 150;
const DEFAULT_PROGRESS_DEADBAND = 0.035;
const DEFAULT_LANE_DEADBAND_PX = 1.5;
const DEFAULT_BACKWARD_PROGRESS_MULTIPLIER = 0.45;

export function advanceSingularityRaceLocalPrediction(runnerInput = {}, frameInput = {}, elapsedSecondsInput = 0, options = {}) {
  const runner = { ...runnerInput };
  const frame = frameInput || {};
  const elapsedSeconds = clampNumber(elapsedSecondsInput, 0, 0.25);
  const sprinting = frame.mode === "sprint";
  const progressSpeed = sprinting
    ? positiveNumber(options.sprintProgressPerSecond, DEFAULT_SPRINT_PROGRESS_PER_SECOND)
    : positiveNumber(options.runProgressPerSecond, DEFAULT_RUN_PROGRESS_PER_SECOND);
  const laneSpeed = sprinting
    ? positiveNumber(options.laneSprintSpeedPxPerSecond, DEFAULT_LANE_SPRINT_SPEED_PX_PER_SECOND)
    : positiveNumber(options.laneSpeedPxPerSecond, DEFAULT_LANE_SPEED_PX_PER_SECOND);
  const minProgress = finiteNumber(options.minProgress, DEFAULT_MIN_PROGRESS);
  const maxProgress = finiteNumber(options.maxProgress, DEFAULT_MAX_PROGRESS);
  const laneHalfWidthPx = positiveNumber(options.laneHalfWidthPx, DEFAULT_LANE_HALF_WIDTH_PX);
  const trailPoint = progressToRestoredMarathonTrailPoint(finiteNumber(runner.progress, minProgress), options.mapId);
  const movement = resolveSingularityRaceInputMovement(frame, trailPoint);
  const speedScale = calculateRestoredMarathonSpeedScale(trailPoint.tangent);
  const forwardFactor = scaleBackwardForward(movement.forward, options.backwardProgressMultiplier);
  const progress = clampNumber(finiteNumber(runner.progress, minProgress) + forwardFactor * progressSpeed * speedScale * elapsedSeconds, minProgress, maxProgress);
  const laneBoundary = resolveSingularityRaceLaneBoundary(runner.laneOffsetPx, movement.lateral * laneSpeed * elapsedSeconds, laneHalfWidthPx);
  const predicted = {
    ...runner,
    progress,
    laneOffsetPx: laneBoundary.laneOffsetPx,
    laneBoundarySide: laneBoundary.boundarySide,
    laneBoundaryTouched: laneBoundary.touchedBoundary,
    clientPredicted: true,
    clientPredictionVersion: SINGULARITY_RACE_PREDICTION_VERSION
  };
  const obstacle = resolveSingularityRaceObstacleCollision(predicted, {
    mapId: options.mapId,
    mapDraft: options.mapDraft,
    laneHalfWidthPx,
    minProgress,
    maxProgress,
    nowMs: options.nowMs,
    raceStarted: options.raceStarted !== false
  });
  return reconcileSingularityRaceLocalPrediction({
    ...obstacle.runner,
    obstacleHit: obstacle.collided,
    obstacleHitId: obstacle.obstacle?.id || ""
  }, { ...options, elapsedSeconds });
}

export function reconcileSingularityRaceLocalPrediction(runnerInput = {}, options = {}) {
  const laneHalfWidthPx = positiveNumber(options.laneHalfWidthPx, DEFAULT_LANE_HALF_WIDTH_PX);
  const minProgress = finiteNumber(options.minProgress, DEFAULT_MIN_PROGRESS);
  const maxProgress = finiteNumber(options.maxProgress, DEFAULT_MAX_PROGRESS);
  const serverProgress = Number(runnerInput.serverProgress);
  const serverLaneOffsetPx = Number(runnerInput.serverLaneOffsetPx);
  if (!Number.isFinite(serverProgress) && !Number.isFinite(serverLaneOffsetPx)) {
    return Object.freeze({
      ...runnerInput,
      progress: clampNumber(runnerInput.progress, minProgress, maxProgress),
      laneOffsetPx: clampNumber(runnerInput.laneOffsetPx, -laneHalfWidthPx, laneHalfWidthPx),
      predictionSnapped: false
    });
  }
  const progressResult = reconcileValue(runnerInput.progress, serverProgress, {
    min: minProgress,
    max: maxProgress,
    deadband: positiveNumber(options.progressDeadband, DEFAULT_PROGRESS_DEADBAND),
    snapThreshold: positiveNumber(options.progressSnapThreshold, DEFAULT_PROGRESS_SNAP_THRESHOLD),
    correctionFactor: correctionFactor(options)
  });
  const laneResult = reconcileValue(runnerInput.laneOffsetPx, serverLaneOffsetPx, {
    min: -laneHalfWidthPx,
    max: laneHalfWidthPx,
    deadband: positiveNumber(options.laneDeadbandPx, DEFAULT_LANE_DEADBAND_PX),
    snapThreshold: positiveNumber(options.laneSnapThresholdPx, DEFAULT_LANE_SNAP_THRESHOLD_PX),
    correctionFactor: correctionFactor(options)
  });
  return Object.freeze({
    ...runnerInput,
    progress: progressResult.value,
    laneOffsetPx: laneResult.value,
    predictionProgressDelta: progressResult.delta,
    predictionLaneDeltaPx: laneResult.delta,
    predictionSnapped: progressResult.snapped || laneResult.snapped
  });
}

export function validateSingularityRacePredictionContract() {
  const errors = [];
  const moved = advanceSingularityRaceLocalPrediction({
    id: "you",
    progress: 5,
    laneOffsetPx: 0,
    serverProgress: 5,
    serverLaneOffsetPx: 0
  }, {
    mode: "sprint",
    direction: { x: 1, y: -1 }
  }, 1, {
    sprintProgressPerSecond: 1,
    laneSprintSpeedPxPerSecond: 100,
    laneHalfWidthPx: 232,
    correctionFactor: 0
  });
  if (moved.progress <= 5 || moved.laneOffsetPx >= 0) errors.push("prediction must move instantly from local input");
  const uphillProgress = findUphillProgress();
  const uphill = advanceSingularityRaceLocalPrediction({
    id: "you",
    progress: uphillProgress,
    laneOffsetPx: 0
  }, {
    mode: "sprint",
    direction: { x: 0, y: -1 }
  }, 1, { sprintProgressPerSecond: 1, correctionFactor: 0 });
  if (uphill.progress <= uphillProgress) errors.push("W should advance progress on upward trail segments");
  const intent = advanceSingularityRaceLocalPrediction({
    id: "you",
    progress: 75,
    laneOffsetPx: 0
  }, {
    mode: "sprint",
    intent: { forward: 1, lateral: 0.5 }
  }, 1, { sprintProgressPerSecond: 1, correctionFactor: 0 });
  if (intent.progress <= 75 || intent.laneOffsetPx <= 0) errors.push("mobile intent should advance without track-vector reversal");
  const reverse = advanceSingularityRaceLocalPrediction({
    id: "you",
    progress: 75,
    laneOffsetPx: 0
  }, {
    mode: "run",
    intent: { forward: -1, lateral: 0 }
  }, 1, { runProgressPerSecond: 1, correctionFactor: 0 });
  if (reverse.progress >= 75 || reverse.progress < 74.4) errors.push("mobile reverse intent should move backward slowly instead of being clamped out");
  const obstacleHit = advanceSingularityRaceLocalPrediction({
    id: "you",
    progress: 12.9,
    laneOffsetPx: -88
  }, {
    mode: "run",
    direction: { x: 1, y: 0 }
  }, 0.4, {
    mapId: "baegeum-city",
    runProgressPerSecond: 1,
    correctionFactor: 0,
    nowMs: 1000
  });
  if (!obstacleHit.obstacleHit || obstacleHit.collisionAtMs !== 1000) errors.push("prediction should apply the shared map obstacle collision");
  const smoothed = reconcileSingularityRaceLocalPrediction({
    progress: 10.5,
    laneOffsetPx: 20,
    serverProgress: 10,
    serverLaneOffsetPx: 0
  }, { correctionFactor: 0.2 });
  if (smoothed.progress <= 10 || smoothed.progress >= 10.5 || smoothed.predictionSnapped) errors.push("small server corrections should smooth");
  const snapped = reconcileSingularityRaceLocalPrediction({
    progress: 50,
    laneOffsetPx: 200,
    serverProgress: 10,
    serverLaneOffsetPx: 0
  }, { progressSnapThreshold: 2, laneSnapThresholdPx: 20 });
  if (snapped.progress !== 10 || snapped.laneOffsetPx !== 0 || !snapped.predictionSnapped) errors.push("large divergence should snap to server authority");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function reconcileValue(localValue, serverValue, options) {
  const local = clampNumber(localValue, options.min, options.max);
  if (!Number.isFinite(serverValue)) return valueResult(local, 0, false);
  const server = clampNumber(serverValue, options.min, options.max);
  const delta = server - local;
  if (Math.abs(delta) >= options.snapThreshold) return valueResult(server, round3(delta), true);
  if (Math.abs(delta) <= options.deadband) return valueResult(local, round3(delta), false);
  return valueResult(round4(local + delta * options.correctionFactor), round3(delta), false);
}

function correctionFactor(options) {
  if (Number.isFinite(Number(options.correctionFactor))) return clampNumber(options.correctionFactor, 0, 1);
  return clampNumber(finiteNumber(options.elapsedSeconds, 0.06) * 1.2, 0, 0.12);
}

function scaleBackwardForward(forward, multiplierInput) {
  const value = finiteNumber(forward, 0);
  if (value >= 0) return value;
  const multiplier = clampNumber(
    Number.isFinite(Number(multiplierInput)) ? Number(multiplierInput) : DEFAULT_BACKWARD_PROGRESS_MULTIPLIER,
    0,
    1
  );
  return value * multiplier;
}

function findUphillProgress() {
  for (let progress = 5; progress <= 95; progress += 0.5) {
    if (progressToRestoredMarathonTrailPoint(progress).tangent.y < -0.18) return progress;
  }
  return 70;
}

function valueResult(value, delta, snapped) {
  return Object.freeze({ value, delta, snapped });
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
  const number = finiteNumber(value, min);
  return Math.max(min, Math.min(max, number));
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

function round4(value) {
  return Math.round(value * 10000) / 10000;
}
