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
  assert.equal(missingSecret.status, 503, "admin state without ADMIN_TOKEN should return 503");
  assert.equal(missingSecret.body.ok, false, "missing ADMIN_TOKEN response must be ok:false");
  assert.equal(missingSecret.body.reason, "admin_token_not_configured", "missing ADMIN_TOKEN should be explicit");

  const wrongToken = await jsonOf(await room.fetch(new Request("https://unit.test/admin/state", {
    headers: { Authorization: "Bearer wrong-token" }
  })));
  assert.equal(wrongToken.status, 401, "wrong admin token should return 401");
  assert.equal(wrongToken.body.ok, false, "wrong admin token response must be ok:false");
  assert.equal(wrongToken.body.reason, "admin_unauthorized", "wrong admin token should be explicit");

  const state = await jsonOf(await room.fetch(adminRequest("/admin/state")));
  assert.equal(state.status, 200, "admin state with token should succeed");
  assert.equal(state.body.ok, true, "admin state should be ok:true");
  assert.equal(state.body.entryOpen, false, "fresh public room should wait for admin user-entry open");

  const emptyStart = await jsonOf(await room.fetch(adminRequest("/admin/start", { method: "POST" })));
  assert.equal(emptyStart.status, 409, "admin start with no players should be blocked");
  assert.equal(emptyStart.body.ok, false, "admin start with no players must be ok:false");
  assert.equal(emptyStart.body.reason, "no_players", "admin start with no players should be explicit");

  const queuedPlayerSession = createPlayerSession();
  room.sessions.set("client:unit-player", queuedPlayerSession);
  const queuedStart = await jsonOf(await room.fetch(adminRequest("/admin/start", { method: "POST" })));
  assert.equal(queuedStart.status, 409, "admin start before in-game entry should be blocked");
  assert.equal(queuedStart.body.ok, false, "admin start before in-game entry must be ok:false");
  assert.equal(queuedStart.body.reason, "entry_not_open", "admin start should wait for in-game entry open after queue joins");
  room.sessions.delete("client:unit-player");

  const close = await jsonOf(await room.fetch(adminRequest("/admin/close", { method: "POST" })));
  assert.equal(close.status, 200, "admin close should succeed in lobby");
  assert.equal(close.body.entryOpen, false, "admin close should close entry");

  const open = await jsonOf(await room.fetch(adminRequest("/admin/open", { method: "POST" })));
  assert.equal(open.status, 200, "admin open should succeed in lobby");
  assert.equal(open.body.entryOpen, true, "admin open should reopen entry");

  const stagingSession = createPlayerSession();
  room.sessions.set("client:unit-player", stagingSession);
  await assertPaddockMovementBeforeAdminStart(room, stagingSession);
  room.sessions.delete("client:unit-player");

  const map = await jsonOf(await room.fetch(adminRequest("/admin/map", {
    method: "POST",
    body: JSON.stringify({ mapId: "singularity-maze-run" })
  })));
  assert.equal(map.status, 200, "admin map should succeed in lobby");
  assert.equal(map.body.mapId, "singularity-maze-run", "admin map should update room map id");

  const playerSession = createPlayerSession();
  room.sessions.set("client:unit-player", playerSession);
  await assertPlayerStartBlocked(room, playerSession);

  const start = await jsonOf(await room.fetch(adminRequest("/admin/start", { method: "POST" })));
  assert.equal(start.status, 200, "admin start with a player should succeed");
  assert.equal(start.body.ok, true, "admin start with a player should be ok:true");
  assert.equal(start.body.phase, "countdown", "admin start should move room to countdown");
  assert.equal(start.body.entryOpen, false, "admin start should close new entry");

  await assertLastIntentTickMovement(room, playerSession);
  assertFinishedPhaseClosesEntry(room, playerSession);
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
  await room.webSocketMessage(createFakeSocket(playerSession), JSON.stringify({
    type: "input_update",
    sequence: 6,
    payload: {
      intent: { forward: 1, lateral: 1 },
      direction: { x: 1, y: 0 },
      mode: "sprint",
      pace: "sprint"
    }
  }));
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
  await room.webSocketMessage(createFakeSocket(tickSession), JSON.stringify({
    type: "input_update",
    sequence: 8,
    payload: {
      intent: { forward: 1, lateral: 0 },
      direction: { x: 1, y: 0 },
      mode: "run",
      pace: "run"
    }
  }));
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

function assertFinishedPhaseClosesEntry(room, playerSession) {
  room.phase = "racing";
  room.sessions.set("client:unit-player", { ...playerSession, finishedAtMs: Date.now() });
  assert.equal(room.refreshPhase(Date.now()), true, "all finished players should close the racing phase");
  assert.equal(room.phase, "finished", "all finished players should move the room to finished");
  assert.equal(room.entryOpen, false, "finished room should wait for admin to reopen entry");
}

function createPlayerSession() {
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
    lastInputAtMs: now,
    lastInputPayload: null,
    lastInputReceivedAtMs: 0,
    lastMovementTickAtMs: now,
    lastSequence: 0,
    inputWindowStartedAtMs: now,
    inputCount: 0
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

function lastPacketOfType(packets, type) {
  return [...packets].reverse().find((packet) => packet.type === type) || null;
}

async function jsonOf(response) {
  return { status: response.status, body: await response.json() };
}

assertWorkerAdminEndpointContracts()
  .then(() => {
    console.log("Singularity Race Cloudflare Worker contract smoke passed.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
