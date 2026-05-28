import {
  RESTORED_MARATHON_AUTHORITY,
  createRestoredMarathonParticipant,
  createRestoredMarathonRoom,
  rankRestoredMarathonParticipants
} from "../games/marathon-contract.js";
import { assignRestoredMarathonCheckpointCharacter } from "../games/marathon-character-skill-contract.js";
import { createRestoredMarathonTransportEnvelope } from "./marathon-server-transport-contract.js";

export const RESTORED_MARATHON_SERVER_RACE_STATE_VERSION = "restored-marathon-server-race-state-001";

export function applyRestoredMarathonServerCheckpointClaimEnvelope(roomInput = {}, envelope = {}, options = {}) {
  const room = createRestoredMarathonRoom(roomInput);
  const command = createCheckpointCommand(envelope, options);
  if (!["racing", "finished"].includes(room.phase)) return rejected("race_not_running", room);
  const index = room.participants.findIndex((participant) => participant.participantId === command.participantId);
  if (index < 0) return rejected("participant_not_found", room);
  const participant = createRestoredMarathonParticipant(room.participants[index]);
  if (!isRunner(participant)) return rejected("participant_cannot_checkpoint", room);
  if (command.sequence <= participant.lastCheckpointSequence) return rejected("stale_checkpoint_claim", room);
  const checkpointIndex = command.checkpointIndex || participant.lastSafeCheckpointIndex;
  if (checkpointIndex <= participant.lastRewardedCheckpointIndex) return rejected("checkpoint_already_rewarded", room);
  if (checkpointIndex > participant.lastSafeCheckpointIndex) return rejected("checkpoint_not_reached", room);
  const reward = assignRestoredMarathonCheckpointCharacter({
    participantId: participant.participantId,
    checkpointIndex,
    stageCount: Math.max(1, room.course.checkpointMeters.length - 2),
    seed: command.seed || `${room.roomId}:${participant.participantId}:${checkpointIndex}`
  });
  const updated = createRestoredMarathonParticipant({
    ...participant,
    characterId: reward.character.characterId,
    skillId: reward.skill.skillId,
    rewardGrade: reward.placeholderSkin.grade,
    skillChargesRemaining: reward.skill.maxCharges,
    skillCooldownUntilMs: 0,
    lastCheckpointSequence: command.sequence,
    lastRewardedCheckpointIndex: checkpointIndex
  });
  const participants = [...room.participants];
  participants[index] = updated;
  const nextRoom = createRestoredMarathonRoom({
    ...room,
    authority: RESTORED_MARATHON_AUTHORITY.SERVER_REQUIRED,
    serverTimeMs: Math.max(room.serverTimeMs, command.receivedAtMs, command.raceTimeMs),
    participants: Object.freeze(participants)
  });
  return Object.freeze({
    ok: true,
    reason: "checkpoint_rewarded",
    room: nextRoom,
    participant: updated,
    serverEnvelope: createCheckpointRewardEnvelope(nextRoom, updated, reward, command)
  });
}

export function applyRestoredMarathonServerFinishClaimEnvelope(roomInput = {}, envelope = {}, options = {}) {
  const room = createRestoredMarathonRoom(roomInput);
  const command = createFinishCommand(envelope, options);
  if (!["racing", "finished"].includes(room.phase)) return rejected("race_not_running", room);
  const index = room.participants.findIndex((participant) => participant.participantId === command.participantId);
  if (index < 0) return rejected("participant_not_found", room);
  const participant = createRestoredMarathonParticipant(room.participants[index]);
  if (!isRunner(participant)) return rejected("participant_cannot_finish", room);
  if (command.sequence <= participant.lastFinishSequence) return rejected("stale_finish_claim", room);
  if (participant.finishedAtMs === null && participant.progressMeters < room.course.distanceMeters) return rejected("finish_not_reached", room);
  const finishedAtMs = participant.finishedAtMs ?? Math.max(room.serverTimeMs, command.receivedAtMs, command.raceTimeMs);
  const updated = createRestoredMarathonParticipant({
    ...participant,
    progressMeters: room.course.distanceMeters,
    finishedAtMs,
    lastFinishSequence: command.sequence
  });
  const participants = [...room.participants];
  participants[index] = updated;
  const runners = participants.filter(isRunner);
  const phase = runners.length > 0 && runners.every((item) => createRestoredMarathonParticipant(item).finishedAtMs !== null) ? "finished" : room.phase;
  const nextRoom = createRestoredMarathonRoom({
    ...room,
    phase,
    authority: RESTORED_MARATHON_AUTHORITY.SERVER_REQUIRED,
    serverTimeMs: Math.max(room.serverTimeMs, command.receivedAtMs, command.raceTimeMs, finishedAtMs),
    participants: Object.freeze(participants)
  });
  return Object.freeze({
    ok: true,
    reason: phase === "finished" ? "race_finalized" : "finish_claimed",
    room: nextRoom,
    participant: updated,
    serverEnvelope: phase === "finished" ? createRaceFinalizedEnvelope(nextRoom, command) : null
  });
}

export function validateRestoredMarathonServerRaceStateContract() {
  const errors = [];
  const checkpointRoom = createRestoredMarathonRoom({
    roomId: "room:race-state:test",
    phase: "racing",
    authority: RESTORED_MARATHON_AUTHORITY.SERVER_REQUIRED,
    course: { distanceMeters: 120, checkpointMeters: [0, 60, 120] },
    participants: [{ participantId: "runner:a", type: "player", progressMeters: 61, lastSafeCheckpointIndex: 1 }]
  });
  const rewarded = applyRestoredMarathonServerCheckpointClaimEnvelope(checkpointRoom, checkpointEnvelope(2, "runner:a", 1), { receivedAtMs: 1000 });
  if (!rewarded.ok || rewarded.serverEnvelope?.type !== "checkpoint_reward") errors.push("server checkpoint claim should emit checkpoint_reward");
  if (!rewarded.participant.characterId || rewarded.participant.lastRewardedCheckpointIndex !== 1) errors.push("server checkpoint reward should update runner character state");
  if (rewarded.participant.rewardGrade !== rewarded.serverEnvelope?.payload?.placeholderSkinGrade) errors.push("server runner reward grade should match the checkpoint skin reward");
  if (!rewarded.serverEnvelope?.payload?.placeholderSkinGrade) errors.push("server checkpoint reward should carry placeholder skin grade");
  const duplicate = applyRestoredMarathonServerCheckpointClaimEnvelope(rewarded.room, checkpointEnvelope(3, "runner:a", 1), { receivedAtMs: 1100 });
  if (duplicate.ok || duplicate.reason !== "checkpoint_already_rewarded") errors.push("server checkpoint reward must not duplicate");
  const spectator = createRestoredMarathonRoom({ ...checkpointRoom, participants: [...checkpointRoom.participants, { participantId: "spectator:a", type: "spectator" }] });
  const blocked = applyRestoredMarathonServerCheckpointClaimEnvelope(spectator, checkpointEnvelope(1, "spectator:a", 1), { receivedAtMs: 1000 });
  if (blocked.ok || blocked.reason !== "participant_cannot_checkpoint") errors.push("spectator checkpoint claim should be blocked");
  const finishRoom = createRestoredMarathonRoom({ ...checkpointRoom, participants: [{ participantId: "runner:a", type: "player", progressMeters: 120, finishedAtMs: 42000 }] });
  const finalized = applyRestoredMarathonServerFinishClaimEnvelope(finishRoom, finishEnvelope(4, "runner:a"), { receivedAtMs: 43000 });
  if (!finalized.ok || finalized.room.phase !== "finished" || finalized.serverEnvelope?.type !== "race_finalized") errors.push("server finish claim should finalize a completed race");
  if (!Array.isArray(finalized.serverEnvelope?.payload?.ranking) || !finalized.serverEnvelope.payload.serverOwned) errors.push("race_finalized must carry server-owned ranking");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function createCheckpointCommand(envelope = {}, options = {}) {
  const payload = envelope.payload || {};
  return Object.freeze({
    participantId: payload.participantId || "",
    checkpointIndex: Math.max(0, Number(payload.checkpointIndex || 0)),
    sequence: Math.max(1, Number(envelope.sequence || payload.sequence || 1)),
    raceTimeMs: Math.max(0, Number(payload.raceTimeMs || envelope.serverTimeMs || options.serverTimeMs || 0)),
    receivedAtMs: Math.max(0, Number(options.receivedAtMs || envelope.receivedAtMs || 0)),
    seed: payload.seed || ""
  });
}

function createFinishCommand(envelope = {}, options = {}) {
  const payload = envelope.payload || {};
  return Object.freeze({
    participantId: payload.participantId || "",
    sequence: Math.max(1, Number(envelope.sequence || payload.sequence || 1)),
    raceTimeMs: Math.max(0, Number(payload.raceTimeMs || envelope.serverTimeMs || options.serverTimeMs || 0)),
    receivedAtMs: Math.max(0, Number(options.receivedAtMs || envelope.receivedAtMs || 0))
  });
}

function createCheckpointRewardEnvelope(room, participant, reward, command) {
  return createRestoredMarathonTransportEnvelope("checkpoint_reward", {
    serverOwned: true,
    participantId: participant.participantId,
    checkpointIndex: reward.checkpointIndex,
    characterId: reward.character.characterId,
    characterLabel: reward.character.label,
    characterGrade: reward.character.grade,
    placeholderSkinId: reward.placeholderSkin.skinId,
    placeholderSkinLabel: reward.placeholderSkin.label,
    placeholderSkinGrade: reward.placeholderSkin.grade,
    rewardGrade: reward.placeholderSkin.grade,
    skillId: reward.skill.skillId,
    skillGrade: reward.skill.grade,
    skillChargesRemaining: reward.skill.maxCharges,
    serverSeedHash: reward.serverSeedHash
  }, { clientId: "server:ws-dev", roomId: room.roomId, sequence: command.sequence + 1, serverTimeMs: Math.max(room.serverTimeMs, command.receivedAtMs) });
}

function createRaceFinalizedEnvelope(room, command) {
  return createRestoredMarathonTransportEnvelope("race_finalized", {
    serverOwned: true,
    phase: room.phase,
    ranking: rankRestoredMarathonParticipants(room.participants)
  }, { clientId: "server:ws-dev", roomId: room.roomId, sequence: command.sequence + 1, serverTimeMs: Math.max(room.serverTimeMs, command.receivedAtMs) });
}

function isRunner(participant) {
  const type = participant?.type;
  return type === "player" || type === "bot";
}

function checkpointEnvelope(sequence, participantId, checkpointIndex) {
  return Object.freeze({ roomId: "room:race-state:test", sequence, payload: { participantId, checkpointIndex, raceTimeMs: 1000 } });
}

function finishEnvelope(sequence, participantId) {
  return Object.freeze({ roomId: "room:race-state:test", sequence, payload: { participantId, raceTimeMs: 42000 } });
}

function rejected(reason, room) {
  return Object.freeze({ ok: false, reason, room, participant: null, serverEnvelope: null });
}
