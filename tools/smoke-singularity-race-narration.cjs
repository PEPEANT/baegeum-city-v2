"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const playerSource = fs.readFileSync(path.join(root, "singularity-race.html"), "utf8");
const adminSource = fs.readFileSync(path.join(root, "singularity-race-admin.html"), "utf8");
const workerSource = fs.readFileSync(path.join(root, "workers", "singularity-race-worker.js"), "utf8");
const controlPath = path.join(root, "src", "restored", "games", "singularity-race-control.js");
const controlSource = fs.readFileSync(controlPath, "utf8");
const assetDir = path.join(root, "assets", "singularity-race", "narration");

function assertPngWithAlpha(fileName) {
  const filePath = path.join(assetDir, fileName);
  assert(fs.existsSync(filePath), `${fileName} should exist`);
  const buffer = fs.readFileSync(filePath);
  assert(buffer.length > 100000, `${fileName} should keep the character frame detail`);
  assert.equal(buffer.toString("hex", 0, 8), "89504e470d0a1a0a", `${fileName} should be a PNG`);
  const colorType = buffer[25];
  assert([4, 6].includes(colorType), `${fileName} should keep an alpha channel after chroma key`);
}

async function main() {
  ["intro-1.png", "intro-2.png", "intro-3.png", "intro-4.png"].forEach(assertPngWithAlpha);

  assert(controlSource.includes("NARRATION_START"), "control contract should define a narration command type");
  assert(controlSource.includes("SINGULARITY_RACE_NARRATION_STORAGE_KEY"), "narration commands should not overwrite race start/close commands");
  assert(controlSource.includes("createSingularityRaceNarrationCommand"), "control contract should create narration commands");
  assert(controlSource.includes("shouldAcceptSingularityRaceNarrationCommand"), "control contract should filter narration commands by room and age");

  const control = await import(pathToFileURL(controlPath).href);
  const command = control.createSingularityRaceNarrationCommand({ nowMs: 2000, roomId: "room:narration" });
  assert.equal(command.type, "narration_start");
  assert(control.shouldAcceptSingularityRaceNarrationCommand(command, { roomId: "room:narration", nowMs: 2500 }), "fresh narration should be accepted");
  assert(!control.shouldAcceptSingularityRaceNarrationCommand(command, { roomId: "room:other", nowMs: 2500 }), "other-room narration should be ignored");
  assert(!control.shouldAcceptSingularityRaceNarrationCommand(command, { roomId: "room:narration", nowMs: 20000, maxAgeMs: 1000 }), "stale narration should not replay");
  assert(control.validateSingularityRaceControlContract().ok, "control contract validation should pass");

  assert(playerSource.includes("admin-observer-narration"), "observer panel should expose a narration start button");
  assert(playerSource.includes("elements.adminObserverNarration.addEventListener(\"click\""), "narration button should be wired to a click handler");
  assert(playerSource.includes("race-narration"), "player page should render the shared narration overlay");
  assert(playerSource.includes("RACE_NARRATION_TYPE_MS"), "narration should use a typewriter timing constant");
  assert(playerSource.includes("getTypedRaceNarrationText"), "narration copy should reveal one character at a time");
  assert(playerSource.includes("특이점 갤러리 여러분 오늘도 화이팅"), "first narration line should be present");
  assert(playerSource.includes("노란색 아이템을 먹고 PC 사용자는 E키"), "second narration line should explain item usage");
  assert(playerSource.includes("writeSingularityRaceNarrationCommand"), "observer narration should persist through its own storage key");
  assert(playerSource.includes("applyNarrationControlCommand"), "player page should consume narration commands");
  assert(playerSource.includes('packet.type === "narration_start"'), "Cloudflare player packets should trigger narration");
  assert(playerSource.includes("cloudflareOnlineEnabled ? CLOUDFLARE_ROOM_ID : DEV_ROOM_ID"), "narration room filter should use the active Cloudflare room id online");
  assert(playerSource.includes("queueRaceNarrationFrame"), "narration should animate independently from runner movement");
  assert(playerSource.includes("renderRaceNarration"), "player page should render the narration timeline");
  assert(playerSource.includes("RACE_NARRATION_ASSETS.blink"), "timeline should include the blink frame");
  assert(playerSource.includes("RACE_NARRATION_ASSETS.wave"), "timeline should include the wave frame");
  assert(adminSource.includes("admin-narration-button"), "admin page should expose a start-adjacent narration button");
  assert(adminSource.includes("playCloudflarePublicNarration"), "admin page should call the public Worker narration endpoint");
  assert(adminSource.includes('requestCloudflareAdmin("/admin/narration"'), "admin page should request /admin/narration in Cloudflare mode");
  assert(adminSource.includes("writeSingularityRaceNarrationCommand"), "admin page should keep local dev narration rehearsal working");
  assert(workerSource.includes('url.pathname.endsWith("/admin/narration")'), "Worker should expose an authenticated admin narration endpoint");
  assert(workerSource.includes('this.serverPacket("narration_start"'), "Worker should broadcast narration_start to connected clients");

  console.log("Singularity Race narration smoke passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
