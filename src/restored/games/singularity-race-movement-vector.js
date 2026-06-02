export const SINGULARITY_RACE_MOVEMENT_VECTOR_VERSION = "singularity-race-movement-vector-005";

const MOVEMENT_AXIS_DEADBAND = 0.08;

export function normalizeSingularityRaceIntent(intentInput = null) {
  if (!intentInput || typeof intentInput !== "object") return null;
  const forward = axisValue(clamp(Number(intentInput.forward || 0), -1, 1));
  const lateral = axisValue(clamp(Number(intentInput.lateral || 0), -1, 1));
  if (!forward && !lateral) return null;
  return Object.freeze({ forward, lateral });
}

export function resolveSingularityRaceInputMovement(frameInput = {}, trailPoint = {}) {
  const intent = normalizeSingularityRaceIntent(frameInput.intent);
  if (!intent) return resolveSingularityRaceTrackMovement(frameInput.direction || { x: 0, y: 0 }, trailPoint);
  return resolveSingularityRaceIntentMovement(intent, trailPoint);
}

export function resolveSingularityRaceIntentMovement(intentInput = {}, trailPoint = {}) {
  const intent = normalizeSingularityRaceIntent(intentInput) || Object.freeze({ forward: 0, lateral: 0 });
  const tangent = normalizeVector(trailPoint.tangent || { x: 1, y: 0 });
  const normal = normalizeVector(trailPoint.normal || { x: -tangent.y, y: tangent.x });
  const direction = normalizeDirection({
    x: (tangent.x * intent.forward) + (normal.x * intent.lateral),
    y: (tangent.y * intent.forward) + (normal.y * intent.lateral)
  });
  return Object.freeze({
    direction,
    tangent,
    normal,
    intent,
    forward: intent.forward,
    lateral: intent.lateral
  });
}

export function resolveSingularityRaceTrackMovement(directionInput = {}, trailPoint = {}) {
  const direction = normalizeDirection(directionInput);
  const tangent = normalizeVector(trailPoint.tangent || { x: 1, y: 0 });
  const normal = normalizeVector(trailPoint.normal || { x: -tangent.y, y: tangent.x });
  const rawForward = axisValue((direction.x * tangent.x) + (direction.y * tangent.y));
  const rawLateral = axisValue((direction.x * normal.x) + (direction.y * normal.y));
  return Object.freeze({
    direction,
    tangent,
    normal,
    forward: rawForward,
    lateral: rawLateral
  });
}

export function resolveSingularityRaceLaneBoundary(currentLaneOffsetPx = 0, laneDeltaPx = 0, laneHalfWidthPx = 232) {
  const halfWidth = Math.max(1, Math.abs(Number(laneHalfWidthPx) || 232));
  const before = finiteNumber(currentLaneOffsetPx, 0);
  const attempted = before + finiteNumber(laneDeltaPx, 0);
  const laneOffsetPx = clamp(attempted, -halfWidth, halfWidth);
  return Object.freeze({
    laneOffsetPx,
    attemptedLaneOffsetPx: attempted,
    touchedBoundary: Math.abs(attempted - laneOffsetPx) > 0.001,
    boundarySide: attempted < -halfWidth ? "left" : attempted > halfWidth ? "right" : "none"
  });
}

export function validateSingularityRaceMovementVectorContract() {
  const errors = [];
  const horizontal = resolveSingularityRaceTrackMovement({ x: 1, y: 0 }, { tangent: { x: 1, y: 0 } });
  const verticalUp = resolveSingularityRaceTrackMovement({ x: 0, y: -1 }, { tangent: { x: 0, y: -1 } });
  const verticalSide = resolveSingularityRaceTrackMovement({ x: 1, y: 0 }, { tangent: { x: 0, y: -1 } });
  const nearHorizontalSide = resolveSingularityRaceTrackMovement({ x: 0, y: 1 }, { tangent: { x: 1, y: 0.04 } });
  const diagonalUphill = resolveSingularityRaceTrackMovement({ x: 0, y: -1 }, { tangent: { x: 0.58, y: -0.82 } });
  const shallowUphill = resolveSingularityRaceTrackMovement({ x: 0, y: -1 }, { tangent: { x: 0.89, y: -0.46 } });
  const mobileIntent = resolveSingularityRaceInputMovement({ intent: { forward: 1, lateral: -0.5 } }, { tangent: { x: -0.8, y: 0.2 } });
  const mobileReverse = resolveSingularityRaceInputMovement({ intent: { forward: -0.65, lateral: 0.25 } }, { tangent: { x: 0.2, y: -0.9 } });
  const boundary = resolveSingularityRaceLaneBoundary(230, 24, 232);
  if (horizontal.forward !== 1 || horizontal.lateral !== 0) errors.push("D should advance on a right-facing track segment");
  if (verticalUp.forward !== 1 || Math.abs(verticalUp.lateral) > 0.001) errors.push("W should advance on an upward track segment");
  if (Math.abs(verticalSide.forward) > 0.001 || verticalSide.lateral !== 1) errors.push("D should become lane movement on an upward track segment");
  if (nearHorizontalSide.forward !== 0) errors.push("side-only input should not leak into progress on a near-horizontal segment");
  if (diagonalUphill.forward < 0.75 || diagonalUphill.lateral > -0.5) errors.push("W should keep screen-up intent on steep diagonal track segments");
  if (shallowUphill.forward > 0.55 || shallowUphill.lateral > -0.8) errors.push("W should not be forced to follow shallow uphill centerlines");
  if (mobileIntent.forward !== 1 || mobileIntent.lateral !== -0.5) errors.push("mobile race intent should not reverse on curved track segments");
  if (mobileReverse.forward !== -0.65 || mobileReverse.lateral !== 0.25) errors.push("mobile reverse intent should stay signed on curved track segments");
  if (!boundary.touchedBoundary || boundary.laneOffsetPx !== 232 || boundary.boundarySide !== "right") errors.push("lane boundary clamp should report wall contact");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function normalizeDirection(direction = {}) {
  const x = clamp(Number(direction.x || 0), -1, 1);
  const y = clamp(Number(direction.y || 0), -1, 1);
  const length = Math.hypot(x, y);
  if (!length) return Object.freeze({ x: 0, y: 0 });
  return Object.freeze({ x: round4(x / length), y: round4(y / length) });
}

function normalizeVector(vector = {}) {
  const x = finiteNumber(vector.x, 1);
  const y = finiteNumber(vector.y, 0);
  const length = Math.hypot(x, y) || 1;
  return Object.freeze({ x: round4(x / length), y: round4(y / length) });
}

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, finiteNumber(value, min)));
}

function axisValue(value) {
  return Math.abs(value) < MOVEMENT_AXIS_DEADBAND ? 0 : round4(value);
}

function round4(value) {
  return Math.round(value * 10000) / 10000;
}
