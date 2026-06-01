import {
  RESTORED_MARATHON_AUTHORITY,
  RESTORED_MARATHON_DEFAULT_MAX_SPECTATORS,
  RESTORED_MARATHON_MAX_RUNNERS,
  RESTORED_MARATHON_MAX_SPECTATORS,
  createRestoredMarathonRoom
} from "../games/marathon-contract.js";

export const RESTORED_MARATHON_DEV_ROOM_REGISTRY_VERSION = "restored-marathon-dev-room-registry-001";
export const RESTORED_MARATHON_DEV_ROOM_REGISTRY_STORAGE_KEY = "singularity-race:dev-rooms:v1";

const ROOM_ID_PREFIX = "room:singularity-race:dev-";
const ALLOWED_PHASES = Object.freeze(["lobby", "countdown", "racing", "finished", "closed"]);

export function createRestoredMarathonDevRoomId(seed = 1) {
  const number = clampInteger(seed, 1, 999);
  return `${ROOM_ID_PREFIX}${String(number).padStart(3, "0")}`;
}

export function createRestoredMarathonDevRoomRecord(options = {}) {
  const roomId = safeRoomId(options.roomId || createRestoredMarathonDevRoomId(options.index || 1));
  const createdAtMs = clampTime(options.createdAtMs);
  return Object.freeze({
    version: RESTORED_MARATHON_DEV_ROOM_REGISTRY_VERSION,
    roomId,
    displayName: cleanRoomName(options.displayName || "특이점 스타디움 001"),
    maxRunners: clampInteger(options.maxRunners ?? RESTORED_MARATHON_MAX_RUNNERS, 1, RESTORED_MARATHON_MAX_RUNNERS),
    maxSpectators: clampInteger(options.maxSpectators ?? RESTORED_MARATHON_DEFAULT_MAX_SPECTATORS, 0, RESTORED_MARATHON_MAX_SPECTATORS),
    phase: ALLOWED_PHASES.includes(options.phase) ? options.phase : "lobby",
    createdAtMs,
    updatedAtMs: Math.max(createdAtMs, clampTime(options.updatedAtMs || createdAtMs))
  });
}

export function readRestoredMarathonDevRooms(storage) {
  if (!storage?.getItem) return Object.freeze([]);
  try {
    const parsed = JSON.parse(storage.getItem(RESTORED_MARATHON_DEV_ROOM_REGISTRY_STORAGE_KEY) || "[]");
    return normalizeRoomList(parsed);
  } catch {
    return Object.freeze([]);
  }
}

export function writeRestoredMarathonDevRooms(storage, rooms = []) {
  const normalized = normalizeRoomList(rooms);
  try {
    storage?.setItem?.(RESTORED_MARATHON_DEV_ROOM_REGISTRY_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Local dev storage can be blocked in private browser modes.
  }
  return normalized;
}

export function upsertRestoredMarathonDevRoom(storage, roomInput = {}) {
  const existing = readRestoredMarathonDevRooms(storage);
  const room = createRestoredMarathonDevRoomRecord({
    ...roomInput,
    updatedAtMs: roomInput.updatedAtMs || roomInput.createdAtMs
  });
  const next = existing.some((item) => item.roomId === room.roomId)
    ? existing.map((item) => item.roomId === room.roomId ? room : item)
    : [...existing, room];
  return Object.freeze({ room, rooms: writeRestoredMarathonDevRooms(storage, next) });
}

export function deleteRestoredMarathonDevRoom(storage, roomId) {
  const safeId = safeRoomId(roomId);
  const next = readRestoredMarathonDevRooms(storage).filter((room) => room.roomId !== safeId);
  return writeRestoredMarathonDevRooms(storage, next);
}

export function closeRestoredMarathonDevRoom(storage, roomId, options = {}) {
  const safeId = safeRoomId(roomId);
  const nowMs = clampTime(options.closedAtMs ?? options.updatedAtMs ?? Date.now());
  const existing = readRestoredMarathonDevRooms(storage);
  const target = existing.find((room) => room.roomId === safeId);
  if (!target) return Object.freeze({ room: null, rooms: existing });
  const room = createRestoredMarathonDevRoomRecord({
    ...target,
    phase: "closed",
    updatedAtMs: nowMs
  });
  const rooms = writeRestoredMarathonDevRooms(storage, existing.map((item) => item.roomId === safeId ? room : item));
  return Object.freeze({ room, rooms });
}

export function getFirstRestoredMarathonDevRoom(rooms = []) {
  return normalizeRoomList(rooms)[0] || null;
}

export function createRestoredMarathonRoomsFromDevRegistry(devRooms = [], options = {}) {
  const serverTimeMs = clampTime(options.serverTimeMs || 1000);
  const mapVersion = options.mapVersion || "baegeum-city-v2-map-001";
  return Object.freeze(normalizeRoomList(devRooms).map((record) => createRestoredMarathonRoom({
    roomId: record.roomId,
    displayName: record.displayName,
    authority: RESTORED_MARATHON_AUTHORITY.SERVER_REQUIRED,
    maxRunners: record.maxRunners,
    maxSpectators: record.maxSpectators,
    course: options.course,
    mapVersion,
    phase: record.phase === "closed" ? "abandoned" : record.phase,
    serverTimeMs
  })));
}

export function validateRestoredMarathonDevRoomRegistryContract() {
  const storage = createMemoryStorage();
  const created = upsertRestoredMarathonDevRoom(storage, {
    roomId: createRestoredMarathonDevRoomId(4),
    displayName: "  테스트 방  ",
    maxSpectators: RESTORED_MARATHON_MAX_SPECTATORS + 10,
    createdAtMs: 100
  });
  const readBack = readRestoredMarathonDevRooms(storage);
  const closed = closeRestoredMarathonDevRoom(storage, created.room.roomId, { closedAtMs: 300 });
  const closedAdapterRooms = createRestoredMarathonRoomsFromDevRegistry(closed.rooms, { serverTimeMs: 400 });
  const deleted = deleteRestoredMarathonDevRoom(storage, created.room.roomId);
  const adapterRooms = createRestoredMarathonRoomsFromDevRegistry(readBack, { serverTimeMs: 200 });
  const errors = [];
  if (createRestoredMarathonDevRoomRecord({ maxRunners: 12 }).maxRunners !== 12) errors.push("room runner cap should persist");
  if (created.room.displayName !== "테스트 방") errors.push("room name should be trimmed");
  if (created.room.maxSpectators !== RESTORED_MARATHON_MAX_SPECTATORS) errors.push("spectator cap should clamp");
  if (readBack.length !== 1) errors.push("room registry should persist one room");
  if (closed.room?.phase !== "closed") errors.push("closed room should stay in the registry");
  if (closedAdapterRooms[0]?.phase !== "abandoned") errors.push("closed dev rooms should map to abandoned adapter rooms");
  if (deleted.length !== 0) errors.push("room delete should empty the registry");
  if (readRestoredMarathonDevRooms(storage).length !== 0) errors.push("deleted room should not reappear");
  if (adapterRooms[0]?.authority !== RESTORED_MARATHON_AUTHORITY.SERVER_REQUIRED) errors.push("dev registry rooms should become server-required rooms");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function normalizeRoomList(rooms) {
  const source = Array.isArray(rooms) ? rooms : [];
  const seen = new Set();
  const normalized = [];
  for (const input of source) {
    const room = createRestoredMarathonDevRoomRecord(input);
    if (seen.has(room.roomId)) continue;
    seen.add(room.roomId);
    normalized.push(room);
  }
  return Object.freeze(normalized);
}

function cleanRoomName(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim().slice(0, 32);
  return text || "특이점 스타디움 001";
}

function safeRoomId(value) {
  return String(value || createRestoredMarathonDevRoomId(1)).replace(/[^a-z0-9:_-]/gi, "_").slice(0, 100);
}

function clampInteger(value, min, max) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function clampTime(value) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function createMemoryStorage() {
  const entries = new Map();
  return {
    getItem(key) {
      return entries.has(key) ? entries.get(key) : null;
    },
    setItem(key, value) {
      entries.set(key, String(value));
    }
  };
}
