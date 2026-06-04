"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");

async function assertWorkerAdminEndpointContracts() {
  const { SingularityRaceRoom } = await import(pathToFileURL(path.join(root, "workers/singularity-race-worker.js")).href);
  const room = new SingularityRaceRoom(createFakeDurableObjectState(), { ADMIN_TOKEN: "unit-admin-token" });
  const missingSecretRoom = new SingularityRaceRoom(createFakeDurableObjectState(), {});

  const missingSecret = await jsonOf(await missingSecretRoom.fetch(new Request("https://unit.test/admin/state")));
  assert.deepEqual([missingSecret.status, missingSecret.body.ok, missingSecret.body.reason], [503, false, "admin_token_not_configured"], "missing ADMIN_TOKEN should be explicit");

  const wrongToken = await jsonOf(await room.fetch(new Request("https://unit.test/admin/state", {
    headers: { Authorization: "Bearer wrong-token" }
  })));
  assert.deepEqual([wrongToken.status, wrongToken.body.ok, wrongToken.body.reason], [401, false, "admin_unauthorized"], "wrong admin token should be explicit");

  const state = await jsonOf(await room.fetch(adminRequest("/admin/state")));
  assert.deepEqual([state.status, state.body.ok, state.body.roomActive, state.body.entryOpen], [200, true, false, false], "fresh public room should wait for admin create and entry open");

  const inactiveStart = await jsonOf(await room.fetch(adminRequest("/admin/start", { method: "POST" })));
  assert.deepEqual([inactiveStart.status, inactiveStart.body.reason], [409, "room_not_created"], "admin start before room create should be explicit");

  const inactiveOpen = await jsonOf(await room.fetch(adminRequest("/admin/open", { method: "POST" })));
  assert.deepEqual([inactiveOpen.status, inactiveOpen.body.reason], [409, "room_not_created"], "admin entry open before room create should be explicit");

  const create = await jsonOf(await room.fetch(adminRequest("/admin/create", { method: "POST" })));
  assert.deepEqual([create.status, create.body.ok, create.body.roomActive, create.body.entryOpen], [200, true, true, false], "admin create should activate the fixed public room but keep entry closed");

  const emptyStart = await jsonOf(await room.fetch(adminRequest("/admin/start", { method: "POST" })));
  assert.deepEqual([emptyStart.status, emptyStart.body.ok, emptyStart.body.reason], [409, false, "no_players"], "admin start with no players should be explicit");

  const queuedPlayerSession = createPlayerSession();
  room.sessions.set("client:unit-player", queuedPlayerSession);
  const queuedStart = await jsonOf(await room.fetch(adminRequest("/admin/start", { method: "POST" })));
  assert.deepEqual([queuedStart.status, queuedStart.body.ok, queuedStart.body.reason], [409, false, "entry_not_open"], "admin start should wait for in-game entry open after queue joins");

  const queuedNarration = await jsonOf(await room.fetch(adminRequest("/admin/narration", { method: "POST", body: JSON.stringify({ scriptId: "singularity-race-intro-001" }) })));
  assert.deepEqual([queuedNarration.status, queuedNarration.body.reason], [409, "entry_not_open"], "admin narration should wait for in-game entry open");
  room.sessions.delete("client:unit-player");

  const close = await jsonOf(await room.fetch(adminRequest("/admin/close", { method: "POST" })));
  assert.deepEqual([close.status, close.body.entryOpen], [200, false], "admin close should close entry");

  const open = await jsonOf(await room.fetch(adminRequest("/admin/open", { method: "POST" })));
  assert.deepEqual([open.status, open.body.entryOpen], [200, true], "admin open should reopen entry");

  const emptyNarration = await jsonOf(await room.fetch(adminRequest("/admin/narration", { method: "POST", body: JSON.stringify({ scriptId: "singularity-race-intro-001" }) })));
  assert.deepEqual([emptyNarration.status, emptyNarration.body.reason], [409, "no_players"], "admin narration should require at least one player");

  const stagingSession = createPlayerSession();
  room.sessions.set("client:unit-player", stagingSession);
  const narration = await jsonOf(await room.fetch(adminRequest("/admin/narration", { method: "POST", body: JSON.stringify({ scriptId: "singularity-race-intro-001" }) })));
  assert.deepEqual([narration.status, narration.body.action, narration.body.scriptId], [200, "narration", "singularity-race-intro-001"], "admin narration should succeed once players are in the opened staging room");
  await assertPaddockMovementBeforeAdminStart(room, stagingSession);
  room.sessions.delete("client:unit-player");

  const map = await jsonOf(await room.fetch(adminRequest("/admin/map", { method: "POST", body: JSON.stringify({ mapId: "singularity-maze-run" }) })));
  assert.deepEqual([map.status, map.body.mapId], [200, "singularity-maze-run"], "admin map should update room map id");

  const playerSession = createPlayerSession();
  room.sessions.set("client:unit-player", playerSession);
  await assertPlayerStartBlocked(room, playerSession);

  const start = await jsonOf(await room.fetch(adminRequest("/admin/start", { method: "POST" })));
  assert.deepEqual([start.status, start.body.ok, start.body.phase, start.body.entryOpen], [200, true, "countdown", false], "admin start should move room to countdown and close new entry");

  await assertLastIntentTickMovement(room, playerSession);
  await assertServerOwnedAttackStun(room);
  assertFinishedPhaseClosesEntry(room, playerSession);
  const deactivate = await jsonOf(await room.fetch(adminRequest("/admin/deactivate", { method: "POST" })));
  assert.deepEqual([deactivate.status, deactivate.body.ok, deactivate.body.roomActive], [200, true, false], "admin deactivate should make the room inactive");
  if (room.countdownTimer) clearTimeout(room.countdownTimer);
  if (room.serverTickTimer) clearTimeout(room.serverTickTimer);
}

async function assertPlayerStartBlocked(room, playerSession) {
  const playerSocket = createFakeSocket(playerSession);
  await room.webSocketMessage(playerSocket, JSON.stringify({ type: "start_request", payload: {} }));
  assert.equal(room.phase, "lobby", "player start_request must not move the room out of lobby");
  assert.equal(lastPacketOfType(playerSocket.sent, "error")?.payload?.reason, "admin_start_required", "player start_request should be rejected explicitly");
}

async function assertPaddockMovementBeforeAdminStart(room, playerSession) {
  const now = Date.now();
  room.phase = "lobby";
  room.entryOpen = true;
  Object.assign(playerSession, {
    progressPercent: 4,
    laneOffsetPx: 0,
    finishedAtMs: null,
    lastInputPayload: null,
    lastInputReceivedAtMs: 0,
    lastMovementTickAtMs: now,
    inputWindowStartedAtMs: now,
    inputCount: 0
  });
  await room.webSocketMessage(createFakeSocket(playerSession), inputPacket(6, { intent: { forward: 1, lateral: 1 }, direction: { x: 1, y: 0 }, mode: "sprint", pace: "sprint" }));
  if (room.serverTickTimer) {
    clearTimeout(room.serverTickTimer);
    room.serverTickTimer = null;
  }
  const afterInputPacket = room.sessions.get("client:unit-player");
  assert.equal(afterInputPacket.progressPercent, 4, "paddock input should update last intent without packet-arrival movement");
  afterInputPacket.lastMovementTickAtMs = Date.now() - 250;
  assert.equal(room.advanceRaceTick(Date.now()), true, "lobby entry-open tick should move the runner inside the start paddock");
  const afterLobbyTick = room.sessions.get("client:unit-player");
  assert.ok(afterLobbyTick.progressPercent > 4, "paddock tick should advance from start line");
  assert.ok(afterLobbyTick.progressPercent <= 7.12, "paddock movement must stop before the start gate");

  room.phase = "countdown";
  room.entryOpen = false;
  Object.assign(afterLobbyTick, {
    progressPercent: 7.1,
    lastMovementTickAtMs: Date.now() - 250
  });
  assert.equal(room.advanceRaceTick(Date.now()), true, "countdown tick should still allow bounded paddock movement");
  assert.ok(room.sessions.get("client:unit-player").progressPercent <= 7.12, "countdown movement must remain blocked by the gate");
  room.phase = "lobby";
  room.entryOpen = true;
}

async function assertLastIntentTickMovement(room, playerSession) {
  const tickSession = {
    ...playerSession,
    progressPercent: 4,
    laneOffsetPx: 0,
    finishedAtMs: null,
    lastInputPayload: null,
    lastInputReceivedAtMs: 0,
    lastMovementTickAtMs: Date.now() - 100,
    inputWindowStartedAtMs: Date.now(),
    inputCount: 0
  };
  room.phase = "racing";
  room.sessions.set("client:unit-player", tickSession);
  await room.webSocketMessage(createFakeSocket(tickSession), inputPacket(8, { intent: { forward: 1, lateral: 0 }, direction: { x: 1, y: 0 }, mode: "run", pace: "run" }));
  if (room.serverTickTimer) {
    clearTimeout(room.serverTickTimer);
    room.serverTickTimer = null;
  }
  const afterInputPacket = room.sessions.get("client:unit-player");
  assert.equal(afterInputPacket.progressPercent, 4, "input packet should update last intent without moving the runner");
  afterInputPacket.lastMovementTickAtMs = Date.now() - 100;
  assert.equal(room.advanceRaceTick(Date.now()), true, "server tick should advance the runner from last accepted intent");
  assert.ok(room.sessions.get("client:unit-player").progressPercent > 4, "server tick should own progress advancement");
}

async function assertServerOwnedAttackStun(room) {
  const now = Date.now();
  room.phase = "lobby";
  room.entryOpen = true;
  room.countdownEndsAtMs = 0;
  room.sessions.clear();
  const attacker = createPlayerSession({ clientId: "client:attacker", participantId: "runner:client:attacker", displayName: "Attacker", progressPercent: 10, laneOffsetPx: 0, lastMovementTickAtMs: now });
  const target = createPlayerSession({ clientId: "client:target", participantId: "runner:client:target", displayName: "Target", lane: 2, progressPercent: 10.5, laneOffsetPx: 0, lastMovementTickAtMs: now });
  room.sessions.set(attacker.clientId, attacker);
  room.sessions.set(target.clientId, target);
  await room.webSocketMessage(createFakeSocket(attacker), attackPacket(21, { attackerId: "runner:spoofed", origin: { x: 999, y: 999 }, aim: { x: 1, y: 0 } }));
  const afterHitTarget = room.sessions.get(target.clientId);
  const afterHitAttacker = room.sessions.get(attacker.clientId);
  assert.ok(afterHitTarget.stunnedUntilMs > now, "server attack should stun a nearby target from authoritative positions");
  assert.ok(afterHitTarget.slowUntilMs > now, "server attack should carry a short impact slow");
  assert.ok(afterHitTarget.collisionAtMs >= now, "server attack should stamp target impact visuals");
  assert.ok(afterHitAttacker.attackCooldownUntilMs > now, "server attack should apply attacker cooldown");
  assert.equal(afterHitAttacker.lastAttackSequence, 21, "server attack should remember attack sequence");

  const beforeProgress = afterHitTarget.progressPercent;
  Object.assign(afterHitTarget, {
    lastInputPayload: { intent: { forward: 1, lateral: 0 }, direction: { x: 1, y: 0 }, mode: "sprint", pace: "sprint" },
    lastInputReceivedAtMs: Date.now(),
    lastMovementTickAtMs: Date.now() - 200
  });
  assert.equal(room.advanceRaceTick(Date.now()), false, "stunned server runner should not advance from held input");
  assert.equal(room.sessions.get(target.clientId).progressPercent, beforeProgress, "stunned server runner progress should remain fixed");

  const cooldownSocket = createFakeSocket(afterHitAttacker);
  await room.webSocketMessage(cooldownSocket, attackPacket(22, { aim: { x: 1, y: 0 } }));
  assert.equal(lastPacketOfType(cooldownSocket.sent, "rate_limited")?.payload?.reason, "attack_cooldown", "server attack should reject cooldown spam");
}

function assertFinishedPhaseClosesEntry(room, playerSession) {
  const now = Date.now();
  Object.assign(room, { phase: "racing", raceStartedAtMs: now - 60000, finishWindowStartedAtMs: 0, finishWindowEndsAtMs: 0 });
  room.sessions.clear(); room.sessions.set("client:unit-player", { ...playerSession, finishedAtMs: now });
  assert.equal(room.refreshPhase(now), true, "first finisher should start the finish window even when all current players are finished");
  assert.deepEqual([room.phase, room.finishWindowEndsAtMs], ["racing", now + 30000], "all finished players should wait through the fixed 30 second finish window");
  assert.equal(room.refreshPhase(room.finishWindowEndsAtMs + 1), true, "expired finish window should close the racing phase");
  assert.deepEqual([room.phase, room.entryOpen], ["finished", false], "finish-window expiry should move the room to finished and keep entry closed");
  assert.ok(room.resultSnapshot?.rankings?.length === 1, "finish-window expiry should create one authoritative result snapshot");
}

function createPlayerSession(overrides = {}) {
  const now = Date.now();
  return {
    clientId: "client:unit-player",
    participantId: "runner:client:unit-player",
    participantType: "player",
    host: false,
    displayName: "Unit Player",
    lane: 1,
    progressPercent: 4,
    laneOffsetPx: 0,
    finishedAtMs: null,
    collisionAtMs: 0,
    obstacleCollisionId: "",
    slowUntilMs: 0,
    stunnedUntilMs: 0,
    actionLockedUntilMs: 0,
    attackCooldownUntilMs: 0,
    lastAttackSequence: 0,
    lastInputAtMs: now,
    lastInputPayload: null,
    lastInputReceivedAtMs: 0,
    lastMovementTickAtMs: now,
    lastSequence: 0,
    inputWindowStartedAtMs: now,
    inputCount: 0,
    ...overrides
  };
}

function adminRequest(pathname, options = {}) {
  return new Request(`https://unit.test${pathname}`, {
    ...options,
    headers: {
      Authorization: "Bearer unit-admin-token",
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
}

function createFakeDurableObjectState() {
  const stored = new Map();
  return {
    getWebSockets: () => [],
    acceptWebSocket: () => {},
    storage: {
      async get(keys) {
        return new Map(keys.filter((key) => stored.has(key)).map((key) => [key, stored.get(key)]));
      },
      async put(value) {
        Object.entries(value).forEach(([key, next]) => stored.set(key, next));
      },
      async setAlarm() {},
      async deleteAlarm() {}
    }
  };
}

function createFakeSocket(session) {
  return {
    sent: [],
    deserializeAttachment: () => session,
    serializeAttachment() {},
    send(value) {
      this.sent.push(JSON.parse(value));
    }
  };
}

function inputPacket(sequence, payload) { return JSON.stringify({ type: "input_update", sequence, payload }); }
function attackPacket(sequence, payload) { return JSON.stringify({ type: "attack_action", sequence, payload }); }

function lastPacketOfType(packets, type) {
  return [...packets].reverse().find((packet) => packet.type === type) || null;
}

async function jsonOf(response) {
  return { status: response.status, body: await response.json() };
}

assertWorkerAdminEndpointContracts()
  .then(() => console.log("Singularity Race Cloudflare Worker contract smoke passed."))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
