import { RESTORED_MARATHON_CONTRACT_VERSION } from "../games/marathon-contract.js";
import { canUseRestoredMarathonServerTransport, createRestoredMarathonTransportEnvelope, createUnavailableRestoredMarathonServerTransport, validateRestoredMarathonTransportEnvelope } from "./marathon-server-transport-contract.js";

export const RESTORED_MARATHON_SERVER_PROVIDER_ADAPTER_VERSION = "restored-marathon-server-provider-adapter-001";

export const RESTORED_MARATHON_PROVIDER_STEPS = Object.freeze(["idle", "hello_sent", "hello_acknowledged", "join_sent", "joined", "history_replayed", "snapshot_ready", "reconnect_sent", "reconnect_acknowledged"]);

const SERVER_PACKET_TYPES = Object.freeze(["hello_result", "join_result", "chat_history", "state_snapshot"]);

export function createRestoredMarathonProviderSession(options = {}) {
  const transport = options.transport || createUnavailableRestoredMarathonServerTransport();
  const clientId = safeText(options.clientId || transport.clientId, 80);
  return Object.freeze({
    version: RESTORED_MARATHON_SERVER_PROVIDER_ADAPTER_VERSION,
    transport,
    clientId,
    roomId: safeText(options.roomId || transport.roomId, 120),
    sequence: Math.max(0, Number(options.sequence || 0)),
    step: RESTORED_MARATHON_PROVIDER_STEPS.includes(options.step) ? options.step : "idle",
    participantId: safeText(options.participantId, 80),
    joinResult: options.joinResult || null,
    chatHistory: Object.freeze(Array.isArray(options.chatHistory) ? [...options.chatHistory] : []),
    latestSnapshot: options.latestSnapshot || null,
    authoritativeRunner: options.authoritativeRunner || null,
    reconnect: createReconnectState(options.reconnect),
    errors: Object.freeze(Array.isArray(options.errors) ? [...options.errors] : [])
  });
}

export function createRestoredMarathonProviderHello(sessionInput = {}, payload = {}) {
  const session = createRestoredMarathonProviderSession(sessionInput);
  if (!canUseRestoredMarathonServerTransport(session.transport)) return failure(session, "transport_not_connected");
  const sequence = session.sequence + 1;
  const packet = createRestoredMarathonTransportEnvelope("hello", {
    protocolVersion: RESTORED_MARATHON_CONTRACT_VERSION,
    requestedRole: normalizeRole(payload.requestedRole),
    provider: session.transport.provider
  }, {
    clientId: session.clientId || session.transport.clientId,
    sequence,
    serverTimeMs: payload.clientTimeMs || session.transport.serverTimeMs
  });
  return success(updateSession(session, { sequence, step: "hello_sent" }), packet);
}

export function createRestoredMarathonProviderJoinRequest(sessionInput = {}, request = {}) {
  const session = createRestoredMarathonProviderSession(sessionInput);
  if (session.step !== "hello_acknowledged") return failure(session, "hello_required_before_join");
  const sequence = session.sequence + 1;
  const roomId = safeText(request.roomId || session.roomId, 120);
  const packet = createRestoredMarathonTransportEnvelope("join_request", {
    participantId: safeText(request.participantId, 80),
    participantType: request.participantType === "spectator" ? "spectator" : "player",
    nickname: safeText(request.nickname, 24),
    mapVersion: safeText(request.mapVersion || "baegeum-city-v2-map-001", 80),
    venueSchemaVersion: safeText(request.venueSchemaVersion || "venue-schema-001", 80),
    protocolVersion: RESTORED_MARATHON_CONTRACT_VERSION
  }, {
    clientId: session.clientId || session.transport.clientId,
    roomId,
    sequence,
    serverTimeMs: request.clientTimeMs || session.transport.serverTimeMs
  });
  const validation = validateRestoredMarathonTransportEnvelope(packet);
  if (!validation.ok) return failure(session, validation.errors.join(", "));
  return success(updateSession(session, { roomId, sequence, step: "join_sent", participantId: packet.payload.participantId }), packet);
}

export function createRestoredMarathonProviderReconnectHello(sessionInput = {}, payload = {}) {
  const session = createRestoredMarathonProviderSession(sessionInput);
  if (!canUseRestoredMarathonServerTransport(session.transport)) return failure(session, "transport_not_connected");
  if (!session.joinResult || !session.roomId) return failure(session, "join_required_before_reconnect");
  const participantId = resolveParticipantId(session, payload.participantId);
  if (!participantId) return failure(session, "participant_required_before_reconnect");
  const sequence = session.sequence + 1;
  const startedAtMs = Math.max(0, Number(payload.clientTimeMs || session.transport.serverTimeMs || 0));
  const graceMs = normalizeGraceMs(payload.reconnectGraceMs ?? session.transport.reconnectGraceMs);
  const reconnect = createReconnectState({ pending: true, participantId, resumeToken: safeText(payload.resumeToken || session.reconnect.resumeToken, 120),
    startedAtMs, graceMs, deadlineMs: startedAtMs + graceMs });
  const packet = createRestoredMarathonTransportEnvelope("hello", {
    protocolVersion: RESTORED_MARATHON_CONTRACT_VERSION,
    requestedRole: normalizeRole(payload.requestedRole || session.joinResult.payload?.participantType),
    provider: session.transport.provider,
    reconnect: true,
    roomId: session.roomId,
    participantId,
    resumeToken: reconnect.resumeToken,
    lastKnownSnapshotSequence: session.latestSnapshot?.sequence || 0
  }, {
    clientId: session.clientId || session.transport.clientId,
    roomId: session.roomId,
    sequence,
    serverTimeMs: startedAtMs
  });
  return success(updateSession(session, { sequence, step: "reconnect_sent", reconnect, participantId }), packet);
}

export function applyRestoredMarathonProviderServerPacket(sessionInput = {}, packet = {}) {
  const session = createRestoredMarathonProviderSession(sessionInput);
  const validation = validateServerProviderPacket(session, packet);
  if (!validation.ok) return failure(session, validation.reason);
  if (packet.type === "hello_result") return applyHelloResult(session, packet);
  if (packet.type === "join_result") return applyJoinResult(session, packet);
  if (packet.type === "chat_history") return applyChatHistory(session, packet);
  if (packet.type === "state_snapshot") return applyStateSnapshot(session, packet);
  return failure(session, "unsupported_provider_packet");
}

export function canRestoredMarathonProviderSendInput(sessionInput = {}) {
  const session = createRestoredMarathonProviderSession(sessionInput);
  if (session.step !== "snapshot_ready") return false;
  if (session.reconnect.pending) return false;
  if (!session.latestSnapshot?.payload?.serverOwned) return false;
  if (getJoinedParticipantType(session) === "spectator") return false;
  return Boolean(session.authoritativeRunner);
}

export function validateRestoredMarathonServerProviderAdapterContract(transportFactory) {
  const errors = [];
  const transport = transportFactory();
  let session = createRestoredMarathonProviderSession({ transport });
  const earlyJoin = createRestoredMarathonProviderJoinRequest(session, { roomId: "room:test", participantId: "runner:test" });
  if (earlyJoin.ok) errors.push("join must wait for hello acknowledgement");
  const hello = createRestoredMarathonProviderHello(session, { requestedRole: "player" });
  if (!hello.ok || hello.packet.type !== "hello") errors.push("connected provider must create hello");
  session = hello.session;
  const badSnapshot = applyRestoredMarathonProviderServerPacket(session, serverPacket("state_snapshot", { serverOwned: true, participants: [] }, { roomId: "room:test", sequence: 2 }));
  if (badSnapshot.ok) errors.push("snapshot must wait for a successful join");
  const helloResult = applyRestoredMarathonProviderServerPacket(session, serverPacket("hello_result", { ok: true, protocolVersion: RESTORED_MARATHON_CONTRACT_VERSION }, { sequence: 2 }));
  if (!helloResult.ok || helloResult.session.step !== "hello_acknowledged") errors.push("hello_result should acknowledge hello");
  session = helloResult.session;
  const join = createRestoredMarathonProviderJoinRequest(session, { roomId: "room:test", participantId: "runner:test", nickname: "Tester" });
  if (!join.ok || join.packet.type !== "join_request") errors.push("join request should follow hello_result");
  session = join.session;
  const joinResult = applyRestoredMarathonProviderServerPacket(session, serverPacket("join_result", { ok: true, playerId: "runner:test", participantType: "player" }, { roomId: "room:test", sequence: 4 }));
  if (!joinResult.ok || joinResult.session.step !== "joined") errors.push("join_result should create joined state");
  session = joinResult.session;
  const spoofHistory = applyRestoredMarathonProviderServerPacket(session, createRestoredMarathonTransportEnvelope("chat_history", { messages: [] }, { clientId: "client:fake", roomId: "room:test", sequence: 5 }));
  if (spoofHistory.ok) errors.push("chat history must be server-owned");
  const history = applyRestoredMarathonProviderServerPacket(session, serverPacket("chat_history", { serverOwned: true, messages: [{ text: "ready" }] }, { roomId: "room:test", sequence: 5 }));
  if (!history.ok || history.session.chatHistory.length !== 1 || history.session.step !== "history_replayed") errors.push("chat_history should replay before snapshot");
  session = history.session;
  const snapshot = applyRestoredMarathonProviderServerPacket(session, serverPacket("state_snapshot", { serverOwned: true, phase: "racing", participants: [{ participantId: "runner:test", type: "player" }] }, { roomId: "room:test", sequence: 6 }));
  if (!snapshot.ok || snapshot.session.step !== "snapshot_ready" || !snapshot.session.latestSnapshot) errors.push("state_snapshot should complete initial provider flow");
  if (!canRestoredMarathonProviderSendInput(snapshot.session)) errors.push("provider should allow input only after an authoritative initial snapshot");
  session = snapshot.session;
  const reconnect = createRestoredMarathonProviderReconnectHello(session, { resumeToken: "resume:test", clientTimeMs: 2000 });
  if (!reconnect.ok || reconnect.packet.payload.reconnect !== true) errors.push("reconnect should create a resume hello");
  if (canRestoredMarathonProviderSendInput(reconnect.session)) errors.push("reconnect grace must block input before replay");
  const earlyReconnectSnapshot = applyRestoredMarathonProviderServerPacket(reconnect.session, serverPacket("state_snapshot", { serverOwned: true, participants: [{ participantId: "runner:test" }] }, { roomId: "room:test", sequence: 8 }));
  if (earlyReconnectSnapshot.ok) errors.push("reconnect snapshot must wait for chat history replay");
  const reconnectHello = applyRestoredMarathonProviderServerPacket(reconnect.session, serverPacket("hello_result", { ok: true, reconnect: true }, { sequence: 8 }));
  if (!reconnectHello.ok || reconnectHello.session.step !== "reconnect_acknowledged") errors.push("reconnect hello_result should acknowledge grace reconnect");
  if (canRestoredMarathonProviderSendInput(reconnectHello.session)) errors.push("reconnect hello alone must not unlock input");
  const reconnectHistory = applyRestoredMarathonProviderServerPacket(reconnectHello.session, serverPacket("chat_history", { serverOwned: true, messages: [{ text: "after reconnect" }] }, { roomId: "room:test", sequence: 9 }));
  if (!reconnectHistory.ok || reconnectHistory.session.step !== "history_replayed") errors.push("reconnect must replay server chat history");
  if (canRestoredMarathonProviderSendInput(reconnectHistory.session)) errors.push("reconnect history alone must not unlock input");
  const reconnectSnapshot = applyRestoredMarathonProviderServerPacket(reconnectHistory.session, serverPacket("state_snapshot", { serverOwned: true, phase: "racing", participants: [{ participantId: "runner:test", type: "player", progressPercent: 42 }] }, { roomId: "room:test", sequence: 10 }));
  if (!reconnectSnapshot.ok || !canRestoredMarathonProviderSendInput(reconnectSnapshot.session)) errors.push("reconnect should unlock input only after authoritative snapshot");
  if (reconnectSnapshot.session.authoritativeRunner?.progressPercent !== 42) errors.push("reconnect should capture the runner's authoritative snapshot row");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function applyHelloResult(session, packet) {
  if (!["hello_sent", "reconnect_sent"].includes(session.step)) return failure(session, "hello_not_pending");
  if (!packet.payload?.ok) return failure(session, "hello_rejected");
  const reconnect = session.step === "reconnect_sent"
    ? createReconnectState({ ...session.reconnect, pending: true, acknowledgedAtMs: packet.serverTimeMs })
    : session.reconnect;
  return success(updateSession(session, {
    step: session.step === "reconnect_sent" ? "reconnect_acknowledged" : "hello_acknowledged",
    sequence: packet.sequence,
    reconnect
  }), packet);
}

function applyJoinResult(session, packet) {
  if (session.step !== "join_sent") return failure(session, "join_not_pending");
  if (!packet.payload?.ok) return failure(session, "join_rejected");
  return success(updateSession(session, { step: "joined", roomId: packet.roomId, sequence: packet.sequence, joinResult: packet, participantId: resolveParticipantId(session, packet.payload?.participantId || packet.payload?.playerId) }), packet);
}

function applyChatHistory(session, packet) {
  if (!["joined", "history_replayed", "snapshot_ready", "reconnect_acknowledged"].includes(session.step)) return failure(session, "join_required_before_history");
  if (!packet.payload?.serverOwned || !Array.isArray(packet.payload.messages)) return failure(session, "server_owned_history_required");
  return success(updateSession(session, { step: "history_replayed", sequence: packet.sequence, chatHistory: packet.payload.messages }), packet);
}

function applyStateSnapshot(session, packet) {
  if (!["history_replayed", "snapshot_ready"].includes(session.step)) return failure(session, "history_required_before_snapshot");
  if (!packet.payload?.serverOwned || !Array.isArray(packet.payload.participants)) return failure(session, "server_owned_snapshot_required");
  const authoritativeRunner = findAuthoritativeRunner(session, packet);
  const reconnect = session.reconnect.pending
    ? createReconnectState({ ...session.reconnect, pending: false, completedAtMs: packet.serverTimeMs })
    : session.reconnect;
  return success(updateSession(session, { step: "snapshot_ready", sequence: packet.sequence, latestSnapshot: packet, authoritativeRunner, reconnect }), packet);
}

function validateServerProviderPacket(session, packet) {
  if (!SERVER_PACKET_TYPES.includes(packet?.type)) return Object.freeze({ ok: false, reason: "server_packet_type_required" });
  const validation = validateRestoredMarathonTransportEnvelope(packet);
  if (!validation.ok) return Object.freeze({ ok: false, reason: validation.errors.join(", ") });
  if (!isServerOwnedPacket(packet)) return Object.freeze({ ok: false, reason: "server_origin_required" });
  if (packet.roomId && session.roomId && packet.roomId !== session.roomId) return Object.freeze({ ok: false, reason: "room_mismatch" });
  return Object.freeze({ ok: true, reason: "" });
}

function updateSession(session, patch) {
  return createRestoredMarathonProviderSession({ ...session, ...patch });
}

function success(session, packet) { return Object.freeze({ ok: true, reason: "", session, packet }); }
function failure(session, reason) { return Object.freeze({ ok: false, reason, session: updateSession(session, { errors: [...session.errors, reason] }), packet: null }); }
function isServerOwnedPacket(packet) { return String(packet.clientId || "").startsWith("server:") || packet.payload?.serverOwned === true; }
function normalizeRole(role) { return ["player", "spectator", "host", "admin"].includes(role) ? role : "player"; }
function safeText(value, maxLength) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength); }
function serverPacket(type, payload, options) { return createRestoredMarathonTransportEnvelope(type, payload, { clientId: "server:provider-test", serverTimeMs: 1000, ...options }); }

function createReconnectState(input = {}) {
  return Object.freeze({
    pending: input.pending === true, participantId: safeText(input.participantId, 80), resumeToken: safeText(input.resumeToken, 120),
    startedAtMs: Math.max(0, Number(input.startedAtMs || 0)), acknowledgedAtMs: Math.max(0, Number(input.acknowledgedAtMs || 0)),
    completedAtMs: Math.max(0, Number(input.completedAtMs || 0)), graceMs: normalizeGraceMs(input.graceMs), deadlineMs: Math.max(0, Number(input.deadlineMs || 0))
  });
}

function normalizeGraceMs(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.max(1000, number) : 8000;
}

function resolveParticipantId(session, fallback = "") {
  return safeText(fallback || session.participantId || session.joinResult?.payload?.participantId || session.joinResult?.payload?.playerId, 80);
}

function getJoinedParticipantType(session) {
  return session.joinResult?.payload?.participantType === "spectator" ? "spectator" : "player";
}

function findAuthoritativeRunner(session, packet) {
  const participantId = resolveParticipantId(session);
  if (!participantId) return null;
  return packet.payload.participants.find((participant) => participant?.participantId === participantId) || null;
}
