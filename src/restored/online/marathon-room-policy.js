import {
  RESTORED_MARATHON_DEFAULT_MAX_SPECTATORS,
  RESTORED_MARATHON_MAX_SPECTATORS
} from "../games/marathon-contract.js";
import { listRestoredMarathonTrailMaps, normalizeRestoredMarathonTrailMapId } from "../games/marathon-trail-geometry.js";

export const RESTORED_MARATHON_ROOM_POLICY_VERSION = "restored-marathon-room-policy-001";
export const RESTORED_MARATHON_ROOM_POLICY_STORAGE_KEY = "singularity-race:room-policy:v1";
export const RESTORED_MARATHON_MAP_VOTE_DURATION_MS = 30000;

const SPECTATOR_CAP_OPTIONS = Object.freeze([0, 10, RESTORED_MARATHON_DEFAULT_MAX_SPECTATORS, 50, 80]);
const ENTRY_DELAY_MINUTE_OPTIONS = Object.freeze([0, 1, 3, 5, 10]);
const MAP_VOTE_STATUSES = Object.freeze(["idle", "open", "closed"]);

function clamp(value, min, max) {
  const number = Number.isFinite(Number(value)) ? Number(value) : min;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function safeRoomId(value) {
  return String(value || "room:singularity-race:dev-001").replace(/[^a-z0-9:_-]/gi, "_").slice(0, 100);
}

export function createRestoredMarathonRoomPolicy(options = {}) {
  const mapId = normalizeRestoredMarathonTrailMapId(options.mapId);
  return Object.freeze({
    version: RESTORED_MARATHON_ROOM_POLICY_VERSION,
    roomId: safeRoomId(options.roomId),
    maxSpectators: clamp(
      options.maxSpectators ?? RESTORED_MARATHON_DEFAULT_MAX_SPECTATORS,
      0,
      RESTORED_MARATHON_MAX_SPECTATORS
    ),
    mapId,
    entryOpensAtMs: clamp(options.entryOpensAtMs ?? 0, 0, 9999999999999),
    mapVote: normalizeRestoredMarathonMapVote(options.mapVote, mapId),
    spectatorMidJoin: options.spectatorMidJoin === false ? false : true
  });
}

export function listRestoredMarathonSpectatorCapOptions() { return SPECTATOR_CAP_OPTIONS; }

export function listRestoredMarathonEntryDelayMinuteOptions() { return ENTRY_DELAY_MINUTE_OPTIONS; }

export function getRestoredMarathonEntryGateStatus(policyInput = {}, nowMs = Date.now()) {
  const policy = createRestoredMarathonRoomPolicy(policyInput);
  const remainingMs = Math.max(0, policy.entryOpensAtMs - Math.max(0, Number(nowMs) || 0));
  return Object.freeze({
    open: remainingMs <= 0,
    remainingMs,
    remainingMinutes: Math.ceil(remainingMs / 60000)
  });
}

export function createRestoredMarathonMapVote(policyInput = {}, options = {}) {
  const policy = createRestoredMarathonRoomPolicy(policyInput);
  const nowMs = clamp(options.nowMs ?? Date.now(), 0, 9999999999999);
  const durationMs = clamp(options.durationMs ?? RESTORED_MARATHON_MAP_VOTE_DURATION_MS, 5000, 300000);
  return createRestoredMarathonRoomPolicy({
    ...policy,
    mapVote: {
      voteId: `map-vote:${policy.roomId}:${nowMs}`,
      status: "open",
      startedAtMs: nowMs,
      endsAtMs: nowMs + durationMs,
      options: listRestoredMarathonTrailMaps().map((map) => map.id),
      votes: {},
      resultMapId: ""
    }
  });
}

export function castRestoredMarathonMapVote(policyInput = {}, voterId = "", mapId = "", options = {}) {
  const policy = createRestoredMarathonRoomPolicy(policyInput);
  const status = getRestoredMarathonMapVoteStatus(policy, options.nowMs ?? Date.now());
  const choice = normalizeRestoredMarathonTrailMapId(mapId);
  const voterKey = safeVoteId(voterId);
  if (!status.active || status.ended || !voterKey || !status.options.includes(choice)) return policy;
  return createRestoredMarathonRoomPolicy({
    ...policy,
    mapVote: {
      ...policy.mapVote,
      votes: {
        ...policy.mapVote.votes,
        [voterKey]: choice
      }
    }
  });
}

export function finalizeRestoredMarathonMapVote(policyInput = {}, options = {}) {
  const policy = createRestoredMarathonRoomPolicy(policyInput);
  const status = getRestoredMarathonMapVoteStatus(policy, options.nowMs ?? Date.now());
  if (!status.active || !status.ended) return policy;
  return createRestoredMarathonRoomPolicy({
    ...policy,
    mapId: status.winningMapId,
    mapVote: {
      ...policy.mapVote,
      status: "closed",
      endsAtMs: Math.max(policy.mapVote.startedAtMs, Math.min(policy.mapVote.endsAtMs, Number(options.nowMs) || policy.mapVote.endsAtMs)),
      resultMapId: status.winningMapId
    }
  });
}

export function getRestoredMarathonMapVoteStatus(policyInput = {}, nowMs = Date.now()) {
  const policy = createRestoredMarathonRoomPolicy(policyInput);
  const vote = policy.mapVote;
  const active = vote.status === "open";
  const remainingMs = active ? Math.max(0, vote.endsAtMs - Math.max(0, Number(nowMs) || 0)) : 0;
  const summary = summarizeMapVote(vote, policy.mapId);
  return Object.freeze({
    voteId: vote.voteId,
    active,
    closed: vote.status === "closed",
    ended: active && remainingMs <= 0,
    remainingMs,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    options: vote.options,
    counts: summary.counts,
    totalVotes: summary.totalVotes,
    winningMapId: vote.status === "closed" && vote.resultMapId ? vote.resultMapId : summary.winningMapId,
    resultMapId: vote.resultMapId || ""
  });
}

export function readRestoredMarathonRoomPolicy(storage, roomId, fallback = {}) {
  if (!storage?.getItem) return createRestoredMarathonRoomPolicy({ ...fallback, roomId });
  try {
    const all = JSON.parse(storage.getItem(RESTORED_MARATHON_ROOM_POLICY_STORAGE_KEY) || "{}");
    return createRestoredMarathonRoomPolicy({ ...fallback, ...(all[safeRoomId(roomId)] || {}), roomId });
  } catch {
    return createRestoredMarathonRoomPolicy({ ...fallback, roomId });
  }
}

export function writeRestoredMarathonRoomPolicy(storage, policyInput = {}) {
  const policy = createRestoredMarathonRoomPolicy(policyInput);
  if (!storage?.setItem || !storage?.getItem) return policy;
  try {
    const all = JSON.parse(storage.getItem(RESTORED_MARATHON_ROOM_POLICY_STORAGE_KEY) || "{}");
    storage.setItem(RESTORED_MARATHON_ROOM_POLICY_STORAGE_KEY, JSON.stringify({ ...all, [policy.roomId]: policy }));
  } catch {
    storage.setItem(RESTORED_MARATHON_ROOM_POLICY_STORAGE_KEY, JSON.stringify({ [policy.roomId]: policy }));
  }
  return policy;
}

export function validateRestoredMarathonRoomPolicyContract() {
  const errors = [];
  const policy = createRestoredMarathonRoomPolicy({ roomId: "room:test", maxSpectators: RESTORED_MARATHON_MAX_SPECTATORS + 50 });
  if (policy.version !== RESTORED_MARATHON_ROOM_POLICY_VERSION) errors.push("room policy version mismatch");
  if (policy.maxSpectators !== RESTORED_MARATHON_MAX_SPECTATORS) errors.push("spectator policy should clamp to the hard cap");
  if (!listRestoredMarathonSpectatorCapOptions().includes(RESTORED_MARATHON_DEFAULT_MAX_SPECTATORS)) {
    errors.push("spectator cap options should include the documented default");
  }
  if (createRestoredMarathonRoomPolicy({ spectatorMidJoin: false }).spectatorMidJoin !== false) {
    errors.push("spectator mid-join policy should be explicit");
  }
  if (createRestoredMarathonRoomPolicy({ mapId: "unknown-map" }).mapId !== createRestoredMarathonRoomPolicy().mapId) {
    errors.push("unknown room map ids should fall back to the default trail map");
  }
  const gate = getRestoredMarathonEntryGateStatus({ entryOpensAtMs: 130000 }, 70000);
  if (gate.open || gate.remainingMinutes !== 1) errors.push("entry gate should report remaining minutes");
  const voting = createRestoredMarathonMapVote({ roomId: "room:test", mapId: "baegeum-city" }, { nowMs: 1000, durationMs: 30000 });
  const voted = castRestoredMarathonMapVote(
    castRestoredMarathonMapVote(voting, "runner:a", "singularity-square-sprint", { nowMs: 2000 }),
    "runner:b",
    "singularity-square-sprint",
    { nowMs: 2000 }
  );
  const voteStatus = getRestoredMarathonMapVoteStatus(castRestoredMarathonMapVote(voted, "runner:c", "singularity-maze-run", { nowMs: 2000 }), 2000);
  if (!voteStatus.active || voteStatus.totalVotes !== 3 || voteStatus.winningMapId !== "singularity-square-sprint") {
    errors.push("map vote should count the winning map before finalization");
  }
  const finalized = finalizeRestoredMarathonMapVote(voted, { nowMs: 32000 });
  if (finalized.mapId !== "singularity-square-sprint" || finalized.mapVote.status !== "closed") {
    errors.push("map vote finalization should update only the selected map policy");
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function normalizeRestoredMarathonMapVote(input = {}, fallbackMapId = "") {
  const source = input && typeof input === "object" ? input : {};
  const status = MAP_VOTE_STATUSES.includes(source.status) ? source.status : "idle";
  const options = normalizeMapVoteOptions(source.options);
  return Object.freeze({
    voteId: String(source.voteId || "").replace(/[^a-z0-9:_-]/gi, "_").slice(0, 120),
    status,
    startedAtMs: clamp(source.startedAtMs ?? 0, 0, 9999999999999),
    endsAtMs: clamp(source.endsAtMs ?? 0, 0, 9999999999999),
    options,
    votes: normalizeMapVoteVotes(source.votes, options),
    resultMapId: status === "closed" ? normalizeRestoredMarathonTrailMapId(source.resultMapId || fallbackMapId) : ""
  });
}

function normalizeMapVoteOptions(options = []) {
  const source = Array.isArray(options) && options.length
    ? options
    : listRestoredMarathonTrailMaps().map((map) => map.id);
  const seen = new Set();
  const normalized = [];
  for (const mapId of source) {
    const id = normalizeRestoredMarathonTrailMapId(mapId);
    if (seen.has(id)) continue;
    seen.add(id);
    normalized.push(id);
  }
  return Object.freeze(normalized.length ? normalized : [normalizeRestoredMarathonTrailMapId()]);
}

function normalizeMapVoteVotes(votes = {}, options = []) {
  const optionSet = new Set(options);
  const normalized = {};
  if (!votes || typeof votes !== "object") return Object.freeze(normalized);
  for (const [voterId, mapId] of Object.entries(votes)) {
    const voterKey = safeVoteId(voterId);
    const choice = normalizeRestoredMarathonTrailMapId(mapId);
    if (voterKey && optionSet.has(choice)) normalized[voterKey] = choice;
  }
  return Object.freeze(normalized);
}

function summarizeMapVote(mapVote, fallbackMapId = "") {
  const fallback = normalizeRestoredMarathonTrailMapId(fallbackMapId);
  const counts = Object.fromEntries(mapVote.options.map((mapId) => [mapId, 0]));
  for (const mapId of Object.values(mapVote.votes)) counts[mapId] = (counts[mapId] || 0) + 1;
  let winningMapId = mapVote.options.includes(fallback) ? fallback : mapVote.options[0];
  let bestCount = counts[winningMapId] || 0;
  for (const mapId of mapVote.options) {
    if ((counts[mapId] || 0) > bestCount) {
      winningMapId = mapId;
      bestCount = counts[mapId] || 0;
    }
  }
  return Object.freeze({
    counts: Object.freeze(counts),
    totalVotes: Object.values(counts).reduce((sum, count) => sum + count, 0),
    winningMapId
  });
}

function safeVoteId(value) {
  return String(value || "").replace(/[^a-z0-9:_-]/gi, "_").slice(0, 100);
}
