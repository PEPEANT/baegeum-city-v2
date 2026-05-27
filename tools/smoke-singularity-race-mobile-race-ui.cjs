"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "singularity-race.html"), "utf8");

function assertIncludes(token, message = `${token} should exist`) {
  assert.ok(source.includes(token), message);
}

function assertExcludes(token, message = `${token} should not exist`) {
  assert.equal(source.includes(token), false, message);
}

function cssBlock(selector) {
  const index = source.indexOf(selector);
  assert.notEqual(index, -1, `${selector} should exist`);
  const open = source.indexOf("{", index);
  assert.notEqual(open, -1, `${selector} should have a block`);
  let depth = 0;
  for (let cursor = open; cursor < source.length; cursor += 1) {
    if (source[cursor] === "{") depth += 1;
    if (source[cursor] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, cursor);
    }
  }
  throw new Error(`${selector} block should close`);
}

function mediaBlock(query) {
  const index = source.indexOf(query);
  assert.notEqual(index, -1, `${query} media block should exist`);
  const open = source.indexOf("{", index);
  assert.notEqual(open, -1, `${query} should open`);
  let depth = 0;
  for (let cursor = open; cursor < source.length; cursor += 1) {
    if (source[cursor] === "{") depth += 1;
    if (source[cursor] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, cursor);
    }
  }
  throw new Error(`${query} media block should close`);
}

assertIncludes("id=\"race-joystick\"", "mobile joystick surface should exist");
assertIncludes("id=\"race-joystick-thumb\"", "mobile joystick thumb should exist");
assertIncludes("id=\"race-sprint-button\"", "mobile hold-to-run button should exist");
assertIncludes("id=\"race-options-button\"", "race options gear should exist");
assertIncludes("id=\"race-options-panel\"", "race options panel should exist");
assertIncludes("id=\"race-options-chat\"", "gear panel should expose chat focus");
assertIncludes("id=\"race-options-queue\"", "gear panel should expose queue");
assertIncludes("startVirtualJoystick", "joystick pointer path should exist");
assertIncludes("moveVirtualJoystick", "joystick move path should exist");
assertIncludes("stopVirtualJoystick", "joystick release path should exist");
assertIncludes("setVirtualSprint", "mobile sprint path should exist");
assertIncludes("focusChatInput", "chat button should focus chat input");

assertExcludes("id=\"race-chat-toggle\"", "race chat toggle button should be removed");
assertExcludes("id=\"race-start-status\"", "race play-status button should be removed");
assertExcludes("class=\"race-dpad-button\"", "mobile WASD buttons should be removed");
assertExcludes(">W</button>", "mobile W label should not render");
assertExcludes(">A</button>", "mobile A label should not render");
assertExcludes(">S</button>", "mobile S label should not render");
assertExcludes(">D</button>", "mobile D label should not render");
assertExcludes("채팅창 열기", "race screen should not show chat open copy");
assertExcludes("관리자 대기중", "race screen should not show play waiting copy");

const desktopInputBlock = cssBlock(".shell[data-screen=\"race\"] .race-input-controls");
assert.ok(desktopInputBlock.includes("display: none"), "PC race input controls should be hidden by default");

const mobileBlock = mediaBlock("@media (max-width: 760px)");
assert.ok(
  mobileBlock.includes(".shell[data-screen=\"race\"] .race-input-controls")
    && mobileBlock.includes("display: block"),
  "mobile race input controls should be enabled only inside the mobile media query"
);
assert.ok(mobileBlock.includes(".race-sprint-button"), "mobile media query should size sprint button");
assert.ok(mobileBlock.includes(".shell[data-screen=\"race\"] .chat-panel"), "mobile media query should protect chat position");

const chatBlock = cssBlock(".shell[data-screen=\"race\"] .chat-panel");
assert.ok(chatBlock.includes("position: fixed"), "race chat should be a fixed overlay");
assert.ok(chatBlock.includes("top: 14px"), "desktop race chat should stay near the upper-left");

const minimapBlock = cssBlock(".race-minimap");
assert.ok(minimapBlock.includes("clamp(176px"), "race minimap should stay larger on desktop");

console.log("Singularity Race mobile race UI smoke passed.");
