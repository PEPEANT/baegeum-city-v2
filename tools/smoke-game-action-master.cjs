"use strict";

const assert = require("assert");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");

async function load(relativePath) {
  return import(pathToFileURL(path.join(root, relativePath)).href);
}

(async () => {
  const {
    GAME_ACTION_TYPES,
    GAME_EFFECT_TYPES,
    GAME_PAYLOAD_CLONE_STATUSES,
    canExecuteGameAction,
    createActionEnvelope,
    createGameAction,
    createGameEffect
  } = await load("src/systems/game-action-master.js");

  const action = createGameAction({
    type: GAME_ACTION_TYPES.EXCHANGE_CHIPS,
    requestId: "req:chip-exchange-001",
    actorId: "player:test",
    source: "mobile_action",
    targetId: "object:chip-counter-001",
    interactionId: "use:chip-counter-001",
    payload: { cash: -10000, chips: 10 },
    context: { channelId: "venue:chip-exchange-01", mapVersion: "baegeum-city-v2-map-001" }
  });
  assert.equal(action.requestId, "req:chip-exchange-001", "requestId should stay stable for dedupe");
  assert.equal(action.context.channelId, "venue:chip-exchange-01", "action should keep channel context");
  assert.equal(action.payloadCloneStatus, GAME_PAYLOAD_CLONE_STATUSES.OK, "valid action payload clone should be observable as ok");
  assert.equal(canExecuteGameAction(action, []).ok, true, "fresh action should execute");
  assert.equal(canExecuteGameAction(action, [action.requestId]).reason, "duplicate_action", "same request should not execute twice");

  const effect = createGameEffect({
    type: GAME_EFFECT_TYPES.ECONOMY_LEDGER_ENTRY,
    actionId: action.requestId,
    payload: { entryType: "chip_exchange", deltas: { cash: -10000, chips: 10 } }
  });
  assert.equal(effect.payloadCloneStatus, GAME_PAYLOAD_CLONE_STATUSES.OK, "valid effect payload clone should be observable as ok");
  const envelope = createActionEnvelope({ action, effects: [effect] });
  assert.equal(envelope.effects[0].actionId, action.requestId, "effects should be tied to action requestId");

  assert.throws(() => createActionEnvelope({
    action,
    effects: [{ type: GAME_EFFECT_TYPES.UI_MESSAGE, actionId: "req:other-action" }]
  }), /does not belong/, "foreign effects should be rejected");

  const circularPayload = { cash: -10000 };
  circularPayload.self = circularPayload;
  const failedAction = createGameAction({
    type: GAME_ACTION_TYPES.EXCHANGE_CHIPS,
    requestId: "req:bad-payload",
    payload: circularPayload
  });
  assert.deepEqual(failedAction.payload, {}, "unclonable action payload should keep the old safe fallback");
  assert.equal(failedAction.payloadCloneStatus, GAME_PAYLOAD_CLONE_STATUSES.CLONE_FAILED, "unclonable action payload should expose clone failure");
  assert.ok(failedAction.payloadCloneReason, "clone failure should expose a reason");

  const failedEffect = createGameEffect({
    type: GAME_EFFECT_TYPES.ECONOMY_LEDGER_ENTRY,
    actionId: action.requestId,
    payload: { bad: BigInt(1) }
  });
  assert.deepEqual(failedEffect.payload, {}, "unclonable effect payload should keep the old safe fallback");
  assert.equal(failedEffect.payloadCloneStatus, GAME_PAYLOAD_CLONE_STATUSES.CLONE_FAILED, "unclonable effect payload should expose clone failure");
  assert.ok(failedEffect.payloadCloneReason, "effect clone failure should expose a reason");

  console.log("Game action master smoke check passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
