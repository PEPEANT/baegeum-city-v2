const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "singularity-race.html"), "utf8");
const admin = fs.readFileSync(path.join(root, "singularity-race-admin.html"), "utf8");
const plan = fs.readFileSync(path.join(root, "docs/plans/restored-marathon-stadium.md"), "utf8");

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  const control = await import(pathToFileURL(path.join(root, "src/restored/games/singularity-race-control.js")));
  const storage = createMemoryStorage();
  const roomId = "room:singularity-race:dev-001";
  const add = control.createSingularityRaceTestBotsCommand({ nowMs: 1000, roomId, botCount: 50 });
  const clear = control.createSingularityRaceTestBotsCommand({ nowMs: 2000, roomId, botCount: 0 });

  assert.equal(add.type, "set_test_bots", "host test-bot command must use a separate command type");
  assert.equal(add.botCount, 50, "host can request a 50-runner rehearsal pack");
  assert(control.shouldAcceptSingularityRaceTestBotsCommand(add, { roomId }), "matching room test-bot command should be accepted");
  assert.equal(control.shouldAcceptSingularityRaceTestBotsCommand(add, { roomId: "room:other" }), false, "wrong room test-bot command should be ignored");

  control.writeSingularityRaceTestBotsCommand(storage, add);
  assert.equal(control.readSingularityRaceTestBotsCommand(storage, roomId).botCount, 50, "stored test-bot command should replay");
  control.writeSingularityRaceTestBotsCommand(storage, clear);
  assert.equal(control.readSingularityRaceTestBotsCommand(storage, roomId).botCount, 0, "clear command should persist zero bots");

  assert(html.includes("runners: createRunners(1, initialSkin, false)"), "player page must not auto-seed a full runner pack on load");
  assert(!html.includes("adminLaunchEnabled ? MAX_RUNNERS : 1"), "adminLaunch must not auto-fill the player page");
  assert(!html.includes("state.runners = createRunners(MAX_RUNNERS, state.selectedSkin, state.ready)"), "player debug button must not create a local full-runner pack");
  assert(html.includes("botCount: state.testBotTargetCount"), "player page should pass host bot count into the dev runtime");
  assert(html.includes("const participantType = isLocalPlayer ? \"player\" : \"bot\""), "dev runtime should join test bots as bot participants");
  assert(html.includes("role: participantType"), "dev runtime should connect test bots with a bot role");
  assert(html.includes("forwardActionPacketToConnectedDevServer(envelope)"), "connected attack/skill packets should reach the dev server ingest path");
  assert(html.includes("connectedDevServer.ingestClientEnvelope(client.transport, envelope"), "player action forwarding should use the server-owned ingest boundary");
  assert(html.includes("targetRunnerCount = Math.max(spectator ? 0 : 1"), "dev runtime should keep spectators from creating runner bots by default");
  assert(html.includes("테스트 봇은 방장 페이지에서만 넣거나 비울 수 있습니다."), "player page should direct bot control to the host page");

  assert(admin.includes("admin-add-bots-button"), "host page needs an explicit add-test-bots control");
  assert(admin.includes("admin-clear-bots-button"), "host page needs an explicit clear-test-bots control");
  assert(admin.includes("roomPacketTransport?.savePackets([], { reason: \"clear_test_bots\" })"), "clearing bots should clear stale relay snapshots");
  assert(admin.includes("roomPacketTransport ? roomPacketTransport.loadPackets([]) : []"), "host page must not reuse stale packet fallback after clear");
  assert(admin.includes("fillRunnerPreviewPack(seeded, botTargetCount)"), "host preview rows should be capped by the test-bot command");

  assert(plan.includes("fresh room starts empty") || plan.includes("A fresh room starts empty"), "marathon plan should document empty-first room behavior");
  console.log("Singularity Race bot control smoke passed.");
}

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value))
  };
}
