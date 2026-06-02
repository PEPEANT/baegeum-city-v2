"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertIncludes(source, token, message) {
  assert.ok(source.includes(token), message);
}

execFileSync(process.execPath, ["--check", path.join(root, "workers/singularity-race-worker.js")], { stdio: "pipe" });
execFileSync(process.execPath, ["--check", path.join(root, "src/restored/online/singularity-race-cloudflare-client.js")], { stdio: "pipe" });

const worker = read("workers/singularity-race-worker.js");
const wrangler = read("wrangler.toml");
const client = read("src/restored/online/singularity-race-cloudflare-client.js");
const race = read("singularity-race.html");
const admin = read("singularity-race-admin.html");
const merge = read("src/restored/games/singularity-race-dev-online.js");

[
  'const ROOM_ID = "room:singularity-race:public-001"',
  "const MAX_RUNNERS = 50",
  "const INPUT_LIMIT_PER_SECOND = 10",
  "const SNAPSHOT_INTERVAL_MS = 200",
  "const MIN_SNAPSHOT_INTERVAL_MS = 125",
  "const CHAT_COOLDOWN_MS = 900",
  "const RUN_PROGRESS_PER_SECOND = 0.58",
  "const SPRINT_PROGRESS_PER_SECOND = 0.76",
  "progressToRestoredMarathonTrailPoint",
  "resolveSingularityRaceInputMovement",
  "resolveSingularityRaceLaneBoundary",
  "export class SingularityRaceRoom",
  "this.state.acceptWebSocket(server)",
  "this.state.storage.setAlarm",
  "this.state.storage.put",
  "safeStoragePut",
  "safeSetAlarm",
  "scheduleCountdownTimer",
  "storage_write_unavailable",
  'url.pathname.startsWith("/admin/")',
  "verifyAdminRequest",
  "ADMIN_TOKEN",
  "/admin/state",
  "/admin/start",
  "/admin/open",
  "/admin/close",
  "/admin/reset",
  "/admin/map",
  "admin_unauthorized",
  "admin_token_not_configured",
  "entryOpen",
  "validateParticipantJoin",
  "room_join_closed",
  "entry_closed",
  "start_request",
  "handlePlayerStartRequest",
  'const host = type === "player" && countPlayers(room) === 0',
  "async alarm()",
  "sanitizePhase",
  "chat_burst_limit"
].forEach((token) => assertIncludes(worker, token, `worker should keep ${token}`));

[
  'name = "SINGULARITY_RACE_ROOM"',
  'class_name = "SingularityRaceRoom"',
  'new_sqlite_classes = ["SingularityRaceRoom"]'
].forEach((token) => assertIncludes(wrangler, token, `wrangler should keep ${token}`));

[
  "SINGULARITY_RACE_CLOUDFLARE_INPUT_MIN_INTERVAL_MS = 100",
  "SINGULARITY_RACE_CLOUDFLARE_SNAPSHOT_HZ = 5",
  "SINGULARITY_RACE_CLOUDFLARE_SNAPSHOT_MAX_HZ = 8",
  "resolveSingularityRaceCloudflareWsUrl",
  "createSingularityRaceCloudflareRoomClient",
  "sendStartRequest"
].forEach((token) => assertIncludes(client, token, `client should keep ${token}`));

[
  'queryParams.get("online") === "cloudflare"',
  "CLOUDFLARE_WS_ENDPOINT",
  "joinOnlineConnectedRoom",
  "joinCloudflareConnectedRoom",
  "CLOUDFLARE_HTTP_ENDPOINT",
  "refreshCloudflarePublicRoomSummary",
  "normalizeCloudflareRoomSummary",
  "getCurrentConnectedRoomSummary",
  'fetch(`${CLOUDFLARE_HTTP_ENDPOINT}/rooms`, { cache: "no-store" })',
  "공개방 상태 확인 실패",
  "서버 재시도 필요",
  "handleCloudflareRoomPacket",
  "localizeCloudflareSnapshot",
  "sendCloudflareChatMessage",
  "requestCloudflareRaceStart",
  "sendStartRequest",
  "state.cloudflareHost",
  "방장 시작 대기중",
  "경기 시작"
].forEach((token) => assertIncludes(race, token, `race page should keep ${token}`));

[
  "cloudflareAdminEnabled",
  "refreshCloudflareRoomSummary",
  "startCloudflarePublicRoom",
  "resetCloudflarePublicRoom",
  "requestCloudflareAdmin",
  "hasCloudflareAdminToken",
  "hasCloudflareAdminControl",
  "setCloudflarePublicMap",
  "createCloudflarePlayerHref",
  "createCloudflareOperatorHref",
  "getAdminRoomSummaries",
  "adminToken",
  "공개 관리자 연결",
  "공개 맵 투표는 다음 단계"
].forEach((token) => assertIncludes(admin, token, `admin page should keep ${token}`));

assert.ok(!race.includes('elements.previewButton.textContent = "10초 카운트다운 시작"'), "player queue preview button must not expose the Cloudflare host-start countdown");
assert.ok(!race.includes('elements.readyButton.textContent = "10초 카운트다운 시작"'), "player queue primary button must wait for operator start");

assert.ok(!worker.includes("host_start_countdown"), "Worker must use start_request instead of the old host countdown packet");
assert.ok(!client.includes("sendHostStart"), "Cloudflare client must not expose the old host-start helper");
assert.ok(!race.includes("cloudflareOperatorEnabled"), "Race page must not expose public operator query authority");
assert.ok(!race.includes("operator: cloudflareOperatorEnabled"), "Race page must not pass operator authority to Cloudflare joins");
assert.ok(!client.includes('url.searchParams.set("operator", "1")'), "Cloudflare client must not pass public operator joins");
assert.ok(!worker.includes("const host = Boolean(options.operator)"), "Worker host authority must come from first player join");
assert.ok(!admin.includes('url.searchParams.set("operator", "1")'), "Public admin page must not create operator links");
assert.ok(!admin.includes('localStorage.setItem("adminToken"'), "Public admin page must not persist adminToken");
assertIncludes(merge, "participant.skinPreset", "server snapshots should preserve remote participant skins");
[
  "preserveLocalPrediction",
  "smoothServerCorrection",
  "localPredictionSnapshotCorrection",
  "snapshotCorrectionProgress",
  "snapshotSnapped"
].forEach((token) => assertIncludes(merge, token, `server snapshot merge should keep jitter smoothing token ${token}`));
assert.ok(!/api[-_]?key|secret|password|private[-_]?key/i.test(worker), "worker source must not embed secret-like config keys");

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
  assert.equal(state.body.entryOpen, true, "fresh public room should be entry-open");

  const emptyStart = await jsonOf(await room.fetch(adminRequest("/admin/start", { method: "POST" })));
  assert.equal(emptyStart.status, 409, "admin start with no players should be blocked");
  assert.equal(emptyStart.body.ok, false, "admin start with no players must be ok:false");
  assert.equal(emptyStart.body.reason, "no_players", "admin start with no players should be explicit");

  const close = await jsonOf(await room.fetch(adminRequest("/admin/close", { method: "POST" })));
  assert.equal(close.status, 200, "admin close should succeed in lobby");
  assert.equal(close.body.entryOpen, false, "admin close should close entry");

  const open = await jsonOf(await room.fetch(adminRequest("/admin/open", { method: "POST" })));
  assert.equal(open.status, 200, "admin open should succeed in lobby");
  assert.equal(open.body.entryOpen, true, "admin open should reopen entry");

  const map = await jsonOf(await room.fetch(adminRequest("/admin/map", {
    method: "POST",
    body: JSON.stringify({ mapId: "singularity-maze-run" })
  })));
  assert.equal(map.status, 200, "admin map should succeed in lobby");
  assert.equal(map.body.mapId, "singularity-maze-run", "admin map should update room map id");

  room.sessions.set("client:unit-player", {
    clientId: "client:unit-player",
    participantId: "runner:client:unit-player",
    participantType: "player",
    displayName: "Unit Player",
    lane: 1,
    progressPercent: 4,
    laneOffsetPx: 0,
    finishedAtMs: null
  });
  const start = await jsonOf(await room.fetch(adminRequest("/admin/start", { method: "POST" })));
  assert.equal(start.status, 200, "admin start with a player should succeed");
  assert.equal(start.body.ok, true, "admin start with a player should be ok:true");
  assert.equal(start.body.phase, "countdown", "admin start should move room to countdown");
  assert.equal(start.body.entryOpen, false, "admin start should close new entry");
  if (room.countdownTimer) clearTimeout(room.countdownTimer);
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

async function jsonOf(response) {
  return { status: response.status, body: await response.json() };
}

assertWorkerAdminEndpointContracts()
  .then(() => {
    console.log("Singularity Race Cloudflare online smoke passed.");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
