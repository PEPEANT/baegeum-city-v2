export const SINGULARITY_RACE_ITEM_CONTRACT_VERSION = "singularity-race-item-001";

export const SINGULARITY_RACE_ITEM_IDS = Object.freeze({
  BOOSTER: "item:booster",
  BANANA: "item:banana",
  STUN_SHOT: "item:stun-shot",
  INK_CLOUD: "item:ink-cloud",
  RED_PILL: "item:red-pill",
  TURBO_CAR: "item:turbo-car"
});

export const SINGULARITY_RACE_ITEM_BOX_RESPAWN_MS = 10000;
export const SINGULARITY_RACE_BOOSTER_DURATION_MS = 1500;
export const SINGULARITY_RACE_BOOSTER_SPEED_MULTIPLIER = 1.28;
export const SINGULARITY_RACE_BANANA_DURATION_MS = 10000;
export const SINGULARITY_RACE_BANANA_SLOW_MS = 900;
export const SINGULARITY_RACE_STUN_SHOT_STUN_MS = 700;
export const SINGULARITY_RACE_INK_CLOUD_DURATION_MS = 5200;
export const SINGULARITY_RACE_INK_BLIND_MS = 1600;
export const SINGULARITY_RACE_INK_SLOW_MS = 520;
export const SINGULARITY_RACE_ITEM_PICKUP_PROGRESS_RADIUS = 0.72;
export const SINGULARITY_RACE_ITEM_PICKUP_LANE_RADIUS_PX = 58;

// 빨간약: 잠깐 거대화. 살짝 빨라지고 넉백 면역 + 작은 러너를 밀쳐낸다(조작은 약간 둔해진다).
export const SINGULARITY_RACE_RED_PILL_DURATION_MS = 4200;
export const SINGULARITY_RACE_RED_PILL_SPEED_MULTIPLIER = 1.12;
export const SINGULARITY_RACE_RED_PILL_SIZE_SCALE = 1.55;
export const SINGULARITY_RACE_RED_PILL_LANE_DRAG = 0.78;
// 터보카: 상자를 부수거나 아이템으로 획득. 몇 초간 크게 가속 + 충돌/넉백 면역.
export const SINGULARITY_RACE_TURBO_CAR_DURATION_MS = 3600;
export const SINGULARITY_RACE_TURBO_CAR_SPEED_MULTIPLIER = 1.55;
export const SINGULARITY_RACE_TURBO_CAR_SIZE_SCALE = 1.22;
// 서버가 신뢰할 수 있는 자체 가속 배수 상한(클라이언트 보고값 클램프용).
export const SINGULARITY_RACE_MAX_SELF_SPEED_MULTIPLIER = 1.6;

const ITEM_DEFINITIONS = Object.freeze([
  item(SINGULARITY_RACE_ITEM_IDS.BOOSTER, "부스터", "self", 30),
  item(SINGULARITY_RACE_ITEM_IDS.BANANA, "바나나", "trap", 26),
  item(SINGULARITY_RACE_ITEM_IDS.STUN_SHOT, "스턴샷", "projectile", 20),
  item(SINGULARITY_RACE_ITEM_IDS.INK_CLOUD, "먹물탄", "blind", 14),
  item(SINGULARITY_RACE_ITEM_IDS.RED_PILL, "빨간약", "grow", 14),
  item(SINGULARITY_RACE_ITEM_IDS.TURBO_CAR, "터보카", "vehicle", 8)
]);

const ITEM_BOX_PROGRESS = Object.freeze([18, 48, 90]);
const ITEM_BOX_LANES = Object.freeze([-184, -92, 0, 92, 184]);

export function listSingularityRaceItemDefinitions() {
  return ITEM_DEFINITIONS;
}

export function getSingularityRaceItemDefinition(itemId) {
  return ITEM_DEFINITIONS.find((item) => item.itemId === itemId) || null;
}

export function createSingularityRaceItemBoxes(options = {}) {
  const progressRows = Array.isArray(options.progressRows) ? options.progressRows : ITEM_BOX_PROGRESS;
  const laneOffsets = Array.isArray(options.laneOffsets) ? options.laneOffsets : ITEM_BOX_LANES;
  return Object.freeze(progressRows.flatMap((progress, sectionIndex) => (
    laneOffsets.map((laneOffsetPx, laneIndex) => createItemBox(sectionIndex + 1, laneIndex + 1, progress, laneOffsetPx))
  )));
}

export function createSingularityRaceItemBoxState(boxes = createSingularityRaceItemBoxes()) {
  return Object.freeze(boxes.map((box) => Object.freeze({ ...box, respawnAtMs: 0 })));
}

export function pickSingularityRaceItem(seed = "") {
  const total = ITEM_DEFINITIONS.reduce((sum, item) => sum + item.weight, 0);
  let roll = hashText(seed) % total;
  for (const definition of ITEM_DEFINITIONS) {
    if (roll < definition.weight) return definition;
    roll -= definition.weight;
  }
  return ITEM_DEFINITIONS[0];
}

export function canCollectSingularityRaceItem(options = {}) {
  if (options.participantType === "spectator") return false;
  if (!options.raceStarted || options.finalResult) return false;
  return !options.currentItemId;
}

export function isSingularityRaceItemBoxActive(box = {}, nowMs = 0) {
  return Number(box.respawnAtMs || 0) <= nowMs;
}

export function createSingularityRaceItemPickupTrace(input = {}) {
  return Object.freeze({
    fromProgress: finiteNumber(input.fromProgress, 0),
    fromLaneOffsetPx: finiteNumber(input.fromLaneOffsetPx, 0),
    toProgress: finiteNumber(input.toProgress, 0),
    toLaneOffsetPx: finiteNumber(input.toLaneOffsetPx, 0),
    createdAtMs: Math.max(0, finiteNumber(input.createdAtMs, 0))
  });
}

export function isSingularityRaceItemBoxInPickupRange(itemBox = {}, runner = {}, options = {}) {
  const progressRadius = positiveNumber(options.progressRadius, SINGULARITY_RACE_ITEM_PICKUP_PROGRESS_RADIUS);
  const laneRadiusPx = positiveNumber(options.laneRadiusPx, SINGULARITY_RACE_ITEM_PICKUP_LANE_RADIUS_PX);
  if (isPickupPointInRange(itemBox, runner.progress, runner.laneOffsetPx, progressRadius, laneRadiusPx)) return true;
  return isPickupTraceInRange(itemBox, options.trace, {
    progressRadius,
    laneRadiusPx,
    nowMs: finiteNumber(options.nowMs, 0),
    traceMaxAgeMs: positiveNumber(options.traceMaxAgeMs, 650)
  });
}

export function validateSingularityRaceItemContract() {
  const errors = [];
  const boxes = createSingularityRaceItemBoxes();
  const stateBoxes = createSingularityRaceItemBoxState(boxes);
  const picked = new Set(Array.from({ length: 64 }, (_, index) => pickSingularityRaceItem(`seed:${index}`).itemId));
  const centerBox = boxes.find((box) => box.progress === 18 && box.laneOffsetPx === 0);
  const traceHit = isSingularityRaceItemBoxInPickupRange(centerBox, { progress: 20, laneOffsetPx: 0 }, {
    progressRadius: SINGULARITY_RACE_ITEM_PICKUP_PROGRESS_RADIUS,
    laneRadiusPx: SINGULARITY_RACE_ITEM_PICKUP_LANE_RADIUS_PX,
    traceMaxAgeMs: 650,
    nowMs: 1000,
    trace: createSingularityRaceItemPickupTrace({
      fromProgress: 16.4,
      fromLaneOffsetPx: 0,
      toProgress: 20,
      toLaneOffsetPx: 0,
      createdAtMs: 1000
    })
  });
  const traceMiss = isSingularityRaceItemBoxInPickupRange(centerBox, { progress: 20, laneOffsetPx: 180 }, {
    progressRadius: SINGULARITY_RACE_ITEM_PICKUP_PROGRESS_RADIUS,
    laneRadiusPx: SINGULARITY_RACE_ITEM_PICKUP_LANE_RADIUS_PX,
    traceMaxAgeMs: 650,
    nowMs: 1000,
    trace: createSingularityRaceItemPickupTrace({
      fromProgress: 16.4,
      fromLaneOffsetPx: 180,
      toProgress: 20,
      toLaneOffsetPx: 180,
      createdAtMs: 1000
    })
  });
  const staleTraceHit = isSingularityRaceItemBoxInPickupRange(centerBox, { progress: 20, laneOffsetPx: 0 }, {
    progressRadius: SINGULARITY_RACE_ITEM_PICKUP_PROGRESS_RADIUS,
    laneRadiusPx: SINGULARITY_RACE_ITEM_PICKUP_LANE_RADIUS_PX,
    traceMaxAgeMs: 650,
    nowMs: 2000,
    trace: createSingularityRaceItemPickupTrace({
      fromProgress: 16.4,
      fromLaneOffsetPx: 0,
      toProgress: 20,
      toLaneOffsetPx: 0,
      createdAtMs: 1000
    })
  });
  const nearLaneMiss = isSingularityRaceItemBoxInPickupRange(centerBox, { progress: 18, laneOffsetPx: 86 }, {
    progressRadius: SINGULARITY_RACE_ITEM_PICKUP_PROGRESS_RADIUS,
    laneRadiusPx: SINGULARITY_RACE_ITEM_PICKUP_LANE_RADIUS_PX,
    traceMaxAgeMs: 650,
    nowMs: 1000
  });
  const nearProgressMiss = isSingularityRaceItemBoxInPickupRange(centerBox, { progress: 19.05, laneOffsetPx: 0 }, {
    progressRadius: SINGULARITY_RACE_ITEM_PICKUP_PROGRESS_RADIUS,
    laneRadiusPx: SINGULARITY_RACE_ITEM_PICKUP_LANE_RADIUS_PX,
    traceMaxAgeMs: 650,
    nowMs: 1000
  });
  if (ITEM_DEFINITIONS.length !== 6) errors.push("item set should expose six race items");
  if (boxes.length !== 15) errors.push("item boxes should be 3 rows of 5 boxes");
  if (!boxes.some((box) => box.sectionIndex === 3 && box.progress === 90)) errors.push("final item row should sit on the late straight road");
  if (!picked.has(SINGULARITY_RACE_ITEM_IDS.BOOSTER)) errors.push("booster should be pickable");
  if (!picked.has(SINGULARITY_RACE_ITEM_IDS.BANANA)) errors.push("banana should be pickable");
  if (!picked.has(SINGULARITY_RACE_ITEM_IDS.STUN_SHOT)) errors.push("stun shot should be pickable");
  if (!picked.has(SINGULARITY_RACE_ITEM_IDS.INK_CLOUD)) errors.push("ink cloud should be pickable");
  if (!picked.has(SINGULARITY_RACE_ITEM_IDS.RED_PILL)) errors.push("red pill should be pickable");
  if (!picked.has(SINGULARITY_RACE_ITEM_IDS.TURBO_CAR)) errors.push("turbo car should be pickable");
  if (!canCollectSingularityRaceItem({ raceStarted: true, currentItemId: "", participantType: "player" })) errors.push("empty player slot should collect during race");
  if (canCollectSingularityRaceItem({ raceStarted: true, currentItemId: "item:booster", participantType: "player" })) errors.push("filled item slot should not collect another box");
  if (canCollectSingularityRaceItem({ raceStarted: true, currentItemId: "", participantType: "spectator" })) errors.push("spectators should not collect item boxes");
  if (SINGULARITY_RACE_BOOSTER_SPEED_MULTIPLIER < 1.25 || SINGULARITY_RACE_BOOSTER_SPEED_MULTIPLIER > 1.35) errors.push("booster must stay in the 0.1 safe speed range");
  if (SINGULARITY_RACE_TURBO_CAR_SPEED_MULTIPLIER <= SINGULARITY_RACE_BOOSTER_SPEED_MULTIPLIER) errors.push("turbo car should be clearly faster than the booster");
  if (SINGULARITY_RACE_TURBO_CAR_SPEED_MULTIPLIER > SINGULARITY_RACE_MAX_SELF_SPEED_MULTIPLIER) errors.push("turbo car must stay within the trusted self-speed cap");
  if (SINGULARITY_RACE_RED_PILL_SIZE_SCALE <= 1) errors.push("red pill should visibly enlarge the runner");
  if (SINGULARITY_RACE_RED_PILL_LANE_DRAG <= 0 || SINGULARITY_RACE_RED_PILL_LANE_DRAG >= 1) errors.push("red pill should trade some lateral agility for size");
  if (SINGULARITY_RACE_INK_BLIND_MS < 1200 || SINGULARITY_RACE_INK_BLIND_MS > 2400) errors.push("ink cloud should briefly block vision without lasting too long");
  if (SINGULARITY_RACE_ITEM_PICKUP_PROGRESS_RADIUS < 0.55 || SINGULARITY_RACE_ITEM_PICKUP_PROGRESS_RADIUS > 0.9) errors.push("item pickup progress radius should stay close to the visible box");
  if (SINGULARITY_RACE_ITEM_PICKUP_LANE_RADIUS_PX < 44 || SINGULARITY_RACE_ITEM_PICKUP_LANE_RADIUS_PX > 68) errors.push("item pickup lane radius should stay close to the visible box");
  if (stateBoxes.some((box) => !box.boxId || Math.abs(box.laneOffsetPx) > 232)) errors.push("item boxes must stay on the race road");
  if (!traceHit) errors.push("pickup trace should collect a crossed item box");
  if (traceMiss) errors.push("pickup trace should still respect lane distance");
  if (staleTraceHit) errors.push("stale pickup trace should not collect a box");
  if (nearLaneMiss) errors.push("near lane misses should not collect item boxes");
  if (nearProgressMiss) errors.push("near progress misses should not collect item boxes");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function isPickupPointInRange(itemBox, progress, laneOffsetPx, progressRadius, laneRadiusPx) {
  return Math.abs((Number(itemBox?.progress) || 0) - (Number(progress) || 0)) <= progressRadius
    && Math.abs((Number(itemBox?.laneOffsetPx) || 0) - (Number(laneOffsetPx) || 0)) <= laneRadiusPx;
}

function isPickupTraceInRange(itemBox, trace, options) {
  if (!trace || options.nowMs - Number(trace.createdAtMs || 0) > options.traceMaxAgeMs) return false;
  const startProgress = Number(trace.fromProgress);
  const endProgress = Number(trace.toProgress);
  const startLane = Number(trace.fromLaneOffsetPx);
  const endLane = Number(trace.toLaneOffsetPx);
  if (![startProgress, endProgress, startLane, endLane].every(Number.isFinite)) return false;
  const boxProgress = Number(itemBox?.progress) || 0;
  const boxLane = Number(itemBox?.laneOffsetPx) || 0;
  const segmentProgress = (endProgress - startProgress) / options.progressRadius;
  const segmentLane = (endLane - startLane) / options.laneRadiusPx;
  const fromBoxProgress = (startProgress - boxProgress) / options.progressRadius;
  const fromBoxLane = (startLane - boxLane) / options.laneRadiusPx;
  const segmentLengthSq = (segmentProgress * segmentProgress) + (segmentLane * segmentLane);
  const t = segmentLengthSq > 0
    ? clampNumber(-((fromBoxProgress * segmentProgress) + (fromBoxLane * segmentLane)) / segmentLengthSq, 0, 1)
    : 0;
  const closestProgress = fromBoxProgress + (segmentProgress * t);
  const closestLane = fromBoxLane + (segmentLane * t);
  return ((closestProgress * closestProgress) + (closestLane * closestLane)) <= 1;
}

function createItemBox(sectionIndex, laneIndex, progress, laneOffsetPx) {
  return Object.freeze({
    boxId: `item-box:${sectionIndex}:${laneIndex}`,
    sectionIndex,
    laneIndex,
    progress: Number(progress),
    laneOffsetPx: Number(laneOffsetPx)
  });
}

function item(itemId, label, effectType, weight) {
  return Object.freeze({ itemId, label, effectType, weight });
}

function hashText(text) {
  let hash = 2166136261;
  for (const char of String(text)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}

function finiteNumber(value, fallback) { const number = Number(value); return Number.isFinite(number) ? number : fallback; }

function positiveNumber(value, fallback) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : fallback; }

function clampNumber(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
