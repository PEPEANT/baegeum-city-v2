import {
  RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID,
  calculateRestoredMarathonSpeedScale,
  normalizeRestoredMarathonTrailMapId,
  progressToRestoredMarathonTrailPoint
} from "../src/restored/games/marathon-trail-geometry.js";
import {
  resolveSingularityRaceInputMovement,
  resolveSingularityRaceLaneBoundary
} from "../src/restored/games/singularity-race-movement-vector.js";
import {
  resolveSingularityRaceObstacleCollision
} from "../src/restored/games/singularity-race-obstacle-contract.js";
import {
  createSingularityRaceFinishWindowState,
  resolveSingularityRaceFinishWindowMs
} from "../src/restored/games/singularity-race-finish-window.js";
import {
  createRestoredMarathonAttackAction,
  resolveRestoredMarathonAttackHit
} from "../src/restored/games/marathon-combat-contract.js";
import {
  createRestoredMarathonSkillUse,
  getRestoredMarathonSkill
} from "../src/restored/games/marathon-character-skill-contract.js";

const WORKER_VERSION = "singularity-race-cloudflare-online-002";
const ROOM_ID = "room:singularity-race:public-001";
const USER_ROOM_PREFIX = "room:singularity-race:user:";
const USER_ROOM_CODE_LENGTH = 6;
const USER_ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const HOST_TOKEN_LENGTH = 32;
const USER_ROOM_CREATE_COOLDOWN_MS = 60000;
const USER_ROOM_MAX_ACTIVE = 12;
const USER_ROOM_EMPTY_IDLE_MS = 3 * 60 * 1000;
const USER_ROOM_UNSTARTED_DELETE_MS = 10 * 60 * 1000;
const USER_ROOM_RESULT_CLOSE_MS = 3 * 60 * 1000;
const USER_ROOM_DELETE_AFTER_CLOSED_MS = 10 * 60 * 1000;
const ROOM_NAME = "특이점레이스 공개방 001";
const MAX_RUNNERS = 50;
const MAX_SPECTATORS = 32;
const INPUT_LIMIT_PER_SECOND = 10;
const SERVER_TICK_INTERVAL_MS = 100;
const INPUT_STALE_MS = 550;
const SELF_SPEED_MULTIPLIER_CAP = 1.6;
const SNAPSHOT_INTERVAL_MS = 100;
const MIN_SNAPSHOT_INTERVAL_MS = 100;
const CHAT_COOLDOWN_MS = 900;
const CHAT_BURST_WINDOW_MS = 10000;
const CHAT_BURST_LIMIT = 5;
const COUNTDOWN_MS = 6000;
const COURSE_DISTANCE_METERS = 42195;
const ENTRY_OPEN_DEFAULT = false;
const ROOM_ACTIVE_DEFAULT = false;
const BASIC_ATTACK_RANGE_PROGRESS = 3.2;
const BASIC_ATTACK_LANE_TO_PROGRESS = 52;
const BASIC_ATTACK_ARC_DEGREES = 58;
const BASIC_ATTACK_STALL_MS = 180;
const BASIC_ATTACK_COOLDOWN_MS = 1150;
const BASIC_ATTACK_STUN_MS = 680;
const BACKWARD_PROGRESS_MULTIPLIER = 0.45;
const SERVER_SKILL_LANE_PUSH_PX = 72;
const SERVER_SKILL_SLOW_MS = 1450;
const SERVER_SKILL_STUN_MS = 520;
const SERVER_SKILL_SELF_BOOST_MS = 2200;
const SERVER_SKILL_SELF_BOOST_MULTIPLIER = 1.18;
const SERVER_SKILL_CHECKPOINT_HOP_PROGRESS = 2.4;
const START_PROGRESS = 4;
const RAIL_MIN_PROGRESS = 2.5;
const START_PADDOCK_MIN_PROGRESS = 2.8;
const START_GATE_PROGRESS = 7.2;
const START_GATE_CLEARANCE_PROGRESS = 0.08;
const START_PADDOCK_MAX_PROGRESS = START_GATE_PROGRESS - START_GATE_CLEARANCE_PROGRESS;
const START_LANE_HALF_WIDTH_PX = 232;
const STAGING_RUN_PROGRESS_PER_SECOND = 1.0;
const STAGING_SPRINT_PROGRESS_PER_SECOND = 1.0;
const RUN_PROGRESS_PER_SECOND = 0.64;
const SPRINT_PROGRESS_PER_SECOND = 0.64;
const LANE_SPEED_PX_PER_SECOND = 134;
const LANE_SPRINT_SPEED_PX_PER_SECOND = 134;
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
    this.raceStartedAtMs = 0;
    this.finishWindowStartedAtMs = 0;
    this.finishWindowEndsAtMs = 0;
    this.entryOpen = ENTRY_OPEN_DEFAULT;
    this.roomActive = ROOM_ACTIVE_DEFAULT;
    this.mapId = PUBLIC_MAP_ID;
    this.roomId = ROOM_ID;
    this.roomCode = roomCodeFromRoomId(ROOM_ID);
    this.roomKind = "public";
    this.roomName = ROOM_NAME;
    this.hostToken = "";
    this.hostClientId = "";
    this.roomStatus = "open";
    this.createdAtMs = 0;
    this.lastActivityAtMs = 0;
    this.resultSnapshot = null;
    this.resultFinalizedAtMs = 0;
    this.closedAtMs = 0;
    this.deleteAfterMs = 0;
    this.userRoomRegistry = [];
    this.roomCreateCooldowns = {};
    this.registryLoaded = false;
    this.roomStateLoaded = false;
    this.storageAvailable = true;
    this.countdownTimer = null;
    this.serverTickTimer = null;
    this.restoreSessions();
  }

  async fetch(request) {
    const url = new URL(request.url);
    this.applyRoomIdentityFromUrl(url);
    await this.loadRoomState();
    await this.refreshRuntime(Date.now());
    if (url.pathname === "/rooms/create") return this.handleCreateUserRoomRequest(request, url);
    if (url.pathname.endsWith("/summary")) return json(roomSummary(this));
    if (url.pathname.startsWith("/host/")) return this.handleHostRequest(request, url);
    if (url.pathname.startsWith("/admin/")) return this.handleAdminRequest(request, url);
    if (request.headers.get("Upgrade") !== "websocket") {
      return json({ ok: false, reason: "websocket_upgrade_required" }, 426);
    }
    return this.acceptSocket(request);
  }

  applyRoomIdentityFromUrl(url) {
    const nextRoomId = normalizeRoomId(url.searchParams.get("roomId") || url.searchParams.get("roomCode") || this.roomId);
    this.roomId = nextRoomId;
    this.roomCode = roomCodeFromRoomId(nextRoomId);
    this.roomKind = isUserRoomId(nextRoomId) ? "user" : "public";
    this.roomName = defaultRoomNameFor(nextRoomId);
  }

  async webSocketMessage(socket, message) {
    await this.loadRoomState();
    await this.refreshRuntime(Date.now());
    const packet = parsePacket(message);
    const session = this.getSession(socket);
    if (!packet || !session) return send(socket, this.serverPacket("error", { reason: "bad_packet" }));
    if (packet.type === "chat_send") return this.handleChat(socket, session, packet);
    if (packet.type === "input_update") return this.handleInput(socket, session, packet);
    if (packet.type === "attack_action") return this.handleAttack(socket, session, packet);
    if (packet.type === "skill_use") return this.handleSkill(socket, session, packet);
    if (packet.type === "start_request" || packet.type === "start_race") {
      return send(socket, this.serverPacket("error", { reason: "admin_start_required" }, session));
    }
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
        roomId: this.roomId,
        roomActive: this.roomActive !== false,
        serverTimeMs: now,
        inputHz: INPUT_LIMIT_PER_SECOND,
        snapshotHz: Math.round(1000 / SNAPSHOT_INTERVAL_MS),
        minSnapshotHz: Math.round(1000 / MIN_SNAPSHOT_INTERVAL_MS)
      }, { clientId }));
      send(server, this.serverPacket("join_result", {
        ok: false,
        reason: joinGate.reason,
        roomActive: this.roomActive !== false,
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
    const hostAuth = verifyHostTokenValue(url.searchParams.get("hostToken"), this);
    const session = createSession(this, clientId, {
      displayName: url.searchParams.get("nickname"),
      skinPreset: url.searchParams.get("skinPreset"),
      participantType: type,
      host: hostAuth.ok,
      now
    });
    this.state.acceptWebSocket(server);
    server.serializeAttachment(session);
    this.sessions.set(session.clientId, session);
    this.lastActivityAtMs = now;
    this.broadcast(this.serverPacket("presence_update", { summary: roomSummary(this) }));
    send(server, this.serverPacket("hello_result", {
      ok: true,
      version: WORKER_VERSION,
      clientId: session.clientId,
      roomId: this.roomId,
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
    if (!isRoomInteractionOpen(this)) return send(socket, this.serverPacket("error", { reason: "room_closed" }, session));
    const gate = acceptChat(session, now);
    if (!gate.ok) return send(socket, this.serverPacket("rate_limited", gate, session));
    const text = cleanText(packet.payload?.text, 140);
    if (!text) return send(socket, this.serverPacket("error", { reason: "empty_chat" }, session));
    const message = {
      id: `message:${this.roomId}:${this.sequence++}`,
      channelId: packet.payload?.channelId || `room:${this.roomId.replace(/^room:/, "")}`,
      senderId: session.participantId,
      senderType: session.participantType,
      displayName: session.displayName,
      text,
      sequence: this.sequence,
      createdAtMs: now,
      moderationStatus: "approved"
    };
    this.chatHistory = [...this.chatHistory, message].slice(-CHAT_LIMIT);
    this.lastActivityAtMs = now;
    this.broadcast(this.serverPacket("chat_delivered", { message }, session));
  }

  async handleInput(socket, session, packet) {
    const now = Date.now();
    if (session.participantType !== "player") return send(socket, this.serverPacket("error", { reason: "spectator_input_blocked" }, session));
    if (!isRoomInteractionOpen(this)) return send(socket, this.serverPacket("error", { reason: "room_closed" }, session));
    if (!acceptInput(session, now)) return send(socket, this.serverPacket("rate_limited", { reason: "input_10hz_limit" }, session));
    if (!canAdvancePlayerMovement(this) || session.finishedAtMs !== null) {
      updateSessionSequence(session, packet.sequence || packet.payload?.sequence || 0);
      socket.serializeAttachment(session);
      this.sessions.set(session.clientId, session);
      return;
    }
    recordSessionInput(session, packet.payload || {}, now, packet.sequence || packet.payload?.sequence || 0);
    this.lastActivityAtMs = now;
    socket.serializeAttachment(session);
    this.sessions.set(session.clientId, session);
    this.scheduleServerTick();
  }

  relayClientAction(session, packet) {
    this.broadcast(this.serverPacket(packet.type, {
      ...safeObject(packet.payload),
      serverRelayed: true,
      participantId: session.participantId,
      attackerId: packet.payload?.attackerId || session.participantId
    }, session));
  }

  handleAttack(socket, session, packet) {
    const now = Date.now();
    if (session.participantType !== "player") return send(socket, this.serverPacket("error", { reason: "participant_cannot_attack" }, session));
    if (!isRoomInteractionOpen(this)) return send(socket, this.serverPacket("error", { reason: this.roomActive === false ? "room_not_created" : "room_closed" }, session));
    if (!canAttackInPhase(this.phase, this.entryOpen)) return send(socket, this.serverPacket("error", { reason: "race_not_attackable" }, session));
    const sequence = Math.max(1, Number(packet.sequence || packet.payload?.sequence || 1));
    if (sequence <= Number(session.lastAttackSequence || 0)) return send(socket, this.serverPacket("error", { reason: "stale_attack" }, session));
    if (now < Number(session.attackCooldownUntilMs || 0)) {
      return send(socket, this.serverPacket("rate_limited", {
        reason: "attack_cooldown",
        cooldownRemainingMs: Math.max(0, Math.round(Number(session.attackCooldownUntilMs || 0) - now))
      }, session));
    }
    const action = createServerBasicAttackAction(session, packet, sequence, this.mapId);
    const target = findServerBasicAttackTarget(this, action, session.participantId);
    session.lastAttackSequence = sequence;
    session.attackCooldownUntilMs = now + BASIC_ATTACK_COOLDOWN_MS;
    session.actionLockedUntilMs = Math.max(Number(session.actionLockedUntilMs || 0), now + BASIC_ATTACK_STALL_MS);
    this.sessions.set(session.clientId, session);
    if (target) {
      target.session.stunnedUntilMs = Math.max(Number(target.session.stunnedUntilMs || 0), now + BASIC_ATTACK_STUN_MS);
      target.session.slowUntilMs = Math.max(Number(target.session.slowUntilMs || 0), now + BASIC_ATTACK_STUN_MS);
      target.session.collisionAtMs = now;
      this.sessions.set(target.session.clientId, target.session);
    }
    this.serializeAttachedSessions();
    this.broadcast(this.serverPacket("attack_action", {
      serverOwned: true,
      serverResolved: true,
      participantId: session.participantId,
      attackerId: session.participantId,
      targetId: target?.session.participantId || "",
      hit: Boolean(target),
      stunMs: target ? BASIC_ATTACK_STUN_MS : 0,
      cooldownMs: BASIC_ATTACK_COOLDOWN_MS
    }, session));
    this.broadcastSnapshot(true);
  }

  handleSkill(socket, session, packet) {
    const now = Date.now();
    if (session.participantType !== "player") return send(socket, this.serverPacket("error", { reason: "participant_cannot_skill" }, session));
    if (!isRoomInteractionOpen(this)) return send(socket, this.serverPacket("error", { reason: this.roomActive === false ? "room_not_created" : "room_closed" }, session));
    if (this.phase !== "racing") return send(socket, this.serverPacket("error", { reason: "race_not_running" }, session));
    if (Number(session.stunnedUntilMs || 0) > now || Number(session.actionLockedUntilMs || 0) > now) {
      return send(socket, this.serverPacket("error", { reason: "participant_control_locked" }, session));
    }
    const sequence = Math.max(1, Number(packet.sequence || packet.payload?.sequence || 1));
    if (sequence <= Number(session.lastSkillSequence || 0)) return send(socket, this.serverPacket("error", { reason: "stale_skill" }, session));
    const use = createServerSkillUse(session, packet, now);
    if (!use.allowed) {
      const payload = {
        reason: use.reason || "skill_blocked",
        cooldownRemainingMs: Math.max(0, Math.round(Number(session.skillCooldownUntilMs || 0) - now))
      };
      return send(socket, this.serverPacket(use.reason === "cooldown" ? "rate_limited" : "error", payload, session));
    }
    const skill = getRestoredMarathonSkill(use.skillId);
    const targets = findServerSkillTargets(this, session, cleanText(packet.payload?.targetId, 96), use);
    session.lastSkillSequence = sequence;
    session.characterId = use.characterId || cleanText(packet.payload?.characterId, 64) || session.characterId || "";
    session.skillId = use.skillId;
    session.rewardGrade = use.grade || cleanText(packet.payload?.rewardGrade || packet.payload?.skillGrade, 2).toUpperCase();
    session.skillCooldownUntilMs = now + (Math.max(0, Number(skill.cooldownSeconds || 0)) * 1000);
    if (skill.maxCharges > 0) session.skillChargesRemaining = Math.max(0, Number(session.skillChargesRemaining ?? skill.maxCharges) - 1);
    else session.skillChargesRemaining = 0;
    session.actionLockedUntilMs = Math.max(Number(session.actionLockedUntilMs || 0), now + Number(use.movementStallMs || 0));
    const result = applyServerSkillEffects(session, targets, use, now);
    this.sessions.set(session.clientId, session);
    for (const target of targets) this.sessions.set(target.clientId, target);
    this.serializeAttachedSessions();
    this.broadcast(this.serverPacket("skill_use", {
      serverOwned: true,
      serverResolved: true,
      participantId: session.participantId,
      characterId: session.characterId || "",
      skillId: use.skillId,
      rewardGrade: session.rewardGrade || "",
      skillGrade: use.grade || session.rewardGrade || "",
      targetId: result.targetIds[0] || "",
      targetIds: result.targetIds,
      hit: result.hit,
      cooldownMs: Math.max(0, Math.round(Number(skill.cooldownSeconds || 0) * 1000)),
      chargesRemaining: session.skillChargesRemaining || 0
    }, session));
    this.broadcastSnapshot(true);
  }

  async startCountdown(now, session) {
    this.phase = "countdown";
    this.countdownEndsAtMs = now + COUNTDOWN_MS;
    this.raceStartedAtMs = 0;
    this.finishWindowStartedAtMs = 0;
    this.finishWindowEndsAtMs = 0;
    this.entryOpen = false;
    this.roomStatus = "open";
    this.resultSnapshot = null;
    this.resultFinalizedAtMs = 0;
    this.closedAtMs = 0;
    this.deleteAfterMs = 0;
    this.lastActivityAtMs = now;
    await this.persistRoomState();
    await this.safeSetAlarm(this.countdownEndsAtMs + 25);
    this.scheduleCountdownTimer();
    this.broadcast(this.serverPacket("start_countdown", {
      roomId: this.roomId,
      gateOpensAtMs: this.countdownEndsAtMs,
      countdownMs: COUNTDOWN_MS,
      serverOwned: true
    }, session));
    this.broadcastSnapshot(true);
  }

  async resetRoom(reason = "admin_reset_room") {
    this.phase = "lobby";
    this.countdownEndsAtMs = 0;
    this.raceStartedAtMs = 0;
    this.finishWindowStartedAtMs = 0;
    this.finishWindowEndsAtMs = 0;
    this.entryOpen = ENTRY_OPEN_DEFAULT;
    this.roomStatus = "open";
    this.resultSnapshot = null;
    this.resultFinalizedAtMs = 0;
    this.closedAtMs = 0;
    this.deleteAfterMs = 0;
    this.lastActivityAtMs = Date.now();
    this.chatHistory = [];
    await this.persistRoomState();
    await this.safeDeleteAlarm();
    this.clearServerTick();
    const packet = this.serverPacket("room_reset", { reason, serverOwned: true });
    for (const socket of this.state.getWebSockets()) {
      try {
        socket.send(JSON.stringify(packet));
        socket.close(4000, reason);
      } catch {}
    }
    this.sessions.clear();
  }

  async createRoom(reason = "admin_create_room") {
    const now = Date.now();
    this.roomActive = true;
    this.phase = "lobby";
    this.countdownEndsAtMs = 0;
    this.raceStartedAtMs = 0;
    this.finishWindowStartedAtMs = 0;
    this.finishWindowEndsAtMs = 0;
    this.entryOpen = ENTRY_OPEN_DEFAULT;
    this.roomStatus = "open";
    this.createdAtMs = now;
    this.lastActivityAtMs = now;
    this.resultSnapshot = null;
    this.resultFinalizedAtMs = 0;
    this.closedAtMs = 0;
    this.deleteAfterMs = 0;
    this.chatHistory = [];
    await this.persistRoomState();
    await this.safeDeleteAlarm();
    this.clearServerTick();
    this.broadcast(this.serverPacket("presence_update", {
      reason,
      summary: roomSummary(this),
      serverOwned: true
    }));
  }

  async deactivateRoom(reason = "admin_deactivate_room") {
    this.roomActive = ROOM_ACTIVE_DEFAULT;
    this.phase = "lobby";
    this.countdownEndsAtMs = 0;
    this.raceStartedAtMs = 0;
    this.finishWindowStartedAtMs = 0;
    this.finishWindowEndsAtMs = 0;
    this.entryOpen = ENTRY_OPEN_DEFAULT;
    this.roomStatus = this.roomKind === "user" ? "closed" : "open";
    this.closedAtMs = this.roomKind === "user" ? Date.now() : 0;
    this.deleteAfterMs = this.roomKind === "user" ? this.closedAtMs + USER_ROOM_DELETE_AFTER_CLOSED_MS : 0;
    this.resultSnapshot = this.roomKind === "user" ? this.resultSnapshot : null;
    this.resultFinalizedAtMs = this.roomKind === "user" ? this.resultFinalizedAtMs : 0;
    this.chatHistory = [];
    await this.persistRoomState();
    await this.safeDeleteAlarm();
    this.clearServerTick();
    const packet = this.serverPacket("room_closed", {
      reason,
      summary: roomSummary(this),
      serverOwned: true
    });
    for (const socket of this.state.getWebSockets()) {
      try {
        socket.send(JSON.stringify(packet));
        socket.close(4000, reason);
      } catch {}
    }
    this.sessions.clear();
  }

  async refreshRuntime(now = Date.now()) {
    const phaseChanged = this.refreshPhase(now);
    const lifecycleChanged = await this.refreshLifecycle(now);
    if (phaseChanged || lifecycleChanged) await this.persistRoomState();
    return phaseChanged || lifecycleChanged;
  }

  async refreshLifecycle(now = Date.now()) {
    if (!shouldAutoLifecycleRoom(this) || this.roomStatus === "deleted") return false;
    const createdAtMs = Number(this.createdAtMs || now);
    const lastActivityAtMs = Number(this.lastActivityAtMs || createdAtMs || now);
    if (this.roomActive !== false && this.phase === "lobby" && !this.resultSnapshot) {
      const emptyIdle = this.sessions.size <= 0 && now - lastActivityAtMs >= USER_ROOM_EMPTY_IDLE_MS;
      const unstartedExpired = now - createdAtMs >= USER_ROOM_UNSTARTED_DELETE_MS;
      if (emptyIdle || unstartedExpired) return this.markRoomDeleted(emptyIdle ? "idle_unstarted_room" : "unstarted_room_expired", now);
      await this.safeSetAlarm(Math.min(lastActivityAtMs + USER_ROOM_EMPTY_IDLE_MS, createdAtMs + USER_ROOM_UNSTARTED_DELETE_MS) + 25);
      return false;
    }
    if (this.roomStatus === "results_finalized" && Number(this.resultFinalizedAtMs || 0) > 0) {
      const closeAtMs = Number(this.resultFinalizedAtMs || now) + USER_ROOM_RESULT_CLOSE_MS;
      if (now >= closeAtMs) return this.markRoomClosed("results_auto_closed", now);
      await this.safeSetAlarm(closeAtMs + 25);
      return false;
    }
    if (this.roomStatus === "closed" && Number(this.deleteAfterMs || 0) > 0) {
      if (now >= Number(this.deleteAfterMs || 0)) return this.markRoomDeleted("closed_ttl_expired", now);
      await this.safeSetAlarm(Number(this.deleteAfterMs || 0) + 25);
    }
    return false;
  }

  markRoomClosed(reason = "room_closed", now = Date.now()) {
    if (this.roomStatus === "closed" || this.roomStatus === "deleted") return false;
    this.roomStatus = "closed";
    this.roomActive = false;
    this.entryOpen = false;
    this.countdownEndsAtMs = 0;
    this.hostToken = "";
    this.hostClientId = "";
    this.closedAtMs = now;
    this.deleteAfterMs = now + USER_ROOM_DELETE_AFTER_CLOSED_MS;
    if (this.resultSnapshot) this.phase = "finished";
    this.clearServerTick();
    const packet = this.serverPacket("room_closed", {
      reason,
      summary: roomSummary(this),
      resultSnapshot: this.resultSnapshot,
      serverOwned: true
    });
    for (const socket of this.state.getWebSockets()) {
      try {
        socket.send(JSON.stringify(packet));
        socket.close(4000, reason);
      } catch {}
    }
    this.sessions.clear();
    this.safeSetAlarm(this.deleteAfterMs + 25);
    return true;
  }

  markRoomDeleted(reason = "room_deleted", now = Date.now()) {
    this.roomStatus = "deleted";
    this.roomActive = false;
    this.entryOpen = false;
    this.phase = "lobby";
    this.countdownEndsAtMs = 0;
    this.raceStartedAtMs = 0;
    this.finishWindowStartedAtMs = 0;
    this.finishWindowEndsAtMs = 0;
    this.hostToken = "";
    this.hostClientId = "";
    this.closedAtMs = this.closedAtMs || now;
    this.deleteAfterMs = now;
    this.resultSnapshot = null;
    this.resultFinalizedAtMs = 0;
    this.chatHistory = [];
    this.clearServerTick();
    for (const socket of this.state.getWebSockets()) {
      try {
        socket.send(JSON.stringify(this.serverPacket("room_deleted", { reason, serverOwned: true })));
        socket.close(4000, reason);
      } catch {}
    }
    this.sessions.clear();
    this.safeDeleteAlarm();
    return true;
  }

  async alarm() {
    await this.loadRoomState();
    await this.refreshRuntime(Date.now());
    this.broadcastSnapshot(true);
  }

  broadcastSnapshot(force) {
    const now = Date.now();
    this.refreshPhase(now);
    if (!force && now - this.lastSnapshotAtMs < SNAPSHOT_INTERVAL_MS) return false;
    this.lastSnapshotAtMs = now;
    return this.broadcast(this.serverPacket("state_snapshot", {
      roomId: this.roomId,
      sequence: this.sequence,
      serverOwned: true,
      serverTimeMs: now,
      phase: this.phase,
      roomStatus: this.roomStatus,
      entryOpen: this.entryOpen,
      roomActive: this.roomActive !== false,
      mapId: this.mapId,
      countdownEndsAtMs: this.countdownEndsAtMs,
      raceStartedAtMs: this.raceStartedAtMs,
      finishWindowStartedAtMs: this.finishWindowStartedAtMs,
      finishWindowEndsAtMs: this.finishWindowEndsAtMs,
      resultSnapshot: this.resultSnapshot,
      resultFinalizedAtMs: this.resultFinalizedAtMs,
      closedAtMs: this.closedAtMs,
      deleteAfterMs: this.deleteAfterMs,
      ...finishWindowSummary(this, now),
      participants: participantSnapshots(this, now)
    }));
  }

  serverPacket(type, payload = {}, session = {}) {
    return {
      transportVersion: "restored-marathon-server-transport-001",
      type,
      clientId: "server:cloudflare-durable-object",
      roomId: this.roomId,
      sequence: this.sequence++,
      serverTimeMs: Date.now(),
      payload: { roomId: this.roomId, ...payload, targetClientId: session.clientId || "" }
    };
  }

  broadcast(packet) {
    const message = JSON.stringify(packet);
    let count = 0;
    for (const socket of this.state.getWebSockets()) {
      try {
        socket.send(message);
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
    const now = Date.now();
    const session = this.getSession(socket);
    if (!session) return;
    if (this.roomKind === "user" && session.host && this.phase === "lobby" && !this.resultSnapshot) {
      this.markRoomClosed("host_disconnected", now);
      await this.persistRoomState();
      return;
    }
    this.sessions.delete(session.clientId);
    this.lastActivityAtMs = now;
    if (this.sessions.size === 0) {
      const wasActive = this.phase !== "lobby";
      if (!this.resultSnapshot) {
        this.phase = "lobby";
        this.countdownEndsAtMs = 0;
        this.raceStartedAtMs = 0;
        this.finishWindowStartedAtMs = 0;
        this.finishWindowEndsAtMs = 0;
        if (wasActive) this.entryOpen = ENTRY_OPEN_DEFAULT;
      }
      await this.persistRoomState();
      if (shouldAutoLifecycleRoom(this) && !this.resultSnapshot) await this.safeSetAlarm(now + USER_ROOM_EMPTY_IDLE_MS + 25);
      else await this.safeDeleteAlarm();
      this.clearServerTick();
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
      this.raceStartedAtMs = this.countdownEndsAtMs || now;
      this.finishWindowStartedAtMs = 0;
      this.finishWindowEndsAtMs = 0;
      for (const session of playerSessions(this)) session.lastMovementTickAtMs = now;
      this.scheduleServerTick();
      this.broadcast(this.serverPacket("race_started", {
        gateOpenedAtMs: this.countdownEndsAtMs,
        raceStartedAtMs: this.raceStartedAtMs,
        serverOwned: true
      }));
      return true;
    }
    if (this.phase === "racing") {
      const players = playerSessions(this);
      if (players.length <= 0) return false;
      const finishedPlayers = players.filter((session) => Number(session.finishedAtMs || 0) > 0);
      const allFinished = finishedPlayers.length === players.length;
      let changed = false;
      if (finishedPlayers.length > 0 && this.finishWindowEndsAtMs <= 0) {
        const firstFinishAtMs = Math.min(...finishedPlayers.map((session) => Number(session.finishedAtMs || now)));
        const raceStartedAtMs = Number(this.raceStartedAtMs || 0) || firstFinishAtMs;
        const finishWindowMs = resolveSingularityRaceFinishWindowMs(Math.max(0, firstFinishAtMs - raceStartedAtMs));
        this.finishWindowStartedAtMs = firstFinishAtMs;
        this.finishWindowEndsAtMs = firstFinishAtMs + finishWindowMs;
        this.safeSetAlarm(this.finishWindowEndsAtMs + 25);
        this.broadcast(this.serverPacket("finish_window_started", {
          firstFinishAtMs,
          finishWindowStartedAtMs: this.finishWindowStartedAtMs,
          raceStartedAtMs,
          finishWindowMs,
          finishWindowDurationMs: finishWindowMs,
          finishWindowEndsAtMs: this.finishWindowEndsAtMs,
          finishedCount: finishedPlayers.length,
          playerCount: players.length,
          serverOwned: true
        }));
        changed = true;
      }
      const finishWindowExpired = this.finishWindowEndsAtMs > 0 && now >= this.finishWindowEndsAtMs;
      if (finishWindowExpired) {
        this.phase = "finished";
        this.countdownEndsAtMs = 0;
        this.entryOpen = ENTRY_OPEN_DEFAULT;
        if (!this.resultSnapshot) {
          this.resultSnapshot = createRoomResultSnapshot(this, now);
          this.resultFinalizedAtMs = now;
        }
        if (shouldAutoLifecycleRoom(this)) this.roomStatus = "results_finalized";
        this.clearServerTick();
        if (shouldAutoLifecycleRoom(this)) this.safeSetAlarm(now + USER_ROOM_RESULT_CLOSE_MS + 25);
        else this.safeDeleteAlarm();
        this.broadcast(this.serverPacket("race_finished", {
          finishedAtMs: now,
          reason: allFinished ? "all_finished" : "finish_window_expired",
          finishWindowEndsAtMs: this.finishWindowEndsAtMs,
          finishedCount: finishedPlayers.length,
          playerCount: players.length,
          resultSnapshot: this.resultSnapshot,
          resultFinalizedAtMs: this.resultFinalizedAtMs,
          serverOwned: true
        }));
        return true;
      }
      return changed;
    }
    return false;
  }

  async loadRoomState() {
    if (this.roomStateLoaded) return;
    const stored = await this.safeStorageGet([
      "roomId",
      "roomCode",
      "roomKind",
      "roomName",
      "hostToken",
      "hostClientId",
      "roomStatus",
      "createdAtMs",
      "lastActivityAtMs",
      "resultSnapshot",
      "resultFinalizedAtMs",
      "closedAtMs",
      "deleteAfterMs",
      "phase",
      "countdownEndsAtMs",
      "raceStartedAtMs",
      "finishWindowStartedAtMs",
      "finishWindowEndsAtMs",
      "entryOpen",
      "roomActive",
      "mapId"
    ]);
    const incomingRoomId = this.roomId;
    const storedRoomId = normalizeRoomId(stored.get("roomId") || incomingRoomId);
    this.roomId = isUserRoomId(incomingRoomId) ? incomingRoomId : storedRoomId;
    this.roomCode = cleanText(stored.get("roomCode") || roomCodeFromRoomId(this.roomId), USER_ROOM_CODE_LENGTH);
    this.roomKind = stored.get("roomKind") === "user" || isUserRoomId(this.roomId) ? "user" : "public";
    this.roomName = cleanText(stored.get("roomName") || defaultRoomNameFor(this.roomId), 64) || defaultRoomNameFor(this.roomId);
    this.hostToken = cleanText(stored.get("hostToken"), 96);
    this.hostClientId = normalizeClientId(stored.get("hostClientId"));
    this.roomStatus = sanitizeRoomStatus(stored.get("roomStatus"));
    this.createdAtMs = Number(stored.get("createdAtMs") || 0);
    this.lastActivityAtMs = Number(stored.get("lastActivityAtMs") || 0);
    this.resultSnapshot = normalizeResultSnapshot(stored.get("resultSnapshot"));
    this.resultFinalizedAtMs = Number(stored.get("resultFinalizedAtMs") || this.resultSnapshot?.finishedAtMs || 0);
    this.closedAtMs = Number(stored.get("closedAtMs") || 0);
    this.deleteAfterMs = Number(stored.get("deleteAfterMs") || 0);
    this.phase = sanitizePhase(stored.get("phase"));
    this.countdownEndsAtMs = Number(stored.get("countdownEndsAtMs") || 0);
    this.raceStartedAtMs = Number(stored.get("raceStartedAtMs") || 0);
    this.finishWindowStartedAtMs = Number(stored.get("finishWindowStartedAtMs") || 0);
    this.finishWindowEndsAtMs = Number(stored.get("finishWindowEndsAtMs") || 0);
    this.entryOpen = stored.has("entryOpen") ? stored.get("entryOpen") !== false : ENTRY_OPEN_DEFAULT;
    this.roomActive = stored.has("roomActive") ? stored.get("roomActive") !== false : ROOM_ACTIVE_DEFAULT;
    this.mapId = normalizeRestoredMarathonTrailMapId(stored.get("mapId") || PUBLIC_MAP_ID);
    if (!this.createdAtMs && this.roomActive !== false) this.createdAtMs = Date.now();
    if (!this.lastActivityAtMs && this.roomActive !== false) this.lastActivityAtMs = this.createdAtMs || Date.now();
    if (!this.roomActive && this.roomStatus !== "closed" && this.roomStatus !== "deleted") {
      this.phase = "lobby";
      this.countdownEndsAtMs = 0;
      this.raceStartedAtMs = 0;
      this.finishWindowStartedAtMs = 0;
      this.finishWindowEndsAtMs = 0;
      this.entryOpen = ENTRY_OPEN_DEFAULT;
      await this.persistRoomState();
      await this.safeDeleteAlarm();
    } else if (this.roomStatus === "closed" && this.resultSnapshot) {
      this.phase = "finished";
      if (this.deleteAfterMs > Date.now()) this.safeSetAlarm(this.deleteAfterMs + 25);
    } else if (this.sessions.size === 0 && this.phase !== "lobby" && !this.resultSnapshot) {
      this.phase = "lobby";
      this.countdownEndsAtMs = 0;
      this.raceStartedAtMs = 0;
      this.finishWindowStartedAtMs = 0;
      this.finishWindowEndsAtMs = 0;
      this.entryOpen = ENTRY_OPEN_DEFAULT;
      await this.persistRoomState();
      await this.safeDeleteAlarm();
    }
    this.roomStateLoaded = true;
    if (this.phase === "countdown" && this.countdownEndsAtMs > Date.now()) this.scheduleCountdownTimer();
    if (this.phase === "racing") this.scheduleServerTick();
    if (this.phase === "racing" && this.finishWindowEndsAtMs > Date.now()) this.safeSetAlarm(this.finishWindowEndsAtMs + 25);
    if (shouldAutoLifecycleRoom(this) && this.roomStatus === "results_finalized" && this.resultFinalizedAtMs > 0) this.safeSetAlarm(this.resultFinalizedAtMs + USER_ROOM_RESULT_CLOSE_MS + 25);
    if (shouldAutoLifecycleRoom(this) && this.roomStatus === "closed" && this.deleteAfterMs > Date.now()) this.safeSetAlarm(this.deleteAfterMs + 25);
  }

  async persistRoomState() {
    await this.safeStoragePut({
      roomId: this.roomId,
      roomCode: this.roomCode,
      roomKind: this.roomKind,
      roomName: this.roomName,
      hostToken: this.hostToken,
      hostClientId: this.hostClientId,
      roomStatus: this.roomStatus,
      createdAtMs: this.createdAtMs,
      lastActivityAtMs: this.lastActivityAtMs,
      resultSnapshot: this.resultSnapshot,
      resultFinalizedAtMs: this.resultFinalizedAtMs,
      closedAtMs: this.closedAtMs,
      deleteAfterMs: this.deleteAfterMs,
      phase: this.phase,
      countdownEndsAtMs: this.countdownEndsAtMs,
      raceStartedAtMs: this.raceStartedAtMs,
      finishWindowStartedAtMs: this.finishWindowStartedAtMs,
      finishWindowEndsAtMs: this.finishWindowEndsAtMs,
      entryOpen: this.entryOpen,
      roomActive: this.roomActive !== false,
      mapId: this.mapId
    });
  }

  async handleAdminRequest(request, url) {
    const auth = verifyAdminRequest(request, this.env);
    if (!auth.ok) return json({ ok: false, reason: auth.reason }, auth.status);
    if (request.method === "GET" && url.pathname.endsWith("/admin/state")) {
      return json({ ...roomSummary(this), admin: true });
    }
    if (request.method !== "POST") return json({ ok: false, reason: "method_not_allowed" }, 405);
    if (url.pathname.endsWith("/admin/create")) return this.handleAdminCreate();
    if (url.pathname.endsWith("/admin/deactivate")) return this.handleAdminDeactivate();
    if (url.pathname.endsWith("/admin/start")) return this.handleAdminStart();
    if (url.pathname.endsWith("/admin/open")) return this.handleAdminEntryOpen();
    if (url.pathname.endsWith("/admin/close")) return this.handleAdminEntryClose();
    if (url.pathname.endsWith("/admin/reset")) return this.handleAdminReset();
    if (url.pathname.endsWith("/admin/map")) return this.handleAdminMap(request);
    return json({ ok: false, reason: "unknown_admin_endpoint" }, 404);
  }

  async handleAdminStart() {
    if (!this.roomActive) return json({ ...roomSummary(this), ok: false, reason: "room_not_created" }, 409);
    if (this.phase !== "lobby" && this.phase !== "finished") return json({ ok: false, reason: "room_not_in_lobby", phase: this.phase }, 409);
    if (countPlayers(this) <= 0) return json({ ...roomSummary(this), ok: false, reason: "no_players" }, 409);
    if (this.entryOpen === false) return json({ ...roomSummary(this), ok: false, reason: "entry_not_open" }, 409);
    await this.startCountdown(Date.now(), { clientId: "admin:public-console" });
    return json({ ...roomSummary(this), ok: true, action: "start" });
  }

  async handleAdminCreate() {
    if (this.roomActive) return json({ ...roomSummary(this), ok: true, action: "create", alreadyActive: true });
    await this.createRoom("admin_create");
    return json({ ...roomSummary(this), ok: true, action: "create" });
  }

  async handleAdminDeactivate() {
    await this.deactivateRoom("admin_deactivate");
    return json({ ...roomSummary(this), ok: true, action: "deactivate" });
  }

  async handleAdminEntryOpen() {
    if (!this.roomActive) return json({ ...roomSummary(this), ok: false, reason: "room_not_created" }, 409);
    if (this.phase !== "lobby" && this.phase !== "finished") return json({ ok: false, reason: "race_active", phase: this.phase }, 409);
    this.phase = "lobby";
    this.countdownEndsAtMs = 0;
    this.entryOpen = true;
    await this.persistRoomState();
    await this.safeDeleteAlarm();
    this.broadcast(this.serverPacket("presence_update", { summary: roomSummary(this), serverOwned: true }));
    return json({ ...roomSummary(this), ok: true, action: "open" });
  }

  async handleAdminEntryClose() {
    if (!this.roomActive) return json({ ...roomSummary(this), ok: false, reason: "room_not_created" }, 409);
    if (this.phase !== "lobby" && this.phase !== "finished") return json({ ok: false, reason: "race_active", phase: this.phase }, 409);
    this.entryOpen = false;
    await this.persistRoomState();
    this.broadcast(this.serverPacket("presence_update", { summary: roomSummary(this), serverOwned: true }));
    return json({ ...roomSummary(this), ok: true, action: "close" });
  }

  async handleAdminReset() {
    if (!this.roomActive) return json({ ...roomSummary(this), ok: false, reason: "room_not_created" }, 409);
    await this.resetRoom("admin_reset");
    return json({ ok: true, action: "reset", ...roomSummary(this) });
  }

  async handleAdminMap(request) {
    if (this.phase !== "lobby" && this.phase !== "finished") return json({ ok: false, reason: "race_active", phase: this.phase }, 409);
    const body = await readJsonBody(request);
    this.mapId = normalizeRestoredMarathonTrailMapId(body?.mapId || urlMapId(request.url) || this.mapId);
    await this.persistRoomState();
    this.broadcast(this.serverPacket("presence_update", { summary: roomSummary(this), serverOwned: true }));
    this.broadcastSnapshot(true);
    return json({ ...roomSummary(this), ok: true, action: "map" });
  }

  async handleHostRequest(request, url) {
    if (url.pathname.endsWith("/host/create")) return this.handleHostCreate(request, url);
    const auth = verifyHostRequest(request, this);
    if (!auth.ok) return json({ ok: false, reason: auth.reason }, auth.status);
    if (request.method === "GET" && url.pathname.endsWith("/host/state")) {
      return json({ ...roomSummary(this), host: true });
    }
    if (request.method !== "POST") return json({ ok: false, reason: "method_not_allowed" }, 405);
    if (url.pathname.endsWith("/host/open")) return this.handleHostEntryOpen();
    if (url.pathname.endsWith("/host/start")) return this.handleHostStart();
    if (url.pathname.endsWith("/host/end") || url.pathname.endsWith("/host/close")) return this.handleHostEnd();
    return json({ ok: false, reason: "unknown_host_endpoint" }, 404);
  }

  async handleHostCreate(request, url) {
    const requestedRoomId = normalizeRoomId(url.searchParams.get("roomId") || this.roomId);
    if (!isUserRoomId(requestedRoomId)) return json({ ok: false, reason: "host_room_required" }, 400);
    if (this.roomActive && this.hostToken) return json({ ...roomSummary(this), ok: false, reason: "room_code_in_use" }, 409);
    const body = await readJsonBody(request);
    const hostToken = cleanText(body?.hostToken, 96);
    if (!hostToken) return json({ ok: false, reason: "host_token_required" }, 400);
    this.roomId = requestedRoomId;
    this.roomCode = cleanText(url.searchParams.get("roomCode") || body?.roomCode || roomCodeFromRoomId(requestedRoomId), USER_ROOM_CODE_LENGTH);
    this.roomKind = "user";
    this.roomName = cleanText(body?.displayName, 64) || defaultRoomNameFor(requestedRoomId);
    this.hostToken = hostToken;
    this.hostClientId = normalizeClientId(body?.hostClientId);
    await this.createRoom("host_create");
    return json({ ...roomSummary(this), ok: true, action: "create", host: true, hostToken: this.hostToken });
  }

  async handleHostEntryOpen() {
    if (!this.roomActive) return json({ ...roomSummary(this), ok: false, reason: "room_not_created" }, 409);
    if (this.roomKind === "user" && this.resultSnapshot) return json({ ...roomSummary(this), ok: false, reason: "results_finalized" }, 409);
    if (this.phase !== "lobby" && this.phase !== "finished") return json({ ok: false, reason: "race_active", phase: this.phase }, 409);
    this.phase = "lobby";
    this.countdownEndsAtMs = 0;
    this.entryOpen = true;
    await this.persistRoomState();
    await this.safeDeleteAlarm();
    this.broadcast(this.serverPacket("presence_update", { summary: roomSummary(this), serverOwned: true, hostOwned: true }));
    return json({ ...roomSummary(this), ok: true, action: "open", host: true });
  }

  async handleHostStart() {
    if (!this.roomActive) return json({ ...roomSummary(this), ok: false, reason: "room_not_created" }, 409);
    if (this.roomKind === "user" && this.resultSnapshot) return json({ ...roomSummary(this), ok: false, reason: "results_finalized" }, 409);
    if (this.phase !== "lobby" && this.phase !== "finished") return json({ ok: false, reason: "room_not_in_lobby", phase: this.phase }, 409);
    if (countPlayers(this) <= 0) return json({ ...roomSummary(this), ok: false, reason: "no_players" }, 409);
    if (this.entryOpen === false) return json({ ...roomSummary(this), ok: false, reason: "entry_not_open" }, 409);
    await this.startCountdown(Date.now(), { clientId: `host:${this.roomCode || "room"}` });
    return json({ ...roomSummary(this), ok: true, action: "start", host: true });
  }

  async handleHostEnd() {
    this.markRoomClosed("host_closed_room", Date.now());
    await this.persistRoomState();
    return json({ ...roomSummary(this), ok: true, action: "end", host: true });
  }

  async handleCreateUserRoomRequest(request, url) {
    if (this.roomId !== ROOM_ID) return json({ ok: false, reason: "room_registry_required" }, 400);
    if (request.method !== "POST") return json({ ok: false, reason: "method_not_allowed" }, 405);
    const body = await readJsonBody(request);
    const now = Date.now();
    await this.loadUserRoomRegistry();
    await this.refreshUserRoomRegistry(url, now);
    const clientKey = createRoomCreateClientKey(request, body);
    const retryAtMs = Number(this.roomCreateCooldowns[clientKey] || 0);
    if (retryAtMs > now) {
      return json({
        ok: false,
        reason: "room_create_cooldown",
        retryAfterMs: retryAtMs - now
      }, 429);
    }
    const activeUserRooms = countActiveUserRoomRegistry(this.userRoomRegistry);
    if (activeUserRooms >= USER_ROOM_MAX_ACTIVE) {
      return json({
        ok: false,
        reason: "user_room_limit",
        activeUserRooms,
        maxUserRooms: USER_ROOM_MAX_ACTIVE
      }, 429);
    }
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const roomCode = generateShortRoomCode();
      const roomId = roomIdFromCode(roomCode);
      const hostToken = generateHostToken();
      const createUrl = new URL(`${url.origin}/host/create`);
      createUrl.searchParams.set("roomId", roomId);
      createUrl.searchParams.set("roomCode", roomCode);
      const response = await roomStub(this.env, roomId).fetch(new Request(createUrl.toString(), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roomId,
          roomCode,
          hostToken,
          hostClientId: body?.hostClientId || "",
          displayName: body?.displayName || defaultRoomNameFor(roomId)
        })
      }));
      const payload = await response.json().catch(() => null);
      if (response.status === 409 && payload?.reason === "room_code_in_use") continue;
      if (!response.ok || !payload?.ok) return json(payload || { ok: false, reason: `create_${response.status}` }, response.status);
      this.roomCreateCooldowns[clientKey] = now + USER_ROOM_CREATE_COOLDOWN_MS;
      this.userRoomRegistry = upsertUserRoomRegistry(this.userRoomRegistry, {
        roomId,
        roomCode,
        hostClientId: normalizeClientId(body?.hostClientId),
        roomStatus: "open",
        roomActive: true,
        createdAtMs: now,
        lastSeenAtMs: now,
        closedAtMs: 0,
        deleteAfterMs: 0
      });
      await this.saveUserRoomRegistry(now);
      return json({
        ...payload,
        hostToken,
        roomUrl: `${url.origin}/ws?roomId=${encodeURIComponent(roomId)}`,
        activeUserRooms: activeUserRooms + 1,
        maxUserRooms: USER_ROOM_MAX_ACTIVE,
        createCooldownMs: USER_ROOM_CREATE_COOLDOWN_MS
      }, response.status);
    }
    return json({ ok: false, reason: "room_code_collision" }, 409);
  }

  async loadUserRoomRegistry() {
    if (this.registryLoaded) return;
    const stored = await this.safeStorageGet(["userRoomRegistry", "roomCreateCooldowns"]);
    this.userRoomRegistry = normalizeUserRoomRegistry(stored.get("userRoomRegistry"));
    this.roomCreateCooldowns = normalizeCooldownRegistry(stored.get("roomCreateCooldowns"));
    this.registryLoaded = true;
  }

  async saveUserRoomRegistry(now = Date.now()) {
    this.userRoomRegistry = normalizeUserRoomRegistry(this.userRoomRegistry);
    this.roomCreateCooldowns = pruneCooldownRegistry(this.roomCreateCooldowns, now);
    await this.safeStoragePut({
      userRoomRegistry: this.userRoomRegistry,
      roomCreateCooldowns: this.roomCreateCooldowns
    });
  }

  async refreshUserRoomRegistry(url, now = Date.now()) {
    const refreshed = [];
    for (const record of normalizeUserRoomRegistry(this.userRoomRegistry)) {
      const roomId = normalizeRoomId(record.roomId || record.roomCode);
      if (!isUserRoomId(roomId)) continue;
      let nextRecord = { ...record, roomId, roomCode: roomCodeFromRoomId(roomId) };
      try {
        const response = await roomStub(this.env, roomId).fetch(new Request(`${url.origin}/summary?roomId=${encodeURIComponent(roomId)}`));
        const summary = await response.json().catch(() => null);
        if (!response.ok || !summary?.ok || summary.roomStatus === "deleted") continue;
        nextRecord = {
          ...nextRecord,
          roomStatus: summary.roomStatus || (summary.roomActive === false ? "closed" : "open"),
          roomActive: summary.roomActive !== false,
          closedAtMs: Number(summary.closedAtMs || 0),
          deleteAfterMs: Number(summary.deleteAfterMs || 0),
          lastSeenAtMs: now
        };
      } catch {
        if (now - Number(record.lastSeenAtMs || record.createdAtMs || 0) > USER_ROOM_UNSTARTED_DELETE_MS) continue;
      }
      if (nextRecord.roomStatus === "deleted") continue;
      refreshed.push(nextRecord);
    }
    this.userRoomRegistry = refreshed.slice(-USER_ROOM_MAX_ACTIVE * 2);
    await this.saveUserRoomRegistry(now);
  }

  async safeStorageGet(keys) {
    if (!this.storageAvailable) return new Map();
    try {
      return await this.state.storage.get(keys);
    } catch (error) {
      this.storageAvailable = false;
      console.warn("storage_read_unavailable", error?.message || error);
      return new Map();
    }
  }

  async safeStoragePut(value) {
    if (!this.storageAvailable) return false;
    try {
      await this.state.storage.put(value);
      return true;
    } catch (error) {
      this.storageAvailable = false;
      console.warn("storage_write_unavailable", error?.message || error);
      return false;
    }
  }

  async safeSetAlarm(whenMs) {
    if (!this.storageAvailable) return false;
    try {
      await this.state.storage.setAlarm(whenMs);
      return true;
    } catch (error) {
      this.storageAvailable = false;
      console.warn("storage_alarm_unavailable", error?.message || error);
      return false;
    }
  }

  async safeDeleteAlarm() {
    if (!this.storageAvailable) return false;
    try {
      await this.state.storage.deleteAlarm();
      return true;
    } catch (error) {
      this.storageAvailable = false;
      console.warn("storage_delete_alarm_unavailable", error?.message || error);
      return false;
    }
  }

  scheduleCountdownTimer() {
    if (this.countdownTimer || this.countdownEndsAtMs <= Date.now()) return;
    const delayMs = Math.max(25, this.countdownEndsAtMs - Date.now() + 25);
    this.countdownTimer = setTimeout(async () => {
      this.countdownTimer = null;
      await this.refreshRuntime(Date.now());
      this.broadcastSnapshot(true);
    }, delayMs);
  }

  scheduleServerTick() {
    if (this.serverTickTimer || !canAdvancePlayerMovement(this)) return;
    this.serverTickTimer = setTimeout(async () => {
      this.serverTickTimer = null;
      try {
        const now = Date.now();
        const advanced = this.advanceRaceTick(now);
        const phaseChanged = await this.refreshRuntime(now);
        this.broadcastSnapshot(Boolean(phaseChanged));
        if (canAdvancePlayerMovement(this) && this.hasFreshRaceInput(Date.now())) this.scheduleServerTick();
      } catch (error) {
        console.error("server_tick_failed", error?.message || error);
        if (canAdvancePlayerMovement(this)) this.scheduleServerTick();
      }
    }, SERVER_TICK_INTERVAL_MS);
  }

  clearServerTick() {
    if (!this.serverTickTimer) return;
    clearTimeout(this.serverTickTimer);
    this.serverTickTimer = null;
  }

  advanceRaceTick(now) {
    if (!canAdvancePlayerMovement(this)) return false;
    let advanced = false;
    for (const session of playerSessions(this)) {
      const moved = advanceSession(session, now, this.phase, this.mapId, { entryOpen: this.entryOpen });
      advanced = moved || advanced;
      this.sessions.set(session.clientId, session);
    }
    if (advanced) this.serializeAttachedSessions();
    return advanced;
  }

  hasFreshRaceInput(now) {
    return playerSessions(this).some((session) => (
      session.finishedAtMs === null
      && Number(session.lastInputReceivedAtMs || 0) > 0
      && now - Number(session.lastInputReceivedAtMs || 0) <= INPUT_STALE_MS
    ));
  }

  serializeAttachedSessions() {
    for (const socket of this.state.getWebSockets?.() || []) {
      const session = this.getSession(socket);
      if (session?.clientId) socket.serializeAttachment?.(session);
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
  if (request.method === "OPTIONS") return corsPreflight();
  if (url.pathname === "/health") return json({ ok: true, version: WORKER_VERSION, roomId: ROOM_ID });
  if (url.pathname === "/rooms/create") return roomStub(env, ROOM_ID).fetch(request);
  if (url.pathname.startsWith("/rooms/host/")) return handleRoomHostRoute(request, env, url);
  if (url.pathname === "/rooms") {
    const targetRoomId = normalizeRoomId(url.searchParams.get("roomId") || url.searchParams.get("roomCode") || ROOM_ID);
    return roomStub(env, targetRoomId).fetch(new Request(`${url.origin}/summary?roomId=${encodeURIComponent(targetRoomId)}`));
  }
  if (url.pathname === "/ws") return roomStub(env, normalizeRoomId(url.searchParams.get("roomId") || ROOM_ID)).fetch(request);
  if (url.pathname.startsWith("/admin/")) return roomStub(env, normalizeRoomId(url.searchParams.get("roomId") || ROOM_ID)).fetch(request);
  return json({ ok: true, service: "singularity-race-online", endpoints: ["/health", "/rooms", "/rooms/create", "/rooms/host/open", "/rooms/host/start", "/rooms/host/end", "/ws"] });
}

async function handleRoomHostRoute(request, env, url) {
  const bodyText = request.method === "GET" ? "" : await request.text().catch(() => "");
  const body = bodyText ? parseJsonText(bodyText) : {};
  const targetRoomId = normalizeRoomId(body?.roomId || url.searchParams.get("roomId") || body?.roomCode || url.searchParams.get("roomCode") || ROOM_ID);
  const hostPath = url.pathname.replace(/^\/rooms\/host/, "/host");
  const hostUrl = new URL(`${url.origin}${hostPath}`);
  hostUrl.searchParams.set("roomId", targetRoomId);
  const headers = new Headers(request.headers);
  return roomStub(env, targetRoomId).fetch(new Request(hostUrl.toString(), {
    method: request.method,
    headers,
    body: bodyText || undefined
  }));
}

function roomStub(env, roomId = ROOM_ID) {
  const id = env.SINGULARITY_RACE_ROOM.idFromName(normalizeRoomId(roomId));
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
    host: Boolean(options.host),
    lane,
    joinedAtMs: options.now,
    progressPercent: START_PROGRESS,
    laneOffsetPx: laneOffsetFor(lane),
    finishedAtMs: null,
    collisionAtMs: 0,
    obstacleCollisionId: "",
    slowUntilMs: 0,
    stunnedUntilMs: 0,
    actionLockedUntilMs: 0,
    attackCooldownUntilMs: 0,
    lastAttackSequence: 0,
    characterId: "",
    skillId: "",
    rewardGrade: "",
    skillChargesRemaining: 0,
    skillCooldownUntilMs: 0,
    lastSkillSequence: 0,
    selfSkillBoostUntilMs: 0,
    skillShieldUntilMs: 0,
    effectKind: "",
    sizeScale: 1,
    lastInputAtMs: options.now,
    lastInputPayload: null,
    lastInputReceivedAtMs: 0,
    lastMovementTickAtMs: options.now,
    lastSequence: 0,
    inputWindowStartedAtMs: options.now,
    inputCount: 0,
    lastChatAtMs: 0,
    chatWindowStartedAtMs: options.now,
    chatCount: 0
  };
}

function validateParticipantJoin(room, requestedType) {
  if (room.roomStatus === "deleted") return { ok: false, reason: "room_deleted" };
  if (room.roomStatus === "closed" || room.roomStatus === "results_finalized") return { ok: false, reason: "room_closed" };
  if (room.roomActive === false) return { ok: false, reason: "room_not_created" };
  if (requestedType === "spectator") {
    if (countSpectators(room) >= MAX_SPECTATORS) return { ok: false, reason: "spectator_full" };
    return { ok: true, participantType: "spectator" };
  }
  if (room.phase !== "lobby") return { ok: false, reason: "room_join_closed" };
  if (countPlayers(room) >= MAX_RUNNERS) return { ok: false, reason: "room_full" };
  return { ok: true, participantType: "player" };
}

function participantSnapshots(room, now = Date.now()) {
  return [...room.sessions.values()].map((session) => {
    // 입력이 신선할 때만 효과를 노출한다(정지/이탈 시 거대화·자동차가 고착되지 않게).
    const effectFresh = Number(session.lastInputReceivedAtMs || 0) > 0 && now - Number(session.lastInputReceivedAtMs || 0) <= INPUT_STALE_MS;
    const skillEffectActive = Number(session.selfSkillBoostUntilMs || 0) > now || Number(session.skillShieldUntilMs || 0) > now;
    return {
      participantId: session.participantId,
      characterId: session.characterId || "",
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
      stunnedUntilMs: session.stunnedUntilMs || 0,
      actionLockedUntilMs: session.actionLockedUntilMs || 0,
      attackCooldownUntilMs: session.attackCooldownUntilMs || 0,
      lastAttackSequence: session.lastAttackSequence || 0,
      skillId: session.skillId || "",
      rewardGrade: session.rewardGrade || "",
      skillChargesRemaining: session.skillChargesRemaining || 0,
      skillCooldownUntilMs: session.skillCooldownUntilMs || 0,
      lastSkillSequence: session.lastSkillSequence || 0,
      selfSkillBoostUntilMs: session.selfSkillBoostUntilMs || 0,
      skillShieldUntilMs: session.skillShieldUntilMs || 0,
      effectKind: skillEffectActive ? (session.effectKind || "skill") : (effectFresh ? (session.effectKind || "") : ""),
      sizeScale: (skillEffectActive || effectFresh) && Number(session.sizeScale) > 0 ? round3(session.sizeScale) : 1,
      finishedAtMs: session.finishedAtMs,
      lastSequence: session.lastSequence
    };
  });
}

function finishWindowSummary(room, now = Date.now()) {
  const players = playerSessions(room);
  const finishedCount = players.filter((session) => Number(session.finishedAtMs || 0) > 0).length;
  const finishWindow = createSingularityRaceFinishWindowState({
    raceStartedAtMs: room.raceStartedAtMs,
    firstFinishAtMs: room.finishWindowStartedAtMs,
    endsAtMs: room.finishWindowEndsAtMs,
    nowMs: now
  });
  return {
    finishWindowActive: finishWindow.active,
    finishWindowDurationMs: finishWindow.durationMs,
    finishWindowRemainingMs: finishWindow.remainingMs,
    finishedCount,
    playerCount: players.length
  };
}

function joinPayload(room, session) {
  return {
    ok: true,
    roomId: room.roomId || ROOM_ID,
    roomCode: room.roomCode || roomCodeFromRoomId(room.roomId || ROOM_ID),
    roomKind: room.roomKind || (isUserRoomId(room.roomId) ? "user" : "public"),
    playerId: session.participantId,
    clientId: session.clientId,
    participantId: session.participantId,
    participantType: session.participantType,
    displayName: session.displayName,
    skinPreset: session.skinPreset,
    host: session.host,
    phase: room.phase,
    roomStatus: room.roomStatus || "open",
    entryOpen: room.entryOpen,
    roomActive: room.roomActive !== false,
    mapId: room.mapId,
    countdownEndsAtMs: room.countdownEndsAtMs,
    raceStartedAtMs: room.raceStartedAtMs,
    finishWindowStartedAtMs: room.finishWindowStartedAtMs,
    finishWindowEndsAtMs: room.finishWindowEndsAtMs,
    resultSnapshot: room.resultSnapshot,
    resultFinalizedAtMs: room.resultFinalizedAtMs,
    closedAtMs: room.closedAtMs,
    deleteAfterMs: room.deleteAfterMs,
    ...finishWindowSummary(room),
    mapVersion: "baegeum-city-v2-map-001",
    venueSchemaVersion: "venue-schema-001",
    protocolVersion: "restored-marathon-001",
    inputHz: INPUT_LIMIT_PER_SECOND,
    snapshotHz: Math.round(1000 / SNAPSHOT_INTERVAL_MS)
  };
}

function roomSummary(room) {
  const roomActive = room.roomActive !== false;
  return {
    ok: true,
    version: WORKER_VERSION,
    roomId: room.roomId || ROOM_ID,
    roomCode: room.roomCode || roomCodeFromRoomId(room.roomId || ROOM_ID),
    roomKind: room.roomKind || (isUserRoomId(room.roomId) ? "user" : "public"),
    displayName: room.roomName || defaultRoomNameFor(room.roomId || ROOM_ID),
    roomActive,
    roomStatus: room.roomStatus || "open",
    createdAtMs: room.createdAtMs || 0,
    lastActivityAtMs: room.lastActivityAtMs || 0,
    phase: room.phase,
    entryOpen: room.entryOpen,
    mapId: room.mapId,
    countdownEndsAtMs: room.countdownEndsAtMs,
    raceStartedAtMs: room.raceStartedAtMs,
    finishWindowStartedAtMs: room.finishWindowStartedAtMs,
    finishWindowEndsAtMs: room.finishWindowEndsAtMs,
    resultSnapshot: room.resultSnapshot,
    resultFinalizedAtMs: room.resultFinalizedAtMs,
    closedAtMs: room.closedAtMs || 0,
    deleteAfterMs: room.deleteAfterMs || 0,
    ...finishWindowSummary(room),
    players: roomActive ? countPlayers(room) : 0,
    maxPlayers: MAX_RUNNERS,
    spectators: roomActive ? countSpectators(room) : 0,
    maxSpectators: MAX_SPECTATORS,
    participants: roomActive ? participantSnapshots(room) : [],
    inputHz: INPUT_LIMIT_PER_SECOND,
    snapshotHz: Math.round(1000 / SNAPSHOT_INTERVAL_MS),
    minSnapshotHz: Math.round(1000 / MIN_SNAPSHOT_INTERVAL_MS)
  };
}

function recordSessionInput(session, payload, now, sequence) {
  session.lastInputPayload = normalizeInputPayload(payload);
  session.lastInputReceivedAtMs = now;
  session.lastInputAtMs = now;
  updateSessionSequence(session, sequence);
}

function updateSessionSequence(session, sequence) {
  const nextSequence = Number(sequence || 0);
  if (!Number.isFinite(nextSequence)) return;
  session.lastSequence = Math.max(Number(session.lastSequence || 0), nextSequence);
}

function normalizeInputPayload(payload = {}) {
  const input = safeObject(payload);
  const intentInput = safeObject(input.intent);
  const directionInput = safeObject(input.direction);
  const intent = input.intent && typeof input.intent === "object" ? {
    forward: round3(clampNumber(intentInput.forward, -1, 1)),
    lateral: round3(clampNumber(intentInput.lateral, -1, 1))
  } : null;
  const direction = input.direction && typeof input.direction === "object" ? {
    x: round3(clampNumber(directionInput.x, -1, 1)),
    y: round3(clampNumber(directionInput.y, -1, 1))
  } : { x: 0, y: 0 };
  const mode = cleanText(input.mode, 16);
  const pace = cleanText(input.pace || mode, 16);
  return {
    intent: intent && (intent.forward || intent.lateral) ? intent : null,
    direction,
    mode,
    pace: pace || mode,
    effect: normalizeInputEffect(input.effect)
  };
}

// 자체 가속 효과(부스터/빨간약/터보카). 클라이언트 보고값을 서버가 안전 범위로 클램프해 권위 적용한다.
function normalizeInputEffect(effect) {
  if (!effect || typeof effect !== "object") return null;
  const rawMultiplier = Number(effect.speedMultiplier);
  const speedMultiplier = Number.isFinite(rawMultiplier) ? Math.max(1, Math.min(SELF_SPEED_MULTIPLIER_CAP, rawMultiplier)) : 1;
  const rawScale = Number(effect.sizeScale);
  const sizeScale = Number.isFinite(rawScale) ? Math.max(1, Math.min(2, rawScale)) : 1;
  const knockbackImmune = Boolean(effect.knockbackImmune);
  const kind = cleanText(effect.kind, 16);
  if (speedMultiplier <= 1 && !knockbackImmune && sizeScale <= 1 && !kind) return null;
  return { speedMultiplier: round3(speedMultiplier), knockbackImmune, sizeScale: round3(sizeScale), kind };
}

function createServerSkillUse(session, packet, now) {
  const payload = safeObject(packet.payload);
  const skillId = cleanText(payload.skillId || session.skillId, 48);
  const rewardGrade = cleanText(payload.rewardGrade || payload.skillGrade || session.rewardGrade, 2).toUpperCase();
  const skill = getRestoredMarathonSkill(skillId);
  if (!skillId || !rewardGrade) return blockedServerSkillUse("no_reward", session);
  if (skill.skillId !== skillId) return blockedServerSkillUse("bad_skill", session);
  const sameReward = session.skillId === skillId && session.rewardGrade === rewardGrade;
  const chargesRemaining = sameReward && Number.isFinite(Number(session.skillChargesRemaining))
    ? Number(session.skillChargesRemaining)
    : skill.maxCharges;
  const cooldownRemainingMs = sameReward ? Math.max(0, Number(session.skillCooldownUntilMs || 0) - now) : 0;
  return createRestoredMarathonSkillUse({
    participantId: session.participantId,
    characterId: cleanText(payload.characterId || session.characterId, 64),
    skillId,
    grade: rewardGrade,
    chargesRemaining,
    cooldownRemainingMs
  });
}

function blockedServerSkillUse(reason, session) {
  return {
    allowed: false,
    reason,
    participantId: session.participantId,
    characterId: session.characterId || "",
    skillId: session.skillId || "",
    grade: session.rewardGrade || "",
    consumesCharge: false,
    movementStallMs: 0,
    payload: { target: "self", radiusMeters: 0, rangeMeters: 0, durationSeconds: 0 }
  };
}

function findServerSkillTargets(room, casterSession, requestedTargetId, use) {
  const targetKind = use.payload?.target || "self";
  if (targetKind === "self") return [];
  const candidates = playerSessions(room)
    .filter((session) => session.participantId !== casterSession.participantId && session.finishedAtMs === null)
    .map((session) => ({
      session,
      distance: serverSkillDistance(casterSession, session)
    }))
    .sort((left, right) => left.distance - right.distance);
  if (targetKind === "global") return candidates.map((entry) => entry.session);
  const range = serverSkillProgressRange(use.skillId);
  const requested = requestedTargetId
    ? candidates.find((entry) => entry.session.participantId === requestedTargetId)
    : null;
  if (requested && requested.distance <= range) return [requested.session];
  return candidates.filter((entry) => entry.distance <= range).slice(0, targetKind === "trail" ? 2 : 1).map((entry) => entry.session);
}

function applyServerSkillEffects(casterSession, targetSessions, use, now) {
  const targetKind = use.payload?.target || "self";
  const targetIds = [];
  if (targetKind === "self") {
    applyServerSelfSkillEffect(casterSession, use, now);
    return { hit: true, targetIds };
  }
  if (use.skillId === "skill:stamina-sip") applyServerSelfSkillEffect(casterSession, use, now);
  for (const target of targetSessions) {
    applyServerTargetSkillEffect(casterSession, target, use, now);
    targetIds.push(target.participantId);
  }
  return { hit: targetIds.length > 0, targetIds };
}

function applyServerSelfSkillEffect(session, use, now) {
  session.effectKind = "skill";
  session.sizeScale = use.skillId === "skill:guard-roll" ? 1.08 : 1.04;
  if (use.skillId === "skill:checkpoint-hop") {
    session.progressPercent = clampNumber(Number(session.progressPercent || START_PROGRESS) + SERVER_SKILL_CHECKPOINT_HOP_PROGRESS, RAIL_MIN_PROGRESS, 100);
    return;
  }
  if (use.skillId === "skill:guard-roll") session.skillShieldUntilMs = Math.max(Number(session.skillShieldUntilMs || 0), now + SERVER_SKILL_SELF_BOOST_MS);
  session.selfSkillBoostUntilMs = Math.max(Number(session.selfSkillBoostUntilMs || 0), now + SERVER_SKILL_SELF_BOOST_MS);
}

function applyServerTargetSkillEffect(casterSession, targetSession, use, now) {
  const durationMs = Math.max(SERVER_SKILL_SLOW_MS, Number(use.payload?.durationSeconds || 0) * 1000);
  const casterLane = Number(casterSession.laneOffsetPx || 0);
  const targetLane = Number(targetSession.laneOffsetPx || 0);
  const pushDirection = targetLane >= casterLane ? 1 : -1;
  if (use.skillId === "skill:side-bump" || use.skillId === "skill:input-scramble" || use.skillId === "skill:noise-burst") {
    targetSession.laneOffsetPx = clampNumber(targetLane + pushDirection * SERVER_SKILL_LANE_PUSH_PX, -START_LANE_HALF_WIDTH_PX, START_LANE_HALF_WIDTH_PX);
    targetSession.stunnedUntilMs = Math.max(Number(targetSession.stunnedUntilMs || 0), now + SERVER_SKILL_STUN_MS);
  }
  targetSession.slowUntilMs = Math.max(Number(targetSession.slowUntilMs || 0), now + durationMs);
  targetSession.collisionAtMs = now;
  targetSession.effectKind = "skill-hit";
  targetSession.sizeScale = 1;
}

function serverSkillDistance(casterSession, targetSession) {
  const progressDistance = Math.abs(Number(targetSession.progressPercent || 0) - Number(casterSession.progressPercent || 0));
  const laneDistance = Math.abs(Number(targetSession.laneOffsetPx || 0) - Number(casterSession.laneOffsetPx || 0)) / BASIC_ATTACK_LANE_TO_PROGRESS;
  return Math.hypot(progressDistance, laneDistance);
}

function serverSkillProgressRange(skillId) {
  if (skillId === "skill:input-scramble") return 4.5;
  if (skillId === "skill:stamina-sip") return 3.6;
  if (skillId === "skill:side-bump") return 3.2;
  if (skillId === "skill:slip-trail") return 2.8;
  return 2.4;
}

function createServerBasicAttackAction(session, packet, sequence, mapId = PUBLIC_MAP_ID) {
  return createRestoredMarathonAttackAction({
    attackerId: session.participantId,
    sequence,
    origin: serverAttackPosition(session),
    aim: normalizeAttackAim(packet.payload?.aim, session, mapId),
    rangeMeters: BASIC_ATTACK_RANGE_PROGRESS,
    arcDegrees: BASIC_ATTACK_ARC_DEGREES,
    selfStallMs: BASIC_ATTACK_STALL_MS,
    cooldownMs: BASIC_ATTACK_COOLDOWN_MS,
    stunMs: BASIC_ATTACK_STUN_MS,
    damage: 0
  });
}

function findServerBasicAttackTarget(room, action, attackerId) {
  return playerSessions(room)
    .filter((session) => session.participantId !== attackerId && session.finishedAtMs === null)
    .map((session) => ({
      session,
      hit: resolveRestoredMarathonAttackHit(action, {
        runnerId: session.participantId,
        position: serverAttackPosition(session),
        hp: 100,
        maxHp: 100
      })
    }))
    .filter((entry) => entry.hit.hit)
    .sort((left, right) => left.hit.distanceMeters - right.hit.distanceMeters)[0] || null;
}

function serverAttackPosition(session) {
  return {
    x: round2(Number(session.progressPercent || START_PROGRESS)),
    y: round2(Number(session.laneOffsetPx || 0) / BASIC_ATTACK_LANE_TO_PROGRESS)
  };
}

function normalizeAttackAim(aimInput = {}, session = null, mapId = PUBLIC_MAP_ID) {
  const aim = safeObject(aimInput);
  const x = clampNumber(aim.x ?? fallbackAimX(session, mapId), -1, 1);
  const y = clampNumber(aim.y ?? 0, -1, 1);
  if (Math.hypot(x, y) > 0.001) return { x, y };
  return { x: fallbackAimX(session, mapId), y: 0 };
}

function fallbackAimX(session = null, mapId = PUBLIC_MAP_ID) {
  const lastInputPayload = session?.lastInputPayload || null;
  const progressPercent = Number(session?.progressPercent || START_PROGRESS);
  const trailPoint = progressToRestoredMarathonTrailPoint(progressPercent, mapId);
  const movement = resolveSingularityRaceInputMovement(lastInputPayload || {}, trailPoint);
  const forward = Number(movement.forward || 0);
  if (Math.abs(forward) > 0.001) return forward < 0 ? -1 : 1;
  return 1;
}

function advanceSession(session, now, phase, mapId = PUBLIC_MAP_ID, options = {}) {
  const racing = phase === "racing";
  const staging = isPaddockMovementOpen(phase, options.entryOpen);
  if ((!racing && !staging) || session.finishedAtMs !== null) {
    session.lastMovementTickAtMs = now;
    return false;
  }
  const previousProgress = Number(session.progressPercent || START_PROGRESS);
  const previousLaneOffsetPx = Number(session.laneOffsetPx || 0);
  const previousCollisionAtMs = Number(session.collisionAtMs || 0);
  const elapsedSeconds = Math.max(0, Math.min(0.25, (now - Number(session.lastMovementTickAtMs || now)) / 1000));
  session.lastMovementTickAtMs = now;
  if (Number(session.stunnedUntilMs || 0) > now) {
    session.effectKind = "";
    session.sizeScale = 1;
    return false;
  }
  const inputReceivedAtMs = Number(session.lastInputReceivedAtMs || 0);
  const payload = inputReceivedAtMs > 0 && now - inputReceivedAtMs <= INPUT_STALE_MS ? session.lastInputPayload : null;
  if (!payload || elapsedSeconds <= 0) return false;
  const progressPercent = Number(session.progressPercent || START_PROGRESS);
  const trailPoint = progressToRestoredMarathonTrailPoint(progressPercent, mapId);
  const movement = resolveSingularityRaceInputMovement(payload, trailPoint);
  const forwardFactor = racing ? scaleBackwardForward(movement.forward) : Number(movement.forward || 0);
  const pace = payload.pace || payload.mode;
  const speedScale = calculateRestoredMarathonSpeedScale(trailPoint.tangent);
  const slowFactor = racing && Number(session.slowUntilMs || 0) > now ? 0.48 : 1;
  // 자체 가속 효과: 경기 중에만 적용. 클램프는 normalizeInputEffect에서 이미 처리됨.
  const effect = racing ? payload.effect : null;
  const skillBoostActive = racing && Number(session.selfSkillBoostUntilMs || 0) > now;
  const skillShieldActive = racing && Number(session.skillShieldUntilMs || 0) > now;
  const inputEffectMultiplier = effect ? Math.max(1, Math.min(SELF_SPEED_MULTIPLIER_CAP, Number(effect.speedMultiplier) || 1)) : 1;
  const skillEffectMultiplier = skillBoostActive ? SERVER_SKILL_SELF_BOOST_MULTIPLIER : 1;
  const effectMultiplier = Math.min(SELF_SPEED_MULTIPLIER_CAP, inputEffectMultiplier * skillEffectMultiplier);
  const knockbackImmune = Boolean(effect && effect.knockbackImmune) || skillShieldActive;
  session.effectKind = skillBoostActive || skillShieldActive ? "skill" : (effect ? (effect.kind || "") : "");
  session.sizeScale = skillShieldActive ? 1.08 : (effect ? (Number(effect.sizeScale) || 1) : 1);
  const progressDelta = paceSpeed(pace, staging) * forwardFactor * speedScale * slowFactor * effectMultiplier * elapsedSeconds;
  const laneSpeed = LANE_SPEED_PX_PER_SECOND;
  const minProgress = racing ? RAIL_MIN_PROGRESS : START_PADDOCK_MIN_PROGRESS;
  const maxProgress = racing ? 100 : START_PADDOCK_MAX_PROGRESS;
  const laneBoundary = resolveSingularityRaceLaneBoundary(
    session.laneOffsetPx,
    Number(movement.lateral || 0) * laneSpeed * elapsedSeconds,
    START_LANE_HALF_WIDTH_PX
  );
  const intendedProgress = clampNumber(progressPercent + progressDelta, minProgress, maxProgress);
  const obstacle = resolveSingularityRaceObstacleCollision({
    progress: intendedProgress,
    laneOffsetPx: laneBoundary.laneOffsetPx,
    collisionAtMs: Number(session.collisionAtMs || 0),
    slowUntilMs: Number(session.slowUntilMs || 0)
  }, {
    mapId,
    laneHalfWidthPx: START_LANE_HALF_WIDTH_PX,
    minProgress,
    maxProgress,
    nowMs: now,
    raceStarted: racing
  });
  // 거대화/자동차 중이거나 부서지는 보상 상자(crate/energy)는 넉백·감속 없이 통과시킨다.
  // 보상(자동차/에너지) 자체는 클라이언트가 효과로 보고하므로 서버는 통행만 허용한다.
  const passThrough = knockbackImmune || (obstacle.collided && isBreakableObstacleKind(obstacle.obstacle.kind));
  if (passThrough) {
    session.progressPercent = intendedProgress;
    session.laneOffsetPx = laneBoundary.laneOffsetPx;
  } else {
    session.progressPercent = obstacle.runner.progress;
    session.laneOffsetPx = obstacle.runner.laneOffsetPx;
    if (obstacle.collided) {
      session.collisionAtMs = now;
      session.obstacleCollisionId = obstacle.obstacle.id;
      session.slowUntilMs = obstacle.runner.slowUntilMs || session.slowUntilMs || 0;
    }
  }
  if (session.progressPercent >= 100 && session.finishedAtMs === null) session.finishedAtMs = now;
  return session.finishedAtMs !== null
    || Math.abs(Number(session.progressPercent || START_PROGRESS) - previousProgress) > 0.0001
    || Math.abs(Number(session.laneOffsetPx || 0) - previousLaneOffsetPx) > 0.05
    || Number(session.collisionAtMs || 0) !== previousCollisionAtMs;
}

function acceptInput(session, now) {
  if (!Number.isFinite(Number(session.inputWindowStartedAtMs))) session.inputWindowStartedAtMs = now;
  if (!Number.isFinite(Number(session.inputCount))) session.inputCount = 0;
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

function canAdvancePlayerMovement(room) { return room.roomActive !== false && (room.phase === "racing" || isPaddockMovementOpen(room.phase, room.entryOpen)); }
function canAttackInPhase(phase, entryOpen) { return phase === "racing" || isPaddockMovementOpen(phase, entryOpen); }
function isPaddockMovementOpen(phase, entryOpen) { return phase === "countdown" || (phase === "lobby" && entryOpen !== false); }
function isRoomInteractionOpen(room) { return room?.roomActive !== false && !["closed", "deleted"].includes(room?.roomStatus || "open"); }
function shouldAutoLifecycleRoom(room) { return room?.roomKind === "user" || isUserRoomId(room?.roomId); }
function playerSessions(room) { return [...room.sessions.values()].filter((item) => item.participantType === "player"); }
function countPlayers(room) { return playerSessions(room).length; }
function countSpectators(room) { return [...room.sessions.values()].filter((item) => item.participantType === "spectator").length; }
function createRoomResultSnapshot(room, now = Date.now()) {
  const raceStartedAtMs = Number(room.raceStartedAtMs || room.finishWindowStartedAtMs || now);
  const ranking = playerSessions(room)
    .slice()
    .sort((left, right) => {
      const leftFinished = Number(left.finishedAtMs || 0) > 0;
      const rightFinished = Number(right.finishedAtMs || 0) > 0;
      if (leftFinished && rightFinished) return Number(left.finishedAtMs || 0) - Number(right.finishedAtMs || 0);
      if (leftFinished) return -1;
      if (rightFinished) return 1;
      const progressDelta = Number(right.progressPercent || 0) - Number(left.progressPercent || 0);
      if (progressDelta !== 0) return progressDelta;
      return Number(left.lane || 0) - Number(right.lane || 0);
    })
    .map((session, index) => {
      const finishedAtMs = Number(session.finishedAtMs || 0);
      return {
        rank: index + 1,
        participantId: session.participantId,
        clientId: session.clientId,
        name: session.displayName,
        displayName: session.displayName,
        finishTimeMs: finishedAtMs > 0 ? Math.max(0, finishedAtMs - raceStartedAtMs) : null,
        finishedAtMs: finishedAtMs > 0 ? finishedAtMs : null,
        finished: finishedAtMs > 0,
        progressPercent: round2(session.progressPercent),
        status: finishedAtMs > 0 ? "finished" : "dnf"
      };
    });
  return {
    roomId: room.roomId || ROOM_ID,
    roomCode: room.roomCode || roomCodeFromRoomId(room.roomId || ROOM_ID),
    roomKind: room.roomKind || (isUserRoomId(room.roomId) ? "user" : "public"),
    title: "Singularity Race Results",
    finishedAtMs: now,
    finalizedAtMs: now,
    raceStartedAtMs,
    finishWindowStartedAtMs: Number(room.finishWindowStartedAtMs || 0),
    finishWindowEndsAtMs: Number(room.finishWindowEndsAtMs || 0),
    rankings: ranking,
    totalPlayers: ranking.length
  };
}
function laneOffsetFor(lane) { return ((lane - 1) / Math.max(1, MAX_RUNNERS - 1) - 0.5) * START_LANE_HALF_WIDTH_PX * 1.8; }
function paceSpeed(pace, staging = false) {
  return staging ? STAGING_RUN_PROGRESS_PER_SECOND : RUN_PROGRESS_PER_SECOND;
}
function scaleBackwardForward(forward) {
  const value = Number(forward || 0);
  if (!Number.isFinite(value) || value >= 0) return Number.isFinite(value) ? value : 0;
  return value * BACKWARD_PROGRESS_MULTIPLIER;
}
function round2(value) { return Math.round(Number(value || 0) * 100) / 100; }
function round3(value) { return Math.round(Number(value || 0) * 1000) / 1000; }
function isBreakableObstacleKind(kind) { return kind === "crate" || kind === "energy"; }
function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(min, Math.min(max, number));
}
function normalizeClientId(value) { return String(value || "").replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 80); }
function cleanText(value, max) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, max); }
function safeObject(value) { return value && typeof value === "object" ? value : {}; }
function sanitizePhase(value) { return ["lobby", "countdown", "racing", "finished"].includes(value) ? value : "lobby"; }
function sanitizeRoomStatus(value) { return ["open", "results_finalized", "closed", "deleted"].includes(value) ? value : "open"; }
function normalizeResultSnapshot(value) {
  if (!value || typeof value !== "object") return null;
  const rankings = Array.isArray(value.rankings) ? value.rankings : [];
  return {
    roomId: normalizeRoomId(value.roomId),
    roomCode: value.roomCode || roomCodeFromRoomId(value.roomId),
    roomKind: value.roomKind === "user" || isUserRoomId(value.roomId) ? "user" : "public",
    title: cleanText(value.title, 80) || "Singularity Race Results",
    finishedAtMs: Math.max(0, Number(value.finishedAtMs || value.finalizedAtMs || 0)),
    finalizedAtMs: Math.max(0, Number(value.finalizedAtMs || value.finishedAtMs || 0)),
    raceStartedAtMs: Math.max(0, Number(value.raceStartedAtMs || 0)),
    finishWindowStartedAtMs: Math.max(0, Number(value.finishWindowStartedAtMs || 0)),
    finishWindowEndsAtMs: Math.max(0, Number(value.finishWindowEndsAtMs || 0)),
    totalPlayers: Math.max(0, Number(value.totalPlayers || rankings.length || 0)),
    rankings: rankings.slice(0, MAX_RUNNERS).map((row, index) => ({
      rank: Math.max(1, Number(row.rank || index + 1)),
      participantId: cleanText(row.participantId, 96) || `runner:${index + 1}`,
      clientId: normalizeClientId(row.clientId),
      name: cleanText(row.name || row.displayName, 40) || `Runner ${index + 1}`,
      displayName: cleanText(row.displayName || row.name, 40) || `Runner ${index + 1}`,
      finishTimeMs: row.finishTimeMs === null || row.finishTimeMs === undefined ? null : Math.max(0, Number(row.finishTimeMs || 0)),
      finishedAtMs: row.finishedAtMs === null || row.finishedAtMs === undefined ? null : Math.max(0, Number(row.finishedAtMs || 0)),
      finished: row.finished !== false && (row.finished === true || row.finishTimeMs !== null && row.finishTimeMs !== undefined || row.finishedAtMs !== null && row.finishedAtMs !== undefined),
      progressPercent: round2(row.progressPercent),
      status: row.status === "finished" ? "finished" : (row.finished ? "finished" : "dnf")
    }))
  };
}
function normalizeUserRoomRegistry(value) {
  return (Array.isArray(value) ? value : []).map((record) => {
    const roomId = normalizeRoomId(record?.roomId || record?.roomCode);
    return {
      roomId,
      roomCode: roomCodeFromRoomId(roomId),
      hostClientId: normalizeClientId(record?.hostClientId),
      roomStatus: sanitizeRoomStatus(record?.roomStatus),
      roomActive: record?.roomActive !== false,
      createdAtMs: Math.max(0, Number(record?.createdAtMs || 0)),
      lastSeenAtMs: Math.max(0, Number(record?.lastSeenAtMs || 0)),
      closedAtMs: Math.max(0, Number(record?.closedAtMs || 0)),
      deleteAfterMs: Math.max(0, Number(record?.deleteAfterMs || 0))
    };
  }).filter((record) => isUserRoomId(record.roomId));
}
function normalizeCooldownRegistry(value) {
  const input = safeObject(value);
  return Object.fromEntries(Object.entries(input).map(([key, next]) => [
    cleanText(key, 140),
    Math.max(0, Number(next || 0))
  ]).filter(([key, next]) => key && next > Date.now()));
}
function pruneCooldownRegistry(value, now = Date.now()) {
  return Object.fromEntries(Object.entries(normalizeCooldownRegistry(value)).filter(([, retryAtMs]) => retryAtMs > now));
}
function countActiveUserRoomRegistry(registry) {
  return normalizeUserRoomRegistry(registry).filter((record) => record.roomActive !== false && !["closed", "deleted"].includes(record.roomStatus)).length;
}
function upsertUserRoomRegistry(registry, nextRecord) {
  const roomId = normalizeRoomId(nextRecord?.roomId || nextRecord?.roomCode);
  const rest = normalizeUserRoomRegistry(registry).filter((record) => record.roomId !== roomId);
  return [...rest, ...normalizeUserRoomRegistry([{ ...nextRecord, roomId }])];
}
function createRoomCreateClientKey(request, body = {}) {
  const clientId = normalizeClientId(body?.hostClientId);
  if (clientId) return `client:${clientId}`;
  const ip = cleanText(request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "", 80)
    .replace(/[^a-zA-Z0-9:.,_-]/g, "");
  return ip ? `ip:${ip.split(",")[0]}` : "anonymous";
}
function parsePacket(message) { try { return JSON.parse(String(message)); } catch { return null; } }
function parseJsonText(value) { try { return JSON.parse(String(value || "{}")); } catch { return {}; } }
function send(socket, packet) { socket.send(JSON.stringify(packet)); }
function json(payload, status = 200) { return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*" } }); }
function corsPreflight() { return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "authorization, content-type, x-admin-token, x-host-token" } }); }
function verifyAdminRequest(request, env) {
  const expected = String(env?.ADMIN_TOKEN || "").trim();
  if (!expected) return { ok: false, reason: "admin_token_not_configured", status: 503 };
  const bearer = String(request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const headerToken = String(request.headers.get("X-Admin-Token") || "").trim();
  const provided = bearer || headerToken;
  if (!provided || provided !== expected) return { ok: false, reason: "admin_unauthorized", status: 401 };
  return { ok: true };
}
function verifyHostRequest(request, room) {
  const bearer = String(request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const headerToken = String(request.headers.get("X-Host-Token") || "").trim();
  return verifyHostTokenValue(bearer || headerToken, room);
}
function verifyHostTokenValue(value, room) {
  const expected = String(room?.hostToken || "").trim();
  if (!expected) return { ok: false, reason: "host_token_not_configured", status: 503 };
  const provided = String(value || "").trim();
  if (!provided || provided !== expected) return { ok: false, reason: "host_unauthorized", status: 401 };
  return { ok: true };
}
function normalizeRoomCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, USER_ROOM_CODE_LENGTH);
}
function isUserRoomId(value) {
  return String(value || "").startsWith(USER_ROOM_PREFIX) && normalizeRoomCode(String(value || "").slice(USER_ROOM_PREFIX.length)).length === USER_ROOM_CODE_LENGTH;
}
function roomIdFromCode(value) {
  const code = normalizeRoomCode(value);
  return code.length === USER_ROOM_CODE_LENGTH ? `${USER_ROOM_PREFIX}${code}` : ROOM_ID;
}
function roomCodeFromRoomId(value) {
  const raw = String(value || "");
  if (!raw.startsWith(USER_ROOM_PREFIX)) return "PUBLIC";
  return normalizeRoomCode(raw.slice(USER_ROOM_PREFIX.length));
}
function normalizeRoomId(value) {
  const raw = String(value || "").trim();
  if (raw === ROOM_ID) return ROOM_ID;
  if (raw.startsWith(USER_ROOM_PREFIX)) return roomIdFromCode(raw.slice(USER_ROOM_PREFIX.length));
  const code = normalizeRoomCode(raw);
  return code.length === USER_ROOM_CODE_LENGTH ? roomIdFromCode(code) : ROOM_ID;
}
function defaultRoomNameFor(roomId) {
  return isUserRoomId(roomId) ? `User Room ${roomCodeFromRoomId(roomId)}` : ROOM_NAME;
}
function generateShortRoomCode() {
  return randomAlphabetToken(USER_ROOM_CODE_LENGTH);
}
function generateHostToken() {
  return randomAlphabetToken(HOST_TOKEN_LENGTH);
}
function randomAlphabetToken(length) {
  const bytes = new Uint8Array(Math.max(1, Number(length) || 1));
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => USER_ROOM_CODE_ALPHABET[byte % USER_ROOM_CODE_ALPHABET.length]).join("");
}
async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
function urlMapId(rawUrl) {
  try {
    return new URL(rawUrl).searchParams.get("mapId") || "";
  } catch {
    return "";
  }
}
