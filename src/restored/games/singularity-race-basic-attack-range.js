import {
  RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID,
  RESTORED_MARATHON_WORLD_HEIGHT,
  RESTORED_MARATHON_WORLD_WIDTH,
  normalizeRestoredMarathonTrailMapId,
  progressToRestoredMarathonTrailPoint
} from "./marathon-trail-geometry.js";

export const SINGULARITY_RACE_BASIC_ATTACK_REACH_PX = 118;
export const SINGULARITY_RACE_BASIC_ATTACK_RADIUS_PX = 54;
export const SINGULARITY_RACE_BASIC_ATTACK_BACK_GRACE_PX = 18;

export function resolveSingularityRaceRunnerWorldPoint(runnerInput = {}, options = {}) {
  const runner = runnerInput || {};
  if (runner.worldPoint) return normalizeWorldPoint(runner.worldPoint);
  const mapId = normalizeRestoredMarathonTrailMapId(options.mapId || runner.mapId || RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID);
  const progressPercent = Number.isFinite(Number(runner.progressPercent))
    ? Number(runner.progressPercent)
    : Number(runner.progress) || 0;
  const laneOffsetPx = Number(runner.laneOffsetPx) || 0;
  const point = progressToRestoredMarathonTrailPoint(progressPercent, mapId);
  const tangent = normalizeVector({
    x: Number(point.tangent?.x || 1) * RESTORED_MARATHON_WORLD_WIDTH,
    y: Number(point.tangent?.y || 0) * RESTORED_MARATHON_WORLD_HEIGHT
  });
  return Object.freeze({
    x: round2((Number(point.x) || 0) / 100 * RESTORED_MARATHON_WORLD_WIDTH + Number(point.normal?.x || 0) * laneOffsetPx),
    y: round2((Number(point.y) || 0) / 100 * RESTORED_MARATHON_WORLD_HEIGHT + Number(point.normal?.y || 0) * laneOffsetPx),
    tangent,
    normal: Object.freeze({ x: -tangent.y, y: tangent.x }),
    progressPercent,
    laneOffsetPx,
    mapId
  });
}

export function normalizeSingularityRaceAttackDirection(directionInput = 1) {
  if (typeof directionInput === "object" && directionInput) return Number(directionInput.x || 0) < 0 ? -1 : 1;
  return Number(directionInput || 1) < 0 ? -1 : 1;
}

export function resolveSingularityRaceBasicAttackRange(attackerInput = {}, targetInput = {}, options = {}) {
  const attacker = resolveSingularityRaceRunnerWorldPoint(attackerInput, options);
  const target = resolveSingularityRaceRunnerWorldPoint(targetInput, options);
  const direction = normalizeSingularityRaceAttackDirection(options.direction ?? options.aim);
  const axis = { x: attacker.tangent.x * direction, y: attacker.tangent.y * direction };
  const normal = { x: -axis.y, y: axis.x };
  const delta = { x: target.x - attacker.x, y: target.y - attacker.y };
  const forwardPx = dot(delta, axis);
  const lateralPx = dot(delta, normal);
  const reachPx = clamp(Number(options.reachPx) || SINGULARITY_RACE_BASIC_ATTACK_REACH_PX, 40, 220);
  const radiusPx = clamp(Number(options.radiusPx) || SINGULARITY_RACE_BASIC_ATTACK_RADIUS_PX, 24, 110);
  const backGracePx = clamp(Number(options.backGracePx) || SINGULARITY_RACE_BASIC_ATTACK_BACK_GRACE_PX, 0, 60);
  const cappedForwardPx = clamp(forwardPx, 0, reachPx);
  const distancePx = Math.hypot(forwardPx - cappedForwardPx, lateralPx);
  const hit = Boolean(targetInput?.participantId || targetInput?.id || targetInput?.runnerId)
    && forwardPx >= -backGracePx
    && forwardPx <= reachPx + radiusPx
    && distancePx <= radiusPx;
  return Object.freeze({
    hit,
    forwardPx: round2(forwardPx),
    lateralPx: round2(lateralPx),
    distancePx: round2(distancePx),
    reachPx,
    radiusPx,
    backGracePx
  });
}

export function createSingularityRaceBasicAttackHit(actionInput = {}, targetInput = {}, rangeInput = {}) {
  const range = rangeInput.distancePx === undefined
    ? resolveSingularityRaceBasicAttackRange(actionInput.attacker || {}, targetInput, actionInput)
    : rangeInput;
  const hit = Boolean(range.hit);
  return Object.freeze({
    version: actionInput.version || "singularity-race-basic-attack-px-001",
    type: hit ? "attack_hit" : "attack_miss",
    attackerId: actionInput.attackerId || "",
    targetId: targetInput.runnerId || targetInput.participantId || targetInput.id || "",
    hit,
    distanceMeters: Number(range.distancePx || 0),
    knockbackMeters: hit ? 1.8 : 0,
    slowMs: hit ? Number(actionInput.stunMs || 0) : 0,
    stunMs: hit ? Number(actionInput.stunMs || 0) : 0,
    damage: hit ? Number(actionInput.damage || 0) : 0,
    attackerStallMs: Number(actionInput.selfStallMs || 0),
    attackCooldownMs: Number(actionInput.cooldownMs || 0)
  });
}

export function findSingularityRaceBasicAttackTarget(attackerInput = {}, targetsInput = [], options = {}) {
  return targetsInput
    .map((target) => ({
      target,
      range: resolveSingularityRaceBasicAttackRange(attackerInput, target, options)
    }))
    .filter((entry) => entry.range.hit)
    .sort((left, right) => left.range.distancePx - right.range.distancePx || Math.abs(left.range.lateralPx) - Math.abs(right.range.lateralPx))[0] || null;
}

export function validateSingularityRaceBasicAttackRangeContract() {
  const attacker = { id: "runner:a", worldPoint: { x: 0, y: 0, tangent: { x: 1, y: 0 } } };
  const front = { id: "runner:b", worldPoint: { x: 96, y: 0, tangent: { x: 1, y: 0 } } };
  const far = { id: "runner:c", worldPoint: { x: 190, y: 0, tangent: { x: 1, y: 0 } } };
  const side = { id: "runner:d", worldPoint: { x: 80, y: 78, tangent: { x: 1, y: 0 } } };
  const behind = { id: "runner:e", worldPoint: { x: -82, y: 0, tangent: { x: 1, y: 0 } } };
  const errors = [];
  if (!resolveSingularityRaceBasicAttackRange(attacker, front).hit) errors.push("front target should be inside fixed pixel reach");
  if (resolveSingularityRaceBasicAttackRange(attacker, far).hit) errors.push("far target should miss fixed pixel reach");
  if (resolveSingularityRaceBasicAttackRange(attacker, side).hit) errors.push("wide lateral target should miss fixed pixel radius");
  if (!resolveSingularityRaceBasicAttackRange(attacker, behind, { direction: -1 }).hit) errors.push("reverse aim should hit a nearby rear target");
  if (findSingularityRaceBasicAttackTarget(attacker, [far, front, side])?.target?.id !== "runner:b") errors.push("target selection should choose the nearest valid hit");
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors)
  });
}

function normalizeWorldPoint(pointInput = {}) {
  const point = pointInput || {};
  const tangent = normalizeVector(point.tangent || { x: 1, y: 0 });
  return Object.freeze({
    x: Number(point.x) || 0,
    y: Number(point.y) || 0,
    tangent,
    normal: normalizeVector(point.normal || { x: -tangent.y, y: tangent.x })
  });
}

function dot(left, right) {
  return Number(left.x || 0) * Number(right.x || 0) + Number(left.y || 0) * Number(right.y || 0);
}

function normalizeVector(vector = {}) {
  const x = Number(vector.x) || 0;
  const y = Number(vector.y) || 0;
  const length = Math.hypot(x, y);
  return Object.freeze(length > 0.0001 ? { x: x / length, y: y / length } : { x: 1, y: 0 });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}
