import { createRestoredMarathonDevRoomTransport } from "../online/marathon-dev-room-transport.js";
import { createRestoredMarathonTransportEnvelope } from "../online/marathon-server-transport-contract.js";
import { RESTORED_MARATHON_MAX_RUNNERS } from "./marathon-contract.js";
const DEFAULT_CLIENT_ID = "client:singularity-race-lobby";
const DEFAULT_SERVER_ID = "server:dev-adapter";
const DEFAULT_COURSE_METERS = 42195;
const DEFAULT_START_PROGRESS = 4;
const DEFAULT_LANE_HALF_WIDTH_PX = 232;
const DEFAULT_MAX_RUNNERS = RESTORED_MARATHON_MAX_RUNNERS;
export function createSingularityConnectedRelayEnvelope(packet = {}, context = {}) {
  const payload = packet.payload || {};
  const connectedSession = context.connectedSession || {};
  const serverOwned = packet.type === "state_snapshot" || payload.serverOwned;
  return createRestoredMarathonTransportEnvelope(packet.type, payload, {
    clientId: packet.clientId || (serverOwned ? DEFAULT_SERVER_ID : DEFAULT_CLIENT_ID),
    roomId: packet.roomId || payload.roomId || connectedSession.roomId || "",
    sequence: packet.sequence || payload.sequence || context.fallbackSequence || 1,
    serverTimeMs: packet.serverTimeMs || payload.serverTimeMs || 0
  });
}
export function createSingularityRoomPressureReport(transport, packets, nowMs = Date.now()) {
  return transport?.createPressureReport?.(packets, { nowMs }) || null;
}
export function createSingularityDevRoomPacketTransport(options = {}) {
  return createRestoredMarathonDevRoomTransport({
    clientId: DEFAULT_CLIENT_ID,
    packetLimit: 80,
    ...options
  });
}
export function mergeSingularityServerSnapshotRunners(existingRunners = [], snapshotPayload = {}, options = {}) {
  const participants = (Array.isArray(snapshotPayload.participants) ? snapshotPayload.participants : [])
    .filter((participant) => isRunnerParticipant(participant));
  const existingById = new Map(existingRunners.map((runner) => [runner.id, runner]));
  const courseDistanceMeters = positiveNumber(options.courseDistanceMeters, DEFAULT_COURSE_METERS);
  const startProgress = finiteNumber(options.startLineProgress, DEFAULT_START_PROGRESS);
  const laneHalfWidthPx = positiveNumber(options.roadLaneHalfWidthPx, DEFAULT_LANE_HALF_WIDTH_PX);
  const maxRunners = Math.max(1, Math.round(positiveNumber(options.maxRunners, DEFAULT_MAX_RUNNERS)));
  const presets = Array.isArray(options.presets) ? options.presets : [];
  const phase = snapshotPayload.phase || "";
  const runners = participants.map((participant, index) => {
    const id = normalizeRunnerId(participant.participantId, index, options.localRunnerId);
    const existing = existingById.get(id) || existingById.get(participant.participantId) || null;
    const serverProgress = resolveSnapshotProgress(participant, {
      courseDistanceMeters,
      existingProgress: existing?.progress,
      phase,
      startProgress
    });
    const serverLaneOffsetPx = resolveSnapshotLaneOffset(participant, existing, {
      laneHalfWidthPx,
      maxRunners
    });
    const display = resolveSnapshotDisplay({
      existing,
      id,
      phase,
      serverProgress,
      serverLaneOffsetPx,
      options,
      laneHalfWidthPx
    });
    return Object.freeze({
      id,
      name: participant.displayName || existing?.name || `Runner ${index + 1}`,
      skin: existing?.skin || (id === "you" ? options.selectedSkin : participant.skinPreset || presets[index % presets.length]?.id) || options.defaultSkin || "default",
      ready: false,
      progress: display.progress,
      laneOffsetPx: display.laneOffsetPx,
      hp: finiteNumber(participant.hp, existing?.hp ?? 100),
      maxHp: finiteNumber(participant.maxHp, existing?.maxHp ?? 100),
      stunnedUntilMs: Math.max(finiteNumber(participant.stunnedUntilMs, 0), finiteNumber(existing?.stunnedUntilMs, 0)),
      slowUntilMs: Math.max(finiteNumber(participant.slowUntilMs, 0), finiteNumber(existing?.slowUntilMs, 0)),
      lastSafeCheckpointIndex: Math.max(finiteNumber(participant.lastSafeCheckpointIndex, 0), finiteNumber(existing?.lastSafeCheckpointIndex, 0)),
      lastRewardedCheckpointIndex: Math.max(finiteNumber(participant.lastRewardedCheckpointIndex, 0), finiteNumber(existing?.lastRewardedCheckpointIndex, 0)),
      characterId: participant.characterId || existing?.characterId || "", skillId: participant.skillId || existing?.skillId || "", rewardGrade: participant.rewardGrade || existing?.rewardGrade || "", skillChargesRemaining: finiteNumber(participant.skillChargesRemaining, existing?.skillChargesRemaining ?? 0), skillCooldownUntilMs: finiteNumber(participant.skillCooldownUntilMs, existing?.skillCooldownUntilMs ?? 0),
      collisionAtMs: Math.max(finiteNumber(participant.collisionAtMs, 0), finiteNumber(existing?.collisionAtMs, 0)),
      obstacleCollisionId: participant.obstacleCollisionId || existing?.obstacleCollisionId || "",
      effectKind: typeof participant.effectKind === "string" ? participant.effectKind : "",
      sizeScale: finiteNumber(participant.sizeScale, 1) > 0 ? finiteNumber(participant.sizeScale, 1) : 1,
      serverOwned: true,
      serverProgress,
      serverLaneOffsetPx,
      serverProgressMeters: finiteNumber(participant.progressMeters, 0),
      serverSequence: Math.max(0, Number(participant.lastSequence || 0)),
      finishedAtMs: participant.finishedAtMs ?? null,
      clientPredicted: Boolean(display.preserved || existing?.clientPredicted),
      snapshotCorrectionProgress: display.progressDelta,
      snapshotCorrectionLanePx: display.laneDeltaPx,
      snapshotSnapped: display.snapped
    });
  });
  return Object.freeze({
    applied: participants.length > 0,
    sequence: Math.max(0, Number(snapshotPayload.sequence || 0)),
    phase,
    runners: Object.freeze(runners)
  });
}

export function validateSingularityRaceDevOnlineContract() {
  const errors = [];
  const roomId = "room:singularity-race:dev-001";
  const envelope = createSingularityConnectedRelayEnvelope({
    type: "state_snapshot",
    payload: { serverOwned: true, sequence: 2 }
  }, { connectedSession: { roomId } });
  if (envelope.clientId !== DEFAULT_SERVER_ID) errors.push("server-owned snapshots must be marked as server packets");
  if (envelope.roomId !== roomId) errors.push("relay envelope must keep the connected room id");
  const transport = createSingularityDevRoomPacketTransport({ roomId, clock: () => 100 });
  const submitted = transport.submitPacket(transport.seedPackets([]), envelope, { reason: "state_snapshot" });
  if (!submitted.ok) errors.push(`dev room packet should submit: ${submitted.reason}`);
  const pressure = createSingularityRoomPressureReport(transport, submitted.packets, 100);
  if (!pressure || !Array.isArray(pressure.clients)) errors.push("pressure report must expose relay guard clients");
  const merged = mergeSingularityServerSnapshotRunners([
    { id: "you", name: "YOU", skin: "gpichan", progress: 4, laneOffsetPx: 0, hp: 100, maxHp: 100 }
  ], {
    sequence: 7,
    phase: "racing",
    participants: [{ participantId: "runner:you", displayName: "Tester", lane: 16, progressMeters: 4219.5, lastSequence: 5 }]
  }, { selectedSkin: "gpichan", courseDistanceMeters: 42195, roadLaneHalfWidthPx: 232 });
  if (!merged.applied || merged.runners[0].id !== "you") errors.push("server snapshots must map runner:you onto the local player");
  if (merged.runners[0].progress < 9 || merged.runners[0].progress > 11) errors.push("server snapshot meters must become display progress percent");
  if (merged.runners[0].skin !== "gpichan") errors.push("server snapshot merge must preserve the local player skin");
  const uniquePredicted = mergeSingularityServerSnapshotRunners(
    [{ id: "you", name: "YOU", skin: "gpichan", progress: 12, laneOffsetPx: 80, hp: 100, maxHp: 100, clientPredicted: true }],
    { sequence: 13, phase: "racing", participants: [{ participantId: "runner:tab-123", displayName: "Tester", laneOffsetPx: 0, progressMeters: 4219.5, lastSequence: 6 }] },
    { selectedSkin: "gpichan", courseDistanceMeters: 42195, roadLaneHalfWidthPx: 232, preserveLocalPrediction: true, localRunnerId: "runner:tab-123" });
  if (uniquePredicted.runners[0]?.id !== "you" || uniquePredicted.runners[0].progress <= 10 || uniquePredicted.runners[0].progress >= 12) errors.push("unique local runner prediction should map to you and smooth toward server snapshots");
  const remoteSkin = mergeSingularityServerSnapshotRunners([], { sequence: 11, phase: "lobby",
    participants: [{ participantId: "runner:remote", displayName: "Remote", skinPreset: "robot" }] }, { defaultSkin: "singularity-fan" });
  if (remoteSkin.runners[0]?.skin !== "robot") errors.push("remote server snapshot should preserve participant skin presets");
  const predicted = mergeSingularityServerSnapshotRunners([
    { id: "you", name: "YOU", skin: "gpichan", progress: 12, laneOffsetPx: 80, hp: 100, maxHp: 100, clientPredicted: true }
  ], {
    sequence: 9,
    phase: "racing",
    participants: [{ participantId: "runner:you", displayName: "Tester", laneOffsetPx: 0, progressMeters: 4219.5, lastSequence: 6 }]
  }, {
    selectedSkin: "gpichan",
    courseDistanceMeters: 42195,
    roadLaneHalfWidthPx: 232,
    preserveLocalPrediction: true,
    localRunnerId: "you"
  });
  if (predicted.runners[0].progress <= 10 || predicted.runners[0].progress >= 12) errors.push("local prediction display should smooth toward server snapshots");
  if (predicted.runners[0].serverProgress < 9 || predicted.runners[0].serverProgress > 11) errors.push("local prediction merge must keep the authoritative server target");
  const spectatorMerged = mergeSingularityServerSnapshotRunners([], {
    sequence: 8,
    phase: "racing",
    participants: [{ participantId: "spectator:test", displayName: "Watcher", type: "spectator" }]
  });
  if (spectatorMerged.applied || spectatorMerged.runners.length) errors.push("spectators must not render as runners");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function normalizeRunnerId(participantId, index, localRunnerId = "runner:you") {
  const id = String(participantId || "");
  if (id === "runner:you" || id === localRunnerId) return "you";
  if (id.startsWith("runner:bot-")) return id.slice("runner:".length);
  return id || `runner:${index + 1}`;
}

function isRunnerParticipant(participant = {}) {
  if (participant.type) return participant.type === "player" || participant.type === "bot";
  return String(participant.participantId || "").startsWith("runner:");
}

function resolveSnapshotProgress(participant, options) {
  const progressPercent = Number.isFinite(Number(participant.progressPercent))
    ? Number(participant.progressPercent)
    : (finiteNumber(participant.progressMeters, 0) / options.courseDistanceMeters) * 100;
  if (progressPercent <= 0 && options.phase !== "racing" && options.phase !== "finished") {
    return clampNumber(options.existingProgress ?? options.startProgress, 0, 100);
  }
  return clampNumber(progressPercent, 0, 100);
}

function resolveSnapshotLaneOffset(participant, existing, options) {
  if (Number.isFinite(Number(participant.laneOffsetPx))) {
    return clampNumber(Number(participant.laneOffsetPx), -options.laneHalfWidthPx, options.laneHalfWidthPx);
  }
  if (Number.isFinite(Number(existing?.laneOffsetPx))) {
    return clampNumber(Number(existing.laneOffsetPx), -options.laneHalfWidthPx, options.laneHalfWidthPx);
  }
  const lane = clampNumber(participant.lane || 1, 1, options.maxRunners);
  const ratio = options.maxRunners <= 1 ? 0.5 : (lane - 1) / (options.maxRunners - 1);
  return clampNumber((ratio - 0.5) * options.laneHalfWidthPx * 1.8, -options.laneHalfWidthPx, options.laneHalfWidthPx);
}

function resolveSnapshotDisplay(input) {
  const localRunnerId = input.options.localRunnerId || "you";
  const localDisplayRunner = input.id === "you" || input.id === localRunnerId;
  const preserve = Boolean(
    input.options.preserveLocalPrediction
      && localDisplayRunner
      && input.phase === "racing"
      && input.existing
  );
  if (!preserve) {
    return Object.freeze({
      progress: input.serverProgress,
      laneOffsetPx: input.serverLaneOffsetPx,
      preserved: false,
      progressDelta: 0,
      laneDeltaPx: 0,
      snapped: false
    });
  }
  const progress = smoothServerCorrection(input.existing.progress, input.serverProgress, {
    min: 0,
    max: 100,
    snapDistance: positiveNumber(input.options.localPredictionProgressSnap, 3.5),
    correctionFactor: positiveNumber(input.options.localPredictionSnapshotCorrection, 0.12)
  });
  const lane = smoothServerCorrection(input.existing.laneOffsetPx, input.serverLaneOffsetPx, {
    min: -input.laneHalfWidthPx,
    max: input.laneHalfWidthPx,
    snapDistance: positiveNumber(input.options.localPredictionLaneSnapPx, 150),
    correctionFactor: positiveNumber(input.options.localPredictionSnapshotCorrection, 0.12)
  });
  return Object.freeze({
    progress: progress.value,
    laneOffsetPx: lane.value,
    preserved: true,
    progressDelta: progress.delta,
    laneDeltaPx: lane.delta,
    snapped: progress.snapped || lane.snapped
  });
}

function smoothServerCorrection(localValue, serverValue, options) {
  const local = clampNumber(localValue, options.min, options.max);
  const server = clampNumber(serverValue, options.min, options.max);
  const delta = server - local;
  if (Math.abs(delta) >= options.snapDistance) return Object.freeze({ value: server, delta: round3(delta), snapped: true });
  return Object.freeze({ value: round4(local + delta * options.correctionFactor), delta: round3(delta), snapped: false });
}

function positiveNumber(value, fallback) { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : fallback; }
function finiteNumber(value, fallback) { const number = Number(value); return Number.isFinite(number) ? number : fallback; }

function clampNumber(value, min, max) {
  const number = finiteNumber(value, min);
  return Math.max(min, Math.min(max, number));
}

function round3(value) { return Math.round(value * 1000) / 1000; }
function round4(value) { return Math.round(value * 10000) / 10000; }
