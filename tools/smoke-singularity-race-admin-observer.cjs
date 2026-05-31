"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const playerSource = fs.readFileSync(path.join(root, "singularity-race.html"), "utf8");
const adminSource = fs.readFileSync(path.join(root, "singularity-race-admin.html"), "utf8");

assert(adminSource.includes("admin-observer-button"), "admin page should expose an observer entry button");
assert(adminSource.includes("createAdminObserverHref"), "admin page should build an observer launch URL");
assert(adminSource.includes("adminObserver: \"1\""), "admin observer URL should mark the player page as observer mode");
assert(adminSource.includes("elements.observerButton.disabled = !connected || activeRoomClosed"), "closed rooms should disable observer entry");

assert(playerSource.includes("adminObserverEnabled"), "player page should read adminObserver query flag");
assert(playerSource.includes("canAdminObserverLaunch"), "player page should gate observer auto launch");
assert(playerSource.includes("joinDevConnectedRoom(\"admin_observer\", \"spectator\", { adminObserver: true })"), "observer launch should join as a spectator");
assert(playerSource.includes("adminObserverMode"), "player page should track admin observer mode separately from spectator mode");
assert(playerSource.includes("ADMIN_OBSERVER_CAMERA_ZOOM"), "observer camera should use a wider default zoom");
assert(playerSource.includes("advanceAdminObserverCamera"), "observer camera should have its own movement loop");
assert(playerSource.includes("updateAdminObserverCamera"), "observer camera should bypass player follow camera");
assert(playerSource.includes("mode: \"admin-observer\""), "observer camera state should be identifiable");
assert(playerSource.includes("isAdminObserverCameraKey"), "observer keyboard handling should avoid player movement state");
assert(playerSource.includes("state.participantType === \"spectator\""), "observer should remain non-player for combat and item gates");
assert(playerSource.includes("admin-observer-panel"), "observer mode should expose a dedicated operator side panel");
assert(playerSource.includes("admin-observer-toggle"), "observer panel should support open and collapsed states");
assert(playerSource.includes("startAdminObserverPanelDrag"), "observer panel should be draggable from its header");
assert(playerSource.includes("adminObserverPanelPosition"), "observer panel drag position should be stored in observer state");
assert(playerSource.includes("publishAdminObserverStartCountdown"), "observer panel should start the countdown through room control");
assert(playerSource.includes("publishAdminObserverTestBots"), "observer panel should control test bot count");
assert(playerSource.includes("closeRoomFromAdminObserver"), "observer panel should close the active room");
assert(playerSource.includes("adminObserverCameraMode"), "observer panel should switch camera modes");
assert(playerSource.includes("getAdminObserverFollowRunner"), "observer panel should support follow-target camera modes");
assert(playerSource.includes("1등 따라가기"), "observer panel should include a leader follow option");
assert(playerSource.includes("특정 플레이어 따라가기"), "observer panel should include a runner follow option");
assert(playerSource.includes("줌 리셋"), "observer panel should expose zoom reset");

console.log("Singularity Race admin observer smoke passed.");
