"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");

async function main() {
  const finishWindow = await import(pathToFileURL(path.join(root, "src/restored/games/singularity-race-finish-window.js")).href);
  const { SingularityRaceRoom } = await import(pathToFileURL(path.join(root, "workers/singularity-race-worker.js")).href);
  const validation = finishWindow.validateSingularityRaceFinishWindowContract();
  assert.equal(validation.ok, true, `finish-window contract failed: ${validation.errors.join(", ")}`);
  assert.equal(finishWindow.resolveSingularityRaceFinishWindowMs(25000), 45000, "short first finish should clamp to 45 seconds");
  assert.equal(finishWindow.resolveSingularityRaceFinishWindowMs(120000), 54000, "medium first finish should scale by 0.45");
  assert.equal(finishWindow.resolveSingularityRaceFinishWindowMs(300000), 90000, "long first finish should clamp to 90 seconds");

  const fakeState = createFakeDurableObjectState();
  const room = new SingularityRaceRoom(fakeState, { ADMIN_TOKEN: "unit-admin-token" });
  const now = Date.now();
  room.roomStateLoaded = true;
  room.roomActive = true;
  room.phase = "racing";
  room.entryOpen = false;
  room.countdownEndsAtMs = 0;
  room.raceStartedAtMs = now - 60000;
  room.sessions.set("client:first", createPlayerSession({ clientId: "client:first", participantId: "runner:client:first", finishedAtMs: now, progressPercent: 100 }));
  room.sessions.set("client:dnf", createPlayerSession({ clientId: "client:dnf", participantId: "runner:client:dnf", lane: 2, progressPercent: 74 }));

  assert.equal(room.refreshPhase(now), true, "first finisher should start the finish window");
  await Promise.resolve();
  assert.equal(room.phase, "racing", "finish window should keep racing while unfinished players remain");
  assert.equal(room.finishWindowStartedAtMs, now, "finish window should start at first finish time");
  assert.equal(room.finishWindowEndsAtMs, now + 45000, "60 second first finish should use the 45 second minimum");
  assert.ok(fakeState.alarms.some((alarm) => alarm >= room.finishWindowEndsAtMs), "finish window should schedule a Durable Object alarm");

  const summary = await jsonOf(await room.fetch(new Request("https://unit.test/summary")));
  assert.equal(summary.body.finishWindowActive, true, "summary should expose an active finish window");
  assert.equal(summary.body.finishedCount, 1, "summary should count finished runners");
  assert.equal(summary.body.playerCount, 2, "summary should count player runners");

  assert.equal(room.refreshPhase(room.finishWindowEndsAtMs + 1), true, "expired finish window should close the race");
  assert.equal(room.phase, "finished", "finish window expiry should move phase to finished");
  assert.equal(room.entryOpen, false, "finished room should keep entry closed until admin opens the next round");
  console.log("Singularity Race finish-window smoke passed.");
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
    lastMovementTickAtMs: now,
    ...overrides
  };
}

function createFakeDurableObjectState() {
  const stored = new Map();
  const alarms = [];
  return {
    alarms,
    getWebSockets: () => [],
    acceptWebSocket: () => {},
    storage: {
      async get(keys) {
        return new Map(keys.filter((key) => stored.has(key)).map((key) => [key, stored.get(key)]));
      },
      async put(value) {
        Object.entries(value).forEach(([key, next]) => stored.set(key, next));
      },
      async setAlarm(whenMs) {
        alarms.push(whenMs);
      },
      async deleteAlarm() {}
    }
  };
}

async function jsonOf(response) {
  return { status: response.status, body: await response.json() };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
