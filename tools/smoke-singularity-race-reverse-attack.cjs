"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");

function fakeState() {
  return {
    getWebSockets: () => [],
    acceptWebSocket: () => {},
    storage: {
      async get(keys) {
        return new Map(keys.map((key) => [key, undefined]));
      },
      async put() {},
      async setAlarm() {},
      async deleteAlarm() {}
    }
  };
}

function session(overrides = {}) {
  const now = Date.now();
  return {
    clientId: "client:unit-player",
    participantId: "runner:client:unit-player",
    participantType: "player",
    displayName: "Unit Player",
    progressPercent: 10,
    laneOffsetPx: 0,
    finishedAtMs: null,
    slowUntilMs: 0,
    stunnedUntilMs: 0,
    actionLockedUntilMs: 0,
    attackCooldownUntilMs: 0,
    lastAttackSequence: 0,
    lastInputPayload: null,
    lastInputReceivedAtMs: now,
    lastMovementTickAtMs: now,
    inputWindowStartedAtMs: now,
    inputCount: 0,
    ...overrides
  };
}

function socketFor(attachedSession) {
  return {
    sent: [],
    deserializeAttachment: () => attachedSession,
    serializeAttachment() {},
    send(value) {
      this.sent.push(JSON.parse(value));
    }
  };
}

async function main() {
  const workerUrl = pathToFileURL(path.join(root, "workers/singularity-race-worker.js")).href;
  const { SingularityRaceRoom } = await import(workerUrl);
  const room = new SingularityRaceRoom(fakeState(), { ADMIN_TOKEN: "unit-admin-token" });
  const now = Date.now();
  Object.assign(room, { roomStateLoaded: true, roomActive: true, entryOpen: true, phase: "lobby" });

  const attacker = session({
    clientId: "client:reverse-attacker",
    participantId: "runner:client:reverse-attacker",
    lastInputPayload: {
      intent: { forward: -1, lateral: 0 },
      direction: { x: 1, y: 0 },
      mode: "run",
      pace: "run"
    },
    lastInputReceivedAtMs: now
  });
  const front = session({ clientId: "client:front", participantId: "runner:client:front", progressPercent: 12 });
  const back = session({ clientId: "client:back", participantId: "runner:client:back", progressPercent: 8 });
  [attacker, front, back].forEach((entry) => room.sessions.set(entry.clientId, entry));

  await room.webSocketMessage(socketFor(attacker), JSON.stringify({ type: "attack_action", sequence: 31, payload: {} }));

  assert.equal(room.sessions.get(front.clientId).stunnedUntilMs, 0, "reverse fallback attack must miss the target in front");
  assert.ok(room.sessions.get(back.clientId).stunnedUntilMs > now, "reverse fallback attack must hit the target behind");
}

main()
  .then(() => console.log("Singularity Race reverse attack smoke passed."))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
