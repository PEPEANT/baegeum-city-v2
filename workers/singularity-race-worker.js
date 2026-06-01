import {
  RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID,
  calculateRestoredMarathonSpeedScale,
  progressToRestoredMarathonTrailPoint
} from "../src/restored/games/marathon-trail-geometry.js";
import {
  resolveSingularityRaceInputMovement,
  resolveSingularityRaceLaneBoundary
} from "../src/restored/games/singularity-race-movement-vector.js";
import {
  resolveSingularityRaceObstacleCollision
} from "../src/restored/games/singularity-race-obstacle-contract.js";

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
const RUN_PROGRESS_PER_SECOND = 0.58;
const SPRINT_PROGRESS_PER_SECOND = 0.76;
const LANE_SPEED_PX_PER_SECOND = 122;
const LANE_SPRINT_SPEED_PX_PER_SECOND = 160;
const CHAT_LIMIT = 80;
const PUBLIC_MAP_ID = RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID;

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
    this.roomStateLoaded = false;
    this.restoreSessions();
  }

  async fetch(request) {
    await this.loadRoomState();
    if (this.refreshPhase(Date.now())) await this.persistRoomState();
    const url = new URL(request.url);
    if (url.pathname.endsWith("/summary")) return json(roomSummary(this));
    if (url.pathname.startsWith("/admin/")) return disabledAdminResponse();
    if (request.headers.get("Upgrade") !== "websocket") {
      return json({ ok: false, reason: "websocket_upgrade_required" }, 426);
    }
    return this.acceptSocket(request);
  }

  async webSocketMessage(socket, message) {
    await this.loadRoomState();
    if (this.refreshPhase(Date.now())) await this.persistRoomState();
    const packet = parsePacket(message);
    const session = this.getSession(socket);
    if (!packet || !session) return send(socket, this.serverPacket("error", { reason: "bad_packet" }));
    if (packet.type === "chat_send") return this.handleChat(socket, session, packet);
    if (packet.type === "input_update") return this.handleInput(socket, session, packet);
    if (packet.type === "attack_action" || packet.type === "skill_use") return this.relayClientAction(session, packet);
    if (packet.type === "start_request" || packet.type === "start_race") return this.handlePlayerStartRequest(socket, session);
    if (packet.type === "ping") return send(socket, this.serverPacket("pong", { serverTimeMs: Date.now() }));
    send(socket, this.serverPacket("error", { reason: "unsupported_packet", packetType: packet.type || "" }));
  }

  async webSocketClose(socket) {
    await this.disconnectSocket(socket, "closed");
  }

  async webSocketError(socket) {
    await this.disconnectSocket(socket, "error");
  }

  acceptSocket(request) {
    const url = new URL(request.url);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const now = Date.now();
    const requestedType = url.searchParams.get("participantType") === "spectator" ? "spectator" : "player";
    const joinGate = validateParticipantJoin(this, requestedType);
    const clientId = normalizeClientId(url.searchParams.get("clientId")) || crypto.randomUUID();
    if (!joinGate.ok) {
      this.state.acceptWebSocket(server);
      send(server, this.serverPacket("hello_result", {
        ok: false,
        version: WORKER_VERSION,
        clientId,
        roomId: ROOM_ID,
        serverTimeMs: now,
        inputHz: INPUT_LIMIT_PER_SECOND,
        snapshotHz: Math.round(1000 / SNAPSHOT_INTERVAL_MS),
        minSnapshotHz: Math.round(1000 / MIN_SNAPSHOT_INTERVAL_MS)
      }, { clientId }));
      send(server, this.serverPacket("join_result", {
        ok: false,
        reason: joinGate.reason,
        phase: this.phase,
        requestedParticipantType: requestedType,
        players: countPlayers(this),
        maxPlayers: MAX_RUNNERS,
        spectators: countSpectators(this),
        maxSpectators: MAX_SPECTATORS
      }, { clientId }));
      server.close(4409, joinGate.reason);
      return new Response(null, { status: 101, webSocket: client });
    }
    const type = joinGate.participantType;
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
    send(server, this.serverPacket("join_result", joinPayload(this, session), session));
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

  async handlePlayerStartRequest(socket, session) {
    if (!session.host) return send(socket, this.serverPacket("error", { reason: "host_required" }, session));
    if (this.phase !== "lobby" && this.phase !== "finished") return send(socket, this.serverPacket("error", { reason: "room_not_in_lobby" }, session));
    if (countPlayers(this) <= 0) return send(socket, this.serverPacket("error", { reason: "no_players" }, session));
    const now = Date.now();
    await this.startCountdown(now, session);
  }

  async startCountdown(now, session) {
    this.phase = "countdown";
    this.countdownEndsAtMs = now + COUNTDOWN_MS;
    await this.persistRoomState();
    await this.state.storage.setAlarm(this.countdownEndsAtMs + 25);
    this.broadcast(this.serverPacket("start_countdown", {
      roomId: ROOM_ID,
      gateOpensAtMs: this.countdownEndsAtMs,
      countdownMs: COUNTDOWN_MS,
      serverOwned: true
    }, session));
    this.broadcastSnapshot(true);
  }

  async resetRoom(reason = "admin_reset_room") {
    this.phase = "lobby";
    this.countdownEndsAtMs = 0;
    this.chatHistory = [];
    await this.persistRoomState();
    await this.state.storage.deleteAlarm();
    const packet = this.serverPacket("room_reset", { reason, serverOwned: true });
    for (const socket of this.state.getWebSockets()) {
      try {
        socket.send(JSON.stringify(packet));
        socket.close(4000, reason);
      } catch {}
    }
    this.sessions.clear();
  }

  async alarm() {
    await this.loadRoomState();
    if (this.refreshPhase(Date.now())) await this.persistRoomState();
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
      mapId: PUBLIC_MAP_ID,
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

  async disconnectSocket(socket, reason) {
    const session = this.getSession(socket);
    if (!session) return;
    this.sessions.delete(session.clientId);
    if (this.sessions.size === 0) {
      this.phase = "lobby";
      this.countdownEndsAtMs = 0;
      await this.persistRoomState();
      await this.state.storage.deleteAlarm();
    }
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
      return true;
    }
    return false;
  }

  async loadRoomState() {
    if (this.roomStateLoaded) return;
    const stored = await this.state.storage.get(["phase", "countdownEndsAtMs"]);
    this.phase = sanitizePhase(stored.get("phase"));
    this.countdownEndsAtMs = Number(stored.get("countdownEndsAtMs") || 0);
    if (this.sessions.size === 0 && this.phase !== "lobby") {
      this.phase = "lobby";
      this.countdownEndsAtMs = 0;
      await this.persistRoomState();
      await this.state.storage.deleteAlarm();
    }
    this.roomStateLoaded = true;
  }

  async persistRoomState() {
    await this.state.storage.put({
      phase: this.phase,
      countdownEndsAtMs: this.countdownEndsAtMs
    });
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
  if (request.method === "OPTIONS") return corsPreflight();
  if (url.pathname === "/health") return json({ ok: true, version: WORKER_VERSION, roomId: ROOM_ID });
  if (url.pathname === "/rooms") return roomStub(env).fetch(new Request(`${url.origin}/summary`));
  if (url.pathname === "/ws") return roomStub(env).fetch(request);
  if (url.pathname.startsWith("/admin/")) return roomStub(env).fetch(request);
  return json({ ok: true, service: "singularity-race-online", endpoints: ["/health", "/rooms", "/ws"] });
}

function roomStub(env) {
  const id = env.SINGULARITY_RACE_ROOM.idFromName(ROOM_ID);
  return env.SINGULARITY_RACE_ROOM.get(id);
}

function createSession(room, clientId, options) {
  const type = options.participantType;
  const lane = type === "player" ? countPlayers(room) + 1 : 1;
  const host = type === "player" && countPlayers(room) === 0;
  return {
    clientId,
    participantId: type === "player" ? `runner:${clientId}` : `spectator:${clientId}`,
    participantType: type,
    displayName: cleanText(options.displayName, 24) || `플레이어${String(lane).padStart(2, "0")}`,
    skinPreset: cleanText(options.skinPreset, 48) || "singularity-fan",
    host,
    lane,
    joinedAtMs: options.now,
    progressPercent: START_PROGRESS,
    laneOffsetPx: laneOffsetFor(lane),
    finishedAtMs: null,
    collisionAtMs: 0,
    obstacleCollisionId: "",
    slowUntilMs: 0,
    lastInputAtMs: options.now,
    lastSequence: 0,
    inputWindowStartedAtMs: options.now,
    inputCount: 0,
    lastChatAtMs: 0,
    chatWindowStartedAtMs: options.now,
    chatCount: 0
  };
}

function validateParticipantJoin(room, requestedType) {
  if (room.phase !== "lobby") return { ok: false, reason: "room_join_closed" };
  if (requestedType === "spectator") {
    if (countSpectators(room) >= MAX_SPECTATORS) return { ok: false, reason: "spectator_full" };
    return { ok: true, participantType: "spectator" };
  }
  if (countPlayers(room) >= MAX_RUNNERS) return { ok: false, reason: "room_full" };
  return { ok: true, participantType: "player" };
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
    collisionAtMs: session.collisionAtMs || 0,
    obstacleCollisionId: session.obstacleCollisionId || "",
    slowUntilMs: session.slowUntilMs || 0,
    finishedAtMs: session.finishedAtMs,
    lastSequence: session.lastSequence
  }));
}

function joinPayload(room, session) {
  return {
    ok: true,
    playerId: session.participantId,
    clientId: session.clientId,
    participantId: session.participantId,
    participantType: session.participantType,
    displayName: session.displayName,
    skinPreset: session.skinPreset,
    host: session.host,
    phase: room.phase,
    mapId: PUBLIC_MAP_ID,
    countdownEndsAtMs: room.countdownEndsAtMs,
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
    participants: participantSnapshots(room),
    inputHz: INPUT_LIMIT_PER_SECOND,
    snapshotHz: Math.round(1000 / SNAPSHOT_INTERVAL_MS),
    minSnapshotHz: Math.round(1000 / MIN_SNAPSHOT_INTERVAL_MS)
  };
}

function advanceSession(session, payload, now, phase) {
  const elapsedSeconds = Math.max(0, Math.min(0.4, (now - Number(session.lastInputAtMs || now)) / 1000));
  session.lastInputAtMs = now;
  if (phase !== "racing" || session.finishedAtMs !== null) return;
  const progressPercent = Number(session.progressPercent || START_PROGRESS);
  const trailPoint = progressToRestoredMarathonTrailPoint(progressPercent, PUBLIC_MAP_ID);
  const movement = resolveSingularityRaceInputMovement(payload || {}, trailPoint);
  const forwardFactor = Math.max(0, Number(movement.forward || 0));
  const pace = payload.pace || payload.mode;
  const speedScale = calculateRestoredMarathonSpeedScale(trailPoint.tangent);
  const slowFactor = Number(session.slowUntilMs || 0) > now ? 0.48 : 1;
  const progressDelta = paceSpeed(pace) * forwardFactor * speedScale * slowFactor * elapsedSeconds;
  const laneSpeed = pace === "sprint" ? LANE_SPRINT_SPEED_PX_PER_SECOND : LANE_SPEED_PX_PER_SECOND;
  const laneBoundary = resolveSingularityRaceLaneBoundary(
    session.laneOffsetPx,
    Number(movement.lateral || 0) * laneSpeed * elapsedSeconds,
    START_LANE_HALF_WIDTH_PX
  );
  const obstacle = resolveSingularityRaceObstacleCollision({
    progress: Math.min(100, progressPercent + progressDelta),
    laneOffsetPx: laneBoundary.laneOffsetPx,
    collisionAtMs: Number(session.collisionAtMs || 0),
    slowUntilMs: Number(session.slowUntilMs || 0)
  }, {
    mapId: PUBLIC_MAP_ID,
    laneHalfWidthPx: START_LANE_HALF_WIDTH_PX,
    maxProgress: 100,
    nowMs: now,
    raceStarted: true
  });
  session.progressPercent = obstacle.runner.progress;
  session.laneOffsetPx = obstacle.runner.laneOffsetPx;
  if (obstacle.collided) {
    session.collisionAtMs = now;
    session.obstacleCollisionId = obstacle.obstacle.id;
    session.slowUntilMs = obstacle.runner.slowUntilMs || session.slowUntilMs || 0;
  }
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
function paceSpeed(pace) { return pace === "sprint" ? SPRINT_PROGRESS_PER_SECOND : RUN_PROGRESS_PER_SECOND; }
function round2(value) { return Math.round(Number(value || 0) * 100) / 100; }
function normalizeClientId(value) { return String(value || "").replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 80); }
function cleanText(value, max) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, max); }
function safeObject(value) { return value && typeof value === "object" ? value : {}; }
function sanitizePhase(value) { return ["lobby", "countdown", "racing", "finished"].includes(value) ? value : "lobby"; }
function parsePacket(message) { try { return JSON.parse(String(message)); } catch { return null; } }
function send(socket, packet) { socket.send(JSON.stringify(packet)); }
function json(payload, status = 200) { return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" } }); }
function corsPreflight() { return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "content-type" } }); }
function disabledAdminResponse() { return json({ ok: false, reason: "public_admin_disabled", startMode: "first_player_host" }, 410); }
