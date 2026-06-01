"use strict";

const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

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
  "disabledAdminResponse",
  "public_admin_disabled",
  "validateParticipantJoin",
  "room_join_closed",
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
  "createCloudflarePlayerHref",
  "createCloudflareOperatorHref",
  "getAdminRoomSummaries",
  "공개 관리자 비활성화"
].forEach((token) => assertIncludes(admin, token, `admin page should keep ${token}`));

assert.ok(!race.includes('elements.previewButton.textContent = "10초 카운트다운 시작"'), "player queue preview button must not expose the Cloudflare host-start countdown");
assert.ok(!race.includes('elements.readyButton.textContent = "10초 카운트다운 시작"'), "player queue primary button must wait for operator start");

assert.ok(!worker.includes("host_start_countdown"), "Worker must use start_request instead of the old host countdown packet");
assert.ok(!client.includes("sendHostStart"), "Cloudflare client must not expose the old host-start helper");
assert.ok(!race.includes("cloudflareOperatorEnabled"), "Race page must not expose public operator query authority");
assert.ok(!race.includes("operator: cloudflareOperatorEnabled"), "Race page must not pass operator authority to Cloudflare joins");
assert.ok(!client.includes('url.searchParams.set("operator", "1")'), "Cloudflare client must not pass public operator joins");
assert.ok(!worker.includes("const host = Boolean(options.operator)"), "Worker host authority must come from first player join");
assert.ok(!admin.includes('fetch(cloudflareAdminUrl("/admin/start")'), "Public admin page must not call the Worker start endpoint");
assert.ok(!admin.includes("fetch(cloudflareAdminUrl(path)"), "Public admin page must not call Worker reset/open endpoints");
assert.ok(!admin.includes('url.searchParams.set("operator", "1")'), "Public admin page must not create operator links");
assertIncludes(merge, "participant.skinPreset", "server snapshots should preserve remote participant skins");
[
  "preserveLocalPrediction",
  "smoothServerCorrection",
  "localPredictionSnapshotCorrection",
  "snapshotCorrectionProgress",
  "snapshotSnapped"
].forEach((token) => assertIncludes(merge, token, `server snapshot merge should keep jitter smoothing token ${token}`));
assert.ok(!/api[-_]?key|secret|password|private[-_]?key/i.test(worker), "worker source must not embed secret-like config keys");

console.log("Singularity Race Cloudflare online smoke passed.");
