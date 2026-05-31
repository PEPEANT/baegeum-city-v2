"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const playerSource = fs.readFileSync(path.join(root, "singularity-race.html"), "utf8");
const adminSource = fs.readFileSync(path.join(root, "singularity-race-admin.html"), "utf8");

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const control = await import(pathToFileURL(path.join(root, "src/restored/games/singularity-race-control.js")));
  const registry = await import(pathToFileURL(path.join(root, "src/restored/online/marathon-dev-room-registry.js")));
  const adapterModule = await import(pathToFileURL(path.join(root, "src/restored/online/marathon-room-adapter.js")));
  const storage = createMemoryStorage();
  const roomId = "room:singularity-race:dev-777";

  registry.upsertRestoredMarathonDevRoom(storage, { roomId, displayName: "Close Smoke", createdAtMs: 1000 });
  const closed = registry.closeRestoredMarathonDevRoom(storage, roomId, { closedAtMs: 2000 });
  const rooms = registry.createRestoredMarathonRoomsFromDevRegistry(closed.rooms, { serverTimeMs: 3000 });
  const adapter = adapterModule.createDevConnectedMarathonRoomAdapter({ devRooms: closed.rooms });
  const join = adapterModule.joinConnectedMarathonRoom(adapter, { roomId, participantId: "runner:closed", sequence: 1 });
  const closeCommand = control.createSingularityRaceRoomClosedCommand({ nowMs: 2000, roomId });

  control.writeSingularityRaceControlCommand(storage, closeCommand);

  assert.equal(closed.room.phase, "closed", "closing a dev room should keep a closed registry record");
  assert.equal(rooms[0].phase, "abandoned", "closed dev rooms should become abandoned adapter rooms");
  assert.equal(join.ok, false, "closed rooms should reject joins");
  assert.equal(join.reason, "room_closed", "closed room join failure should be explicit");
  assert(control.shouldAcceptSingularityRaceRoomClosedCommand(closeCommand, { roomId }), "matching close command should be accepted");
  assert.equal(control.readSingularityRaceControlCommand(storage, roomId).type, "room_closed", "close command should persist in the control key");

  assert(adminSource.includes("closeRestoredMarathonDevRoom"), "admin page should close rooms instead of only deleting them");
  assert(adminSource.includes("deleteRestoredMarathonDevRoom"), "admin page should also expose a full room delete path");
  assert(adminSource.includes("admin-remove-room-button"), "admin page should expose a separate room delete button");
  assert(adminSource.includes("room_deleted"), "admin room delete should clear room relay packets with a delete reason");
  assert(adminSource.includes("createSingularityRaceRoomClosedCommand"), "admin page should broadcast a room_closed command");
  assert(adminSource.includes("reason: \"room_closed\""), "admin relay cleanup should use a room_closed reason");
  assert(adminSource.includes("방 종료"), "admin page should expose a room close action");
  assert(playerSource.includes("race-room-closed-panel"), "player page should show a room closed panel");
  assert(playerSource.includes("applyRoomClosedControlCommand"), "player page should listen for room close commands");
  assert(playerSource.includes("closeRaceRoomFromHost"), "player page should terminate the active session on room close");
  assert(playerSource.includes("leaveClosedRoom"), "player page should offer a leave path after room close");
  assert(playerSource.includes("state.roomClosed"), "player input and lobby gates should use roomClosed state");
  assert(playerSource.includes("shouldAcceptSingularityRaceRoomClosedCommand"), "player page should filter room close commands by room");

  console.log("Singularity Race room close smoke passed.");
}

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value))
  };
}
