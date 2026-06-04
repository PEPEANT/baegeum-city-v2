import { RESTORED_MARATHON_MAX_RUNNERS } from "./marathon-contract.js";

export const SINGULARITY_RACE_START_COUNTDOWN_MS = 6000;
export const SINGULARITY_RACE_CONTROL_STORAGE_KEY = "singularity-race:race-control:v1";
export const SINGULARITY_RACE_TEST_BOTS_STORAGE_KEY = "singularity-race:test-bots:v1";
export const SINGULARITY_RACE_NARRATION_STORAGE_KEY = "singularity-race:narration-control:v1";
export const SINGULARITY_RACE_CONTROL_BROADCAST_NAME = "singularity-race:race-control-relay:v1";
export const SINGULARITY_RACE_NARRATION_SCRIPT_ID = "singularity-race-intro-001";
export const SINGULARITY_RACE_CONTROL_TYPES = Object.freeze({
  START_COUNTDOWN: "start_countdown",
  SET_TEST_BOTS: "set_test_bots",
  ROOM_CLOSED: "room_closed",
  NARRATION_START: "narration_start"
});

export function createSingularityRaceStartCountdownCommand(options = {}) {
  const nowMs = clampTime(options.nowMs ?? Date.now());
  const countdownMs = Math.max(1000, Number(options.countdownMs || SINGULARITY_RACE_START_COUNTDOWN_MS));
  const gateOpensAtMs = Math.max(nowMs + 1000, clampTime(options.gateOpensAtMs ?? nowMs + countdownMs));
  return Object.freeze({
    type: SINGULARITY_RACE_CONTROL_TYPES.START_COUNTDOWN,
    commandId: options.commandId || `host:start:${nowMs}`,
    roomId: options.roomId || "room:singularity-race:dev-001",
    sourceClientId: options.sourceClientId || "client:singularity-race-host",
    countdownMs,
    startsAtMs: clampTime(options.startsAtMs ?? nowMs),
    gateOpensAtMs
  });
}

export function createSingularityRaceTestBotsCommand(options = {}) {
  const nowMs = clampTime(options.nowMs ?? Date.now());
  const botCount = clampInteger(options.botCount, 0, RESTORED_MARATHON_MAX_RUNNERS);
  return Object.freeze({
    type: SINGULARITY_RACE_CONTROL_TYPES.SET_TEST_BOTS,
    commandId: options.commandId || `host:test-bots:${botCount}:${nowMs}`,
    roomId: options.roomId || "room:singularity-race:dev-001",
    sourceClientId: options.sourceClientId || "client:singularity-race-host",
    botCount,
    createdAtMs: nowMs
  });
}

export function createSingularityRaceRoomClosedCommand(options = {}) {
  const nowMs = clampTime(options.nowMs ?? Date.now());
  return Object.freeze({
    type: SINGULARITY_RACE_CONTROL_TYPES.ROOM_CLOSED,
    commandId: options.commandId || `host:room-closed:${nowMs}`,
    roomId: options.roomId || "room:singularity-race:dev-001",
    sourceClientId: options.sourceClientId || "client:singularity-race-host",
    closedAtMs: nowMs,
    reason: String(options.reason || "host_closed_room").slice(0, 80)
  });
}

export function createSingularityRaceNarrationCommand(options = {}) {
  const nowMs = clampTime(options.nowMs ?? Date.now());
  const scriptId = String(options.scriptId || SINGULARITY_RACE_NARRATION_SCRIPT_ID).slice(0, 80);
  return Object.freeze({
    type: SINGULARITY_RACE_CONTROL_TYPES.NARRATION_START,
    commandId: options.commandId || `host:narration:${scriptId}:${nowMs}`,
    roomId: options.roomId || "room:singularity-race:dev-001",
    sourceClientId: options.sourceClientId || "client:singularity-race-host",
    scriptId,
    createdAtMs: nowMs
  });
}

export function parseSingularityRaceControlCommand(value) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return null;
  }
}

export function readSingularityRaceControlCommand(storage, roomId = "") {
  const command = parseSingularityRaceControlCommand(storage?.getItem?.(createSingularityRaceControlStorageKey(roomId)));
  return command && (!roomId || command.roomId === roomId) ? command : null;
}

export function readSingularityRaceTestBotsCommand(storage, roomId = "") {
  const command = parseSingularityRaceControlCommand(storage?.getItem?.(createSingularityRaceTestBotsStorageKey(roomId)));
  return command?.type === SINGULARITY_RACE_CONTROL_TYPES.SET_TEST_BOTS && (!roomId || command.roomId === roomId) ? command : null;
}

export function readSingularityRaceNarrationCommand(storage, roomId = "") {
  const command = parseSingularityRaceControlCommand(storage?.getItem?.(createSingularityRaceNarrationStorageKey(roomId)));
  return command?.type === SINGULARITY_RACE_CONTROL_TYPES.NARRATION_START && (!roomId || command.roomId === roomId) ? command : null;
}

export function writeSingularityRaceControlCommand(storage, command) {
  try {
    storage?.setItem?.(createSingularityRaceControlStorageKey(command?.roomId), JSON.stringify(command)); return Object.freeze({ ok: true, command });
  } catch {
    return Object.freeze({ ok: false, reason: "storage_unavailable", command });
  }
}

export function writeSingularityRaceTestBotsCommand(storage, command) {
  try {
    storage?.setItem?.(createSingularityRaceTestBotsStorageKey(command?.roomId), JSON.stringify(command)); return Object.freeze({ ok: true, command });
  } catch {
    return Object.freeze({ ok: false, reason: "storage_unavailable", command });
  }
}

export function writeSingularityRaceNarrationCommand(storage, command) {
  try {
    storage?.setItem?.(createSingularityRaceNarrationStorageKey(command?.roomId), JSON.stringify(command)); return Object.freeze({ ok: true, command });
  } catch {
    return Object.freeze({ ok: false, reason: "storage_unavailable", command });
  }
}

export function createSingularityRaceControlStorageKey(roomId = "") {
  return createRoomStorageKey(SINGULARITY_RACE_CONTROL_STORAGE_KEY, roomId);
}

export function createSingularityRaceTestBotsStorageKey(roomId = "") {
  return createRoomStorageKey(SINGULARITY_RACE_TEST_BOTS_STORAGE_KEY, roomId);
}

export function createSingularityRaceNarrationStorageKey(roomId = "") {
  return createRoomStorageKey(SINGULARITY_RACE_NARRATION_STORAGE_KEY, roomId);
}

export function publishSingularityRaceControlCommand(broadcast, command) {
  try {
    broadcast?.postMessage?.(command);
    return Object.freeze({ ok: true, command });
  } catch {
    return Object.freeze({ ok: false, reason: "broadcast_unavailable", command });
  }
}

export function openSingularityRaceControlBroadcast(scope = globalThis) {
  if (typeof scope?.BroadcastChannel !== "function") return null;
  try {
    return new scope.BroadcastChannel(SINGULARITY_RACE_CONTROL_BROADCAST_NAME);
  } catch {
    return null;
  }
}

export function shouldAcceptSingularityRaceControlCommand(command, options = {}) {
  if (command?.type !== SINGULARITY_RACE_CONTROL_TYPES.START_COUNTDOWN) return false;
  if (options.lastCommandId && command.commandId === options.lastCommandId) return false;
  if (options.roomId && command.roomId !== options.roomId) return false;
  return clampTime(command.gateOpensAtMs) > clampTime(options.nowMs ?? Date.now());
}

export function shouldAcceptSingularityRaceTestBotsCommand(command, options = {}) {
  if (command?.type !== SINGULARITY_RACE_CONTROL_TYPES.SET_TEST_BOTS) return false;
  if (options.lastCommandId && command.commandId === options.lastCommandId) return false;
  if (options.roomId && command.roomId !== options.roomId) return false;
  return Number.isInteger(command.botCount) && command.botCount >= 0 && command.botCount <= RESTORED_MARATHON_MAX_RUNNERS;
}

export function shouldAcceptSingularityRaceRoomClosedCommand(command, options = {}) {
  if (command?.type !== SINGULARITY_RACE_CONTROL_TYPES.ROOM_CLOSED) return false;
  if (options.lastCommandId && command.commandId === options.lastCommandId) return false;
  if (options.roomId && command.roomId !== options.roomId) return false;
  return clampTime(command.closedAtMs) > 0;
}

export function shouldAcceptSingularityRaceNarrationCommand(command, options = {}) {
  if (command?.type !== SINGULARITY_RACE_CONTROL_TYPES.NARRATION_START) return false;
  if (options.lastCommandId && command.commandId === options.lastCommandId) return false;
  if (options.roomId && command.roomId !== options.roomId) return false;
  const nowMs = clampTime(options.nowMs ?? Date.now());
  const maxAgeMs = Math.max(1000, clampTime(options.maxAgeMs ?? 30000));
  const createdAtMs = clampTime(command.createdAtMs);
  return createdAtMs > 0 && nowMs - createdAtMs <= maxAgeMs;
}

export function getSingularityRaceControlPhase(command, nowMs = Date.now()) {
  if (!command) return "waiting";
  return clampTime(nowMs) < clampTime(command.gateOpensAtMs) ? "countdown" : "running";
}

export function getSingularityRaceControlPhaseLabel(command, nowMs = Date.now()) {
  return ({ waiting: "대기 중", countdown: "카운트다운", running: "진행 중" })[getSingularityRaceControlPhase(command, nowMs)];
}

export function validateSingularityRaceControlContract() {
  const errors = [];
  const command = createSingularityRaceStartCountdownCommand({ nowMs: 1000, roomId: "room:test" });
  const bots = createSingularityRaceTestBotsCommand({ nowMs: 1000, roomId: "room:test", botCount: RESTORED_MARATHON_MAX_RUNNERS });
  const closed = createSingularityRaceRoomClosedCommand({ nowMs: 3000, roomId: "room:test" });
  const narration = createSingularityRaceNarrationCommand({ nowMs: 4000, roomId: "room:test" });
  const stored = new Map();
  const storage = {
    getItem(key) {
      return stored.get(key) || null;
    },
    setItem(key, value) {
      stored.set(key, String(value));
    }
  };
  writeSingularityRaceControlCommand(storage, command);
  writeSingularityRaceTestBotsCommand(storage, bots);
  writeSingularityRaceControlCommand(storage, closed);
  writeSingularityRaceNarrationCommand(storage, narration);
  if (command.type !== "start_countdown" || command.gateOpensAtMs !== 1000 + SINGULARITY_RACE_START_COUNTDOWN_MS) errors.push("start countdown command must keep the configured gate delay");
  if (bots.type !== "set_test_bots" || bots.botCount !== RESTORED_MARATHON_MAX_RUNNERS) errors.push("test bot command must keep the requested bot count");
  if (!shouldAcceptSingularityRaceControlCommand(command, { nowMs: 1000 })) errors.push("future countdown command should be accepted");
  if (shouldAcceptSingularityRaceControlCommand(command, { nowMs: 12000 })) errors.push("expired countdown command should be ignored");
  if (shouldAcceptSingularityRaceControlCommand(command, { roomId: "room:other", nowMs: 1000 })) errors.push("start commands from another room must be ignored");
  if (readSingularityRaceControlCommand(storage, "room:other")) errors.push("stored commands from another room must not be read");
  if (!stored.has(createSingularityRaceControlStorageKey("room:test"))) errors.push("start commands should be stored under a room-scoped key");
  if (stored.has(SINGULARITY_RACE_CONTROL_STORAGE_KEY)) errors.push("start commands should not reuse the global key when roomId exists");
  if (!shouldAcceptSingularityRaceTestBotsCommand(bots, { roomId: "room:test" })) errors.push("test bot commands should be accepted for the matching room");
  if (!readSingularityRaceTestBotsCommand(storage, "room:test")) errors.push("room-scoped test bot commands should be readable");
  if (getSingularityRaceControlPhaseLabel(null, 1000) !== "대기 중") errors.push("race control labels must stay Korean");
  if (!shouldAcceptSingularityRaceRoomClosedCommand(closed, { roomId: "room:test" })) errors.push("room closed commands should be accepted for the matching room");
  if (shouldAcceptSingularityRaceRoomClosedCommand(closed, { roomId: "room:other" })) errors.push("room closed commands from another room must be ignored");
  if (!shouldAcceptSingularityRaceNarrationCommand(narration, { roomId: "room:test", nowMs: 4500 })) errors.push("narration commands should be accepted for the matching room");
  if (shouldAcceptSingularityRaceNarrationCommand(narration, { roomId: "room:other", nowMs: 4500 })) errors.push("narration commands from another room must be ignored");
  if (shouldAcceptSingularityRaceNarrationCommand(narration, { roomId: "room:test", nowMs: 40000, maxAgeMs: 10000 })) errors.push("old narration commands should not replay forever");
  if (readSingularityRaceControlCommand(storage, "room:test")?.type !== "room_closed") errors.push("room closed command should persist through the control key");
  if (readSingularityRaceNarrationCommand(storage, "room:test")?.type !== "narration_start") errors.push("narration command should persist through its own room-scoped key");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function createRoomStorageKey(baseKey, roomId = "") {
  const safeId = String(roomId || "").trim();
  return safeId ? `${baseKey}:${safeKey(safeId)}` : baseKey;
}

function safeKey(value) {
  return String(value || "").trim().replace(/[^a-zA-Z0-9:_-]/g, "_");
}

function clampTime(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function clampInteger(value, min, max) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}
