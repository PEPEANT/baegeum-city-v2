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
assertIncludes("id=\"race-sprint-button\" type=\"button\" hidden aria-hidden=\"true\"", "legacy sprint button should stay hidden");
assertIncludes("id=\"race-options-button\"", "race options gear should exist");
assertIncludes("id=\"race-options-panel\"", "race options panel should exist");
assertIncludes("id=\"race-options-home\"", "gear panel should expose home");
assertIncludes("id=\"race-options-community\"", "gear panel should expose community");
assertIncludes("id=\"race-options-about\"", "gear panel should expose settings/about");
assertIncludes("id=\"race-options-fullscreen\"", "gear panel should expose fullscreen lock");
assertIncludes("id=\"race-options-chat\"", "gear panel should expose chat focus");
assertIncludes("id=\"race-options-queue\"", "gear panel should expose queue");
assertIncludes("id=\"race-about-panel\"", "settings/about panel should exist");
assertIncludes("id=\"race-watch-controls\"", "spectator watch camera controls should exist");
assertIncludes("id=\"race-watch-prev\"", "spectator watch camera should expose previous runner");
assertIncludes("id=\"race-watch-next\"", "spectator watch camera should expose next runner");
assertIncludes("watchTargetRunnerId", "spectators and finishers should share a selected watch target");
assertIncludes("cycleWatchTargetRunner", "watch camera controls should cycle runner targets");
assertIncludes("RACE_FULLSCREEN_LOCK_STORAGE_KEY", "fullscreen lock preference should be persisted");
assertIncludes("maybeRequestRaceFullscreen", "fullscreen lock should request fullscreen from user gestures");
assertIncludes("toggleRaceFullscreenLock", "fullscreen lock should be user-toggleable");
assertIncludes("height: 100dvh", "race screen should use dynamic viewport height on mobile browsers");
assertIncludes("overscroll-behavior: none", "race screen should prevent mobile viewport scroll bounce");
assertIncludes("https://gall.dcinside.com/mgallery/board/lists?id=thesingularity", "community link should target the Singularity gallery");
assertIncludes("startVirtualJoystick", "joystick pointer path should exist");
assertIncludes("moveVirtualJoystick", "joystick move path should exist");
assertIncludes("stopVirtualJoystick", "joystick release path should exist");
assertIncludes("createMobileRaceIntent", "mobile joystick should produce race intent");
assertIncludes("createMobileRaceDirection", "mobile joystick should produce screen-direction movement");
assertIncludes("state.action.mobileIntent", "mobile race intent should be stored outside WASD key emulation");
assertIncludes("state.action.mobileDirection", "mobile race direction should avoid direct progress/lane intent");
assertIncludes("direction: state.action.mobileDirection || undefined", "mobile input frame should prefer screen direction over race intent");
assertIncludes("CONNECTED_INPUT_PUMP_INTERVAL_MS = 100", "connected mobile input pump should stay within the 10 Hz budget");
assertIncludes("startConnectedInputPump", "connected mobile input should use a render-independent pump");
assertIncludes("function setVirtualSprint", "legacy sprint path should only clear stale Shift state");
assertIncludes("focusChatInput", "chat button should focus chat input");

assertExcludes("id=\"race-chat-toggle\"", "race chat toggle button should be removed");
assertExcludes("id=\"race-start-status\"", "race play-status button should be removed");
assertExcludes("class=\"race-dpad-button\"", "mobile WASD buttons should be removed");
assertExcludes(">W</button>", "mobile W label should not render");
assertExcludes(">A</button>", "mobile A label should not render");
assertExcludes(">S</button>", "mobile S label should not render");
assertExcludes(">D</button>", "mobile D label should not render");
assertExcludes("채팅창 열기", "race screen should not show chat open copy");

const desktopInputBlock = cssBlock(".shell[data-screen=\"race\"] .race-input-controls");
assert.ok(desktopInputBlock.includes("display: none"), "PC race input controls should be hidden by default");

const mobileBlock = mediaBlock("@media (max-width: 760px)");
assert.ok(
  mobileBlock.includes(".shell[data-screen=\"race\"] .race-input-controls")
    && mobileBlock.includes("display: block"),
  "mobile race input controls should be enabled only inside the mobile media query"
);
assert.ok(source.includes(".race-sprint-button") && source.includes("display: none !important"), "mobile sprint button should be visually removed");
assert.ok(mobileBlock.includes(".shell[data-screen=\"race\"] .chat-panel"), "mobile media query should protect chat position");
assert.ok(
  mobileBlock.includes(".shell[data-screen=\"queue\"] .chat-panel")
    && mobileBlock.includes("height: clamp(184px, calc(100dvh - 176px), 360px)")
    && mobileBlock.includes("min-height: 0"),
  "mobile queue chat should fit portrait and landscape without bottom clipping"
);
assertIncludes("queue-skin-toggle", "queue room should expose a skin collapse toggle");
assertIncludes("queueSkinPanelOpen: false", "queue skin panel should start collapsed");
assert.ok(
  mobileBlock.includes("top: 8px")
    && mobileBlock.includes("width: min(196px, calc(100vw - 108px))")
    && mobileBlock.includes("height: 78px"),
  "mobile chat log should be compact in the upper-left without covering the field"
);
assert.ok(
  mobileBlock.includes(".shell[data-screen=\"race\"].race-chat-closed .race-chat-open-button")
    && mobileBlock.includes("display: inline-grid !important")
    && source.includes(">CHAT</button>"),
  "mobile closed chat should leave only a small CHAT chip"
);
assert.ok(
  mobileBlock.includes(".shell[data-screen=\"race\"] .race-chat-close-button")
    && mobileBlock.includes("display: inline-grid !important")
    && mobileBlock.includes("width: 22px"),
  "mobile open chat should expose a tiny close button"
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
  !mobileBlock.includes(".shell[data-screen=\"race\"] .runner-rank-badge:not([hidden])"),
  "mobile race should not stack rank badges above runner health/name UI"
);
assert.ok(
  mobileBlock.includes("#race-chat-action-button")
    && mobileBlock.includes("top: 8px")
    && mobileBlock.includes("right: 8px")
    && mobileBlock.includes("width: 40px"),
  "mobile chat input button should sit at the top-right"
);
assert.ok(
  mobileBlock.includes("#race-attack-button")
    && mobileBlock.includes("width: 70px")
    && mobileBlock.includes("height: 70px")
    && mobileBlock.includes("bottom: 18px"),
  "mobile attack button should be compact and low"
);
assert.ok(
  !mobileBlock.includes("height: 58px")
    && !mobileBlock.includes("place-items: center;\n        border-radius: 50%;\n        font-size: 10px"),
  "mobile sprint button sizing should be removed"
);

const chatBlock = cssBlock(".shell[data-screen=\"race\"] .chat-panel");
assert.ok(chatBlock.includes("position: fixed"), "race chat should be a fixed overlay");
assert.ok(chatBlock.includes("bottom: 16px"), "desktop race chat should stay near the lower-left");
assertIncludes("race-chat-composing", "race chat composer should only open on demand");
assertIncludes(":not(.race-chat-composing) .chat-panel .chat-form", "race chat form should stay hidden until T/chat click");
assertIncludes("createRunnerNameplateLabel", "runner rank should be folded into the nameplate label");
assertIncludes("has-visible-health", "runner health bars should stay hidden until damage makes them relevant");
assertIncludes("race-ceremony-free", "mobile controls should be able to reappear for ceremony-room free movement");
assertIncludes("race-finished:not(.race-ceremony-free) .race-input-controls", "finish should hide mobile movement controls except in the ceremony room free-move phase");
assertIncludes("race-finished.race-watching-after-finish .race-input-controls", "post-finish watching should keep the mobile control layer available for chat");
assertIncludes("race-finished.race-watching-after-finish #race-chat-action-button", "post-finish watching should keep the mobile chat action visible");
assertIncludes(".shell[data-screen=\"race\"].is-spectator #race-chat-action-button", "spectator mode should keep the chat action visible");
assertIncludes(".shell[data-screen=\"race\"].race-watch-camera .race-watch-controls:not([hidden])", "watch camera mode should show previous/next controls");
assertIncludes(".shell.is-spectator .race-joystick-stack", "spectator mode should hide movement controls without hiding chat");
assertExcludes(".shell.is-spectator .race-input-controls {\n      display: none;", "spectator mode should not hide the whole input layer");
assertIncludes("race-finished.race-ceremony-free:not(.race-watching-after-finish) .race-result-panel", "mobile watch/restart actions should move above ceremony free-move controls");
assertIncludes("canMoveInCeremonyRoom", "mobile joystick should share the ceremony-room movement gate");

const minimapBlock = cssBlock(".race-minimap {");
assert.ok(minimapBlock.includes("clamp(176px"), "race minimap should stay larger on desktop");
assertIncludes("minimap-obstacle", "race minimap should show obstacle markers");

console.log("Singularity Race mobile race UI smoke passed.");
