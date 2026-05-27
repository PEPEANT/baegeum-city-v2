export const RESTORED_MARATHON_COMBAT_CONTRACT_VERSION = "restored-marathon-combat-001";
export const RESTORED_MARATHON_COMBAT_VERSION = RESTORED_MARATHON_COMBAT_CONTRACT_VERSION;

export const RESTORED_MARATHON_COMBAT_EVENTS = Object.freeze([
  "attack_start",
  "attack_hit",
  "skill_hit",
  "runner_down",
  "checkpoint_respawn"
]);

export function createRestoredMarathonAttackAction(options = {}) {
  const rangeMeters = clamp(options.rangeMeters ?? 3.2, 0.4, 8);
  return Object.freeze({
    version: RESTORED_MARATHON_COMBAT_VERSION,
    type: "attack_start",
    attackerId: options.attackerId || "",
    sequence: Math.max(1, Number(options.sequence || 1)),
    origin: point(options.origin),
    aim: normalizeVector(options.aim || { x: 1, y: 0 }),
    rangeMeters,
    arcDegrees: clamp(options.arcDegrees ?? 42, 5, 100),
    selfStallMs: clamp(options.selfStallMs ?? 520, 120, 1400),
    cooldownMs: clamp(options.cooldownMs ?? 1150, 200, 3000),
    stunMs: clamp(options.stunMs ?? 650, 0, 1800),
    damage: clamp(options.damage ?? 34, 0, 100),
    staminaCost: clamp(options.staminaCost ?? 12, 0, 40)
  });
}

export function resolveRestoredMarathonAttackHit(actionInput, targetInput = {}) {
  const action = createRestoredMarathonAttackAction(actionInput);
  const target = normalizeRunner(targetInput);
  const offset = { x: target.position.x - action.origin.x, y: target.position.y - action.origin.y };
  const distance = Math.hypot(offset.x, offset.y);
  const angleOk = angleDegreesBetween(action.aim, normalizeVector(offset)) <= action.arcDegrees / 2;
  const hit = Boolean(target.runnerId && distance <= action.rangeMeters && angleOk && !target.invulnerable);
  return Object.freeze({
    version: RESTORED_MARATHON_COMBAT_VERSION,
    type: hit ? "attack_hit" : "attack_miss",
    attackerId: action.attackerId,
    targetId: target.runnerId,
    hit,
    distanceMeters: round2(distance),
    knockbackMeters: hit ? 1.8 : 0,
    slowMs: hit ? action.stunMs : 0,
    stunMs: hit ? action.stunMs : 0,
    damage: hit ? action.damage : 0,
    attackerStallMs: action.selfStallMs,
    attackCooldownMs: action.cooldownMs
  });
}

export function applyRestoredMarathonRunnerDamage(runnerInput = {}, hitInput = {}) {
  const runner = normalizeRunner(runnerInput);
  const damage = Math.max(0, Number(hitInput.damage || 0));
  const hp = clamp(runner.hp - damage, 0, runner.maxHp);
  const down = hp <= 0;
  return Object.freeze({
    ...runner,
    hp,
    down,
    slowUntilMs: Math.max(runner.slowUntilMs, Number(hitInput.nowMs || 0) + Number(hitInput.slowMs || 0)),
    stunnedUntilMs: Math.max(runner.stunnedUntilMs, Number(hitInput.nowMs || 0) + Number(hitInput.stunMs || hitInput.slowMs || 0)),
    pendingRespawnCheckpointIndex: down ? runner.lastSafeCheckpointIndex : runner.pendingRespawnCheckpointIndex
  });
}

export function createRestoredMarathonCheckpointRespawn(runnerInput = {}, courseInput = {}) {
  const runner = normalizeRunner(runnerInput);
  const checkpointMeters = courseInput.checkpointMeters || [0];
  const checkpointIndex = Math.floor(clamp(runner.pendingRespawnCheckpointIndex ?? runner.lastSafeCheckpointIndex, 0, checkpointMeters.length - 1));
  return Object.freeze({
    version: RESTORED_MARATHON_COMBAT_VERSION,
    type: "checkpoint_respawn",
    runnerId: runner.runnerId,
    checkpointIndex,
    progressMeters: Number(checkpointMeters[checkpointIndex] || 0),
    hp: runner.maxHp,
    invulnerableMs: 1400,
    reason: runner.down ? "runner_down" : "manual_recover"
  });
}

export function validateRestoredMarathonCombatContract() {
  const errors = [];
  const attack = createRestoredMarathonAttackAction({
    attackerId: "runner:a",
    origin: { x: 0, y: 0 },
    aim: { x: 1, y: 0 }
  });
  const hit = resolveRestoredMarathonAttackHit(attack, { runnerId: "runner:b", position: { x: 2, y: 0 }, hp: 30 });
  if (!hit.hit || hit.attackerStallMs <= 0) errors.push("mouse attack should hit in range and stall attacker");
  if (hit.attackCooldownMs <= 0 || hit.stunMs <= 0) errors.push("basic attack should expose cooldown and stun");
  const damaged = applyRestoredMarathonRunnerDamage({ runnerId: "runner:b", hp: 30, lastSafeCheckpointIndex: 2 }, hit);
  if (!damaged.down || damaged.pendingRespawnCheckpointIndex !== 2) errors.push("downed runner should return to saved checkpoint");
  const staged = resolveRestoredMarathonAttackHit(createRestoredMarathonAttackAction({ damage: 0 }), { runnerId: "runner:c", position: { x: 1, y: 0 }, hp: 100 });
  const stunned = applyRestoredMarathonRunnerDamage({ runnerId: "runner:c", hp: 100 }, { ...staged, nowMs: 1000 });
  if (stunned.hp !== 100 || stunned.stunnedUntilMs <= 1000) errors.push("pre-start attack can stun without damage");
  const respawn = createRestoredMarathonCheckpointRespawn(damaged, { checkpointMeters: [0, 500, 1000] });
  if (respawn.progressMeters !== 1000 || respawn.hp <= 0) errors.push("respawn should restore at checkpoint");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function normalizeRunner(input = {}) {
  return Object.freeze({
    runnerId: input.runnerId || input.participantId || "",
    position: point(input.position),
    hp: clamp(input.hp ?? 100, 0, input.maxHp ?? 100),
    maxHp: clamp(input.maxHp ?? 100, 1, 500),
    invulnerable: Boolean(input.invulnerable),
    slowUntilMs: Math.max(0, Number(input.slowUntilMs || 0)),
    stunnedUntilMs: Math.max(0, Number(input.stunnedUntilMs || 0)),
    lastSafeCheckpointIndex: Math.max(0, Number(input.lastSafeCheckpointIndex || 0)),
    pendingRespawnCheckpointIndex: input.pendingRespawnCheckpointIndex
  });
}

function point(input = {}) {
  return Object.freeze({ x: round2(Number(input.x || 0)), y: round2(Number(input.y || 0)) });
}

function normalizeVector(input = {}) {
  const x = Number(input.x || 0);
  const y = Number(input.y || 0);
  const length = Math.hypot(x, y) || 1;
  return Object.freeze({ x: round2(x / length), y: round2(y / length) });
}

function angleDegreesBetween(left, right) {
  const dot = clamp(left.x * right.x + left.y * right.y, -1, 1);
  return Math.acos(dot) * 180 / Math.PI;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : min));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}
