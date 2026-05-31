"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const pageSource = fs.readFileSync(path.join(root, "singularity-race.html"), "utf8");
const manifestPath = path.join(root, "src", "restored", "assets", "asset-manifest.js");

function assertMp3Asset(asset) {
  assert(asset, "audio asset should exist in restored manifest");
  const filePath = path.join(root, asset.path);
  assert(fs.existsSync(filePath), `${asset.path} should exist`);
  const buffer = fs.readFileSync(filePath);
  assert(buffer.length > 250000, `${asset.id} should keep the provided mp3 detail`);
  const signature = buffer.toString("latin1", 0, 3);
  const frameSync = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
  assert(signature === "ID3" || frameSync, `${asset.id} should look like an mp3`);
}

async function main() {
  const manifestModule = await import(pathToFileURL(manifestPath).href);
  const manifest = manifestModule.RESTORED_ASSET_MANIFEST || [];
  const byId = new Map(manifest.map((asset) => [asset.id, asset]));

  for (const assetId of [
    "audio:bgm:singularity-race:squid-wake",
    "audio:bgm:singularity-race:dont-stop-me",
    "audio:bgm:singularity-race:tjie-she-pen"
  ]) {
    const asset = byId.get(assetId);
    assertMp3Asset(asset);
    assert.equal(asset.collection, "singularity-race", `${assetId} should be owned by Singularity Race`);
    assert.equal(asset.role, "bgm", `${assetId} should stay classified as bgm`);
  }

  assert(![...byId.keys()].some((assetId) => assetId.toLowerCase().includes("drowning")), "Drowning should remain unused for a later map version");
  assert(!pageSource.includes("Drowning"), "player page should not wire the later-map Drowning track");
  assert(pageSource.includes("getRestoredAssetById"), "race audio should resolve through the restored asset manifest");
  assert(pageSource.includes("RACE_AUDIO_TRACKS"), "race page should declare a small music track set");
  assert(pageSource.includes("audio:bgm:singularity-race:squid-wake"), "entry music should use the Squid wake track id");
  assert(pageSource.includes("audio:bgm:singularity-race:dont-stop-me"), "race start should use the primary race track id");
  assert(pageSource.includes("audio:bgm:singularity-race:tjie-she-pen"), "race extension should use the follow-up track id");
  assert(pageSource.includes("race-audio-root"), "race page should mount hidden audio elements for browser verification");
  assert(pageSource.includes("unlockRaceAudio"), "audio playback should be unlocked from a user gesture");
  assert(pageSource.includes("requestPersonalEntryMusic"), "first player entry should queue personal music");
  assert(pageSource.includes("requestRaceMusicStart(\"gate_open\")"), "race music should start when the gate opens");
  assert(pageSource.includes("handleRaceAudioEnded"), "race music should advance when the first track ends");
  assert(pageSource.includes("createStadiumAudioGraph"), "race music should attempt a mild stadium/broadcast sound profile");
  assert(pageSource.includes("race-extended") && pageSource.includes("loop: true"), "extended music should loop if the race keeps going");

  console.log("Singularity Race audio smoke passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
