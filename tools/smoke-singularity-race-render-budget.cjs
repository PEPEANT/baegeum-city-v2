"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pageSource = fs.readFileSync(path.join(root, "singularity-race.html"), "utf8");

function functionBody(name) {
  const start = pageSource.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  let depth = 0;
  let opened = false;
  for (let index = start; index < pageSource.length; index += 1) {
    const char = pageSource[index];
    if (char === "{") {
      depth += 1;
      opened = true;
    } else if (char === "}") {
      depth -= 1;
      if (opened && depth === 0) return pageSource.slice(start, index + 1);
    }
  }
  throw new Error(`${name} body should close`);
}

const advanceBody = functionBody("advanceActionPreview");
const loopBody = functionBody("advanceActionPreviewLoop");
const frameBody = functionBody("renderActionPreviewFrame");
const minimapBody = functionBody("renderRaceMinimap");

assert(pageSource.includes("RACE_HUD_RENDER_INTERVAL_MS"), "race HUD render interval should exist");
assert(!pageSource.includes("RACE_STANDINGS_RENDER_INTERVAL_MS"), "race standings should not be refreshed during the running hot path");
assert(pageSource.includes("RACE_SLOT_RENDER_INTERVAL_MS"), "race slot render interval should exist");
assert(pageSource.includes("renderCache"), "race render cache should exist");
assert(pageSource.includes("runnerMotion"), "runner motion cache should exist for run animation");
assert(pageSource.includes("runner-run-cycle"), "runner sprites should animate like running instead of sliding");
assert(pageSource.includes("lastMovementInputAtMs"), "recent movement input should gate local run animation");
assert(pageSource.includes("hasRecentMovementInput"), "recent input grace should smooth short key taps");
assert(pageSource.includes("BASIC_ATTACK_COOLDOWN_MS"), "basic attack should have a cooldown");
assert(pageSource.includes("triggerVirtualAttackButton"), "mobile attack button should use the same attack path");
assert(pageSource.includes("--runner-facing-scale"), "runner side sprites should flip by facing direction");
assert(pageSource.includes("requestAnimationFrame(advanceActionPreviewLoop)"), "movement loop should use animation frames");
assert(!pageSource.includes("setInterval(advanceActionPreview, 60)"), "movement loop should not be stuck at a 60ms timer");
assert(loopBody.includes("requestAnimationFrame(advanceActionPreviewLoop)"), "animation loop should reschedule itself");
assert(advanceBody.includes("renderActionPreviewFrame(now)"), "hot movement loop should use lightweight frame render");
assert(advanceBody.includes("state.screen !== SINGULARITY_RACE_SCREENS.RACE"), "animation frames should not redraw inactive screens");
assert(frameBody.includes("renderTrack();"), "lightweight frame should keep track rendering hot");
assert(pageSource.includes("clearRaceStandings"), "running race standings should be cleared instead of rendered");
assert(!frameBody.includes("renderRaceStandings();"), "hot frame must not render ranking rows while running");
assert(!pageSource.includes("setRaceCue(\"rank\""), "rank-change cue should not appear while running");
assert(!frameBody.includes("renderMessages();"), "hot frame must not redraw chat messages");
assert(!frameBody.includes("renderProfileSkins();"), "hot frame must not redraw profile skins");
assert(minimapBody.includes("minimapPlayerNode"), "minimap should cache static SVG and move only the player dot");

console.log("Singularity Race render budget smoke passed.");
