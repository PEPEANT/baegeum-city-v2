import {
  createRestoredMarathonParticipant,
  createRestoredMarathonRoom
} from "../games/marathon-contract.js";

export function applyRestoredMarathonServerStartPositions(roomInput = {}, runnerPositions = []) {
  const room = createRestoredMarathonRoom(roomInput);
  if (!Array.isArray(runnerPositions) || !runnerPositions.length) return room;
  const byParticipantId = new Map(runnerPositions.map((position) => [position?.participantId, position]));
  const participants = room.participants.map((participant) => {
    const position = byParticipantId.get(participant.participantId);
    if (!position) return participant;
    return createRestoredMarathonParticipant({
      ...participant,
      progressMeters: resolveProgressMeters(room, position),
      laneOffsetPx: clampNumber(position.laneOffsetPx ?? participant.laneOffsetPx, -1000, 1000)
    });
  });
  return createRestoredMarathonRoom({ ...room, participants: Object.freeze(participants) });
}

function resolveProgressMeters(room, position) {
  if (Number.isFinite(Number(position.progressMeters))) {
    return clampNumber(Number(position.progressMeters), 0, room.course.distanceMeters);
  }
  const progressPercent = clampNumber(position.progressPercent ?? 0, 0, 99.9);
  return round2(room.course.distanceMeters * progressPercent / 100);
}

function clampNumber(value, min, max) {
  const number = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(number) ? number : min));
}

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}
