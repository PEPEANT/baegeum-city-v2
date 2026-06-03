"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const prototypePath = path.join(root, "free-race-prototype.html");
const html = fs.readFileSync(prototypePath, "utf8");
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);

assert(scriptMatch, "free-race-prototype.html should keep one inline script");
assert.doesNotThrow(() => new Function(scriptMatch[1]), "prototype inline script should parse");

[
  "const AUTHORITY_STATE_KEYS = Object.freeze([\"x\", \"y\", \"vx\", \"vy\"])",
  "function deriveProgressFromPoint",
  "progressPercent",
  "laneOffsetPx",
  "segment.startDistance",
  "deltaX * normalX + deltaY * normalY",
  "function advancePlayer",
  "player.vx +=",
  "player.vy +=",
  "player.x +=",
  "player.y +=",
  "MOVE_ACCELERATION = 3200",
  "PLAYER_COLLISION_RADIUS = 15",
  "PRESSURE_PAD_INSET_X",
  "PRESSURE_PAD_INSET_Y",
  "MOVEMENT_DRAG",
  "OFF_COURSE_DRAG = 11.2",
  "MAX_MOVE_SPEED",
  "OFF_COURSE_MAX_SPEED",
  "function applyDrag",
  "function clampVelocity",
  "function resolveCircleCollision",
  "BODY_COLLISION_IMPULSE",
  "areAllPadsOccupied",
  "function pressureContactPoint",
  "function isPlayerStandingOnPad",
  "touchStick",
  "window.__freeRacePrototype"
].forEach((token) => assert.ok(html.includes(token), `prototype should include ${token}`));

[
  "<script type=\"module\"",
  "import ",
  "fetch(",
  "WebSocket",
  "localStorage",
  "sessionStorage",
  "workers/",
  "singularity-race.html",
  "player.progressPercent +=",
  "progressPercent +=",
  "function circleInsideRect",
  "rect.x - PLAYER_RADIUS",
  "rect.w + PLAYER_RADIUS",
  "const GROUND_FRICTION",
  "const MAX_SPEED",
  "GRAVITY_ACCELERATION",
  "JUMP_VELOCITY",
  "FAST_FALL_ACCELERATION",
  "AIR_CONTROL_MULTIPLIER",
  "function resolveTerrain",
  "function floorYAt",
  "onGround",
  "input.jump",
  "input.drop",
  "player.vx = Math.min(player.vx, 0)"
].forEach((token) => assert.equal(html.includes(token), false, `prototype should not include ${token}`));

assert.ok(
  html.indexOf("player.vx +=") < html.indexOf("player.x +=")
    && html.indexOf("player.vy +=") < html.indexOf("player.y +="),
  "prototype should integrate velocity before position"
);

assert.ok(
  html.includes("players.some((player) => isPlayerStandingOnPad(player, pad))"),
  "prototype pressure plates should use the top-view contact-point check"
);

assert.ok(
  html.indexOf("advancePlayer(players[1]") < html.indexOf("const gateOpen = areAllPadsOccupied();"),
  "gate state should be resolved after this frame's movement"
);

assert.ok(
  html.includes("const normalVelocity = player.vx * nx + player.vy * ny;"),
  "gate collision should remove velocity along the collision normal"
);

console.log("Free race prototype smoke passed.");
