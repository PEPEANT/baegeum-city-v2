"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");

run()
  .then(() => console.log("Singularity Race Cloudflare host contract smoke passed."))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

async function run() {
  const { SingularityRaceRoom } = await import(pathToFileURL(path.join(root, "workers/singularity-race-worker.js")).href);
  await assertUserRoomDirectory(SingularityRaceRoom);
  const room = new SingularityRaceRoom(createFakeDurableObjectState(), {});
  const roomId = "room:singularity-race:user:ABC123";
  const hostToken = "unit-host-token";
  const create = await jsonOf(await room.fetch(new Request(`https://unit.test/host/create?roomId=${encodeURIComponent(roomId)}&roomCode=ABC123`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ hostToken, hostClientId: "client:host", displayName: "Unit User Room" })
  })));
  assert.equal(create.status, 200, "host create should activate a user room");
  assert.deepEqual([create.body.ok, create.body.roomId, create.body.roomCode, create.body.roomKind], [true, roomId, "ABC123", "user"]);
  assert.deepEqual([create.body.roomActive, create.body.entryOpen, create.body.hostToken], [true, false, hostToken]);

  const wrongOpen = await jsonOf(await room.fetch(hostRequest("/host/open", "wrong-token")));
  assert.deepEqual([wrongOpen.status, wrongOpen.body.reason], [401, "host_unauthorized"], "wrong host token should be explicit");

  const disconnectRoom = new SingularityRaceRoom(createFakeDurableObjectState(), {});
  const disconnectToken = "unit-disconnect-token";
  const disconnectCreate = await jsonOf(await disconnectRoom.fetch(new Request("https://unit.test/host/create?roomId=room%3Asingularity-race%3Auser%3AQUIT01&roomCode=QUIT01", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ hostToken: disconnectToken, hostClientId: "client:quit-host", displayName: "Quit User Room" })
  })));
  assert.equal(disconnectCreate.status, 200, "disconnect-room create should activate a user room");
  const hostSession = createPlayerSession({ clientId: "client:quit-host", host: true });
  disconnectRoom.sessions.set(hostSession.clientId, hostSession);
  await disconnectRoom.disconnectSocket(createFakeSocket(hostSession), "closed");
  assert.deepEqual([disconnectRoom.roomActive, disconnectRoom.roomStatus, disconnectRoom.hostToken], [false, "closed", ""], "host leaving a user-room lobby should close the room");

  const open = await jsonOf(await room.fetch(hostRequest("/host/open", hostToken)));
  assert.deepEqual([open.status, open.body.entryOpen], [200, true], "host open should allow entry");

  const emptyStart = await jsonOf(await room.fetch(hostRequest("/host/start", hostToken)));
  assert.deepEqual([emptyStart.status, emptyStart.body.reason], [409, "no_players"], "host start with no players should be blocked");

  room.sessions.set("client:unit-player", createPlayerSession());
  const start = await jsonOf(await room.fetch(hostRequest("/host/start", hostToken)));
  assert.deepEqual([start.status, start.body.phase, start.body.entryOpen], [200, "countdown", false], "host start should move to countdown");

  const cancelRoom = new SingularityRaceRoom(createFakeDurableObjectState(), {});
  const cancelToken = "unit-cancel-token";
  const cancelCreate = await jsonOf(await cancelRoom.fetch(new Request("https://unit.test/host/create?roomId=room%3Asingularity-race%3Auser%3ACANCEL&roomCode=CANCEL", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ hostToken: cancelToken, hostClientId: "client:cancel-host", displayName: "Cancel User Room" })
  })));
  assert.equal(cancelCreate.status, 200, "cancel-room create should activate a user room");
  cancelRoom.sessions.set("client:unit-player", createPlayerSession());
  const earlyEnd = await jsonOf(await cancelRoom.fetch(hostRequest("/host/end", cancelToken)));
  assert.deepEqual([earlyEnd.status, earlyEnd.body.roomActive, earlyEnd.body.roomStatus, cancelRoom.hostToken], [200, false, "closed", ""], "host end before final results should cancel and close the room");

  const now = Date.now();
  const player = room.sessions.get("client:unit-player");
  Object.assign(player, {
    progressPercent: 100,
    finishedAtMs: now - 31000
  });
  room.sessions.set(player.clientId, player);
  Object.assign(room, {
    phase: "racing",
    raceStartedAtMs: now - 60000,
    finishWindowStartedAtMs: now - 31000,
    finishWindowEndsAtMs: now - 1
  });
  assert.equal(room.refreshPhase(now), true, "expired finish window should create server result snapshot");
  assert.equal(room.resultSnapshot?.rankings?.[0]?.rank, 1, "server result snapshot should rank the player once");

  const end = await jsonOf(await room.fetch(hostRequest("/host/end", hostToken)));
  assert.deepEqual([end.status, end.body.roomActive, end.body.roomStatus, room.hostToken], [200, false, "closed", ""], "host end should close finalized room and clear token");
  if (room.countdownTimer) clearTimeout(room.countdownTimer);
  if (room.serverTickTimer) clearTimeout(room.serverTickTimer);
}

async function assertUserRoomDirectory(SingularityRaceRoom) {
  const namespace = createFakeRoomNamespace(SingularityRaceRoom);
  const publicRoom = namespace.getRoom("room:singularity-race:public-001");
  const create = await jsonOf(await publicRoom.fetch(new Request("https://unit.test/rooms/create", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ hostClientId: "client:directory-host", displayName: "Directory Room" })
  })));
  assert.equal(create.status, 200, "public room registry should create a user room");
  const summary = await jsonOf(await publicRoom.fetch(new Request("https://unit.test/summary?includeUserRooms=1")));
  assert.equal(summary.status, 200, "public summary should expose room directory");
  assert.equal(summary.body.userRooms.length, 1, "public summary should include active user rooms");
  assert.equal(summary.body.userRooms[0].roomId, create.body.roomId, "directory entry should point at the created room");
  assert.equal(summary.body.userRooms[0].participants, undefined, "directory entries should not include participant snapshots");
  assert.ok(summary.body.rooms.some((room) => room.roomId === create.body.roomId), "combined room list should include the created room");
}

function hostRequest(pathname, hostToken) {
  return new Request(`https://unit.test${pathname}`, {
    method: "POST",
    headers: { "X-Host-Token": hostToken, "content-type": "application/json" }
  });
}

function createPlayerSession(options = {}) {
  const now = Date.now();
  return {
    clientId: options.clientId || "client:unit-player",
    participantId: `runner:${options.clientId || "client:unit-player"}`,
    participantType: "player",
    displayName: options.displayName || "Unit Player",
    host: Boolean(options.host),
    progressPercent: 4,
    laneOffsetPx: 0,
    finishedAtMs: null,
    lastMovementTickAtMs: now,
    lastInputAtMs: now,
    inputWindowStartedAtMs: now,
    inputCount: 0
  };
}

function createFakeSocket(session) {
  return { deserializeAttachment: () => session, send() {}, close() {} };
}

function createFakeRoomNamespace(RoomClass) {
  const rooms = new Map();
  const env = { SINGULARITY_RACE_ROOM: { idFromName: (name) => name, get: (id) => ({ fetch: (request) => getRoom(id).fetch(request) }) } };
  function getRoom(roomId) {
    const key = String(roomId);
    if (!rooms.has(key)) rooms.set(key, new RoomClass(createFakeDurableObjectState(), env));
    return rooms.get(key);
  }
  return { getRoom };
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

async function jsonOf(response) {
  return { status: response.status, body: await response.json() };
}
