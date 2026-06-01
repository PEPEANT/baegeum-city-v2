"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function readProjectFile(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertIncludes(source, token, message) {
  assert.ok(source.includes(token), message);
}

function assertExcludes(source, token, message) {
  assert.ok(!source.includes(token), message);
}

const indexSource = readProjectFile("index.html");
const raceSource = readProjectFile("singularity-race.html");
const adminSource = readProjectFile("singularity-race-admin.html");
const skinSource = readProjectFile("src/skins/singularity-race-skin-presets.js");
const mapCatalogSource = readProjectFile("src/restored/games/marathon-trail-map-catalog.js");
const trailValidationSource = readProjectFile("src/restored/games/marathon-trail-geometry-validation.js");
const roomPolicySource = readProjectFile("src/restored/online/marathon-room-policy.js");
const docsIndex = readProjectFile("docs/INDEX.md");
const lockDoc = readProjectFile("docs/singularity-race-v0-1-lock.md");
const readySource = readProjectFile("tools/smoke-singularity-race-01-ready.cjs");
const packageJson = JSON.parse(readProjectFile("package.json"));

[
  'data-primary-mode="singularity-race"',
  'href="./singularity-race.html?online=cloudflare&amp;serverUrl=wss%3A%2F%2Fsingularity-race-online.rneetn.workers.dev%2Fws"',
  'href="./baegeum-city-v2.html"',
  'href="./baegeum-city-v2-dice.html?map=dice-city&spawn=dice-blackjack-casino-01"',
  'href="https://drawing-world.onrender.com/"',
  'href="https://pepeant.github.io/MammonCity/"',
  "./assets/singularity-race/banner-qorud.png",
  "https://gall.dcinside.com/mgallery/board/lists?id=thesingularity",
  "SIMULACRA WORLD",
  "시뮬라크 월드에서 시작되는 특이점이 온다 픽셀 레이스",
  "배금도시 v2",
  "다이스시티 v1",
  "드로잉월드",
  "배금도시 v1",
  "aboutOpenButton",
  "제작자: 훈서기",
  "플레이",
].forEach((token) => assertIncludes(indexSource, token, `index should keep ${token}`));

assertExcludes(indexSource, 'href="./singularity-race-admin.html?devOnline=1"', "launcher should not expose the dev host page as a user button");
assertExcludes(indexSource, "운영 화면", "launcher should not expose the old host button label");
assertExcludes(indexSource, "대표 모드", "launcher should not show the representative-mode eyebrow");
assertExcludes(indexSource, "특이점레이스 시작", "launcher should not keep the old primary start label");
assertExcludes(indexSource, "특이점레이스 도시 트랙", "launcher should not keep the old banner title copy");
assertExcludes(indexSource, "SINGULARITY RACE", "launcher shell brand should not look like the game title");
assertExcludes(indexSource, "Pixel City Race", "launcher banner should use Korean copy");
assertIncludes(indexSource, 'class="secondary-action is-muted" href="./baegeum-city-v2.html"', "Baegeum City v2 should remain a muted preserved mode");
assert.ok(fs.existsSync(path.join(root, "baegeum-city-v2.html")), "Baegeum City v2 city-core entry should remain preserved");
assert.ok(fs.existsSync(path.join(root, "editor.html")), "world editor file should remain preserved even if it is not a launcher card");
assert.ok(fs.existsSync(path.join(root, "skin-lab.html")), "skin lab file should remain preserved even if it is not a launcher card");
assertIncludes(indexSource, "<main>", "launcher should remain a visible page, not a redirect-only shim");
assertExcludes(indexSource, 'http-equiv="refresh"', "launcher should not become a meta redirect");
assert.ok(!/location\.(href|assign|replace)\s*=/.test(indexSource), "launcher should not force JavaScript redirection");

[
  'data-screen="profile"',
  'id="main-title"',
  "특이점레이스 대기열방",
  "SINGULARITY_RACE_SCREENS.LOBBY",
  "SINGULARITY_RACE_SCREENS.QUEUE",
  "SINGULARITY_RACE_SCREENS.MAP_PREVIEW",
  "SINGULARITY_RACE_SCREENS.RACE",
  "enterQueue",
  "enterMapPreview",
  "enterRaceScreen",
  "startLocalCountdown",
  "finalizeRaceResult",
  "continueWatchingAfterFinish",
  "restartRaceAfterResult",
  "로비로 복귀",
  "setScreen(SINGULARITY_RACE_SCREENS.LOBBY)",
  "결과를 정리하고 로비로 돌아왔습니다.",
  "state.connectedSession = null",
  "roomPacketTransport.savePackets([], { reason: \"result_restart\" })",
  "state.action = createActionRaceState()",
  "state.runnerVisuals.clear()",
  "state.runnerMotion.clear()",
  "race-result-panel",
  "track-start-crowd",
  "start-crowd-fence",
  "start-crowd-sign-wave",
  "pixel-citizen",
  "crowd-sign",
  "특이점은온다",
  "특이점갤러리 화이팅",
  "AGI 2027",
  "1등 부기줄",
  "race-ceremony-space",
  "race-ceremony-room",
  "race-ceremony-back-wall",
  "race-ceremony-status",
  "race-ceremony-floor-crowd",
  "race-ceremony-free-player",
  "race-ceremony-podium",
  "race-ceremony-summary",
  "renderRaceCeremonySpace",
  "createRaceCeremonyPodiumSlot",
  "CEREMONY_TRANSFER_DELAY_MS",
  "CEREMONY_RUNNER_TRANSFER_STAGGER_MS",
  "canMoveInCeremonyRoom",
  "advanceCeremonyPlayerMovement",
  "ceremonyTransferAtMs",
  "ceremonyEnteredAtMs",
  "잠시 후 시상대 공간으로 이동합니다",
  "advanceRaceCeremonyState",
  "race-result-watch",
  "race-result-restart",
  'id="race-options-home"',
  'id="race-options-community"',
  'id="race-options-about"',
  "race-about-panel",
  "profile-heading",
  'id="nickname-input"',
  'id="profile-start-button"',
  ".shell[data-screen=\"queue\"] .track-panel .panel-header",
  ".shell[data-screen=\"queue\"] .skin-panel",
  "대기열방 스킨 변경",
  "대기열방에서도 출발 전 스킨을 바꿀 수 있습니다.",
  "getVisibleQueueRunners",
  "createQueueEmptyStateNode",
  "아직 대기열에 입장한 플레이어가 없습니다.",
  "currentRoomMaxRunners",
  "getRestoredMarathonEntryGateStatus",
  "map-vote-panel",
  "map-vote-options",
  "renderMapVoteModal",
  "castCurrentMapVote",
  "getCurrentMapVoteStatus",
  "--accent-strong: #168dff",
  "@keyframes ui-press-pop",
  "특별출연: 지피쨩",
  "race-mobile-controls"
].forEach((token) => assertIncludes(raceSource, token, `race page should keep ${token}`));

assertIncludes(raceSource, 'href="https://gall.dcinside.com/mgallery/board/lists?id=thesingularity"', "race page should link the community gallery");
assertExcludes(raceSource, "닉네임과 스킨을 먼저 고른 뒤 로비에 입장합니다.", "profile intro copy should be replaced by direct nickname/start controls");
assertIncludes(raceSource, "overflow-y: auto;", "profile skin picker should keep its own scroll area");
assertIncludes(raceSource, "grid-auto-rows: 64px;", "profile skin picker should reserve compact stable full-row card height");
assertExcludes(raceSource, "caption.textContent = preset.id", "queue skin cards should not show the English/id caption below the Korean name");
assertIncludes(raceSource, "--selected-green: #34e87a", "selected skin should use a green highlight token");
assertIncludes(raceSource, 'content: "선택";', "selected skin should show an explicit selected badge");
assert.ok(
  raceSource.indexOf('id="nickname-input"') < raceSource.indexOf('id="profile-skin-grid"'),
  "nickname/start controls should appear before the profile skin grid"
);
assert.ok(
  raceSource.indexOf('class="panel chat-panel"') < raceSource.indexOf('class="panel skin-panel"')
    && raceSource.indexOf('class="panel skin-panel"') < raceSource.indexOf('id="map-vote-panel"'),
  "queue skin panel should sit inside the lobby grid beside chat before map vote overlay"
);
assertExcludes(
  raceSource,
  "Array.from({ length: slotCount }, (_, index) => state.runners[index] || null)",
  "normal queue view should not pre-render every empty room slot"
);
assertIncludes(raceSource, 'const TRAILING_SKIN_IDS = Object.freeze(["kaguya"])', "race page should keep kaguya at the end of the skin picker");
assertIncludes(skinSource, 'const RACE_SKIN_SPECS = Object.freeze([\n  { id: "singularity-fan"', "skin presets should start with singularity-fan");
assertIncludes(skinSource, 'accessory: "ribbon" }\n]);', "skin presets should keep kaguya as the final skin spec");

[
  "방 만들기",
  "봇 넣기",
  "봇 비우기",
  "시작",
  "옵저버 참석",
  "runner-watch-list",
  "admin-enter-button",
  "admin-start-button",
  "admin-refresh-button",
  "admin-add-bots-button",
  "room-runner-input",
  "entry-delay-options",
  "renderEntryDelayPolicy",
  "admin-map-vote-button",
  "renderMapVotePolicy",
  "finalizeMapVoteIfNeeded",
  "admin-map-options",
  "renderMapSelection",
  "--accent-strong: #168dff",
  "@keyframes ui-press-pop"
].forEach((token) => assertIncludes(adminSource, token, `admin page should keep ${token}`));

assertIncludes(raceSource, "room-refresh-button", "player page should keep the visible room refresh control");
assertIncludes(raceSource, "getDevRoomPresenceSummary", "player page should derive dev-room counts from stored snapshots");

[
  "RESTORED_MARATHON_MAP_VOTE_DURATION_MS",
  "createRestoredMarathonMapVote",
  "castRestoredMarathonMapVote",
  "finalizeRestoredMarathonMapVote",
  "getRestoredMarathonMapVoteStatus"
].forEach((token) => assertIncludes(roomPolicySource, token, `room policy should keep ${token}`));

[
  "기본 스타디움",
  "네모 스프린트",
  "미로 런",
  "외곽 사각형",
  "단일 정답 미로"
].forEach((token) => assertIncludes(mapCatalogSource, token, `map catalog should keep ${token}`));

[
  "validateDistinctMapShapes",
  "averageSampleDistance",
  "visibly distinct route shapes"
].forEach((token) => assertIncludes(trailValidationSource, token, `trail validation should keep ${token}`));

[
  "selectedRaceMapId",
  "syncRaceMapFromRoomPolicy",
  "RESTORED_MARATHON_ROOM_POLICY_STORAGE_KEY",
  "const activeDevRoomClosed = (devOnlineEnabled || adminLaunchEnabled)",
  "const devRoomControlsEnabled = devOnlineEnabled || adminLaunchEnabled",
  "if (!devRoomControlsEnabled) return"
].forEach((token) => assertIncludes(raceSource, token, `race page should keep ${token}`));

[
  "Singularity Race v0.1 Lock",
  "common engine",
  "current implementation work",
  "Do not delete existing",
  "Future Expansion Protection",
  "Race Core / City Core / UGC Core / Platform Core",
  "npm run check:singularity-race",
  "ZIP"
].forEach((token) => assertIncludes(lockDoc, token, `lock doc should record ${token}`));

assertIncludes(docsIndex, "singularity-race-v0-1-lock.md", "docs index should link the v0.1 lock");
assertIncludes(readySource, "tools/smoke-singularity-race-v01-lock.cjs", "quick readiness gate should include the v0.1 lock smoke");
assertIncludes(packageJson.scripts.check, "tools/smoke-singularity-race-v01-lock.cjs", "full check should include the v0.1 lock smoke");

console.log("Singularity Race v0.1 lock smoke passed.");
