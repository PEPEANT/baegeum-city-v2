"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pageSource = fs.readFileSync(path.join(root, "singularity-race.html"), "utf8");
const runnerViewSource = fs.readFileSync(path.join(root, "src/restored/games/singularity-race-runner-view.js"), "utf8");

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
const trackBody = functionBody("renderTrack");
const minimapBody = functionBody("renderRaceMinimap");
const softPassPressureBody = functionBody("calculateSoftPassPressure");
const softPassOffsetBody = functionBody("calculateSoftPassSideOffset");
const basicAttackBody = functionBody("performBasicAttack");
const keyUpBody = functionBody("handleActionKeyUp");
const releaseMoveBody = functionBody("releaseVirtualMoveKeys");
const staleReleaseBody = functionBody("releaseStaleMovementKeys");
const sprintBody = functionBody("setVirtualSprint");
const focusChatBody = functionBody("focusChatInput");
const closeChatComposerBody = functionBody("closeRaceChatComposer");

assert(pageSource.includes("RACE_HUD_RENDER_INTERVAL_MS"), "race HUD render interval should exist");
assert(!pageSource.includes("RACE_STANDINGS_RENDER_INTERVAL_MS"), "race standings should not be refreshed during the running hot path");
assert(pageSource.includes("RACE_RANKING_RENDER_INTERVAL_MS"), "live ranking should have a bounded refresh interval");
assert(!pageSource.includes("LIVE RANK"), "race ranking overlay should not show a developer-style LIVE RANK label");
assert(pageSource.includes("content: attr(data-rank)"), "race ranking rows should show an explicit rank badge");
assert(runnerViewSource.includes("row.dataset.rank"), "standing rows should expose the rank for the badge UI");
assert(pageSource.includes("ranked.slice(0, 5)"), "race ranking overlay should stay capped to five visible rows on desktop");
assert(!runnerViewSource.includes("HP"), "race ranking rows should stay simple and omit HP text");
assert(pageSource.includes("채팅 숨기기") && pageSource.includes("채팅 보이기"), "race options should own chat visibility");
assert(pageSource.includes("race-chat-composing"), "race chat input should have a composing-only state");
assert(pageSource.includes(":not(.race-chat-composing) .chat-panel .chat-form"), "race chat form should stay hidden until chat is active");
assert(focusChatBody.includes("state.raceChatInputOpen = true"), "T/chat click should open the chat input composer");
assert(closeChatComposerBody.includes("state.raceChatInputOpen = false"), "chat composer should close independently from the message log");
assert(pageSource.includes(".shell[data-screen=\"race\"] #race-queue-toggle"), "race queue button should not float as a standalone control");
assert(pageSource.includes("RACE_SLOT_RENDER_INTERVAL_MS"), "race slot render interval should exist");
assert(pageSource.includes("renderCache"), "race render cache should exist");
assert(pageSource.includes("runnerMotion"), "runner motion cache should exist for run animation");
assert(pageSource.includes("runner-run-cycle"), "runner sprites should animate like running instead of sliding");
assert(pageSource.includes("track-start-crowd"), "start-line crowd should exist as a static stadium decoration");
assert(pageSource.includes("start-crowd-hop"), "start-line ordinary citizens should use CSS motion instead of hot-loop JS");
assert(!trackBody.includes("track-start-crowd"), "start-line crowd should not be rebuilt by the hot track render loop");
assert(pageSource.includes("pixel-citizen") && !pageSource.includes("track-start-crowd\"><img"), "start-line crowd should be CSS citizens, not race skin avatars");
assert(!/\.runner-avatar img\s*\{[^}]*runner-idle-breath/s.test(pageSource), "idle runner sprites should not keep breathing in place");
assert(!pageSource.includes("focus-pulse"), "player focus ring should stay static while idle");
assert(pageSource.includes("lastMovementInputAtMs"), "recent movement input should preserve facing for short key taps");
assert(pageSource.includes("hasRecentMovementInput"), "recent input grace should smooth short key taps");
assert(pageSource.includes("releaseStaleMovementKeys(now)"), "hot loop should clear movement keys only after focus loss");
assert(staleReleaseBody.includes("!document.hidden && document.hasFocus()"), "stale movement release should not interrupt focused held-key sprinting");
assert(pageSource.includes("event.repeat && !state.action.keys[event.code]"), "orphan key-repeat events should not restart movement");
assert(pageSource.includes("hasFreshPlayerMovementInput(timing.now)"), "local run animation should require fresh player input");
assert(pageSource.includes("if (!wasPressed) recordMovementInput(event.code);"), "key-repeat events should not keep reviving movement freshness");
assert(pageSource.includes("cancelPlayerMovementForAction(now, attackFacingDirection)"), "basic attack should cancel held movement before the visual resolves");
assert(pageSource.includes("state.action.lastMovementInputAtMs = 0"), "action cancels should clear stale movement freshness");
assert(pageSource.includes("function stopPlayerRunAnimation"), "player run animation should have an explicit stop path");
assert(keyUpBody.includes("stopPlayerRunAnimation(Date.now())"), "movement keyup should stop local run animation immediately");
assert(keyUpBody.includes("releasedSprintKey"), "sprint keyup should be treated as a motion release");
assert(releaseMoveBody.includes("stopPlayerRunAnimation(Date.now())"), "virtual movement release should stop local run animation immediately");
assert(sprintBody.includes("!nextPressed && !hasMovementKeyHeld()"), "mobile sprint release should stop motion when no movement key is held");
assert(!pageSource.includes("createSingularityPlayerFocusRingNode(playerPoint"), "player focus ring should not render in the race effects layer");
assert(pageSource.includes("BASIC_ATTACK_COOLDOWN_MS"), "basic attack should have a cooldown");
assert(pageSource.includes("attackVisualId"), "basic attack visual should have a one-shot sequence id");
assert(pageSource.includes("scheduleAttackVisualCleanup"), "basic attack visual should schedule a one-shot cleanup render");
assert(pageSource.includes("triggerVirtualAttackButton"), "mobile attack button should use the same attack path");
assert(pageSource.includes("--runner-facing-scale"), "runner side sprites should flip by facing direction");
assert(pageSource.includes("scheduleActionPreviewLoop()"), "movement loop should start through a scheduler");
assert(pageSource.includes("window.requestAnimationFrame(advanceActionPreviewLoop)"), "movement loop should use animation frames");
assert(pageSource.includes("startActionPreviewWatchdog()"), "movement loop should have a watchdog for stalled countdown/race frames");
assert(pageSource.includes("Singularity Race action preview loop failed"), "movement loop should report frame errors without stopping permanently");
assert(!pageSource.includes("setInterval(advanceActionPreview, 60)"), "movement loop should not be stuck at a 60ms timer");
assert(loopBody.includes("scheduleActionPreviewLoop()"), "animation loop should reschedule itself");
assert(functionBody("startActionPreviewWatchdog").includes("Date.now() - state.action.lastTickMs < 500"), "watchdog should only run when the frame loop stalls");
assert(advanceBody.includes("renderActionPreviewFrame(now)"), "hot movement loop should use lightweight frame render");
assert(advanceBody.includes("state.screen !== SINGULARITY_RACE_SCREENS.RACE"), "animation frames should not redraw inactive screens");
assert(!advanceBody.includes("resolveSingleRailCollisions(\"pack\")"), "normal pack movement should not physically jitter the local runner every frame");
assert(frameBody.includes("renderTrack();"), "lightweight frame should keep track rendering hot");
assert(pageSource.includes("listRestoredMarathonTrailSavePoints,"), "race minimap save-point helper must be imported before the hot render loop calls it");
assert(pageSource.includes("renderRaceStandings"), "race screen should expose live standings");
assert(frameBody.includes("RACE_RANKING_RENDER_INTERVAL_MS"), "hot frame should throttle live ranking refreshes");
assert(frameBody.includes("renderRaceStandings();"), "hot frame should refresh live ranking at the bounded interval");
assert(!pageSource.includes("setRaceCue(\"rank\""), "rank-change cue should not appear while running");
assert(!frameBody.includes("renderMessages();"), "hot frame must not redraw chat messages");
assert(!frameBody.includes("renderProfileSkins();"), "hot frame must not redraw profile skins");
assert(trackBody.includes("if (avatar.className !== nextClassName) avatar.className = nextClassName;"), "runner classes should not be rewritten every frame");
assert(trackBody.includes("!attacking && !stunned && motion.running"), "attack and stun states should suppress run animation");
assert(trackBody.includes("!attacking && !stunned && runner.collisionAtMs"), "stun and attack states should take visual priority over collision flash");
assert(trackBody.includes("if (!avatar.parentNode) elements.trackRunners.append(avatar);"), "hot track render should not re-append every runner DOM node each frame");
assert(pageSource.includes("runner.id === \"you\" ? moving : timing.now - lastMovedAtMs < 180"), "local player should not keep a run-animation grace tail after movement release");
assert(minimapBody.includes("minimapPlayerNode"), "minimap should cache static SVG and move only the player dot");
assert(softPassPressureBody.includes("runnerId === \"you\""), "AI pack pressure should not slow or jitter the local player directly");
assert(softPassOffsetBody.includes("runner.id === \"you\""), "soft pass visual offset should not move the local player at rest");
assert(!basicAttackBody.includes("state.runners[0] = { ...player, collisionAtMs: now };"), "attacker should not enter collision flash after a basic attack");
assert(!basicAttackBody.includes("target.hp ="), "basic attack should replace target runner state instead of mutating a possibly frozen runner");
assert(basicAttackBody.includes("state.runners[targetIndex] = updatedTarget"), "basic attack should write a replaced target runner state");
assert(pageSource.includes("runner-stun-shake"), "stunned runners should use a stun-specific animation");

console.log("Singularity Race render budget smoke passed.");
