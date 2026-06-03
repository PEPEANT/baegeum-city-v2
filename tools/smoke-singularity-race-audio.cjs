"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const pageSource = fs.readFileSync(path.join(root, "singularity-race.html"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const adminSource = fs.readFileSync(path.join(root, "singularity-race-admin.html"), "utf8");
const manifestPath = path.join(root, "src", "restored", "assets", "asset-manifest.js");

function assertMp3Asset(asset, options = {}) {
  assert(asset, "audio asset should exist in restored manifest");
  const filePath = path.join(root, asset.path);
  assert(fs.existsSync(filePath), `${asset.path} should exist`);
  const buffer = fs.readFileSync(filePath);
  assert(buffer.length > (options.minBytes || 250000), `${asset.id} should keep enough mp3 detail`);
  const signature = buffer.toString("latin1", 0, 3);
  const frameSync = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
  assert(signature === "ID3" || frameSync, `${asset.id} should look like an mp3`);
}

function assertBgmAssets(byId) {
  for (const assetId of [
    "audio:bgm:singularity-race:squid-wake",
    "audio:bgm:singularity-race:modern-future-world",
    "audio:bgm:singularity-race:atlas-futuristic",
    "audio:bgm:singularity-race:dont-stop-me",
    "audio:bgm:singularity-race:tjie-she-pen"
  ]) {
    const asset = byId.get(assetId);
    assertMp3Asset(asset);
    assert.equal(asset.collection, "singularity-race", `${assetId} should be owned by Singularity Race`);
    assert.equal(asset.role, "bgm", `${assetId} should stay classified as bgm`);
  }
}

function assertSfxAssets(byId) {
  for (const assetId of [
    "audio:sfx:singularity-race:countdown-bell",
    "audio:sfx:singularity-race:attack-swipe",
    "audio:sfx:singularity-race:item-pickup",
    "audio:sfx:singularity-race:item-use",
    "audio:sfx:singularity-race:item-hit",
    "audio:sfx:singularity-race:skill-use",
    "audio:sfx:singularity-race:winner-finish",
    "audio:sfx:singularity-race:podium-applause",
    "audio:sfx:singularity-race:ui-tap",
    "audio:sfx:singularity-race:ui-confirm",
    "audio:sfx:singularity-race:ui-toggle",
    "audio:sfx:singularity-race:ui-deny"
  ]) {
    const asset = byId.get(assetId);
    assertMp3Asset(asset, { minBytes: 1800 });
    assert.equal(asset.collection, "singularity-race", `${assetId} should be owned by Singularity Race`);
    assert.equal(asset.role, "sfx", `${assetId} should stay classified as sfx`);
  }
}

function assertPlayerAudioWiring(byId) {
  assert(![...byId.keys()].some((assetId) => assetId.toLowerCase().includes("drowning")), "Drowning should remain unused for a later map version");
  assert(!pageSource.includes("Drowning"), "player page should not wire the later-map Drowning track");
  assert(pageSource.includes("getRestoredAssetById"), "race audio should resolve through the restored asset manifest");
  assert(pageSource.includes("RACE_AUDIO_TRACKS"), "race page should declare a small music track set");
  assert(pageSource.includes("audio:bgm:singularity-race:squid-wake"), "entry music should use the Squid wake track id");
  assert(pageSource.includes("audio:bgm:singularity-race:modern-future-world"), "lobby playlist should include the modern future track id");
  assert(pageSource.includes("audio:bgm:singularity-race:atlas-futuristic"), "lobby playlist should include the atlas futuristic track id");
  assert(pageSource.includes("MENU_AUDIO_TRACK_KEYS"), "race page should keep a dedicated menu/lobby playlist");
  assert(pageSource.includes("ENTRY_GATE_AUDIO_TRACK_KEY"), "race page should keep Squid wake as a separate entry-gate cue");
  const menuKeySource = pageSource.match(/const MENU_AUDIO_TRACK_KEYS = Object\.freeze\(\[([^\]]+)\]\);/)?.[1] || "";
  assert(menuKeySource.includes('"menu-modern-future-world"'), "lobby playlist should include modern future world");
  assert(menuKeySource.includes('"menu-atlas-futuristic"'), "lobby playlist should include atlas futuristic");
  assert(!menuKeySource.includes('"entry"'), "lobby playlist should not include the Squid wake entry cue");
  assert(pageSource.includes("stopMenuBgm"), "race page should stop menu music when the race starts");
  assert(pageSource.includes("stopEntryGateMusic"), "race page should stop the entry cue when the race starts");
  assert(pageSource.includes("audio:bgm:singularity-race:dont-stop-me"), "race start should use the primary race track id");
  assert(pageSource.includes("audio:bgm:singularity-race:tjie-she-pen"), "race extension should use the follow-up track id");
  assert(pageSource.includes("race-audio-root"), "race page should mount hidden audio elements for browser verification");
  assert(pageSource.includes('audio.preload = "none"'), "race audio elements should not preload every track on initial page load");
  assert(pageSource.includes("audio.dataset.src = track.src"), "race audio should keep source URLs lazy until playback");
  assert(pageSource.includes("attachRaceAudioSource"), "race audio should attach src only when a track is played");
  assert(pageSource.includes("waitForRaceAudioMetadata"), "race audio should still support start offsets after lazy source attachment");
  assert(!pageSource.includes('audio.preload = "auto";\n        audio.loop = Boolean(track.loop);\n        audio.volume = track.volume;\n        audio.src = track.src;'), "race page should not eagerly preload all audio tracks at setup");
  assert(pageSource.includes("unlockRaceAudio"), "audio playback should be unlocked from a user gesture");
  assert(pageSource.includes("LAUNCHER_MENU_BGM_INTENT_KEY"), "race page should consume launcher BGM start intent");
  assert(pageSource.includes("consumeLauncherMenuBgmIntent"), "race page should try lobby music after launcher entry");
  assert(pageSource.includes("requestPersonalEntryMusic"), "first player entry should queue personal music");
  assert(pageSource.includes("syncEntryGateMusicCue"), "player page should track entry gate status without auto-playing the entry cue");
  assert(!pageSource.includes("requestEntryGateMusic(\"entry_gate_open\")"), "entry gate opening must not auto-play the Squid wake cue before the user enters");
  assert(pageSource.includes("requestEntryGateMusic(\"queue_entry\")"), "queue entry should play the Squid wake entry cue");
  assert(pageSource.includes("requestEntryGateMusic(\"connected_join\")"), "connected room entry should play the Squid wake entry cue");
  assert(pageSource.includes("const entryArrivalCue = reason === \"queue_entry\" || reason === \"connected_join\""), "queue/connected entry should be the explicit Squid wake trigger");
  assert(pageSource.includes("id === \"ready-button\" && state.screen === SINGULARITY_RACE_SCREENS.LOBBY"), "queue entry button should not spend the user gesture on UI SFX before the Squid cue");
  const startMenuBody = pageSource.match(/async function startMenuBgm[\s\S]*?function handleMenuBgmEnded/)?.[0] || "";
  assert(!startMenuBody.includes("state.raceAudio.entryStarted = true"), "normal menu BGM must not mark the Squid wake cue as already played");
  assert(pageSource.includes("audio:sfx:singularity-race:countdown-bell"), "countdown should use the provided 10-second countdown SFX id");
  assert(pageSource.includes("playCountdownBellSfx"), "start countdown should play the countdown bell SFX");
  assert(pageSource.includes("createCountdownBellOffsetSeconds"), "late countdown sync should align the countdown bell SFX offset");
  assert(pageSource.includes("stopCountdownBellSfx"), "race start should stop any countdown bell tail");
  assert(pageSource.includes("volume: 0.88"), "countdown SFX should be louder than normal lobby music");
  assert(pageSource.includes("const countdownEcho = track.role === \"sfx-countdown\""), "countdown SFX should use the stronger echo profile");
  assert(pageSource.includes("feedback.gain.value = countdownEcho ? 0.32 : 0.18"), "countdown echo should ring more than normal tracks");
  assert(pageSource.includes("requestRaceMusicStart(\"gate_open\")"), "race music should start when the gate opens");
  assert(pageSource.includes("handleRaceAudioEnded"), "race music should advance when the first track ends");
  assert(pageSource.includes("createStadiumAudioGraph"), "race music should attempt a mild stadium/broadcast sound profile");
  assert(pageSource.includes("race-extended") && pageSource.includes("loop: true"), "extended music should loop if the race keeps going");
  assert(pageSource.includes("RACE_SFX_TRACK_KEYS"), "race page should keep dedicated SFX track keys");
  assert(pageSource.includes("playRaceSfx(\"sfx-attack-swipe\")"), "basic attack should play attack SFX");
  assert(pageSource.includes("playRaceSfx(\"sfx-item-pickup\")"), "item pickup should play pickup SFX");
  assert(pageSource.includes("playRaceSfx(\"sfx-item-use\")"), "item use should play use/throw SFX");
  assert(pageSource.includes("playRaceSfx(\"sfx-item-hit\")"), "item hit should play impact SFX");
  assert(pageSource.includes("playRaceSfx(\"sfx-skill-use\")"), "reward skill use should play skill SFX");
  assert(pageSource.includes("playWinnerFinishSfx"), "finish result should play the winner finish cue");
  assert(pageSource.includes("schedulePodiumApplauseSfx"), "finish result should schedule podium applause");
  assert(pageSource.includes("stopRaceSfx"), "restart/room close should stop long result SFX");
  assert(pageSource.includes("UI_SFX_KEYS"), "player page should keep named UI SFX cues");
  assert(pageSource.includes("playRaceUiSfx"), "player page should route UI feedback through the race SFX helper");
  assert(pageSource.includes("handleRaceUiClickSfx"), "player page should play click feedback for lobby controls");
  assert(pageSource.includes("audio:sfx:singularity-race:ui-tap"), "player page should wire the UI tap SFX id");
  assert(pageSource.includes("audio:sfx:singularity-race:ui-confirm"), "player page should wire the UI confirm SFX id");
  assert(pageSource.includes("audio:sfx:singularity-race:ui-toggle"), "player page should wire the UI toggle SFX id");
  assert(pageSource.includes("audio:sfx:singularity-race:ui-deny"), "player page should wire the UI deny SFX id");
}

function assertAdminAudioWiring() {
  assert(adminSource.includes("admin-ui-audio-root"), "admin page should mount hidden UI audio elements");
  assert(adminSource.includes("ADMIN_UI_SFX_TRACKS"), "admin page should declare UI SFX tracks");
  assert(adminSource.includes("playAdminUiSfx"), "admin page should route UI feedback through the admin SFX helper");
  assert(adminSource.includes("handleAdminUiClickSfx"), "admin page should play click feedback for console controls");
  assert(adminSource.includes("audio:sfx:singularity-race:ui-tap"), "admin page should wire the UI tap SFX id");
  assert(adminSource.includes("audio:sfx:singularity-race:ui-confirm"), "admin page should wire the UI confirm SFX id");
  assert(adminSource.includes("audio:sfx:singularity-race:ui-toggle"), "admin page should wire the UI toggle SFX id");
  assert(adminSource.includes("audio:sfx:singularity-race:ui-deny"), "admin page should wire the UI deny SFX id");
}

function assertIndexAudioWiring() {
  assert(indexSource.includes("launcherBgmTracks"), "launcher should declare the two-track waiting playlist");
  assert(indexSource.includes("rememberLauncherBgmIntent"), "launcher should remember that the user asked to enter with lobby music");
  assert(!indexSource.includes("audio:bgm:singularity-race:squid-wake"), "launcher should not use the Squid wake entry cue as normal lobby BGM");
  assert(indexSource.includes("audio:bgm:singularity-race:modern-future-world"), "launcher should use the modern future manifest id");
  assert(indexSource.includes("audio:bgm:singularity-race:atlas-futuristic"), "launcher should use the atlas futuristic manifest id");
  assert(indexSource.includes("getRestoredAssetById"), "launcher BGM should resolve through the restored asset manifest");
  assert(indexSource.includes("stopLauncherBgm"), "launcher should stop its music before entering the game page");
}

async function main() {
  const manifestModule = await import(pathToFileURL(manifestPath).href);
  const manifest = manifestModule.RESTORED_ASSET_MANIFEST || [];
  const byId = new Map(manifest.map((asset) => [asset.id, asset]));

  assertBgmAssets(byId);
  assertSfxAssets(byId);
  assertPlayerAudioWiring(byId);
  assertAdminAudioWiring();
  assertIndexAudioWiring();
  console.log("Singularity Race audio smoke passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
