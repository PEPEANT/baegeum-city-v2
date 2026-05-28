import { RESTORED_MARATHON_AUTHORITY, advanceRestoredMarathonParticipant, createRestoredMarathonParticipant, createRestoredMarathonRoom } from "../games/marathon-contract.js";
import { createRestoredMarathonSkillUse, getRestoredMarathonSkill } from "../games/marathon-character-skill-contract.js";

export const RESTORED_MARATHON_SERVER_SKILL_STATE_VERSION = "restored-marathon-server-skill-state-001";
const SKILL_LANE_TO_PROGRESS = 42;

export function createRestoredMarathonServerSkillCommand(envelope = {}, options = {}) {
  const payload = envelope.payload || {};
  return Object.freeze({
    version: RESTORED_MARATHON_SERVER_SKILL_STATE_VERSION,
    roomId: envelope.roomId || payload.roomId || "",
    participantId: payload.participantId || "",
    sequence: Math.max(1, Number(envelope.sequence || payload.sequence || 1)),
    raceTimeMs: Math.max(0, Number(payload.raceTimeMs || envelope.serverTimeMs || options.serverTimeMs || 0)),
    receivedAtMs: Math.max(0, Number(options.receivedAtMs || envelope.receivedAtMs || 0)),
    targetId: payload.targetId || ""
  });
}

export function applyRestoredMarathonServerSkillEnvelope(roomInput = {}, envelope = {}, options = {}) {
  return applyRestoredMarathonServerSkillCommand(roomInput, createRestoredMarathonServerSkillCommand(envelope, options), options);
}

export function applyRestoredMarathonServerSkillCommand(roomInput = {}, commandInput = {}, options = {}) {
  const room = createRestoredMarathonRoom(roomInput);
  const command = createRestoredMarathonServerSkillCommand({ payload: commandInput, ...commandInput }, options);
  if (room.phase !== "racing") return rejected("race_not_running", room);
  const userIndex = room.participants.findIndex((participant) => participant.participantId === command.participantId);
  if (userIndex < 0) return rejected("participant_not_found", room);
  const user = createRestoredMarathonParticipant(room.participants[userIndex]);
  if (user.type === "spectator" || user.type === "admin") return rejected("participant_cannot_skill", room);
  if (command.sequence <= user.lastSkillSequence) return rejected("stale_skill", room);
  const nowMs = Math.max(room.serverTimeMs, command.receivedAtMs, command.raceTimeMs);
  if (user.hp <= 0 || nowMs < user.stunnedUntilMs || nowMs < user.actionLockedUntilMs) return rejected("participant_control_locked", room);
  if (!user.skillId || !user.rewardGrade) return rejected("no_reward_skill", room);
  const skill = getRestoredMarathonSkill(user.skillId);
  const use = createRestoredMarathonSkillUse({ participantId: user.participantId, characterId: user.characterId, skillId: skill.skillId,
    grade: user.rewardGrade, chargesRemaining: user.skillChargesRemaining, cooldownRemainingMs: Math.max(0, user.skillCooldownUntilMs - nowMs) });
  if (!use.allowed) return rejected(use.reason, room);
  const participants = [...room.participants];
  const updatedUser = applyUserSkillState(user, room, command, use, nowMs);
  participants[userIndex] = updatedUser;
  const target = use.payload.target === "self" ? null : findSkillTarget(room, updatedUser, command.targetId, use.payload.rangeMeters || use.payload.radiusMeters);
  if (target) participants[target.index] = applyTargetSkillState(target.participant, updatedUser, use, nowMs);
  const nextRoom = createRestoredMarathonRoom({ ...room, authority: RESTORED_MARATHON_AUTHORITY.SERVER_REQUIRED, serverTimeMs: nowMs, participants: Object.freeze(participants) });
  return Object.freeze({ ok: true, reason: target ? "skill_hit" : "skill_used", room: nextRoom, participant: participants[userIndex], target: target ? participants[target.index] : null, use, command });
}

export function validateRestoredMarathonServerSkillStateContract() {
  const errors = [];
  const hopRoom = skillRoom({ characterId: "runner:recommend-fairy", skillId: "skill:checkpoint-hop", rewardGrade: "A", skillChargesRemaining: 1 });
  const hopped = applyRestoredMarathonServerSkillEnvelope(hopRoom, skillEnvelope(1, "runner:a", 2000), { receivedAtMs: 2000 });
  if (!hopped.ok || hopped.participant.progressMeters <= 12 || hopped.participant.skillChargesRemaining !== 0) errors.push("server skill should consume charge and apply self effect");
  const spamRoom = skillRoom({ characterId: "runner:dororong", skillId: "skill:steady-boost", skillChargesRemaining: 0 });
  const boosted = applyRestoredMarathonServerSkillEnvelope(spamRoom, skillEnvelope(1, "runner:a", 2100), { receivedAtMs: 2100 });
  const cooldown = applyRestoredMarathonServerSkillEnvelope(boosted.room, skillEnvelope(2, "runner:a", 2300), { receivedAtMs: 2300 });
  if (!boosted.ok || cooldown.ok || cooldown.reason !== "cooldown") errors.push("server skill should reject cooldown spam");
  const bumpRoom = skillRoom({ characterId: "runner:comment-berserker", skillId: "skill:side-bump", rewardGrade: "B", skillChargesRemaining: 0 });
  const bumped = applyRestoredMarathonServerSkillEnvelope(bumpRoom, skillEnvelope(1, "runner:a", 2400, "runner:b"), { receivedAtMs: 2400 });
  if (!bumped.ok || !bumped.target || bumped.target.stunnedUntilMs <= 2400 || bumped.target.laneOffsetPx === 0) errors.push("nearby server skill should affect a server-owned target");
  const spectator = createRestoredMarathonRoom({ ...bumpRoom, participants: [...bumpRoom.participants, { participantId: "spectator:test", type: "spectator" }] });
  const blocked = applyRestoredMarathonServerSkillEnvelope(spectator, skillEnvelope(1, "spectator:test", 2500), { receivedAtMs: 2500 });
  if (blocked.ok || blocked.reason !== "participant_cannot_skill") errors.push("spectators must not use runner skills");
  const noRewardRoom = skillRoom({ characterId: "", skillId: "", rewardGrade: "", skillChargesRemaining: 0 });
  const noReward = applyRestoredMarathonServerSkillEnvelope(noRewardRoom, skillEnvelope(1, "runner:a", 2600), { receivedAtMs: 2600 });
  if (noReward.ok || noReward.reason !== "no_reward_skill") errors.push("server skill should require a checkpoint reward grade");
  const mismatchRoom = skillRoom({ characterId: "runner:dororong", skillId: "skill:noise-burst", rewardGrade: "D", skillChargesRemaining: 1 });
  const mismatch = applyRestoredMarathonServerSkillEnvelope(mismatchRoom, skillEnvelope(1, "runner:a", 2700), { receivedAtMs: 2700 });
  if (mismatch.ok || mismatch.reason !== "skill_grade_mismatch") errors.push("server skill should reject grade and skill mismatches");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function applyUserSkillState(user, room, command, use, nowMs) {
  let next = createRestoredMarathonParticipant({
    ...user,
    lastSkillSequence: command.sequence,
    skillChargesRemaining: use.consumesCharge ? Math.max(0, user.skillChargesRemaining - 1) : user.skillChargesRemaining,
    skillCooldownUntilMs: nowMs + getRestoredMarathonSkill(use.skillId).cooldownSeconds * 1000,
    actionLockedUntilMs: Math.max(user.actionLockedUntilMs, nowMs + use.movementStallMs)
  });
  if (use.skillId === "skill:checkpoint-hop") next = hopForward(next, room, command.raceTimeMs, 2.4);
  if (use.skillId === "skill:steady-boost" || use.skillId === "skill:stamina-sip") next = createRestoredMarathonParticipant({ ...next, stamina: Math.min(100, next.stamina + 10) });
  if (use.skillId === "skill:guard-roll") next = createRestoredMarathonParticipant({ ...next, slowUntilMs: Math.max(next.slowUntilMs, nowMs + 900) });
  return next;
}

function applyTargetSkillState(target, user, use, nowMs) {
  const durationMs = Math.max(420, Number(use.payload.durationSeconds || 1) * 1000);
  const lanePush = target.laneOffsetPx >= user.laneOffsetPx ? 52 : -52;
  const staminaDelta = use.skillId === "skill:stamina-sip" ? -12 : 0;
  return createRestoredMarathonParticipant({
    ...target,
    stamina: Math.max(0, target.stamina + staminaDelta),
    laneOffsetPx: use.skillId === "skill:side-bump" ? target.laneOffsetPx + lanePush : target.laneOffsetPx,
    slowUntilMs: Math.max(target.slowUntilMs, nowMs + durationMs),
    stunnedUntilMs: Math.max(target.stunnedUntilMs, nowMs + Math.min(620, durationMs))
  });
}

function hopForward(participant, room, raceTimeMs, progressPercent) {
  const progressMeters = Math.min(room.course.distanceMeters, participant.progressMeters + room.course.distanceMeters * progressPercent / 100);
  return advanceRestoredMarathonParticipant({ ...participant, progressMeters }, { pace: "recover", raceTimeMs, sequence: participant.lastSequence }, 0, room.course);
}

function findSkillTarget(room, user, targetId, rangeProgress = 3) {
  const userPoint = participantPoint(room, user);
  return room.participants
    .map((participant, index) => ({ participant: createRestoredMarathonParticipant(participant), index }))
    .filter((entry) => entry.participant.participantId !== user.participantId && (entry.participant.type === "player" || entry.participant.type === "bot") && entry.participant.hp > 0)
    .map((entry) => ({ ...entry, distance: skillDistance(userPoint, participantPoint(room, entry.participant)) }))
    .filter((entry) => (targetId ? entry.participant.participantId === targetId : true) && entry.distance <= Math.max(1, rangeProgress))
    .sort((left, right) => left.distance - right.distance)[0] || null;
}

function participantPoint(room, participant) {
  const progressPercent = room.course.distanceMeters > 0 ? participant.progressMeters / room.course.distanceMeters * 100 : 0;
  return Object.freeze({ x: progressPercent, y: participant.laneOffsetPx / SKILL_LANE_TO_PROGRESS });
}

function skillDistance(left, right) { return Math.hypot(right.x - left.x, right.y - left.y); }
function rejected(reason, room) { return Object.freeze({ ok: false, reason, room, participant: null, command: null }); }
function skillEnvelope(sequence, participantId, raceTimeMs, targetId = "") {
  return Object.freeze({ roomId: "room:skill:test", sequence, payload: { participantId, raceTimeMs, targetId } });
}
function skillRoom(skillState) {
  return createRestoredMarathonRoom({ roomId: "room:skill:test", phase: "racing", authority: RESTORED_MARATHON_AUTHORITY.SERVER_REQUIRED,
    course: { distanceMeters: 120, checkpointMeters: [0, 60, 120] },
    participants: [{ participantId: "runner:a", type: "player", progressMeters: 12, rewardGrade: "D", ...skillState }, { participantId: "runner:b", type: "player", progressMeters: 13, hp: 100 }] });
}
