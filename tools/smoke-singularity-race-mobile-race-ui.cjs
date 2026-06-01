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
assertIncludes("id=\"race-options-home\"", "gear panel should expose home");
assertIncludes("id=\"race-options-community\"", "gear panel should expose community");
assertIncludes("id=\"race-options-about\"", "gear panel should expose settings/about");
assertIncludes("id=\"race-options-chat\"", "gear panel should expose chat focus");
assertIncludes("id=\"race-options-queue\"", "gear panel should expose queue");
assertIncludes("id=\"race-about-panel\"", "settings/about panel should exist");
assertIncludes("https://gall.dcinside.com/mgallery/board/lists?id=thesingularity", "community link should target the Singularity gallery");
assertIncludes("startVirtualJoystick", "joystick pointer path should exist");
assertIncludes("moveVirtualJoystick", "joystick move path should exist");
assertIncludes("stopVirtualJoystick", "joystick release path should exist");
assertIncludes("createMobileRaceIntent", "mobile joystick should produce race intent");
assertIncludes("state.action.mobileIntent", "mobile race intent should be stored outside WASD key emulation");
assertIncludes("publishConnectedInputRequest(false, frame)", "connected mobile input should heartbeat during held movement");
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
assert.ok(
  mobileBlock.includes("top: 10px")
    && mobileBlock.includes("width: min(258px, calc(100vw - 138px))"),
  "mobile chat log should move to the upper-left without covering the right controls"
);
assert.ok(
  mobileBlock.includes(".shell[data-screen=\"race\"] .race-standings")
    && mobileBlock.includes("display: none"),
  "mobile race should hide panel standings for readability"
);
assert.ok(
  mobileBlock.includes(".shell[data-screen=\"race\"] .race-minimap")
    && mobileBlock.includes("display: block")
    && mobileBlock.includes("width: clamp(96px, 27vw, 108px)")
    && mobileBlock.includes("top: 68px"),
  "mobile race should keep a compact minimap visible without covering controls"
);
assert.ok(
  mobileBlock.includes(".shell[data-screen=\"race\"] .runner-rank-badge:not([hidden])")
    && mobileBlock.includes("display: grid"),
  "mobile race should show rank badges over runners"
);
assert.ok(
  mobileBlock.includes("#race-chat-action-button")
    && mobileBlock.includes("top: 12px")
    && mobileBlock.includes("right: 12px"),
  "mobile chat input button should sit at the top-right"
);
assert.ok(
  mobileBlock.includes("#race-attack-button")
    && mobileBlock.includes("width: 86px")
    && mobileBlock.includes("height: 86px")
    && mobileBlock.includes("bottom: 24px"),
  "mobile attack button should be larger and lower"
);
assert.ok(
  mobileBlock.includes(".race-sprint-button")
    && mobileBlock.includes("width: 78px")
    && mobileBlock.includes("height: 78px")
    && mobileBlock.includes("border-radius: 50%"),
  "mobile sprint should be a larger circular button"
);

const chatBlock = cssBlock(".shell[data-screen=\"race\"] .chat-panel");
assert.ok(chatBlock.includes("position: fixed"), "race chat should be a fixed overlay");
assert.ok(chatBlock.includes("bottom: 16px"), "desktop race chat should stay near the lower-left");
assertIncludes("race-chat-composing", "race chat composer should only open on demand");
assertIncludes(":not(.race-chat-composing) .chat-panel .chat-form", "race chat form should stay hidden until T/chat click");
assertIncludes("runner-rank-badge", "runner avatars should expose mobile rank badges");
assertIncludes("race-ceremony-free", "mobile controls should be able to reappear for ceremony-room free movement");
assertIncludes("race-finished:not(.race-ceremony-free) .race-input-controls", "finish should hide mobile movement controls except in the ceremony room free-move phase");
assertIncludes("race-finished.race-ceremony-free:not(.race-watching-after-finish) .race-result-panel", "mobile watch/restart actions should move above ceremony free-move controls");
assertIncludes("canMoveInCeremonyRoom", "mobile joystick should share the ceremony-room movement gate");

const minimapBlock = cssBlock(".race-minimap {");
assert.ok(minimapBlock.includes("clamp(176px"), "race minimap should stay larger on desktop");
assertIncludes("minimap-obstacle", "race minimap should show obstacle markers");

console.log("Singularity Race mobile race UI smoke passed.");
