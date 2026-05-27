export const SINGULARITY_RACE_START_COUNTDOWN_MS = 10000;
export const SINGULARITY_RACE_CONTROL_STORAGE_KEY = "singularity-race:race-control:v1";
export const SINGULARITY_RACE_TEST_BOTS_STORAGE_KEY = "singularity-race:test-bots:v1";
export const SINGULARITY_RACE_CONTROL_BROADCAST_NAME = "singularity-race:race-control-relay:v1";
export const SINGULARITY_RACE_CONTROL_TYPES = Object.freeze({
  START_COUNTDOWN: "start_countdown",
  SET_TEST_BOTS: "set_test_bots"
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
  const botCount = clampInteger(options.botCount, 0, 30);
  return Object.freeze({
    type: SINGULARITY_RACE_CONTROL_TYPES.SET_TEST_BOTS,
    commandId: options.commandId || `host:test-bots:${botCount}:${nowMs}`,
    roomId: options.roomId || "room:singularity-race:dev-001",
    sourceClientId: options.sourceClientId || "client:singularity-race-host",
    botCount,
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
  const command = parseSingularityRaceControlCommand(storage?.getItem?.(SINGULARITY_RACE_CONTROL_STORAGE_KEY));
  return command && (!roomId || command.roomId === roomId) ? command : null;
}

export function readSingularityRaceTestBotsCommand(storage, roomId = "") {
  const command = parseSingularityRaceControlCommand(storage?.getItem?.(SINGULARITY_RACE_TEST_BOTS_STORAGE_KEY));
  return command?.type === SINGULARITY_RACE_CONTROL_TYPES.SET_TEST_BOTS && (!roomId || command.roomId === roomId)
    ? command
    : null;
}

export function writeSingularityRaceControlCommand(storage, command) {
  try {
    storage?.setItem?.(SINGULARITY_RACE_CONTROL_STORAGE_KEY, JSON.stringify(command));
    return Object.freeze({ ok: true, command });
  } catch {
    return Object.freeze({ ok: false, reason: "storage_unavailable", command });
  }
}

export function writeSingularityRaceTestBotsCommand(storage, command) {
  try {
    storage?.setItem?.(SINGULARITY_RACE_TEST_BOTS_STORAGE_KEY, JSON.stringify(command));
    return Object.freeze({ ok: true, command });
  } catch {
    return Object.freeze({ ok: false, reason: "storage_unavailable", command });
  }
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
  return Number.isInteger(command.botCount) && command.botCount >= 0 && command.botCount <= 30;
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
  const bots = createSingularityRaceTestBotsCommand({ nowMs: 1000, roomId: "room:test", botCount: 29 });
  if (command.type !== "start_countdown" || command.gateOpensAtMs !== 11000) errors.push("start countdown command must keep the 10 second gate delay");
  if (bots.type !== "set_test_bots" || bots.botCount !== 29) errors.push("test bot command must keep the requested bot count");
  if (!shouldAcceptSingularityRaceControlCommand(command, { nowMs: 1000 })) errors.push("future countdown command should be accepted");
  if (shouldAcceptSingularityRaceControlCommand(command, { nowMs: 12000 })) errors.push("expired countdown command should be ignored");
  if (!shouldAcceptSingularityRaceTestBotsCommand(bots, { roomId: "room:test" })) errors.push("test bot commands should be accepted for the matching room");
  if (getSingularityRaceControlPhaseLabel(null, 1000) !== "대기 중") errors.push("race control labels must stay Korean");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
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
