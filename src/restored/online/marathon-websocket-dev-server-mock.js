import { RESTORED_MARATHON_AUTHORITY, RESTORED_MARATHON_CONTRACT_VERSION, RESTORED_MARATHON_MAX_RUNNERS, canJoinRestoredMarathonRoom, countRestoredMarathonRunners, createRestoredMarathonParticipant, createRestoredMarathonRoom } from "../games/marathon-contract.js";
import { createRestoredMarathonNetcodeProfile, createRestoredMarathonPingSample, createRestoredMarathonReconciliationHint, shouldAcceptRestoredMarathonRelayPacket } from "./marathon-netcode-contract.js";
import { applyRestoredMarathonServerInputEnvelope, createRestoredMarathonServerRunnerSnapshot, startRestoredMarathonServerRoom, validateRestoredMarathonServerStateContract } from "./marathon-server-state-contract.js";
import { createConfiguredRestoredMarathonServerTransport, createRestoredMarathonTransportEnvelope, validateRestoredMarathonTransportEnvelope } from "./marathon-server-transport-contract.js";
import { createServerBackedMarathonRoomAdapter } from "./marathon-server-room-adapter.js";

export const RESTORED_MARATHON_WEBSOCKET_DEV_SERVER_VERSION = "restored-marathon-websocket-dev-server-mock-001";

const DEFAULT_ENDPOINT_ID = "ws://127.0.0.1:4173/dev/singularity-race";
const DEFAULT_ROOM_ID = "room:singularity-race:ws-dev-001";
const DEFAULT_MAP_VERSION = "baegeum-city-v2-map-001";
const DEFAULT_VENUE_SCHEMA_VERSION = "venue-schema-001";
const CLIENT_PACKET_TYPES = Object.freeze(["chat_send", "input_update", "skill_use", "attack_action"]);

export function createRestoredMarathonWebSocketDevServerMock(options = {}) {
  const context = createServerContext(options);
  return Object.freeze({
    version: RESTORED_MARATHON_WEBSOCKET_DEV_SERVER_VERSION,
    mode: "websocket_dev_server_mock",
    endpointId: context.endpointId,
    connectClient: (client) => connectClient(context, client),
    listRooms: () => listRooms(context),
    createRoomAdapter: (transport) => createRoomAdapter(context, transport),
    joinRoom: (transport, request) => joinRoom(context, transport, request),
    startRace: (transport, roomId, options) => startRace(context, transport, roomId, options),
    ingestClientEnvelope: (transport, envelope, meta) => ingestClientEnvelope(context, transport, envelope, meta),
    createPingSample: (timing, previous) => createPingSample(context, timing, previous),
    createStateSnapshot: (roomId, options) => createStateSnapshot(context, roomId, options),
    getPackets: (roomId) => getPackets(context, roomId)
  });
}

function createServerContext(options) {
  const roomId = options.roomId || DEFAULT_ROOM_ID;
  const room = createRestoredMarathonRoom({ roomId, displayName: options.displayName || "Singularity Race Local WS Dev Room",
    authority: RESTORED_MARATHON_AUTHORITY.SERVER_REQUIRED, maxRunners: RESTORED_MARATHON_MAX_RUNNERS, course: options.course,
    mapVersion: options.mapVersion || DEFAULT_MAP_VERSION, phase: "lobby", serverTimeMs: Number(options.serverTimeMs || 0) });
  return {
    endpointId: options.endpointId || DEFAULT_ENDPOINT_ID,
    clock: typeof options.clock === "function" ? options.clock : (() => room.serverTimeMs),
    rooms: new Map([[roomId, room]]),
    clients: new Map(),
    packetsByRoom: new Map([[roomId, []]]),
    netcodeProfile: createRestoredMarathonNetcodeProfile(options.netcodeProfile),
    lastPingSample: null,
    packetLimit: Math.max(20, Number(options.packetLimit || 120)),
    pressureWindowMs: Math.max(250, Number(options.pressureWindowMs || 1000))
  };
}

function connectClient(context, options = {}) {
  const clientId = safeId(options.clientId || `client:ws-dev:${context.clients.size + 1}`);
  const transport = createConfiguredRestoredMarathonServerTransport({ provider: "websocket", endpointId: context.endpointId, authMode: "session",
    requiresAuth: false, capabilities: { rooms: true, chat: true, input: true, snapshots: true, admin: false } },
  { status: "connected", clientId, serverTimeMs: context.clock() });
  context.clients.set(clientId, { clientId, participantId: "", roomId: "", participantType: "player" });
  const helloResult = createRestoredMarathonTransportEnvelope("hello_result",
    { ok: true, roomCount: context.rooms.size, protocolVersion: RESTORED_MARATHON_CONTRACT_VERSION },
    { clientId, sequence: 1, serverTimeMs: context.clock() });
  return Object.freeze({ ok: true, transport, helloResult, rooms: listRooms(context) });
}

function listRooms(context) {
  return Object.freeze(Array.from(context.rooms.values()).map((room) => createRestoredMarathonRoom(room)));
}

function createRoomAdapter(context, transport) {
  if (!isKnownConnectedTransport(context, transport)) return createServerBackedMarathonRoomAdapter({ transport, rooms: [] });
  return createServerBackedMarathonRoomAdapter({ transport, rooms: listRooms(context) });
}

function joinRoom(context, transport = {}, request = {}) {
  const connected = ensureKnownTransport(context, transport);
  if (!connected.ok) return failure(connected.reason);
  const roomId = request.roomId || context.rooms.keys().next().value;
  const room = context.rooms.get(roomId);
  if (!room) return failure("room_not_found");
  if (request.mapVersion && request.mapVersion !== room.mapVersion) return failure("map_version_mismatch");
  if (request.venueSchemaVersion && request.venueSchemaVersion !== DEFAULT_VENUE_SCHEMA_VERSION) return failure("venue_schema_mismatch");
  const participantType = request.participantType === "spectator" ? "spectator" : "player";
  const joinCheck = canJoinRestoredMarathonRoom(room, participantType);
  if (!joinCheck.ok) return failure(joinCheck.errors.join(";") || "join_blocked");
  const participantId = request.participantId || `runner:${transport.clientId}`;
  const joinedRoom = appendParticipant(room, { participantId, nickname: request.nickname || participantId, participantType });
  context.rooms.set(roomId, joinedRoom);
  context.clients.set(transport.clientId, { clientId: transport.clientId, participantId, roomId, participantType });
  const sequence = Math.max(1, Number(request.sequence || 2));
  const joinRequest = createRestoredMarathonTransportEnvelope("join_request", {
    participantId, nickname: request.nickname || participantId, participantType,
    mapVersion: room.mapVersion, venueSchemaVersion: DEFAULT_VENUE_SCHEMA_VERSION,
    protocolVersion: RESTORED_MARATHON_CONTRACT_VERSION
  }, { clientId: transport.clientId, roomId, sequence, serverTimeMs: context.clock() });
  const joinResult = createRestoredMarathonTransportEnvelope("join_result", {
    ok: true, playerId: participantId, participantType, phase: joinedRoom.phase,
    mapId: joinedRoom.course.mapId, spawnId: "baegeum-marathon-stadium-spawn",
    mapVersion: joinedRoom.mapVersion, venueSchemaVersion: DEFAULT_VENUE_SCHEMA_VERSION,
    protocolVersion: RESTORED_MARATHON_CONTRACT_VERSION
  }, { clientId: "server:ws-dev", roomId, sequence: sequence + 1, serverTimeMs: context.clock() });
  savePackets(context, roomId, [joinRequest, joinResult]);
  return Object.freeze({ ok: true, reason: "", room: joinedRoom, joinRequest, joinResult });
}

function startRace(context, transport = {}, roomId = DEFAULT_ROOM_ID, options = {}) {
  const connected = ensureKnownTransport(context, transport);
  if (!connected.ok) return failure(connected.reason);
  const room = context.rooms.get(roomId);
  if (!room) return failure("room_not_found");
  const startedRoom = startRestoredMarathonServerRoom(room, { serverTimeMs: options.serverTimeMs ?? context.clock() });
  context.rooms.set(roomId, startedRoom);
  return Object.freeze({ ok: true, reason: "", room: startedRoom, packets: getPackets(context, roomId) });
}

function ingestClientEnvelope(context, transport = {}, envelope = {}, meta = {}) {
  const connected = ensureKnownTransport(context, transport);
  if (!connected.ok) return failure(connected.reason);
  const validation = validateRestoredMarathonTransportEnvelope(envelope);
  if (!validation.ok) return failure(validation.errors.join(", "));
  if (envelope.clientId !== transport.clientId) return failure("client_mismatch");
  if (!CLIENT_PACKET_TYPES.includes(envelope.type)) return failure("server_authority_required");
  if (!context.rooms.has(envelope.roomId)) return failure("room_not_found");
  const packets = getPackets(context, envelope.roomId);
  const receivedAtMs = Number(meta.receivedAtMs ?? context.clock());
  const guard = shouldAcceptRestoredMarathonRelayPacket(packets, envelope, {
    profile: context.netcodeProfile,
    nowMs: receivedAtMs,
    windowMs: context.pressureWindowMs
  });
  if (!guard.ok) return Object.freeze({ ...failure(guard.reason), pressure: guard.pressure });
  const accepted = Object.freeze({ ...envelope, receivedAtMs, direction: "client_to_server" });
  const movement = envelope.type === "input_update"
    ? applyRestoredMarathonServerInputEnvelope(context.rooms.get(envelope.roomId), accepted, { elapsedMs: meta.elapsedMs, receivedAtMs })
    : null;
  if (movement && !movement.ok) return Object.freeze({ ...failure(movement.reason), pressure: guard.pressure });
  if (movement?.ok) context.rooms.set(envelope.roomId, movement.room);
  const serverEnvelope = envelope.type === "chat_send" ? createChatDelivered(context, envelope) : null;
  const nextPackets = savePackets(context, envelope.roomId, serverEnvelope ? [accepted, serverEnvelope] : [accepted]);
  return Object.freeze({ ok: true, reason: "", room: movement?.room || context.rooms.get(envelope.roomId), packets: nextPackets, pressure: guard.pressure, serverEnvelope });
}

function createStateSnapshot(context, roomId = DEFAULT_ROOM_ID, options = {}) {
  const room = context.rooms.get(roomId);
  if (!room) return failure("room_not_found");
  const sequence = Math.max(1, Number(options.sequence || 1));
  const serverTimeMs = context.clock();
  const pingSample = createPingSample(context, options.pingTiming || {
    clientSentAtMs: Math.max(0, serverTimeMs - 76),
    serverReceivedAtMs: Math.max(0, serverTimeMs - 40),
    serverSentAtMs: Math.max(0, serverTimeMs - 38),
    clientReceivedAtMs: serverTimeMs
  }, options.previousPingSample);
  const snapshot = createRestoredMarathonTransportEnvelope("state_snapshot", {
    snapshotId: `snapshot:${roomId}:${sequence}`,
    serverOwned: true,
    serverTickHz: context.netcodeProfile.serverTickHz,
    snapshotHz: context.netcodeProfile.snapshotHz,
    movementAuthority: "server",
    phase: room.phase,
    authority: room.authority,
    pingSample,
    reconciliation: createRestoredMarathonReconciliationHint(options.localRunner || {}, options.serverRunner || {}, { elapsedMs: options.elapsedMs ?? 50 }, context.netcodeProfile),
    participants: room.participants.map((participant) => createRestoredMarathonServerRunnerSnapshot(participant, room))
  }, { clientId: "server:ws-dev", roomId, sequence, serverTimeMs });
  return Object.freeze({ ok: true, reason: "", snapshot, packets: savePackets(context, roomId, [snapshot]) });
}

export function validateRestoredMarathonWebSocketDevServerMockContract() {
  const errors = [];
  const server = createRestoredMarathonWebSocketDevServerMock({ clock: () => 1000 });
  const stateValidation = validateRestoredMarathonServerStateContract();
  if (!stateValidation.ok) errors.push(...stateValidation.errors);
  const connected = server.connectClient({ clientId: "client:test" });
  if (!connected.ok || connected.transport.provider !== "websocket") errors.push("client should connect through websocket dev provider");
  if (!server.createRoomAdapter(connected.transport).online.canOpenLobby) errors.push("connected mock transport should create a lobby-capable adapter");
  const joined = server.joinRoom(connected.transport, { participantId: "runner:test", nickname: "Tester", sequence: 2, mapVersion: DEFAULT_MAP_VERSION });
  if (!joined.ok || joined.joinResult.type !== "join_result") errors.push("server mock join should return join_result");
  const started = server.startRace(connected.transport, joined.room.roomId, { serverTimeMs: 1000 });
  if (!started.ok || started.room.phase !== "racing") errors.push("server mock should start a server-owned race");
  const input = createRestoredMarathonTransportEnvelope("input_update", { participantId: "runner:test", pace: "push", raceTimeMs: 1000, direction: { x: 1, y: 0 } },
    { clientId: connected.transport.clientId, roomId: joined.room.roomId, sequence: 4, serverTimeMs: 1000 });
  const moved = server.ingestClientEnvelope(connected.transport, input, { receivedAtMs: 1000, elapsedMs: 1000 });
  if (!moved.ok || moved.room.participants[0].progressMeters <= 0) errors.push("server mock should apply valid client input to server-owned runner state");
  const forbidden = createRestoredMarathonTransportEnvelope("race_finalized", { ok: true },
    { clientId: connected.transport.clientId, roomId: joined.room.roomId, sequence: 5, serverTimeMs: 1000 });
  if (server.ingestClientEnvelope(connected.transport, forbidden, { receivedAtMs: 1000 }).ok) errors.push("client must not send server-owned finalization");
  const snapshot = server.createStateSnapshot(joined.room.roomId, { sequence: 6, serverRunner: { x: 72, y: 0, progress: 2 } });
  if (!snapshot.ok) errors.push("server mock should create authoritative snapshots");
  if (!snapshot.snapshot.payload.serverOwned || !snapshot.snapshot.payload.pingSample || !snapshot.snapshot.payload.reconciliation) errors.push("snapshot should include server-owned ping and reconciliation data");
  if (!server.createPingSample({ clientSentAtMs: 1000, serverReceivedAtMs: 1030, serverSentAtMs: 1032, clientReceivedAtMs: 1062 }).serverOwned) errors.push("server mock should expose ping samples");
  if (!createSpamCheck(server, connected.transport, joined.room.roomId)) errors.push("server mock should rate-limit action packet spam");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function createSpamCheck(server, transport, roomId) {
  for (let sequence = 10; sequence < 50; sequence += 1) {
    const spam = createRestoredMarathonTransportEnvelope("input_update", { participantId: "runner:test", pace: "push", raceTimeMs: sequence },
      { clientId: transport.clientId, roomId, sequence, serverTimeMs: 1000 });
    const result = server.ingestClientEnvelope(transport, spam, { receivedAtMs: 1000 });
    if (!result.ok) return result.reason === "rate_limited";
  }
  return false;
}

function appendParticipant(room, request) {
  if (room.participants.some((participant) => participant.participantId === request.participantId)) return room;
  const type = request.participantType === "spectator" ? "spectator" : "player";
  const participant = createRestoredMarathonParticipant({ participantId: request.participantId, displayName: request.nickname, type,
    lane: type === "player" ? countRestoredMarathonRunners(room.participants) + 1 : 1 });
  return createRestoredMarathonRoom({ ...room, authority: RESTORED_MARATHON_AUTHORITY.SERVER_REQUIRED, participants: Object.freeze([...room.participants, participant]) });
}

function createChatDelivered(context, envelope) {
  return createRestoredMarathonTransportEnvelope("chat_delivered", {
    ...envelope.payload,
    delivered: true
  }, { clientId: "server:ws-dev", roomId: envelope.roomId, sequence: envelope.sequence + 1, serverTimeMs: context.clock() });
}

function createPingSample(context, timing = {}, previous) { const sample = createRestoredMarathonPingSample(timing, previous ?? context.lastPingSample, context.netcodeProfile); context.lastPingSample = sample; return sample; }

function savePackets(context, roomId, packets) {
  const existing = context.packetsByRoom.get(roomId) || [];
  const next = Object.freeze([...existing, ...packets].slice(-context.packetLimit));
  context.packetsByRoom.set(roomId, next);
  return next;
}

function getPackets(context, roomId = DEFAULT_ROOM_ID) {
  return Object.freeze([...(context.packetsByRoom.get(roomId) || [])]);
}

function ensureKnownTransport(context, transport) {
  if (!isKnownConnectedTransport(context, transport)) return Object.freeze({ ok: false, reason: "transport_not_connected" });
  return Object.freeze({ ok: true, reason: "" });
}

function isKnownConnectedTransport(context, transport = {}) {
  return transport.provider === "websocket" && transport.status === "connected" && transport.endpointId === context.endpointId && context.clients.has(transport.clientId);
}

function failure(reason) {
  return Object.freeze({ ok: false, reason, room: null, packets: Object.freeze([]) });
}

function safeId(value) {
  return String(value || "").replace(/[^a-z0-9:_-]/gi, "_").slice(0, 80) || "client:ws-dev";
}
