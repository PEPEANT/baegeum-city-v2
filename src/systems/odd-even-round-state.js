import { normalizeOddEvenReservation, ODD_EVEN_ROUND_STATUSES } from "./odd-even-round-runtime.js";

export const ODD_EVEN_ROUND_STATE_KEY = "baegeum-city:v2:odd-even-rounds";
export const ODD_EVEN_ROUND_STATE_VERSION = "odd-even-round-state-001";
export const ODD_EVEN_LOCAL_ROUND_STATUSES = Object.freeze({
  PENDING: "pending",
  SETTLED: ODD_EVEN_ROUND_STATUSES.SETTLED,
  REFUNDED: ODD_EVEN_ROUND_STATUSES.REFUNDED
});

const closeStatuses = new Set([
  ODD_EVEN_LOCAL_ROUND_STATUSES.SETTLED,
  ODD_EVEN_LOCAL_ROUND_STATUSES.REFUNDED
]);

export function inspectOddEvenRoundStorage(storage = globalThis.localStorage) {
  if (!storage?.getItem) return roundStorageResult("missing_storage", null, []);
  const raw = storage.getItem(ODD_EVEN_ROUND_STATE_KEY);
  if (raw === null) return roundStorageResult("missing", raw, []);
  try {
    const saved = JSON.parse(raw);
    if (Array.isArray(saved?.rounds)) return roundStorageResult("ok", raw, normalizeRounds(saved.rounds));
    if (Array.isArray(saved)) return roundStorageResult("ok", raw, normalizeRounds(saved));
    return roundStorageResult("corrupt", raw, []);
  } catch (error) {
    return roundStorageResult("corrupt", raw, [], error);
  }
}

export function readOddEvenRounds(storage = globalThis.localStorage) {
  return inspectOddEvenRoundStorage(storage).rounds;
}

export function saveOddEvenRounds(rounds, storage = globalThis.localStorage) {
  const normalized = normalizeRounds(rounds);
  if (storage?.setItem) {
    storage.setItem(ODD_EVEN_ROUND_STATE_KEY, JSON.stringify({
      version: ODD_EVEN_ROUND_STATE_VERSION,
      rounds: normalized
    }));
  }
  return normalized;
}

export function createPendingOddEvenRound({ interior, playerState = {}, reservation = {} } = {}) {
  const round = normalizeOddEvenReservation({ interior, playerState, reservation });
  return normalizeOddEvenRound({
    ...round,
    status: ODD_EVEN_LOCAL_ROUND_STATUSES.PENDING,
    venueId: playerState.venueId || interior?.id || null,
    mapId: playerState.mapId || null,
    createdAt: new Date().toISOString()
  });
}

export function upsertPendingOddEvenRound(round, storage = globalThis.localStorage) {
  const normalized = normalizeOddEvenRound({ ...round, status: ODD_EVEN_LOCAL_ROUND_STATUSES.PENDING });
  if (!normalized) throw new Error("Invalid odd-even round");
  const others = readOddEvenRounds(storage).filter((item) => item.roundId !== normalized.roundId);
  saveOddEvenRounds([...others, normalized], storage);
  return normalized;
}

export function getOddEvenRound(roundId, storage = globalThis.localStorage) {
  return readOddEvenRounds(storage).find((round) => round.roundId === String(roundId)) || null;
}

export function closeOddEvenRound(roundId, patch = {}, storage = globalThis.localStorage) {
  const rounds = readOddEvenRounds(storage);
  const index = rounds.findIndex((round) => round.roundId === String(roundId));
  if (index === -1) return closeRoundResult(false, "missing_round", null, rounds);
  const current = rounds[index];
  if (current.status !== ODD_EVEN_LOCAL_ROUND_STATUSES.PENDING) {
    return closeRoundResult(false, "round_already_closed", current, rounds);
  }
  const status = patch.status === ODD_EVEN_LOCAL_ROUND_STATUSES.REFUNDED
    ? ODD_EVEN_LOCAL_ROUND_STATUSES.REFUNDED
    : ODD_EVEN_LOCAL_ROUND_STATUSES.SETTLED;
  const closed = normalizeOddEvenRound({
    ...current,
    status,
    result: patch.result,
    won: typeof patch.won === "boolean" ? patch.won : null,
    closedAt: patch.closedAt || new Date().toISOString()
  });
  const saved = saveOddEvenRounds([
    ...rounds.slice(0, index),
    closed,
    ...rounds.slice(index + 1)
  ], storage);
  return closeRoundResult(true, "ok", closed, saved);
}

export function canCloseOddEvenRound(roundId, storage = globalThis.localStorage) {
  const round = getOddEvenRound(roundId, storage);
  if (!round) return { ok: false, reason: "missing_round", round: null };
  if (round.status !== ODD_EVEN_LOCAL_ROUND_STATUSES.PENDING) {
    return { ok: false, reason: "round_already_closed", round };
  }
  return { ok: true, reason: "ok", round };
}

function normalizeRounds(rounds) {
  return rounds.map(normalizeOddEvenRound).filter(Boolean);
}

function normalizeOddEvenRound(round = {}) {
  if (!round.roundId) return null;
  const status = normalizeStatus(round.status);
  return {
    version: ODD_EVEN_ROUND_STATE_VERSION,
    gameType: "odd-even",
    roundId: String(round.roundId),
    tableId: String(round.tableId || "table:odd-even:main"),
    pick: round.pick === "even" ? "even" : "odd",
    chips: Math.max(1, Math.round(Number(round.chips) || 1)),
    status,
    result: round.result === "even" || round.result === "odd" ? round.result : null,
    won: typeof round.won === "boolean" ? round.won : null,
    venueId: round.venueId ? String(round.venueId) : null,
    mapId: round.mapId ? String(round.mapId) : null,
    createdAt: String(round.createdAt || new Date().toISOString()),
    closedAt: closeStatuses.has(status) ? String(round.closedAt || new Date().toISOString()) : null
  };
}

function normalizeStatus(status) {
  if (closeStatuses.has(status)) return status;
  return ODD_EVEN_LOCAL_ROUND_STATUSES.PENDING;
}

function roundStorageResult(status, raw, rounds, error = null) {
  return {
    key: ODD_EVEN_ROUND_STATE_KEY,
    status,
    raw,
    rounds,
    error: error ? String(error.message || error) : null
  };
}

function closeRoundResult(ok, reason, round, rounds) {
  return { ok, reason, round, rounds };
}
