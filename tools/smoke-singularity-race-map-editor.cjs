"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function assertIncludes(source, token, message) {
  assert.ok(source.includes(token), message);
}

async function main() {
  const editorSource = read("singularity-race-map-editor.html");
  const adminSource = read("singularity-race-admin.html");
  const packageJson = JSON.parse(read("package.json"));
  const draftContract = await import(pathToFileURL(path.join(root, "src/restored/games/singularity-race-map-draft-contract.js")));
  const validation = draftContract.validateSingularityRaceMapDraftContract();
  assert.equal(validation.ok, true, validation.errors.join("\n"));

  [
    "특이점레이스 맵 에디터",
    "editor-stage",
    "spectator-marker",
    "obstacle-marker",
    "obstacle-marker::before",
    "obstacle-marker.is-crate::before",
    "listSingularityRaceMapSpectators",
    "listSingularityRaceMapObstacles",
    "createSingularityRaceMapDraft",
    "createSingularityRaceMapDraftKey",
    "normalizeSingularityRaceMapDraft",
    "progressToRestoredMarathonMapPoint",
    "estimateRestoredMarathonTrailProgressFromPoint",
    "startDrag",
    "moveDrag",
    "saveDraft",
    "resetDraft",
    "resolveCoordinate",
    "localStorage.setItem(createSingularityRaceMapDraftKey(state.mapId)",
    "Array.isArray(previous?.obstacles) ? previous.obstacles : state.obstacles"
  ].forEach((token) => assertIncludes(editorSource, token, `map editor should include ${token}`));

  [
    "admin-map-editor-link",
    "singularity-race-map-editor.html",
    "createRaceMapEditorHref",
    "syncMapEditorLink",
    "mapId: normalizeRestoredMarathonTrailMapId(mapId)"
  ].forEach((token) => assertIncludes(adminSource, token, `admin should link map editor with ${token}`));

  assertIncludes(packageJson.scripts["check:singularity-race"], "tools/smoke-singularity-race-map-editor.cjs", "Singularity Race quick check should include the map editor smoke");
  assertIncludes(packageJson.scripts.check, "tools/smoke-singularity-race-map-editor.cjs", "full check should include the map editor smoke");
  console.log("Singularity Race map editor smoke passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
