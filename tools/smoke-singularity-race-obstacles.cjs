"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const raceSource = fs.readFileSync(path.join(root, "singularity-race.html"), "utf8");
const workerSource = fs.readFileSync(path.join(root, "workers/singularity-race-worker.js"), "utf8");
const predictionSource = fs.readFileSync(path.join(root, "src/restored/games/singularity-race-prediction.js"), "utf8");
const localSimSource = fs.readFileSync(path.join(root, "src/restored/games/singularity-race-local-sim.js"), "utf8");

async function main() {
  const obstacle = await import(pathToFileURL(path.join(root, "src/restored/games/singularity-race-obstacle-contract.js")));
  const spectator = await import(pathToFileURL(path.join(root, "src/restored/games/singularity-race-spectator-contract.js")));
  const draftContract = await import(pathToFileURL(path.join(root, "src/restored/games/singularity-race-map-draft-contract.js")));
  const validation = obstacle.validateSingularityRaceObstacleContract();
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  const spectatorValidation = spectator.validateSingularityRaceSpectatorContract();
  assert.equal(spectatorValidation.ok, true, spectatorValidation.errors.join("\n"));
  const draftValidation = draftContract.validateSingularityRaceMapDraftContract();
  assert.equal(draftValidation.ok, true, draftValidation.errors.join("\n"));

  const basicObstacles = obstacle.listSingularityRaceMapObstacles("baegeum-city");
  const squareObstacles = obstacle.listSingularityRaceMapObstacles("singularity-square-sprint");
  const mazeObstacles = obstacle.listSingularityRaceMapObstacles("singularity-maze-run");
  assert(basicObstacles.length >= 6, "basic map should have several obstacles");
  assert(squareObstacles.length >= 5, "square map should have obstacles");
  assert(mazeObstacles.length >= 8, "maze map should have denser obstacles");

  const directHit = obstacle.resolveSingularityRaceObstacleCollision({
    progress: basicObstacles[0].progress,
    laneOffsetPx: basicObstacles[0].laneOffsetPx,
    collisionAtMs: 0
  }, {
    mapId: "baegeum-city",
    nowMs: 1234
  });
  assert.equal(directHit.collided, true, "direct obstacle overlap should collide");
  assert.equal(directHit.runner.collisionAtMs, 1234, "collision should stamp hit feedback time");
  const basicSpectators = spectator.listSingularityRaceMapSpectators("baegeum-city");
  assert.equal(basicSpectators[0].side, "left", "basic crowd should start as a left-side spectator group");
  assert.equal(basicSpectators[0].progress, 0.05, "basic crowd should keep the finalized start-line progress");
  assert.equal(basicSpectators[0].laneOffsetPx, 0, "basic crowd should keep the finalized center lane offset");
  assert.equal(basicSpectators[0].density, 17, "basic crowd density should be data-owned");
  assert(basicSpectators[0].rows.flatMap((row) => row.members).some((member) => member.sign === "AGI 2027"), "crowd signs should be data-owned");
  const movedDraft = draftContract.createSingularityRaceMapDraft({
    mapId: "baegeum-city",
    obstacles: [{ ...basicObstacles[0], progress: 21.25, laneOffsetPx: 144 }],
    spectators: [{ ...basicSpectators[0], progress: 8.5, laneOffsetPx: 280 }]
  }, { includeSavedAt: false, editorRevision: 3 });
  assert.equal(draftContract.createSingularityRaceMapDraftKey("baegeum-city"), "singularity-race-map-draft:v1:baegeum-city");
  const normalizedDraft = draftContract.normalizeSingularityRaceMapDraft(JSON.stringify(movedDraft), "baegeum-city");
  const draftedObstacles = obstacle.listSingularityRaceMapObstacles("baegeum-city", normalizedDraft);
  const draftedSpectators = spectator.listSingularityRaceMapSpectators("baegeum-city", normalizedDraft);
  assert.equal(draftedObstacles[0].progress, 21.25, "draft should move obstacle progress");
  assert.equal(draftedObstacles[0].laneOffsetPx, 144, "draft should move obstacle lane");
  assert.equal(draftedSpectators[0].progress, 8.5, "draft should move spectator progress");
  assert.equal(draftedSpectators[0].laneOffsetPx, 280, "draft should move spectator lane");
  const draftedHit = obstacle.resolveSingularityRaceObstacleCollision({
    progress: 21.25,
    laneOffsetPx: 144
  }, {
    mapId: "baegeum-city",
    mapDraft: normalizedDraft,
    nowMs: 2222
  });
  assert.equal(draftedHit.collided, true, "collision should use drafted obstacle placement");

  [
    "listSingularityRaceMapObstacles",
    "listSingularityRaceMapSpectators",
    "createSingularityRaceMapDraftKey",
    "normalizeSingularityRaceMapDraft",
    "readCurrentRaceMapDraft",
    "currentRaceMapObstacles",
    "mapDraft",
    "resolveSingularityRaceObstacleCollision",
    "createRaceObstacleEffectEntries",
    "createRaceObstacleNode",
    "renderTrackSpectators",
    "createTrackSpectatorGroupNode",
    "race-obstacle",
    "race-obstacle.is-crate::before",
    "markPlayerObstacleCollision"
  ].forEach((token) => assert(raceSource.includes(token), `race page should include ${token}`));
  assert(raceSource.includes('id="track-start-crowd" aria-hidden="true"></div>'), "start crowd root should be empty before data render");
  assert(workerSource.includes("resolveSingularityRaceObstacleCollision"), "Worker should use the same obstacle collision contract");
  assert(workerSource.includes("obstacleCollisionId"), "Worker snapshots should expose obstacle collision state");
  assert(predictionSource.includes("resolveSingularityRaceObstacleCollision"), "client prediction should use the same obstacle collision contract");
  assert(localSimSource.includes("resolveSingularityRaceObstacleCollision"), "local bot simulation should use the same obstacle collision contract");

  console.log("Singularity Race obstacle and spectator smoke passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
