"use strict";

const assert = require("assert");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");

async function load(relativePath) {
  return import(pathToFileURL(path.join(root, relativePath)).href);
}

(async () => {
  const ledger = await load("src/systems/economy-ledger.js");
  const actions = await load("src/systems/game-action-master.js");
  const localRuntime = await load("src/systems/local-action-runtime.js");
  const oddEvenRound = await load("src/systems/odd-even-round-runtime.js");

  const context = createContext();
  const base = { cash: 0, bank: 0, chips: 50, stamina: 100, energy: 100, hunger: 100, hungerMax: 100, bagSlots: 12, inventory: [] };
  const reserve = localRuntime.createOddEvenBetReserveEnvelope({ ...context, pick: "odd", chips: 10 });
  const reservation = reserve.action.payload;
  const reserveEntry = findLedgerEffect(reserve).payload;

  const win = oddEvenRound.createOddEvenBetSettleEnvelope({ ...context, reservation, result: "odd" });
  assert.equal(win.action.type, actions.GAME_ACTION_TYPES.BET_SETTLED, "winning round should use bet_settled action");
  assert.equal(win.action.payload.won, true, "matching pick/result should win");
  assert.equal(findLedgerEffect(win).payload.type, ledger.ECONOMY_ENTRY_TYPES.BET_SETTLED, "win should use bet_settled ledger entry");
  assert.equal(findLedgerEffect(win).payload.deltas.chips, 20, "win should pay stake plus profit after reservation");
  assert.equal(findRoundStateEffect(win).payload.status, oddEvenRound.ODD_EVEN_ROUND_STATUSES.SETTLED, "win should close the round");
  assert.equal(ledger.projectEconomyFromLedger(base, [reserveEntry, findLedgerEffect(win).payload]).chips, 60, "winning net should add 10 chips");

  const loss = oddEvenRound.createOddEvenBetSettleEnvelope({ ...context, reservation, result: "even" });
  assert.equal(loss.action.payload.won, false, "different pick/result should lose");
  assert.equal(findLedgerEffect(loss).payload.deltas.chips, 0, "loss should not return chips after reservation");
  assert.equal(ledger.projectEconomyFromLedger(base, [reserveEntry, findLedgerEffect(loss).payload]).chips, 40, "losing net should lose reserved chips");

  const refund = oddEvenRound.createOddEvenBetRefundEnvelope({ ...context, reservation, reason: "test_refund" });
  assert.equal(refund.action.type, actions.GAME_ACTION_TYPES.BET_REFUNDED, "refund should use bet_refunded action");
  assert.equal(findLedgerEffect(refund).payload.type, ledger.ECONOMY_ENTRY_TYPES.BET_REFUNDED, "refund should use bet_refunded ledger entry");
  assert.equal(findLedgerEffect(refund).payload.deltas.chips, 10, "refund should return reserved chips");
  assert.equal(findRoundStateEffect(refund).payload.status, oddEvenRound.ODD_EVEN_ROUND_STATUSES.REFUNDED, "refund should close the round as refunded");
  assert.equal(ledger.projectEconomyFromLedger(base, [reserveEntry, findLedgerEffect(refund).payload]).chips, 50, "refund should restore original chips");

  console.log("Odd-even round runtime smoke check passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

function createContext() {
  const interior = {
    id: "interior-odd-even-casino",
    gameType: "odd-even",
    channels: {
      venue: "venue:odd-even-casino-01",
      table: "table:odd-even-casino-01:main"
    }
  };
  return {
    interior,
    playerState: {
      mode: "table_seated",
      scene: interior.id,
      mapId: "dice-city",
      venueId: interior.id,
      tableId: interior.channels.table,
      chatChannelId: interior.channels.table
    },
    contract: { mapId: "dice-city", mapVersion: "baegeum-city-v2-map-001" }
  };
}

function findLedgerEffect(envelope) {
  return envelope.effects.find((effect) => effect.type === "economy_ledger_entry");
}

function findRoundStateEffect(envelope) {
  return envelope.effects.find((effect) => effect.type === "world_object_state_patch");
}
