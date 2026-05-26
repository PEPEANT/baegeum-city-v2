"use strict";

const assert = require("assert");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");

async function load(relativePath) {
  return import(pathToFileURL(path.join(root, relativePath)).href);
}

(async () => {
  const roundState = await load("src/systems/odd-even-round-state.js");
  const storage = createMemoryStorage();
  const pending = roundState.createPendingOddEvenRound({
    playerState: {
      mapId: "dice-city",
      venueId: "interior-odd-even-casino",
      tableId: "table:odd-even-casino-01:main"
    },
    reservation: {
      roundId: "round:odd-even:test:0001",
      pick: "odd",
      chips: 10
    }
  });

  assert.equal(pending.status, roundState.ODD_EVEN_LOCAL_ROUND_STATUSES.PENDING, "new round should be pending");
  roundState.upsertPendingOddEvenRound(pending, storage);
  assert.equal(roundState.readOddEvenRounds(storage).length, 1, "pending round should persist");
  assert.equal(roundState.canCloseOddEvenRound(pending.roundId, storage).ok, true, "pending round should close");

  const closed = roundState.closeOddEvenRound(pending.roundId, {
    status: roundState.ODD_EVEN_LOCAL_ROUND_STATUSES.SETTLED,
    result: "odd",
    won: true
  }, storage);
  assert.equal(closed.ok, true, "first close should succeed");
  assert.equal(closed.round.status, roundState.ODD_EVEN_LOCAL_ROUND_STATUSES.SETTLED, "round should become settled");
  assert.equal(closed.round.won, true, "closed result should keep win state");

  const duplicate = roundState.closeOddEvenRound(pending.roundId, {
    status: roundState.ODD_EVEN_LOCAL_ROUND_STATUSES.REFUNDED
  }, storage);
  assert.equal(duplicate.ok, false, "second close should fail");
  assert.equal(duplicate.reason, "round_already_closed", "duplicate close should expose the reason");

  const corruptStorage = createMemoryStorage();
  corruptStorage.setItem(roundState.ODD_EVEN_ROUND_STATE_KEY, JSON.stringify({ bad: true }));
  assert.equal(roundState.inspectOddEvenRoundStorage(corruptStorage).status, "corrupt", "bad round state shape should be visible");

  console.log("Odd-even round state smoke check passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value))
  };
}
