"use strict";

const assert = require("assert");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");

async function load(relativePath) {
  return import(pathToFileURL(path.join(root, relativePath)).href);
}

(async () => {
  const contract = await load("src/data/economy-loop-contract.js");
  const ledger = await load("src/systems/economy-ledger.js");
  const exchangeUi = await load("src/ui/exchange-atm-panel.js");

  contract.assertEconomyLoopShape();

  assert.equal(contract.CHIP_EXCHANGE_POLICY.wonPerChip, exchangeUi.RATE_WON_PER_CHIP, "contract exchange rate should match ATM UI");
  assert.deepEqual([...contract.CHIP_EXCHANGE_POLICY.options], [...exchangeUi.EXCHANGE_OPTIONS], "contract exchange options should match ATM UI");

  const summary = contract.economyLoopSummary();
  assert.equal(summary.total, contract.economyLoopItems.length, "summary should count every loop item");
  assert.ok(summary.implemented >= 3, "contract should mark the current implemented economy primitives");

  const gaps = contract.economyLoopGaps();
  assert.ok(gaps.some((item) => item.id === "transfer:player-to-player"), "player transfer should remain visible as a gap");
  assert.ok(gaps.some((item) => item.id === "time:scheduled-economic-events"), "time-driven economy should remain visible as a gap");
  assert.ok(gaps.some((item) => item.id === "betting:settle-or-refund"), "bet settlement should remain visible as a gap");

  const ledgerTypes = Object.values(ledger.ECONOMY_ENTRY_TYPES);
  const missingLedgerTypes = contract.missingLedgerTypeIds(ledgerTypes);
  assert.ok(missingLedgerTypes.includes("player_transfer"), "player transfer should require a new ledger type");
  assert.ok(missingLedgerTypes.includes("item_purchased"), "food purchase should require an atomic purchase ledger type");
  assert.ok(missingLedgerTypes.includes("stat_changed"), "hunger and energy ticks should require a stat ledger/effect type");

  const transfer = contract.listEconomyLoopItems({ kind: contract.ECONOMY_LOOP_KINDS.TRANSFER })[0];
  assert.equal(transfer.serverAuthorityRequired, true, "player transfers should require server authority");

  console.log("Economy loop contract smoke check passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
