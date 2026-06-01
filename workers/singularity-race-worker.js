const WORKER_VERSION = "singularity-race-cloudflare-online-001";
const ROOM_ID = "room:singularity-race:public-001";
const ROOM_NAME = "특이점레이스 공개방 001";
const MAX_RUNNERS = 50;
const MAX_SPECTATORS = 32;
const INPUT_LIMIT_PER_SECOND = 10;
const SNAPSHOT_INTERVAL_MS = 200;
const MIN_SNAPSHOT_INTERVAL_MS = 125;
const CHAT_COOLDOWN_MS = 900;
const CHAT_BURST_WINDOW_MS = 10000;
const CHAT_BURST_LIMIT = 5;
const COUNTDOWN_MS = 10000;
const COURSE_DISTANCE_METERS = 42195;
const START_PROGRESS = 4;
const START_LANE_HALF_WIDTH_PX = 232;
const CHAT_LIMIT = 80;

export default {
  async fetch(request, env) {
    return routeWorkerRequest(request, env);
  }
};

export class SingularityRaceRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sequence = 1;
    this.lastSnapshotAtMs = 0;
    this.chatHistory = [];
    this.phase = "lobby";
    this.countdownEndsAtMs = 0;
    this.restoreSessions();
  }

  async fetch(request) {
    this.refreshPhase(Date.now());
    const url = new URL(request.url);
    if (url.pathname.endsWith("/summary")) return json(roomSummary(this));
    if (request.headers.get("Upgrade") !== "websocket") {
      return json({ ok: false, reason: "websocket_upgrade_required" }, 426);
    }
    return this.acceptSocket(request);
  }

  async webSocketMessage(socket, message) {
    this.refreshPhase(Date.now());
    const packet = parsePacket(message);
    const session = this.getSession(socket);
    if (!packet || !session) return send(socket, this.serverPacket("error", { reason: "bad_packet" }));
    if (packet.type === "chat_send") return this.handleChat(socket, session, packet);
    if (packet.type === "input_update") return this.handleInput(socket, session, packet);
    if (packet.type === "attack_action" || packet.type === "skill_use") return this.relayClientAction(session, packet);
    if (packet.type === "host_start_countdown" || packet.type === "start_race") return this.handleHostStart(socket, session);
    if (packet.type === "ping") return send(socket, this.serverPacket("pong", { serverTimeMs: Date.now() }));
    send(socket, this.serverPacket("error", { reason: "unsupported_packet", packetType: packet.type || "" }));
  }

  async webSocketClose(socket) {
    this.disconnectSocket(socket, "closed");
  }

  async webSocketError(socket) {
    this.disconnectSocket(socket, "error");
  }

  acceptSocket(request) {
    const url = new URL(request.url);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const now = Date.now();
    const requestedType = url.searchParams.get("participantType") === "spectator" ? "spectator" : "player";
    const type = chooseParticipantType(this, requestedType);
    const clientId = normalizeClientId(url.searchParams.get("clientId")) || crypto.randomUUID();
    const session = createSession(this, clientId, {
      displayName: url.searchParams.get("nickname"),
      skinPreset: url.searchParams.get("skinPreset"),
      participantType: type,
      now
    });
    this.state.acceptWebSocket(server);
    server.serializeAttachment(session);
    this.sessions.set(session.clientId, session);
    this.broadcast(this.serverPacket("presence_update", { summary: roomSummary(this) }));
    send(server, this.serverPacket("hello_result", {
      ok: true,
      version: WORKER_VERSION,
      clientId: session.clientId,
      roomId: ROOM_ID,
      serverTimeMs: now,
      inputHz: INPUT_LIMIT_PER_SECOND,
      snapshotHz: Math.round(1000 / SNAPSHOT_INTERVAL_MS),
      minSnapshotHz: Math.round(1000 / MIN_SNAPSHOT_INTERVAL_MS)
    }, session));
    send(server, this.serverPacket("join_result", joinPayload(session), session));
    send(server, this.serverPacket("chat_history", {
      serverOwned: true,
      messages: this.chatHistory.slice(-CHAT_LIMIT)
    }, session));
    this.broadcastSnapshot(true);
    return new Response(null, { status: 101, webSocket: client });
  }

  handleChat(socket, session, packet) {
    const now = Date.now();
    const gate = acceptChat(session, now);
    if (!gate.ok) return send(socket, this.serverPacket("rate_limited", gate, session));
    const text = cleanText(packet.payload?.text, 140);
    if (!text) return send(socket, this.serverPacket("error", { reason: "empty_chat" }, session));
    const message = {
      id: `message:${ROOM_ID}:${this.sequence++}`,
      channelId: packet.payload?.channelId || `room:${ROOM_ID.replace(/^room:/, "")}`,
      senderId: session.participantId,
      senderType: session.participantType,
      displayName: session.displayName,
      text,
      sequence: this.sequence,
      createdAtMs: now,
      moderationStatus: "approved"
    };
    this.chatHistory = [...this.chatHistory, message].slice(-CHAT_LIMIT);
    this.broadcast(this.serverPacket("chat_delivered", { message }, session));
  }

  handleInput(socket, session, packet) {
    const now = Date.now();
    if (session.participantType !== "player") return send(socket, this.serverPacket("error", { reason: "spectator_input_blocked" }, session));
    if (!acceptInput(session, now)) return send(socket, this.serverPacket("rate_limited", { reason: "input_10hz_limit" }, session));
    advanceSession(session, packet.payload || {}, now, this.phase);
    session.lastSequence = Math.max(session.lastSequence, Number(packet.sequence || packet.payload?.sequence || 0));
    socket.serializeAttachment(session);
    this.sessions.set(session.clientId, session);
    this.broadcastSnapshot(false);
  }

  relayClientAction(session, packet) {
    this.broadcast(this.serverPacket(packet.type, {
      ...safeObject(packet.payload),
      serverRelayed: true,
      participantId: session.participantId,
      attackerId: packet.payload?.attackerId || session.participantId
    }, session));
  }

  handleHostStart(socket, session) {
    if (!session.host) return send(socket, this.serverPacket("error", { reason: "host_required" }, session));
    if (this.phase !== "lobby" && this.phase !== "finished") return send(socket, this.serverPacket("error", { reason: "room_not_in_lobby" }, session));
    const now = Date.now();
    this.phase = "countdown";
    this.countdownEndsAtMs = now + COUNTDOWN_MS;
    this.broadcast(this.serverPacket("start_countdown", {
      roomId: ROOM_ID,
      gateOpensAtMs: this.countdownEndsAtMs,
      countdownMs: COUNTDOWN_MS,
      serverOwned: true
    }, session));
    this.broadcastSnapshot(true);
  }

  broadcastSnapshot(force) {
    const now = Date.now();
    this.refreshPhase(now);
    if (!force && now - this.lastSnapshotAtMs < SNAPSHOT_INTERVAL_MS) return false;
    this.lastSnapshotAtMs = now;
    return this.broadcast(this.serverPacket("state_snapshot", {
      roomId: ROOM_ID,
      sequence: this.sequence,
      serverOwned: true,
      serverTimeMs: now,
      phase: this.phase,
      mapId: "stadium-basic",
      countdownEndsAtMs: this.countdownEndsAtMs,
      participants: participantSnapshots(this)
    }));
  }

  serverPacket(type, payload = {}, session = {}) {
    return {
      transportVersion: "restored-marathon-server-transport-001",
      type,
      clientId: "server:cloudflare-durable-object",
      roomId: ROOM_ID,
      sequence: this.sequence++,
      serverTimeMs: Date.now(),
      payload: { roomId: ROOM_ID, ...payload, targetClientId: session.clientId || "" }
    };
  }

  broadcast(packet) {
    let count = 0;
    for (const socket of this.state.getWebSockets()) {
      try {
        socket.send(JSON.stringify(packet));
        count += 1;
      } catch {
        this.disconnectSocket(socket, "send_failed");
      }
    }
    return count > 0;
  }

  getSession(socket) {
    const attached = socket.deserializeAttachment?.();
    if (!attached?.clientId) return null;
    if (!this.sessions.has(attached.clientId)) this.sessions.set(attached.clientId, attached);
    return this.sessions.get(attached.clientId);
  }

  disconnectSocket(socket, reason) {
    const session = this.getSession(socket);
    if (!session) return;
    this.sessions.delete(session.clientId);
    this.broadcast(this.serverPacket("disconnect_notice", {
      participantId: session.participantId,
      reason
    }, session));
    this.broadcastSnapshot(true);
  }

  refreshPhase(now) {
    if (this.phase === "countdown" && this.countdownEndsAtMs > 0 && now >= this.countdownEndsAtMs) {
      this.phase = "racing";
      this.broadcast(this.serverPacket("race_started", { gateOpenedAtMs: this.countdownEndsAtMs, serverOwned: true }));
    }
  }

  restoreSessions() {
    this.sessions = new Map();
    for (const socket of this.state.getWebSockets?.() || []) {
      const session = socket.deserializeAttachment?.();
      if (session?.clientId) this.sessions.set(session.clientId, session);
    }
  }
}

async function routeWorkerRequest(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/health") return json({ ok: true, version: WORKER_VERSION, roomId: ROOM_ID });
  if (url.pathname === "/rooms") return roomStub(env).fetch(new Request(`${url.origin}/summary`));
  if (url.pathname === "/ws") return roomStub(env).fetch(request);
  return json({ ok: true, service: "singularity-race-online", endpoints: ["/health", "/rooms", "/ws"] });
}

function roomStub(env) {
  const id = env.SINGULARITY_RACE_ROOM.idFromName(ROOM_ID);
  return env.SINGULARITY_RACE_ROOM.get(id);
}

function createSession(room, clientId, options) {
  const type = options.participantType;
  const lane = type === "player" ? countPlayers(room) + 1 : 1;
  return {
    clientId,
    participantId: type === "player" ? `runner:${clientId}` : `spectator:${clientId}`,
    participantType: type,
    displayName: cleanText(options.displayName, 24) || `플레이어${String(lane).padStart(2, "0")}`,
    skinPreset: cleanText(options.skinPreset, 48) || "singularity-fan",
    host: type === "player" && countPlayers(room) === 0,
    lane,
    joinedAtMs: options.now,
    progressPercent: START_PROGRESS,
    laneOffsetPx: laneOffsetFor(lane),
    finishedAtMs: null,
    lastInputAtMs: options.now,
    lastSequence: 0,
    inputWindowStartedAtMs: options.now,
    inputCount: 0,
    lastChatAtMs: 0,
    chatWindowStartedAtMs: options.now,
    chatCount: 0
  };
}

function chooseParticipantType(room, requestedType) {
  if (requestedType === "spectator") return "spectator";
  if (room.phase !== "lobby" || countPlayers(room) >= MAX_RUNNERS) return "spectator";
  return "player";
}

function participantSnapshots(room) {
  return [...room.sessions.values()].map((session) => ({
    participantId: session.participantId,
    displayName: session.displayName,
    type: session.participantType,
    lane: session.lane,
    skinPreset: session.skinPreset,
    host: session.host,
    progressPercent: round2(session.progressPercent),
    progressMeters: round2((session.progressPercent / 100) * COURSE_DISTANCE_METERS),
    laneOffsetPx: round2(session.laneOffsetPx),
    hp: 100,
    maxHp: 100,
    finishedAtMs: session.finishedAtMs,
    lastSequence: session.lastSequence
  }));
}

function joinPayload(session) {
  return {
    ok: true,
    playerId: session.participantId,
    clientId: session.clientId,
    participantId: session.participantId,
    participantType: session.participantType,
    displayName: session.displayName,
    skinPreset: session.skinPreset,
    host: session.host,
    phase: "lobby",
    mapId: "stadium-basic",
    mapVersion: "baegeum-city-v2-map-001",
    venueSchemaVersion: "venue-schema-001",
    protocolVersion: "restored-marathon-001",
    inputHz: INPUT_LIMIT_PER_SECOND,
    snapshotHz: Math.round(1000 / SNAPSHOT_INTERVAL_MS)
  };
}

function roomSummary(room) {
  return {
    ok: true,
    version: WORKER_VERSION,
    roomId: ROOM_ID,
    displayName: ROOM_NAME,
    phase: room.phase,
    players: countPlayers(room),
    maxPlayers: MAX_RUNNERS,
    spectators: countSpectators(room),
    maxSpectators: MAX_SPECTATORS,
    inputHz: INPUT_LIMIT_PER_SECOND,
    snapshotHz: Math.round(1000 / SNAPSHOT_INTERVAL_MS),
    minSnapshotHz: Math.round(1000 / MIN_SNAPSHOT_INTERVAL_MS)
  };
}

function advanceSession(session, payload, now, phase) {
  const elapsedSeconds = Math.max(0, Math.min(0.4, (now - Number(session.lastInputAtMs || now)) / 1000));
  session.lastInputAtMs = now;
  if (phase !== "racing" || session.finishedAtMs !== null) return;
  const moving = Math.hypot(Number(payload.direction?.x || 0), Number(payload.direction?.y || 0)) > 0.05;
  const speed = moving ? paceSpeed(payload.pace || payload.mode) : 0;
  session.progressPercent = Math.min(100, Number(session.progressPercent || START_PROGRESS) + speed * elapsedSeconds);
  session.laneOffsetPx = Math.max(-START_LANE_HALF_WIDTH_PX, Math.min(START_LANE_HALF_WIDTH_PX,
    Number(session.laneOffsetPx || 0) + Number(payload.direction?.y || 0) * 120 * elapsedSeconds));
  if (session.progressPercent >= 100 && session.finishedAtMs === null) session.finishedAtMs = now;
}

function acceptInput(session, now) {
  if (now - session.inputWindowStartedAtMs >= 1000) {
    session.inputWindowStartedAtMs = now;
    session.inputCount = 0;
  }
  session.inputCount += 1;
  return session.inputCount <= INPUT_LIMIT_PER_SECOND;
}

function acceptChat(session, now) {
  if (now - session.lastChatAtMs < CHAT_COOLDOWN_MS) return { ok: false, reason: "chat_cooldown" };
  if (now - session.chatWindowStartedAtMs >= CHAT_BURST_WINDOW_MS) {
    session.chatWindowStartedAtMs = now;
    session.chatCount = 0;
  }
  session.chatCount += 1;
  session.lastChatAtMs = now;
  return session.chatCount <= CHAT_BURST_LIMIT ? { ok: true } : { ok: false, reason: "chat_burst_limit" };
}

function countPlayers(room) { return [...room.sessions.values()].filter((item) => item.participantType === "player").length; }
function countSpectators(room) { return [...room.sessions.values()].filter((item) => item.participantType === "spectator").length; }
function laneOffsetFor(lane) { return ((lane - 1) / Math.max(1, MAX_RUNNERS - 1) - 0.5) * START_LANE_HALF_WIDTH_PX * 1.8; }
function paceSpeed(pace) { return pace === "sprint" ? 1.8 : pace === "push" ? 1.25 : pace === "recover" ? 0.45 : 0.85; }
function round2(value) { return Math.round(Number(value || 0) * 100) / 100; }
function normalizeClientId(value) { return String(value || "").replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 80); }
function cleanText(value, max) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, max); }
function safeObject(value) { return value && typeof value === "object" ? value : {}; }
function parsePacket(message) { try { return JSON.parse(String(message)); } catch { return null; } }
function send(socket, packet) { socket.send(JSON.stringify(packet)); }
function json(payload, status = 200) { return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" } }); }
