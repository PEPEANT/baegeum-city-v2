"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");

async function main() {
  const { SingularityRaceRoom } = await import(pathToFileURL(path.join(root, "workers/singularity-race-worker.js")).href);
  const room = new SingularityRaceRoom(createFakeDurableObjectState(), { ADMIN_TOKEN: "unit-admin-token" });
  room.roomStateLoaded = true;
  room.roomActive = true;
  await assertSignedReverseTickMovement(room);
  await assertServerOwnedSkillUse(room);
  if (room.serverTickTimer) clearTimeout(room.serverTickTimer);
  console.log("Singularity Race Cloudflare Worker skill smoke passed.");
}

async function assertSignedReverseTickMovement(room) {
  const session = createPlayerSession({ progressPercent: 50 });
  room.phase = "racing";
  room.sessions.set(session.clientId, session);
  const afterInput = room.sessions.get(session.clientId);
  Object.assign(afterInput, {
    lastInputPayload: { intent: { forward: -1, lateral: 0 }, direction: { x: 0, y: 1 }, mode: "run", pace: "run" },
    lastInputReceivedAtMs: Date.now(),
    lastMovementTickAtMs: Date.now() - 100
  });
  assert.equal(room.advanceRaceTick(Date.now()), true, "server tick should accept signed reverse intent");
  assert.ok(room.sessions.get(session.clientId).progressPercent < 50, "signed reverse intent should move backward");
}

async function assertServerOwnedSkillUse(room) {
  const now = Date.now();
  room.phase = "racing";
  room.entryOpen = false;
  room.sessions.clear();
  const caster = createPlayerSession({ clientId: "client:caster", participantId: "runner:client:caster", progressPercent: 20 });
  const target = createPlayerSession({ clientId: "client:target", participantId: "runner:client:target", lane: 2, progressPercent: 22, laneOffsetPx: 20 });
  room.sessions.set(caster.clientId, caster);
  room.sessions.set(target.clientId, target);
  await room.webSocketMessage(createFakeSocket(caster), packet("skill_use", 31, {
    skillId: "skill:side-bump",
    rewardGrade: "B",
    characterId: "runner:dopamine-sprinter",
    targetId: target.participantId
  }));
  const afterCaster = room.sessions.get(caster.clientId);
  const afterTarget = room.sessions.get(target.clientId);
  assert.equal(afterCaster.skillId, "skill:side-bump", "server skill should persist accepted skill id");
  assert.ok(afterCaster.skillCooldownUntilMs > now, "server skill should apply cooldown");
  assert.ok(afterTarget.stunnedUntilMs > now, "server skill should stun a nearby target");
  assert.ok(afterTarget.slowUntilMs > now, "server skill should slow a nearby target");
}

function createPlayerSession(overrides = {}) {
  const now = Date.now();
  return {
    clientId: "client:unit-player",
    participantId: "runner:client:unit-player",
    participantType: "player",
    displayName: "Unit Player",
    lane: 1,
    progressPercent: 4,
    laneOffsetPx: 0,
    finishedAtMs: null,
    collisionAtMs: 0,
    slowUntilMs: 0,
    stunnedUntilMs: 0,
    actionLockedUntilMs: 0,
    attackCooldownUntilMs: 0,
    lastInputPayload: null,
    lastInputReceivedAtMs: 0,
    lastMovementTickAtMs: now,
    inputWindowStartedAtMs: now,
    inputCount: 0,
    ...overrides
  };
}

function createFakeSocket(session) {
  return {
    deserializeAttachment: () => session,
    serializeAttachment() {},
    send() {}
  };
}

function createFakeDurableObjectState() {
  return {
    getWebSockets: () => [],
    acceptWebSocket: () => {},
    storage: { async get() { return new Map(); }, async put() {}, async setAlarm() {}, async deleteAlarm() {} }
  };
}

function packet(type, sequence, payload) {
  return JSON.stringify({ type, sequence, payload });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
