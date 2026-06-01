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
const merge = read("src/restored/games/singularity-race-dev-online.js");

[
  'const ROOM_ID = "room:singularity-race:public-001"',
  "const MAX_RUNNERS = 50",
  "const INPUT_LIMIT_PER_SECOND = 10",
  "const SNAPSHOT_INTERVAL_MS = 200",
  "const MIN_SNAPSHOT_INTERVAL_MS = 125",
  "const CHAT_COOLDOWN_MS = 900",
  "export class SingularityRaceRoom",
  "this.state.acceptWebSocket(server)",
  "host_start_countdown",
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
  "sendHostStart"
].forEach((token) => assertIncludes(client, token, `client should keep ${token}`));

[
  'queryParams.get("online") === "cloudflare"',
  "CLOUDFLARE_WS_ENDPOINT",
  "joinOnlineConnectedRoom",
  "joinCloudflareConnectedRoom",
  "handleCloudflareRoomPacket",
  "localizeCloudflareSnapshot",
  "sendCloudflareChatMessage",
  "startCloudflareHostCountdown",
  "10초 카운트다운 시작"
].forEach((token) => assertIncludes(race, token, `race page should keep ${token}`));

assertIncludes(merge, "participant.skinPreset", "server snapshots should preserve remote participant skins");
assert.ok(!/api[-_]?key|secret|password|private[-_]?key/i.test(worker), "worker source must not embed secret-like config keys");

console.log("Singularity Race Cloudflare online smoke passed.");
