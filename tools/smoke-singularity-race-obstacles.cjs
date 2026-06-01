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
  const validation = obstacle.validateSingularityRaceObstacleContract();
  assert.equal(validation.ok, true, validation.errors.join("\n"));

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

  [
    "listSingularityRaceMapObstacles",
    "resolveSingularityRaceObstacleCollision",
    "createRaceObstacleEffectNodes",
    "createRaceObstacleNode",
    "race-obstacle",
    "markPlayerObstacleCollision"
  ].forEach((token) => assert(raceSource.includes(token), `race page should include ${token}`));
  assert(workerSource.includes("resolveSingularityRaceObstacleCollision"), "Worker should use the same obstacle collision contract");
  assert(workerSource.includes("obstacleCollisionId"), "Worker snapshots should expose obstacle collision state");
  assert(predictionSource.includes("resolveSingularityRaceObstacleCollision"), "client prediction should use the same obstacle collision contract");
  assert(localSimSource.includes("resolveSingularityRaceObstacleCollision"), "local bot simulation should use the same obstacle collision contract");

  console.log("Singularity Race obstacle smoke passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
