import { RESTORED_MARATHON_AUTHORITY, createRestoredMarathonParticipant, createRestoredMarathonRoom } from "../games/marathon-contract.js";
import {
  applyRestoredMarathonRunnerDamage,
  createRestoredMarathonAttackAction,
  createRestoredMarathonCheckpointRespawn,
  resolveRestoredMarathonAttackHit
} from "../games/marathon-combat-contract.js";

export const RESTORED_MARATHON_SERVER_COMBAT_STATE_VERSION = "restored-marathon-server-combat-state-001";
const SERVER_ATTACK_DAMAGE = 24;
const SERVER_ATTACK_RANGE_PROGRESS = 4.2;
const SERVER_ATTACK_LANE_TO_PROGRESS = 42;
const SERVER_ATTACK_STALL_MS = 520;
const SERVER_ATTACK_COOLDOWN_MS = 1150;
const SERVER_ATTACK_STUN_MS = 680;

export function createRestoredMarathonServerAttackCommand(envelope = {}, options = {}) {
  const payload = envelope.payload || {};
  return Object.freeze({
    version: RESTORED_MARATHON_SERVER_COMBAT_STATE_VERSION,
    roomId: envelope.roomId || payload.roomId || "",
    attackerId: payload.attackerId || payload.participantId || "",
    sequence: Math.max(1, Number(envelope.sequence || payload.sequence || 1)),
    raceTimeMs: Math.max(0, Number(payload.raceTimeMs || envelope.serverTimeMs || options.serverTimeMs || 0)),
    receivedAtMs: Math.max(0, Number(options.receivedAtMs || envelope.receivedAtMs || 0)),
    aim: normalizeAim(payload.aim)
  });
}

export function applyRestoredMarathonServerAttackEnvelope(roomInput = {}, envelope = {}, options = {}) {
  return applyRestoredMarathonServerAttackCommand(roomInput, createRestoredMarathonServerAttackCommand(envelope, options), options);
}

export function applyRestoredMarathonServerAttackCommand(roomInput = {}, commandInput = {}, options = {}) {
  const room = createRestoredMarathonRoom(roomInput);
  const command = createRestoredMarathonServerAttackCommand({ payload: commandInput, ...commandInput }, options);
  if (!["countdown", "racing"].includes(room.phase)) return rejected("race_not_attackable", room);
  const attackerIndex = room.participants.findIndex((participant) => participant.participantId === command.attackerId);
  if (attackerIndex < 0) return rejected("attacker_not_found", room);
  const attacker = createRestoredMarathonParticipant(room.participants[attackerIndex]);
  if (attacker.type === "spectator" || attacker.type === "admin") return rejected("participant_cannot_attack", room);
  if (command.sequence <= attacker.lastAttackSequence) return rejected("stale_attack", room);
  const nowMs = Math.max(room.serverTimeMs, command.receivedAtMs, command.raceTimeMs);
  if (nowMs < attacker.attackCooldownUntilMs) return rejected("attack_cooldown", room);
  const action = createServerAttackAction(attacker, room, command, room.phase === "racing");
  const target = findServerAttackTarget(action, room, attacker.participantId);
  const participants = [...room.participants];
  participants[attackerIndex] = createRestoredMarathonParticipant({
    ...attacker,
    lastAttackSequence: command.sequence,
    attackCooldownUntilMs: nowMs + action.cooldownMs,
    actionLockedUntilMs: Math.max(attacker.actionLockedUntilMs, nowMs + action.selfStallMs)
  });
  const targetParticipant = target ? applyServerAttackDamage(target, room, nowMs) : null;
  if (targetParticipant) participants[target.index] = targetParticipant;
  return Object.freeze({ ok: true, reason: target ? "attack_hit" : "attack_miss", room: createRestoredMarathonRoom({
    ...room, authority: RESTORED_MARATHON_AUTHORITY.SERVER_REQUIRED, serverTimeMs: nowMs, participants: Object.freeze(participants)
  }), attacker: participants[attackerIndex], target: targetParticipant, hit: target?.hit || null, command });
}

function createServerAttackAction(attacker, room, command, damageEnabled) {
  return createRestoredMarathonAttackAction({
    attackerId: attacker.participantId,
    sequence: command.sequence,
    origin: serverAttackPosition(attacker, room),
    aim: command.aim,
    rangeMeters: SERVER_ATTACK_RANGE_PROGRESS,
    arcDegrees: 70,
    selfStallMs: SERVER_ATTACK_STALL_MS,
    cooldownMs: SERVER_ATTACK_COOLDOWN_MS,
    stunMs: SERVER_ATTACK_STUN_MS,
    damage: damageEnabled ? SERVER_ATTACK_DAMAGE : 0
  });
}

function findServerAttackTarget(action, room, attackerId) {
  return room.participants
    .map((participant, index) => ({ participant: createRestoredMarathonParticipant(participant), index }))
    .filter((entry) => entry.participant.participantId !== attackerId && (entry.participant.type === "player" || entry.participant.type === "bot") && entry.participant.hp > 0)
    .map((entry) => ({ ...entry, hit: resolveRestoredMarathonAttackHit(action, {
      runnerId: entry.participant.participantId,
      position: serverAttackPosition(entry.participant, room),
      hp: entry.participant.hp,
      maxHp: entry.participant.maxHp
    }) }))
    .filter((entry) => entry.hit.hit)
    .sort((left, right) => left.hit.distanceMeters - right.hit.distanceMeters)[0] || null;
}

function applyServerAttackDamage(target, room, nowMs) {
  const damaged = applyRestoredMarathonRunnerDamage({
    ...target.participant,
    runnerId: target.participant.participantId,
    position: serverAttackPosition(target.participant, room)
  }, { ...target.hit, nowMs });
  if (!damaged.down) return createRestoredMarathonParticipant({ ...target.participant, hp: damaged.hp, slowUntilMs: damaged.slowUntilMs,
    stunnedUntilMs: damaged.stunnedUntilMs, pendingRespawnCheckpointIndex: damaged.pendingRespawnCheckpointIndex });
  const respawn = createRestoredMarathonCheckpointRespawn(damaged, room.course);
  return createRestoredMarathonParticipant({ ...target.participant, hp: respawn.hp, progressMeters: respawn.progressMeters,
    slowUntilMs: nowMs + respawn.invulnerableMs, stunnedUntilMs: nowMs + Math.min(respawn.invulnerableMs, SERVER_ATTACK_STUN_MS), pendingRespawnCheckpointIndex: null });
}

function serverAttackPosition(participant, room) {
  const progressPercent = room.course.distanceMeters > 0 ? participant.progressMeters / room.course.distanceMeters * 100 : 0;
  return Object.freeze({ x: round2(progressPercent), y: round2(participant.laneOffsetPx / SERVER_ATTACK_LANE_TO_PROGRESS) });
}

function rejected(reason, room) { return Object.freeze({ ok: false, reason, room, participant: null, command: null }); }
function normalizeAim(aim = {}) { const direction = normalizeDirection(aim); return direction.x || direction.y ? direction : Object.freeze({ x: 1, y: 0 }); }
function normalizeDirection(direction = {}) { return Object.freeze({ x: clampNumber(direction.x ?? 1, -1, 1), y: clampNumber(direction.y ?? 0, -1, 1) }); }
function clampNumber(value, min, max) { const number = Number(value); return Math.max(min, Math.min(max, Number.isFinite(number) ? number : min)); }
function round2(value) { return Math.round(value * 100) / 100; }
