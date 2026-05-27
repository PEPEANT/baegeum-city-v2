const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");

async function main() {
  const serverModule = await import(pathToFileURL(path.join(root, "src/restored/online/marathon-websocket-dev-server-mock.js")));
  const transportModule = await import(pathToFileURL(path.join(root, "src/restored/online/marathon-server-transport-contract.js")));
  let now = 0;
  const server = serverModule.createRestoredMarathonWebSocketDevServerMock({
    clock: () => now,
    course: { distanceMeters: 120, checkpointMeters: [0, 60, 120] }
  });
  const connected = server.connectClient({ clientId: "client:server-state-smoke" });
  assert.equal(connected.ok, true, "dev server should connect a test client");
  const joined = server.joinRoom(connected.transport, {
    participantId: "runner:server-state",
    nickname: "Server State",
    sequence: 2,
    mapVersion: "baegeum-city-v2-map-001"
  });
  assert.equal(joined.ok, true, "test client should join the room");
  const started = server.startRace(connected.transport, joined.room.roomId, { serverTimeMs: now });
  assert.equal(started.ok, true, "server should own race start");
  let room = started.room;
  for (let sequence = 3; sequence < 80 && room.phase !== "finished"; sequence += 1) {
    now += 1000;
    const input = transportModule.createRestoredMarathonTransportEnvelope("input_update", {
      participantId: "runner:server-state",
      pace: "sprint",
      raceTimeMs: now,
      direction: { x: 1, y: 0 }
    }, { clientId: connected.transport.clientId, roomId: room.roomId, sequence, serverTimeMs: now });
    const result = server.ingestClientEnvelope(connected.transport, input, { receivedAtMs: now, elapsedMs: 1000 });
    assert.equal(result.ok, true, `server input ${sequence} should be accepted`);
    room = result.room;
  }
  const runner = room.participants.find((participant) => participant.participantId === "runner:server-state");
  assert.equal(room.phase, "finished", "server-owned room should finish when the runner reaches the end");
  assert.equal(runner.progressMeters, 120, "server should clamp runner progress at the finish");
  assert(runner.finishedAtMs > 0, "server should stamp finish time");
  const snapshot = server.createStateSnapshot(room.roomId, { sequence: 90, localRunner: { x: 0, y: 0, progress: 0 }, elapsedMs: 50 });
  assert.equal(snapshot.ok, true, "server should emit a state snapshot after finish");
  const row = snapshot.snapshot.payload.participants.find((participant) => participant.participantId === "runner:server-state");
  assert.equal(snapshot.snapshot.payload.serverOwned, true, "snapshot must be server-owned");
  assert.equal(snapshot.snapshot.payload.movementAuthority, "server", "movement authority should be explicit");
  assert.equal(row.serverOwned, true, "runner row should be server-owned");
  assert.equal(row.progressMeters, 120, "snapshot should carry the authoritative finish position");
  console.log("singularity race server state smoke ok");
  console.log(JSON.stringify({ finishTimeMs: runner.finishedAtMs, lastSequence: runner.lastSequence, progressMeters: row.progressMeters }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
