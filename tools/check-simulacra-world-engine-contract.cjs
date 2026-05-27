"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");
const contractPath = path.join(root, "src", "restored", "engine", "simulacra-world-game-module-contract.js");
const shellPath = path.join(root, "src", "restored", "engine", "simulacra-world-shell.js");
const pagePath = path.join(root, "simulacra-world.html");
const planPath = path.join(root, "docs", "plans", "simulacra-world-engine.md");
const indexPath = path.join(root, "docs", "INDEX.md");
const plansReadmePath = path.join(root, "docs", "plans", "README.md");
const restoredReadmePath = path.join(root, "src", "restored", "README.md");
const packagePath = path.join(root, "package.json");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

(async () => {
  [contractPath, shellPath, pagePath, planPath, indexPath, plansReadmePath, restoredReadmePath].forEach((filePath) => {
    assert(fs.existsSync(filePath), `${path.relative(root, filePath)} is required.`);
  });

  const contract = await import(pathToFileURL(contractPath).href);
  const shell = await import(pathToFileURL(shellPath).href);
  const validation = contract.validateSimulacraWorldGameModuleContract();
  assert.equal(validation.ok, true, validation.errors.join("\n"));
  const shellValidation = shell.validateSimulacraWorldShellContract();
  assert.equal(shellValidation.ok, true, shellValidation.errors.join("\n"));

  assert.deepEqual(contract.listSimulacraCommonModuleIds(), [
    "choice-system",
    "smartphone-ui",
    "job-system",
    "money-dpay-ledger",
    "npc-affinity",
    "stock-market",
    "save-system",
    "chat-channel",
    "asset-registry",
    "online-room-admin"
  ]);

  assert.deepEqual(contract.listSimulacraGameModules().map((module) => module.gameId), [
    "singularity-race",
    "drawing-world",
    "iron-line-ops"
  ]);
  assert.equal(contract.getSimulacraGameModule("singularity-race").status, "active");
  assert.equal(contract.getSimulacraGameModule("drawing-world").status, "candidate");
  assert.equal(contract.getSimulacraGameModule("iron-line-ops").status, "reference");
  assert.equal(contract.getSimulacraGameModule("iron-line-ops").role, "ops-reference");
  const shellSnapshot = shell.createSimulacraWorldShellSnapshot();
  assert.equal(shellSnapshot.shellId, "simulacra-world");
  assert.deepEqual(shellSnapshot.launchableGameIds, ["singularity-race"]);
  assert.deepEqual(shellSnapshot.candidateGameIds, ["drawing-world"]);
  assert.deepEqual(shellSnapshot.referenceGameIds, ["iron-line-ops"]);
  assert.equal(shell.createSimulacraWorldGameLaunch("singularity-race").ok, true);
  assert.equal(shell.createSimulacraWorldGameLaunch("drawing-world").ok, false);
  assert.equal(shell.createSimulacraWorldGameLaunch("iron-line-ops").ok, false);
  const page = read(pagePath);
  [
    "시뮬라크월드",
    "createSimulacraWorldShellSnapshot",
    "createSimulacraWorldGameLaunch",
    "./src/restored/engine/simulacra-world-shell.js",
    "data-game-list",
    "후보와 참고 항목은 실행되지 않습니다"
  ].forEach((token) => assert(page.includes(token), `page must include ${token}`));

  const plan = read(planPath);
  [
    "시뮬라크월드",
    "Common Modules",
    "Singularity Race",
    "Drawing World",
    "Iron Line Ops Reference",
    "game module interface",
    "src/restored/engine/simulacra-world-game-module-contract.js",
    "src/restored/engine/simulacra-world-shell.js"
  ].forEach((token) => assert(plan.includes(token), `plan must include ${token}`));

  assert(read(indexPath).includes("plans/simulacra-world-engine.md"), "docs index must link the Simulacra World plan.");
  assert(read(plansReadmePath).includes("simulacra-world-engine.md"), "plans README must list the Simulacra World plan.");
  assert(read(restoredReadmePath).includes("engine/simulacra-world-game-module-contract.js"), "restored README must list the engine module contract.");
  assert(read(restoredReadmePath).includes("engine/simulacra-world-shell.js"), "restored README must list the engine shell snapshot.");
  assert(JSON.parse(read(packagePath)).scripts.check.includes("check-simulacra-world-engine-contract.cjs"), "npm run check must include this contract check.");

  console.log("Simulacra World engine contract check passed.");
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
