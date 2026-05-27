export const SINGULARITY_RACE_START_COUNTDOWN_MS = 10000;
export const SINGULARITY_RACE_CONTROL_STORAGE_KEY = "singularity-race:race-control:v1";
export const SINGULARITY_RACE_CONTROL_BROADCAST_NAME = "singularity-race:race-control-relay:v1";
export const SINGULARITY_RACE_CONTROL_TYPES = Object.freeze({ START_COUNTDOWN: "start_countdown" });

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

export function writeSingularityRaceControlCommand(storage, command) {
  try {
    storage?.setItem?.(SINGULARITY_RACE_CONTROL_STORAGE_KEY, JSON.stringify(command));
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
  return clampTime(command.gateOpensAtMs) > clampTime(options.nowMs ?? Date.now());
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
  if (command.type !== "start_countdown" || command.gateOpensAtMs !== 11000) errors.push("start countdown command must keep the 10 second gate delay");
  if (!shouldAcceptSingularityRaceControlCommand(command, { nowMs: 1000 })) errors.push("future countdown command should be accepted");
  if (shouldAcceptSingularityRaceControlCommand(command, { nowMs: 12000 })) errors.push("expired countdown command should be ignored");
  if (getSingularityRaceControlPhaseLabel(null, 1000) !== "대기 중") errors.push("race control labels must stay Korean");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function clampTime(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}
