import { RESTORED_MARATHON_SERVER_TRANSPORT_VERSION, validateRestoredMarathonTransportEnvelope } from "./marathon-server-transport-contract.js";
import { createRestoredMarathonNetcodeProfile, createRestoredMarathonPacketPressureReport, shouldAcceptRestoredMarathonRelayPacket } from "./marathon-netcode-contract.js";

export const RESTORED_MARATHON_DEV_ROOM_TRANSPORT_VERSION = "restored-marathon-dev-room-transport-001";
export const RESTORED_MARATHON_ROOM_PACKET_STORAGE_KEY = "singularity-race:room-packets:v1";
export const RESTORED_MARATHON_ROOM_PACKET_BROADCAST_NAME = "singularity-race:room-packet-relay:v1";

export function createRestoredMarathonDevRoomTransport(options = {}) {
  const context = createTransportContext(options);
  return Object.freeze({
    version: RESTORED_MARATHON_DEV_ROOM_TRANSPORT_VERSION,
    mode: "dev_room_relay",
    clientId: context.clientId,
    roomId: context.roomId,
    storageKey: context.storageKey,
    loadPackets: (fallback) => loadTransportPackets(context, fallback),
    seedPackets: (fallback) => seedTransportPackets(context, fallback),
    submitPacket: (packets, envelope, meta) => submitTransportPacket(context, packets, envelope, meta),
    createPressureReport: (packets, options) => createTransportPressureReport(context, packets, options),
    savePackets: (packets, meta) => saveTransportPackets(context, packets, meta),
    subscribe: (onPackets) => subscribeTransportPackets(context, onPackets)
  });
}

function createTransportContext(options) {
  const roomId = options.roomId || "room:singularity-race:dev-001";
  const broadcastName = options.broadcastName || RESTORED_MARATHON_ROOM_PACKET_BROADCAST_NAME;
  return Object.freeze({
    roomId,
    clientId: options.clientId || "client:singularity-race-dev",
    storage: options.storage || createMemoryStorage(),
    storageKey: options.storageKey || `${RESTORED_MARATHON_ROOM_PACKET_STORAGE_KEY}:${safeKey(roomId)}`,
    packetLimit: Math.max(12, Number(options.packetLimit || 80)),
    netcodeProfile: createRestoredMarathonNetcodeProfile(options.netcodeProfile),
    pressureWindowMs: Math.max(250, Number(options.pressureWindowMs || 1000)),
    clock: typeof options.clock === "function" ? options.clock : (() => 0),
    eventTarget: options.eventTarget || null,
    broadcastName,
    broadcast: openBroadcast(options.broadcastFactory, broadcastName)
  });
}

function loadTransportPackets(context, fallback = []) {
  const parsed = readJsonArray(context.storage, context.storageKey)
    .filter((packet) => packet?.roomId === context.roomId);
  return Object.freeze(parsed.length ? parsed : fallback);
}

function seedTransportPackets(context, fallback = []) {
  const loaded = loadTransportPackets(context, []);
  if (loaded.length) return loaded;
  const saved = saveTransportPackets(context, fallback, { reason: "seed" });
  return saved.packets;
}

function submitTransportPacket(context, packets = [], envelope = {}, meta = {}) {
  const validation = validateRestoredMarathonTransportEnvelope(envelope);
  if (!validation.ok) return Object.freeze({ ok: false, reason: validation.errors.join(", "), packets: Object.freeze(packets) });
  if (envelope.transportVersion !== RESTORED_MARATHON_SERVER_TRANSPORT_VERSION) {
    return Object.freeze({ ok: false, reason: "transport_version_mismatch", packets: Object.freeze(packets) });
  }
  if (envelope.roomId !== context.roomId) {
    return Object.freeze({ ok: false, reason: "room_mismatch", packets: Object.freeze(packets) });
  }
  const receivedAtMs = meta.receivedAtMs ?? context.clock();
  const guard = shouldAcceptRestoredMarathonRelayPacket(packets, envelope, {
    profile: context.netcodeProfile, nowMs: receivedAtMs, windowMs: context.pressureWindowMs
  });
  if (!guard.ok) {
    return Object.freeze({ ok: false, reason: guard.reason, packets: Object.freeze(packets), pressure: guard.pressure });
  }
  const next = Object.freeze([...packets, normalizePacket(context, envelope, { ...meta, receivedAtMs })].slice(-context.packetLimit));
  const saved = saveTransportPackets(context, next, { ...meta, reason: meta.reason || envelope.type });
  return Object.freeze({ ok: saved.ok, reason: saved.reason, packets: saved.packets, pressure: guard.pressure });
}

function normalizePacket(context, envelope, meta = {}) {
  return Object.freeze({
    ...envelope,
    receivedAtMs: meta.receivedAtMs ?? context.clock(),
    sourceClientId: envelope.clientId || context.clientId,
    relayReason: meta.reason || envelope.type
  });
}

function saveTransportPackets(context, packets = [], meta = {}) {
  const next = Object.freeze(packets.filter((packet) => packet?.roomId === context.roomId).slice(-context.packetLimit));
  const saved = writeJson(context.storage, context.storageKey, next);
  if (!saved.ok) return Object.freeze({ ok: false, reason: saved.reason, packets: next });
  publishTransportMessage(context, {
    type: "room_packets_updated",
    roomId: context.roomId,
    packetCount: next.length,
    lastPacketType: next.at(-1)?.type || "",
    reason: meta.reason || "save"
  });
  return Object.freeze({ ok: true, reason: "", packets: next });
}

function createTransportPressureReport(context, packets = [], options = {}) {
  return createRestoredMarathonPacketPressureReport(packets, {
    profile: context.netcodeProfile, windowMs: context.pressureWindowMs,
    nowMs: options.nowMs ?? context.clock(), maxPacketsPerClient: options.maxPacketsPerClient
  });
}

function subscribeTransportPackets(context, onPackets) {
  if (typeof onPackets !== "function") return () => {};
  const onStorage = (event) => {
    if (event?.key && event.key !== context.storageKey) return;
    onPackets(loadTransportPackets(context));
  };
  const onBroadcast = (event) => {
    if (!shouldAcceptBroadcast(context, event)) return;
    onPackets(loadTransportPackets(context));
  };
  context.eventTarget?.addEventListener?.("storage", onStorage);
  if (context.broadcast) context.broadcast.onmessage = onBroadcast;
  return () => closeTransportSubscription(context, onStorage);
}

function shouldAcceptBroadcast(context, event) {
  if (!event?.data || event.data.sourceClientId === context.clientId) return false;
  return event.data.type === "room_packets_updated" && event.data.roomId === context.roomId;
}

function closeTransportSubscription(context, onStorage) {
  context.eventTarget?.removeEventListener?.("storage", onStorage);
  if (context.broadcast) context.broadcast.onmessage = null;
  context.broadcast?.close?.();
}

function publishTransportMessage(context, payload) {
  context.broadcast?.postMessage?.({
    ...payload,
    sourceClientId: context.clientId,
    storageKey: context.storageKey,
    transportVersion: RESTORED_MARATHON_DEV_ROOM_TRANSPORT_VERSION
  });
}

export function validateRestoredMarathonDevRoomTransportContract(envelopeFactory) {
  const errors = [];
  const storage = createMemoryStorage();
  const broadcastFactory = createMemoryBroadcastFactory();
  const roomId = "room:singularity-race:dev-001";
  const left = createRestoredMarathonDevRoomTransport({
    roomId, clientId: "client:left", storage, broadcastFactory, clock: () => 200
  });
  const right = createRestoredMarathonDevRoomTransport({
    roomId, clientId: "client:right", storage, broadcastFactory, clock: () => 201
  });
  let relayedCount = 0;
  const unsubscribe = right.subscribe((packets) => {
    relayedCount = packets.length;
  });
  const input = envelopeFactory("input_update", { participantId: "runner:left", pace: "push", raceTimeMs: 1000 }, {
    clientId: left.clientId, roomId, sequence: 1
  });
  const sent = left.submitPacket(left.seedPackets([]), input, { reason: "input_update" });
  if (!sent.ok) errors.push(`dev room packet should save: ${sent.reason}`);
  if (right.loadPackets().length !== 1) errors.push("peer should load saved room packets");
  if (relayedCount !== 1) errors.push("broadcast relay should notify peer transport");
  const blocked = left.submitPacket(sent.packets, { ...input, roomId: "room:other" });
  if (blocked.ok) errors.push("room mismatch should be blocked");
  let spamPackets = sent.packets;
  let spamBlocked = null;
  for (let sequence = 2; sequence <= 40; sequence += 1) {
    const spam = envelopeFactory("input_update", { participantId: "runner:left", pace: "push", raceTimeMs: 1000 + sequence }, {
      clientId: left.clientId, roomId, sequence
    });
    const result = left.submitPacket(spamPackets, spam, { reason: "input_update", receivedAtMs: 200 });
    if (!result.ok) {
      spamBlocked = result;
      break;
    }
    spamPackets = result.packets;
  }
  if (!spamBlocked || spamBlocked.reason !== "rate_limited") errors.push("input spam should be rate-limited");
  const pressure = left.createPressureReport(spamPackets, { nowMs: 200 });
  const leftClient = pressure.clients.find((row) => row.clientId === left.clientId);
  if ((leftClient?.guardedCount || 0) > pressure.maxPacketsPerClient) errors.push("saved relay packets should stay within the per-client guard");
  unsubscribe();
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function readJsonArray(storage, storageKey) {
  try {
    const parsed = JSON.parse(storage.getItem(storageKey) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJson(storage, storageKey, value) {
  try {
    storage.setItem(storageKey, JSON.stringify(value));
    return Object.freeze({ ok: true, reason: "" });
  } catch {
    return Object.freeze({ ok: false, reason: "storage_unavailable" });
  }
}

function createMemoryStorage() {
  const state = new Map();
  return Object.freeze({
    getItem: (key) => state.has(key) ? state.get(key) : null,
    setItem: (key, value) => state.set(key, String(value))
  });
}

function createMemoryBroadcastFactory() {
  const ports = new Map();
  return (name) => {
    const channelPorts = ports.get(name) || [];
    const port = {
      onmessage: null,
      postMessage(data) {
        for (const peer of channelPorts) {
          if (peer !== port) peer.onmessage?.({ data });
        }
      },
      close() {
        ports.set(name, channelPorts.filter((peer) => peer !== port));
      }
    };
    channelPorts.push(port);
    ports.set(name, channelPorts);
    return port;
  };
}

function openBroadcast(factory, name) {
  if (typeof factory !== "function") return null;
  try {
    return factory(name);
  } catch {
    return null;
  }
}

function safeKey(value) {
  return String(value).replace(/[^a-z0-9:_-]/gi, "_");
}
