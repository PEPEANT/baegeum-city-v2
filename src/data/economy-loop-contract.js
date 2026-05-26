export const ECONOMY_LOOP_VERSION = "economy-loop-001";

export const ECONOMY_LOOP_STATUSES = Object.freeze({
  IMPLEMENTED: "implemented",
  PARTIAL: "partial",
  CONTRACT_ONLY: "contract_only",
  BLOCKED_BY_LEDGER_TYPE: "blocked_by_ledger_type"
});

export const ECONOMY_LOOP_KINDS = Object.freeze({
  SOURCE: "source",
  SINK: "sink",
  EXCHANGE: "exchange",
  TRANSFER: "transfer",
  BETTING: "betting",
  TIME: "time",
  MARKET: "market",
  AUTHORITY: "authority"
});

export const CHIP_EXCHANGE_POLICY = Object.freeze({
  id: "chip-atm-fixed-v0",
  wonPerChip: 1000,
  options: Object.freeze([10, 50, 100]),
  spreadPercent: 0,
  dailyLimitChips: null,
  current: true,
  risk: "No fee, spread, or daily cap yet; this is useful for tests but weak for long-term balance."
});

export const economyLoopItems = Object.freeze([
  loopItem({
    id: "source:initial-cash",
    kind: ECONOMY_LOOP_KINDS.SOURCE,
    status: ECONOMY_LOOP_STATUSES.IMPLEMENTED,
    owner: "src/systems/player-economy-state.js",
    ledgerTypes: [],
    note: "Local prototype starts with 100000 cash. This is a seed, not a repeatable income loop."
  }),
  loopItem({
    id: "source:work-cash",
    kind: ECONOMY_LOOP_KINDS.SOURCE,
    status: ECONOMY_LOOP_STATUSES.CONTRACT_ONLY,
    owner: "future job/work loop",
    ledgerTypes: ["cash_grant"],
    timeEventIds: ["lunch-crowd"],
    note: "Part-time work or grind income can reuse cash_grant, but no gameplay producer exists yet."
  }),
  loopItem({
    id: "sink:food-purchase",
    kind: ECONOMY_LOOP_KINDS.SINK,
    status: ECONOMY_LOOP_STATUSES.BLOCKED_BY_LEDGER_TYPE,
    owner: "future convenience-store loop",
    requiredLedgerTypes: ["item_purchased"],
    note: "Buying food must atomically remove cash and add an item; item_granted alone is not enough."
  }),
  loopItem({
    id: "sink:transport-fee",
    kind: ECONOMY_LOOP_KINDS.SINK,
    status: ECONOMY_LOOP_STATUSES.BLOCKED_BY_LEDGER_TYPE,
    owner: "future bus/taxi loop",
    requiredLedgerTypes: ["cash_spent"],
    note: "Map travel can start free, but paid bus routes need a ledger-backed cash sink."
  }),
  loopItem({
    id: "sink:hunger-energy-tick",
    kind: ECONOMY_LOOP_KINDS.TIME,
    status: ECONOMY_LOOP_STATUSES.BLOCKED_BY_LEDGER_TYPE,
    owner: "future stats loop",
    requiredLedgerTypes: ["stat_changed"],
    timeDriven: true,
    note: "Hunger, energy, and stamina exist, but WorldClock does not mutate them yet."
  }),
  loopItem({
    id: "exchange:chip-atm",
    kind: ECONOMY_LOOP_KINDS.EXCHANGE,
    status: ECONOMY_LOOP_STATUSES.IMPLEMENTED,
    owner: "src/ui/exchange-atm-panel.js",
    ledgerTypes: ["chip_exchange"],
    policyId: CHIP_EXCHANGE_POLICY.id,
    note: "Cash and chips move in opposite directions at the fixed DiceLand test rate."
  }),
  loopItem({
    id: "betting:reserve",
    kind: ECONOMY_LOOP_KINDS.BETTING,
    status: ECONOMY_LOOP_STATUSES.IMPLEMENTED,
    owner: "src/ui/odd-even-table-panel.js",
    ledgerTypes: ["bet_reserved"],
    note: "Odd-even table UI can reserve chips before a local settlement or refund close."
  }),
  loopItem({
    id: "betting:settle-or-refund",
    kind: ECONOMY_LOOP_KINDS.BETTING,
    status: ECONOMY_LOOP_STATUSES.PARTIAL,
    owner: "src/systems/odd-even-round-runtime.js + src/systems/odd-even-round-state.js",
    ledgerTypes: ["bet_settled", "bet_refunded"],
    note: "Table UI can locally settle/refund one reserved round and persist its closed state; reconnect recovery and server authority are still pending."
  }),
  loopItem({
    id: "transfer:player-to-player",
    kind: ECONOMY_LOOP_KINDS.TRANSFER,
    status: ECONOMY_LOOP_STATUSES.BLOCKED_BY_LEDGER_TYPE,
    owner: "future online server",
    requiredLedgerTypes: ["player_transfer"],
    serverAuthorityRequired: true,
    note: "User-to-user money movement needs limits, fees, request ids, audit logs, and server authority."
  }),
  loopItem({
    id: "time:scheduled-economic-events",
    kind: ECONOMY_LOOP_KINDS.TIME,
    status: ECONOMY_LOOP_STATUSES.CONTRACT_ONLY,
    owner: "src/systems/world-clock.js",
    timeEventIds: ["morning-news", "lunch-crowd", "casino-peak", "night-rumor"],
    note: "Clock events are detected, but they do not create jobs, prices, crowds, or ledger entries yet."
  }),
  loopItem({
    id: "market:stock-price-tick",
    kind: ECONOMY_LOOP_KINDS.MARKET,
    status: ECONOMY_LOOP_STATUSES.BLOCKED_BY_LEDGER_TYPE,
    owner: "future phone stock app",
    requiredLedgerTypes: ["market_order", "market_settlement"],
    timeDriven: true,
    note: "Phone stock prices need server-time ticks and ledger-backed orders before real trading."
  }),
  loopItem({
    id: "authority:server-economy",
    kind: ECONOMY_LOOP_KINDS.AUTHORITY,
    status: ECONOMY_LOOP_STATUSES.CONTRACT_ONLY,
    owner: "future server",
    serverAuthorityRequired: true,
    note: "Local ledger is a prototype; online cash, chips, betting, rankings, and transfers must be server-decided."
  })
]);

export function listEconomyLoopItems({ kind, status } = {}) {
  return economyLoopItems.filter((item) =>
    (!kind || item.kind === kind) && (!status || item.status === status)
  );
}

export function economyLoopGaps(items = economyLoopItems) {
  return items.filter((item) => item.status !== ECONOMY_LOOP_STATUSES.IMPLEMENTED);
}

export function economyLoopSummary(items = economyLoopItems) {
  return items.reduce((summary, item) => {
    summary.total += 1;
    summary[item.status] = (summary[item.status] || 0) + 1;
    return summary;
  }, { total: 0 });
}

export function missingLedgerTypeIds(implementedTypes = [], items = economyLoopItems) {
  const implemented = new Set(implementedTypes);
  const required = new Set();
  for (const item of items) {
    for (const type of item.requiredLedgerTypes || []) {
      if (!implemented.has(type)) required.add(type);
    }
  }
  return [...required].sort();
}

export function assertEconomyLoopShape(items = economyLoopItems) {
  const errors = [];
  const ids = new Set();
  for (const item of items) {
    if (!item.id) errors.push("missing id");
    if (ids.has(item.id)) errors.push(`duplicate id: ${item.id}`);
    ids.add(item.id);
    if (!Object.values(ECONOMY_LOOP_KINDS).includes(item.kind)) errors.push(`bad kind: ${item.id}`);
    if (!Object.values(ECONOMY_LOOP_STATUSES).includes(item.status)) errors.push(`bad status: ${item.id}`);
    if (!item.owner) errors.push(`missing owner: ${item.id}`);
    if (!item.note) errors.push(`missing note: ${item.id}`);
  }
  if (errors.length) throw new Error(`Economy loop contract invalid: ${errors.join(", ")}`);
  return true;
}

function loopItem(input) {
  return Object.freeze({
    ledgerTypes: Object.freeze(input.ledgerTypes || []),
    requiredLedgerTypes: Object.freeze(input.requiredLedgerTypes || []),
    timeEventIds: Object.freeze(input.timeEventIds || []),
    timeDriven: false,
    serverAuthorityRequired: false,
    policyId: null,
    ...input
  });
}
