export const RESTORED_MARATHON_INPUT_CONTRACT_VERSION = "restored-marathon-input-001";
export const RESTORED_MARATHON_INPUT_VERSION = RESTORED_MARATHON_INPUT_CONTRACT_VERSION;

export const RESTORED_MARATHON_INPUT_KEYS = Object.freeze(["KeyW", "KeyA", "KeyS", "KeyD", "ShiftLeft", "ShiftRight", "KeyE"]);
export const RESTORED_MARATHON_POINTER_ACTIONS = Object.freeze(["none", "aim", "attack"]);
export const RESTORED_MARATHON_RUN_MODES = Object.freeze(["idle", "walk", "run", "sprint", "skill", "attack"]);

export function createRestoredMarathonInputFrame(options = {}) {
  const keys = normalizeKeys(options.keys);
  const intent = normalizeRaceIntent(options.intent || options.raceIntent);
  const direction = normalizeDirection(options.direction || directionFromKeys(keys));
  const pointer = normalizePointer(options.pointer);
  const skillPressed = Boolean(options.skillPressed || keys.KeyE);
  const attacking = pointer.action === "attack";
  const mode = chooseRunMode({ direction, intent, keys, skillPressed, attacking });
  return Object.freeze({
    version: RESTORED_MARATHON_INPUT_VERSION,
    participantId: options.participantId || "",
    sequence: Math.max(1, Number(options.sequence || 1)),
    keys,
    intent,
    direction,
    pointer,
    skillPressed,
    attacking,
    mode,
    pace: paceForMode(mode),
    movementLocked: attacking,
    staminaCostPerSecond: staminaCostForMode(mode)
  });
}

export function createRestoredMarathonInputPacket(inputFrame, options = {}) {
  const frame = createRestoredMarathonInputFrame(inputFrame);
  return Object.freeze({
    type: "input_update",
    roomId: options.roomId || "",
    participantId: frame.participantId,
    sequence: frame.sequence,
    payload: Object.freeze({
      intent: frame.intent,
      direction: frame.direction,
      pointer: frame.pointer,
      skillPressed: frame.skillPressed,
      attacking: frame.attacking,
      mode: frame.mode,
      pace: frame.pace
    })
  });
}

export function validateRestoredMarathonInputContract() {
  const errors = [];
  const sprint = createRestoredMarathonInputFrame({
    participantId: "runner:test",
    keys: ["KeyW", "ShiftLeft"],
    sequence: 2
  });
  if (sprint.mode !== "sprint" || sprint.pace !== "sprint") errors.push("Shift + WASD should sprint");
  const attack = createRestoredMarathonInputFrame({
    participantId: "runner:test",
    keys: ["KeyW"],
    pointer: { action: "attack", x: 10, y: 0 },
    sequence: 3
  });
  if (!attack.movementLocked || attack.mode !== "attack") errors.push("mouse attack should lock movement");
  const skill = createRestoredMarathonInputFrame({ participantId: "runner:test", keys: ["KeyE"], sequence: 4 });
  if (!skill.skillPressed || skill.mode !== "skill") errors.push("E should request a skill frame");
  const mobile = createRestoredMarathonInputFrame({
    participantId: "runner:mobile",
    keys: ["ShiftLeft"],
    intent: { forward: 1, lateral: -0.5 },
    sequence: 5
  });
  if (mobile.mode !== "sprint" || mobile.intent.forward !== 1 || mobile.intent.lateral !== -0.5) {
    errors.push("mobile race intent should drive sprint/run mode without WASD");
  }
  const packet = createRestoredMarathonInputPacket(sprint, { roomId: "room:test" });
  if (packet.payload.pace !== "sprint" || packet.type !== "input_update") errors.push("input packet should preserve pace");
  const mobilePacket = createRestoredMarathonInputPacket(mobile, { roomId: "room:test" });
  if (mobilePacket.payload.intent?.forward !== 1 || mobilePacket.payload.intent?.lateral !== -0.5) errors.push("input packet should preserve race intent");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function normalizeKeys(keysInput = {}) {
  const source = Array.isArray(keysInput)
    ? Object.fromEntries(keysInput.map((key) => [key, true]))
    : keysInput;
  return Object.freeze(Object.fromEntries(RESTORED_MARATHON_INPUT_KEYS.map((key) => [key, Boolean(source[key])])));
}

function directionFromKeys(keys) {
  const x = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  const y = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);
  return normalizeDirection({ x, y });
}

function normalizeDirection(direction) {
  const x = clamp(Number(direction.x || 0), -1, 1);
  const y = clamp(Number(direction.y || 0), -1, 1);
  const length = Math.hypot(x, y);
  if (!length) return Object.freeze({ x: 0, y: 0 });
  return Object.freeze({ x: round3(x / length), y: round3(y / length) });
}

function normalizeRaceIntent(intentInput = null) {
  if (!intentInput || typeof intentInput !== "object") return null;
  const forward = round3(clamp(Number(intentInput.forward || 0), 0, 1));
  const lateral = round3(clamp(Number(intentInput.lateral || 0), -1, 1));
  if (Math.abs(forward) < 0.08 && Math.abs(lateral) < 0.08) return null;
  return Object.freeze({
    forward: Math.abs(forward) < 0.08 ? 0 : forward,
    lateral: Math.abs(lateral) < 0.08 ? 0 : lateral
  });
}

function normalizePointer(pointer = {}) {
  const action = RESTORED_MARATHON_POINTER_ACTIONS.includes(pointer.action) ? pointer.action : "none";
  return Object.freeze({
    action,
    x: round3(Number(pointer.x || 0)),
    y: round3(Number(pointer.y || 0))
  });
}

function chooseRunMode({ direction, intent, keys, skillPressed, attacking }) {
  if (attacking) return "attack";
  if (skillPressed) return "skill";
  const moving = Boolean((intent && (intent.forward || intent.lateral)) || direction.x || direction.y);
  if (!moving) return "idle";
  if (keys.ShiftLeft || keys.ShiftRight) return "sprint";
  return "run";
}

function paceForMode(mode) {
  if (mode === "sprint") return "sprint";
  if (mode === "attack" || mode === "skill") return "recover";
  if (mode === "idle") return "recover";
  return "push";
}

function staminaCostForMode(mode) {
  if (mode === "sprint") return 18;
  if (mode === "attack") return 10;
  if (mode === "skill") return 8;
  if (mode === "run") return 4;
  return -8;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}

function round3(value) {
  return Math.round(value * 1000) / 1000;
}
