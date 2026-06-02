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
  "const SERVER_TICK_INTERVAL_MS = 100",
  "const INPUT_STALE_MS = 550",
  "const SNAPSHOT_INTERVAL_MS = 200",
  "const MIN_SNAPSHOT_INTERVAL_MS = 125",
  "const CHAT_COOLDOWN_MS = 900",
  "const START_PADDOCK_MAX_PROGRESS",
  "const STAGING_RUN_PROGRESS_PER_SECOND = 1.0",
  "const STAGING_SPRINT_PROGRESS_PER_SECOND = 2.05",
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
  "scheduleServerTick",
  "advanceRaceTick",
  "canAdvancePlayerMovement",
  "isPaddockMovementOpen",
  "recordSessionInput",
  "lastInputPayload",
  "lastInputReceivedAtMs",
  "lastMovementTickAtMs",
  "handleAttack",
  "handleSkill",
  "createServerBasicAttackAction",
  "createServerSkillUse",
  "findServerBasicAttackTarget",
  "findServerSkillTargets",
  "BASIC_ATTACK_STUN_MS",
  "BASIC_ATTACK_COOLDOWN_MS",
  "BACKWARD_PROGRESS_MULTIPLIER",
  "stunnedUntilMs",
  "attackCooldownUntilMs",
  "skillCooldownUntilMs",
  "storage_write_unavailable",
  'url.pathname.startsWith("/admin/")',
  "verifyAdminRequest",
  "ADMIN_TOKEN",
  "/admin/state",
  "/admin/create",
  "/admin/deactivate",
  "/admin/start",
  "/admin/open",
  "/admin/close",
  "/admin/reset",
  "/admin/map",
  "admin_unauthorized",
  "admin_token_not_configured",
  "entryOpen",
  "roomActive",
  "validateParticipantJoin",
  "room_not_created",
  "room_join_closed",
  "entry_not_open",
  "admin_start_required",
  "start_request",
  "host: false",
  "ENTRY_OPEN_DEFAULT",
  "ROOM_ACTIVE_DEFAULT",
  "race_finished",
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
  "createSingularityRaceCloudflareRoomClient"
].forEach((token) => assertIncludes(client, token, `client should keep ${token}`));

[
  'queryParams.get("online") === "cloudflare"',
  "CLOUDFLARE_WS_ENDPOINT",
  "joinOnlineConnectedRoom",
  "joinCloudflareConnectedRoom",
  "CLOUDFLARE_HTTP_ENDPOINT",
  "refreshCloudflarePublicRoomSummary",
  "normalizeCloudflareRoomSummary",
  "updateCloudflareRoomSummary",
  "isCloudflarePublicJoinBlocked",
  "isCloudflarePublicSpectatorBlocked",
  "isCloudflareRaceStagingInputOpen",
  "canPublishConnectedInputRequest",
  "enterCloudflareRaceStagingIfOpen",
  "getCurrentConnectedRoomSummary",
  'fetch(`${CLOUDFLARE_HTTP_ENDPOINT}/rooms`, { cache: "no-store", signal: abort?.signal })',
  "CLOUDFLARE_ROOM_FETCH_TIMEOUT_MS",
  "abort.abort()",
  "entryOpen: payload.entryOpen !== false",
  "roomActive: payload.roomActive !== false",
  "getCloudflareEntryGateStatus",
  "isCloudflareConnectedSession",
  "&& !isCloudflareConnectedSession()",
  "공개방 상태 확인 실패",
  "서버 재시도 필요",
  "handleCloudflareRoomPacket",
  "raceRewardSkillButton",
  "raceItemButton",
  "targetId: resolveConnectedSkillTargetId()",
  "createMobileRaceIntent",
  "presence_update",
  "room_closed",
  "localizeCloudflareSnapshot",
  "sendCloudflareChatMessage",
  "state.cloudflareHost",
  "관리자 시작 대기중",
  "관리자 대기중"
].forEach((token) => assertIncludes(race, token, `race page should keep ${token}`));

[
  "cloudflareAdminEnabled",
  "refreshCloudflareRoomSummary",
  "createCloudflarePublicRoom",
  "deactivateCloudflarePublicRoom",
  "startCloudflarePublicRoom",
  "toggleCloudflarePublicEntry",
  "resetCloudflarePublicRoom",
  "requestCloudflareAdmin",
  "hasCloudflareAdminToken",
  "hasCloudflareAdminControl",
  "setCloudflarePublicMap",
  "isCloudflarePublicRoomActive",
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
assert.ok(!worker.includes('if (room.entryOpen === false) return { ok: false, reason: "entry_closed" };'), "Worker must allow players to join the waiting queue before in-game entry opens");
assert.ok(!worker.includes("advanceSession(session, packet.payload || {}, now"), "Worker must not advance movement directly when input packets arrive");
assert.ok(!worker.includes("handlePlayerStartRequest"), "Worker must not allow player-owned public starts");
assert.ok(!worker.includes('const host = type === "player" && countPlayers(room) === 0'), "Worker must not assign first-player host authority");
assert.ok(!worker.includes('if (packet.type === "attack_action" || packet.type === "skill_use") return this.relayClientAction'), "Worker must not leave public attacks as client-relayed packets");
assert.ok(!worker.includes('if (packet.type === "skill_use") return this.relayClientAction'), "Worker must not leave public skills as client-relayed packets");
assert.ok(!client.includes("sendHostStart"), "Cloudflare client must not expose the old host-start helper");
assert.ok(!client.includes("sendStartRequest"), "Cloudflare client must not expose a player start helper");
assert.ok(!race.includes("requestCloudflareRaceStart"), "Race page must not expose a Cloudflare player start helper");
assert.ok(!race.includes("cloudflareRoomClient.sendStartRequest"), "Race page must not send player start requests");
assert.ok(!race.includes("방장 시작 대기중"), "Race page should wait for admin start, not a player host");
assert.ok(!race.includes("현재 이 방의 시작 권한을 가진 호스트"), "Race page must not tell the first user they are host");
assert.ok(!race.includes("cloudflareOperatorEnabled"), "Race page must not expose public operator query authority");
assert.ok(!race.includes("operator: cloudflareOperatorEnabled"), "Race page must not pass operator authority to Cloudflare joins");
assert.ok(!client.includes('url.searchParams.set("operator", "1")'), "Cloudflare client must not pass public operator joins");
assert.ok(!worker.includes("const host = Boolean(options.operator)"), "Worker host authority must not come from public joins");
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
assertIncludes(race, "canRequestConnectedAttack", "race page should send connected attacks whenever public race input is open");
assert.ok(!/api[-_]?key|secret|password|private[-_]?key/i.test(worker), "worker source must not embed secret-like config keys");

execFileSync(process.execPath, [path.join(root, "tools/smoke-singularity-race-cloudflare-worker-contract.cjs")], { stdio: "inherit" });
execFileSync(process.execPath, [path.join(root, "tools/smoke-singularity-race-cloudflare-worker-skill.cjs")], { stdio: "inherit" });
console.log("Singularity Race Cloudflare online smoke passed.");
