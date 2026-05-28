import { createRestoredMarathonChannelSet } from "./marathon-channel-adapter.js";
import { applyRestoredMarathonProviderServerPacket, canRestoredMarathonProviderSendInput, createRestoredMarathonProviderHello, createRestoredMarathonProviderJoinRequest, createRestoredMarathonProviderReconnectHello, createRestoredMarathonProviderSession } from "./marathon-server-provider-adapter.js";
import { createRestoredMarathonServerTransportSnapshot, createRestoredMarathonTransportEnvelope } from "./marathon-server-transport-contract.js";
import { validateRestoredMarathonServerRaceStateContract } from "./marathon-server-race-state.js";
import { validateRestoredMarathonServerSessionContract } from "./marathon-server-session-contract.js";
import { validateRestoredMarathonServerSkillStateContract } from "./marathon-server-skill-state.js";
import { validateRestoredMarathonServerStateContract } from "./marathon-server-state-contract.js";
import { createRestoredMarathonWebSocketDevServerMock } from "./marathon-websocket-dev-server-mock.js";

const DEFAULT_ROOM_ID = "room:singularity-race:ws-dev-001";
const DEFAULT_MAP_VERSION = "baegeum-city-v2-map-001";

export function validateRestoredMarathonWebSocketDevServerMockContract() {
  const errors = [];
  const server = createRestoredMarathonWebSocketDevServerMock({ clock: () => 1000 });
  const stateValidation = validateRestoredMarathonServerStateContract();
  const raceValidation = validateRestoredMarathonServerRaceStateContract();
  const skillValidation = validateRestoredMarathonServerSkillStateContract();
  const sessionValidation = validateRestoredMarathonServerSessionContract(createRestoredMarathonChannelSet({ roomId: DEFAULT_ROOM_ID }));
  if (!stateValidation.ok) errors.push(...stateValidation.errors);
  if (!raceValidation.ok) errors.push(...raceValidation.errors);
  if (!skillValidation.ok) errors.push(...skillValidation.errors);
  if (!sessionValidation.ok) errors.push(...sessionValidation.errors);
  const connected = server.connectClient({ clientId: "client:test" });
  if (!connected.ok || connected.transport.provider !== "websocket") errors.push("client should connect through websocket dev provider");
  if (!server.createRoomAdapter(connected.transport).online.canOpenLobby) errors.push("connected mock transport should create a lobby-capable adapter");
  const providerFlow = assertProviderFlow(server, connected, errors);
  const joined = providerFlow?.joined || server.joinRoom(connected.transport, { participantId: "runner:test", nickname: "Tester", sequence: 2, mapVersion: DEFAULT_MAP_VERSION });
  if (!joined.ok || joined.joinResult.type !== "join_result") errors.push("server mock join should return join_result");
  const started = server.startRace(connected.transport, joined.room.roomId, { serverTimeMs: 1000 });
  if (!started.ok || started.room.phase !== "racing") errors.push("server mock should start a server-owned race");
  assertServerStartPositionSeeding(errors);
  assertBotParticipantSeparation(errors);
  assertSpectatorAndChat(server, joined, errors);
  assertMovementAndAuthority(server, connected.transport, joined.room.roomId, errors);
  assertServerAttackAuthority(errors);
  assertServerCheckpointAndFinishAuthority(errors);
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function assertBotParticipantSeparation(errors) {
  const server = createRestoredMarathonWebSocketDevServerMock({ clock: () => 1000 });
  const player = server.connectClient({ clientId: "client:bot-split:player" });
  const bot = server.connectClient({ clientId: "client:bot-split:bot", role: "bot" });
  const joinedPlayer = server.joinRoom(player.transport, { participantId: "runner:player", participantType: "player", nickname: "Player", sequence: 2, mapVersion: DEFAULT_MAP_VERSION });
  const joinedBot = server.joinRoom(bot.transport, { participantId: "runner:bot-test", participantType: "bot", nickname: "Bot", sequence: 3, mapVersion: DEFAULT_MAP_VERSION });
  const botRow = joinedBot.room?.participants.find((participant) => participant.participantId === "runner:bot-test");
  if (!joinedPlayer.ok || !joinedBot.ok || botRow?.type !== "bot") errors.push("server mock should keep dev bots separate from player participants");
  const started = server.startRace(player.transport, joinedPlayer.room.roomId, { serverTimeMs: 1000 });
  const botInput = envelope("input_update", { participantId: "runner:bot-test", pace: "sprint", raceTimeMs: 1100, direction: { x: 1, y: 0 } },
    { clientId: bot.transport.clientId, roomId: joinedPlayer.room.roomId, sequence: 4 });
  const moved = server.ingestClientEnvelope(bot.transport, botInput, { receivedAtMs: 1100, elapsedMs: 1000 });
  const movedBot = moved.room?.participants.find((participant) => participant.participantId === "runner:bot-test");
  if (!started.ok || !moved.ok || movedBot?.type !== "bot" || movedBot.progressMeters <= 0) errors.push("bot input should move only through server-owned bot authority");
}

function assertProviderFlow(server, connected, errors) {
  let session = createRestoredMarathonProviderSession({ transport: connected.transport });
  const hello = createRestoredMarathonProviderHello(session, { requestedRole: "player" });
  if (!hello.ok) {
    errors.push(`provider hello should pass: ${hello.reason}`);
    return null;
  }
  const helloApplied = applyRestoredMarathonProviderServerPacket(hello.session, connected.helloResult);
  if (!helloApplied.ok) {
    errors.push(`provider hello_result should apply: ${helloApplied.reason}`);
    return null;
  }
  const joinRequest = createRestoredMarathonProviderJoinRequest(helloApplied.session, {
    roomId: DEFAULT_ROOM_ID,
    participantId: "runner:test",
    nickname: "Tester",
    mapVersion: DEFAULT_MAP_VERSION
  });
  if (!joinRequest.ok) {
    errors.push(`provider join_request should pass: ${joinRequest.reason}`);
    return null;
  }
  const joined = server.joinRoom(connected.transport, joinRequest.packet.payload);
  const joinedApplied = applyRestoredMarathonProviderServerPacket(joinRequest.session, joined.joinResult);
  if (!joined.ok || !joinedApplied.ok) {
    errors.push(`provider join_result should apply: ${joined.reason || joinedApplied.reason}`);
    return { joined };
  }
  const replay = server.replayChatHistory(connected.transport, joined.room.roomId, {});
  const historyPacket = createRestoredMarathonTransportEnvelope("chat_history", {
    serverOwned: true,
    messages: replay.messages || []
  }, { clientId: "server:ws-dev", roomId: joined.room.roomId, sequence: joined.joinResult.sequence + 1, serverTimeMs: 1000 });
  const historyApplied = applyRestoredMarathonProviderServerPacket(joinedApplied.session, historyPacket);
  const snapshot = server.createStateSnapshot(joined.room.roomId, { sequence: joined.joinResult.sequence + 2 });
  const snapshotApplied = applyRestoredMarathonProviderServerPacket(historyApplied.session, snapshot.snapshot);
  if (!historyApplied.ok || !snapshot.ok || !snapshotApplied.ok || snapshotApplied.session.step !== "snapshot_ready") {
    errors.push("provider flow should reach snapshot_ready with server replay and snapshot");
  }
  if (!canRestoredMarathonProviderSendInput(snapshotApplied.session)) errors.push("provider should unlock input after the first authoritative snapshot");
  assertProviderReconnectFlow(server, connected, joined, snapshotApplied.session, errors);
  return { joined, session: snapshotApplied.session };
}

function assertServerStartPositionSeeding(errors) {
  const server = createRestoredMarathonWebSocketDevServerMock({ clock: () => 1200, course: { distanceMeters: 900 } });
  const connected = server.connectClient({ clientId: "client:start-seed" });
  const joined = server.joinRoom(connected.transport, { participantId: "runner:you", nickname: "Seed", sequence: 2, mapVersion: DEFAULT_MAP_VERSION });
  const started = server.startRace(connected.transport, joined.room.roomId, {
    runnerPositions: [{ participantId: "runner:you", progressPercent: 7.12, laneOffsetPx: 123 }]
  });
  const snapshot = server.createStateSnapshot(joined.room.roomId, { sequence: 8 });
  const you = snapshot.snapshot?.payload.participants.find((participant) => participant.participantId === "runner:you");
  if (!started.ok || you?.progressPercent !== 7.12 || you?.laneOffsetPx !== 123) {
    errors.push("server race start should snapshot seeded paddock progress and lane immediately");
  }
}

function assertProviderReconnectFlow(server, connected, joined, session, errors) {
  const reconnect = createRestoredMarathonProviderReconnectHello(session, { resumeToken: "resume:dev:test", clientTimeMs: 1200 });
  if (!reconnect.ok) {
    errors.push(`provider reconnect hello should pass: ${reconnect.reason}`);
    return;
  }
  if (canRestoredMarathonProviderSendInput(reconnect.session)) errors.push("provider reconnect must block input before replay");
  const helloResult = createRestoredMarathonTransportEnvelope("hello_result", {
    ok: true,
    reconnected: true,
    targetClientId: connected.transport.clientId
  }, { clientId: "server:ws-dev", sequence: reconnect.session.sequence + 1, serverTimeMs: 1201 });
  const helloApplied = applyRestoredMarathonProviderServerPacket(reconnect.session, helloResult);
  if (!helloApplied.ok) {
    errors.push(`provider reconnect hello_result should apply: ${helloApplied.reason}`);
    return;
  }
  const replay = server.replayChatHistory(connected.transport, joined.room.roomId, {});
  const historyPacket = createRestoredMarathonTransportEnvelope("chat_history", {
    serverOwned: true,
    messages: replay.messages || []
  }, { clientId: "server:ws-dev", roomId: joined.room.roomId, sequence: helloResult.sequence + 1, serverTimeMs: 1202 });
  const historyApplied = applyRestoredMarathonProviderServerPacket(helloApplied.session, historyPacket);
  const snapshot = server.createStateSnapshot(joined.room.roomId, { sequence: historyPacket.sequence + 1 });
  const snapshotApplied = applyRestoredMarathonProviderServerPacket(historyApplied.session, snapshot.snapshot);
  if (!historyApplied.ok || !snapshot.ok || !snapshotApplied.ok || !canRestoredMarathonProviderSendInput(snapshotApplied.session)) {
    errors.push("provider reconnect should unlock input only after server replay and authoritative snapshot");
  }
}

function assertSpectatorAndChat(server, joined, errors) {
  const spectatorConnected = server.connectClient({ clientId: "client:spectator", role: "spectator" });
  const spectatorJoin = server.joinRoom(spectatorConnected.transport, { participantId: "spectator:test", participantType: "spectator", nickname: "Spectator", sequence: 3, mapVersion: DEFAULT_MAP_VERSION });
  if (!spectatorJoin.ok) errors.push("server mock should allow spectator mid-race join");
  const lateRunnerJoin = server.joinRoom(server.connectClient({ clientId: "client:late-runner" }).transport, { participantId: "runner:late", participantType: "player", nickname: "Late Runner", sequence: 3, mapVersion: DEFAULT_MAP_VERSION });
  if (!lateRunnerJoin.ok || lateRunnerJoin.joinResult.payload.participantType !== "spectator" || !lateRunnerJoin.joinResult.payload.convertedToSpectator) errors.push("server mock should convert late runner join into spectator join");
  const spectatorInput = envelope("input_update", { participantId: "spectator:test", pace: "push", raceTimeMs: 1000, direction: { x: 1, y: 0 } },
    { clientId: "client:spectator", roomId: joined.room.roomId, sequence: 4 });
  if (server.ingestClientEnvelope(spectatorConnected.transport, spectatorInput, { receivedAtMs: 1000, elapsedMs: 1000 }).ok) errors.push("spectator input should be blocked by session permissions");
  const roomChannel = createRestoredMarathonChannelSet({ roomId: joined.room.roomId }).find((channel) => channel.type === "room");
  const hostTransport = server.connectClient({ clientId: "client:host", role: "host", displayName: "Host" }).transport;
  const hostChat = envelope("chat_send", { messageId: "message:host:1", channelId: roomChannel.channelId, senderId: "spoofed", senderType: "player", text: "host room notice" },
    { clientId: hostTransport.clientId, roomId: joined.room.roomId, sequence: 5 });
  const delivered = server.ingestClientEnvelope(hostTransport, hostChat, { receivedAtMs: 1000 });
  if (!delivered.ok || delivered.serverEnvelope.payload.senderId === "spoofed") errors.push("server chat should ignore spoofed sender metadata");
  const replay = server.replayChatHistory(server.connectClient({ clientId: "client:spectator-replay", role: "spectator" }).transport, joined.room.roomId, { channelId: roomChannel.channelId });
  if (!replay.ok || !replay.messages.some((message) => message.text === "host room notice")) errors.push("spectator should receive server-owned room chat replay");
}

function assertMovementAndAuthority(server, transport, roomId, errors) {
  const input = envelope("input_update", { participantId: "runner:test", pace: "push", raceTimeMs: 1000, direction: { x: 1, y: 0 } },
    { clientId: transport.clientId, roomId, sequence: 4 });
  const moved = server.ingestClientEnvelope(transport, input, { receivedAtMs: 1000, elapsedMs: 1000 });
  if (!moved.ok || moved.room.participants[0].progressMeters <= 0) errors.push("server mock should apply valid client input");
  const forbidden = envelope("race_finalized", { ok: true }, { clientId: transport.clientId, roomId, sequence: 5 });
  if (server.ingestClientEnvelope(transport, forbidden, { receivedAtMs: 1000 }).ok) errors.push("client must not send server-owned finalization");
  const snapshot = server.createStateSnapshot(roomId, { sequence: 6, serverRunner: { x: 72, y: 0, progress: 2 } });
  if (!snapshot.ok) errors.push("server mock should create authoritative snapshots");
  if (!snapshot.snapshot.payload.serverOwned || !snapshot.snapshot.payload.pingSample || !snapshot.snapshot.payload.reconciliation) errors.push("snapshot should include ping and reconciliation data");
  if (!server.createPingSample({ clientSentAtMs: 1000, serverReceivedAtMs: 1030, serverSentAtMs: 1032, clientReceivedAtMs: 1062 }).serverOwned) errors.push("server mock should expose ping samples");
  if (!createSpamCheck(server, transport, roomId)) errors.push("server mock should rate-limit action packet spam");
}

function createSpamCheck(server, transport, roomId) {
  for (let sequence = 10; sequence < 50; sequence += 1) {
    const spam = envelope("input_update", { participantId: "runner:test", pace: "push", raceTimeMs: sequence },
      { clientId: transport.clientId, roomId, sequence });
    const result = server.ingestClientEnvelope(transport, spam, { receivedAtMs: 1000 });
    if (!result.ok) return result.reason === "rate_limited";
  }
  return false;
}

function assertServerAttackAuthority(errors) {
  const server = createRestoredMarathonWebSocketDevServerMock({ clock: () => 2000 });
  const a = server.connectClient({ clientId: "client:attack:a" });
  const b = server.connectClient({ clientId: "client:attack:b" });
  const joinedA = server.joinRoom(a.transport, { participantId: "runner:a", nickname: "A", sequence: 2, mapVersion: DEFAULT_MAP_VERSION });
  const joinedB = server.joinRoom(b.transport, { participantId: "runner:b", nickname: "B", sequence: 3, mapVersion: DEFAULT_MAP_VERSION });
  const started = server.startRace(a.transport, joinedA.room.roomId, { runnerPositions: [
    { participantId: "runner:a", progressPercent: 4, laneOffsetPx: 0 },
    { participantId: "runner:b", progressPercent: 5, laneOffsetPx: 0 }
  ] });
  const attack = envelope("attack_action", { attackerId: "runner:a", aim: { x: 1, y: 0 }, origin: { x: 999, y: 999 } },
    { clientId: a.transport.clientId, roomId: joinedA.room.roomId, sequence: 4 });
  const hit = server.ingestClientEnvelope(a.transport, attack, { receivedAtMs: 2000 });
  const target = hit.room?.participants.find((participant) => participant.participantId === "runner:b");
  if (!joinedB.ok || !started.ok || !hit.ok || target.hp >= 100 || target.stunnedUntilMs <= 2000) errors.push("server mock should own attack hit, stun, and damage");
  const spam = envelope("attack_action", { attackerId: "runner:a", aim: { x: 1, y: 0 } },
    { clientId: a.transport.clientId, roomId: joinedA.room.roomId, sequence: 5 });
  if (server.ingestClientEnvelope(a.transport, spam, { receivedAtMs: 2100 }).ok) errors.push("server mock should reject attack cooldown spam");
  const snapshot = server.createStateSnapshot(joinedA.room.roomId, { sequence: 6 });
  const snapshotTarget = snapshot.snapshot?.payload.participants.find((participant) => participant.participantId === "runner:b");
  if (!snapshotTarget || snapshotTarget.hp >= 100 || snapshotTarget.stunnedUntilMs <= 2000) errors.push("server snapshot should carry combat state");
}

function assertServerCheckpointAndFinishAuthority(errors) {
  const server = createRestoredMarathonWebSocketDevServerMock({ clock: () => 3000, course: { distanceMeters: 120, checkpointMeters: [0, 60, 120] } });
  const connected = server.connectClient({ clientId: "client:race:a" });
  const joined = server.joinRoom(connected.transport, { participantId: "runner:a", nickname: "A", sequence: 2, mapVersion: DEFAULT_MAP_VERSION });
  const started = server.startRace(connected.transport, joined.room.roomId, { runnerPositions: [{ participantId: "runner:a", progressMeters: 61, laneOffsetPx: 0 }] });
  const reachInput = envelope("input_update", { participantId: "runner:a", pace: "steady", raceTimeMs: 3050, direction: { x: 1, y: 0 } },
    { clientId: connected.transport.clientId, roomId: joined.room.roomId, sequence: 3 });
  server.ingestClientEnvelope(connected.transport, reachInput, { receivedAtMs: 3050, elapsedMs: 50 });
  const checkpoint = envelope("checkpoint_claim", { participantId: "runner:a", checkpointIndex: 1, raceTimeMs: 3100 },
    { clientId: connected.transport.clientId, roomId: joined.room.roomId, sequence: 4 });
  const rewarded = server.ingestClientEnvelope(connected.transport, checkpoint, { receivedAtMs: 3100 });
  if (!started.ok || !rewarded.ok || rewarded.serverEnvelope?.type !== "checkpoint_reward") errors.push("server mock should own checkpoint_reward packets");
  const duplicate = envelope("checkpoint_claim", { participantId: "runner:a", checkpointIndex: 1, raceTimeMs: 3200 },
    { clientId: connected.transport.clientId, roomId: joined.room.roomId, sequence: 5 });
  if (server.ingestClientEnvelope(connected.transport, duplicate, { receivedAtMs: 3200 }).ok) errors.push("server mock should reject duplicate checkpoint rewards");
  const finishServer = createRestoredMarathonWebSocketDevServerMock({ clock: () => 6000, course: { distanceMeters: 120, checkpointMeters: [0, 60, 120] } });
  const finisher = finishServer.connectClient({ clientId: "client:race:finisher" });
  const joinedFinisher = finishServer.joinRoom(finisher.transport, { participantId: "runner:finisher", nickname: "Finisher", sequence: 2, mapVersion: DEFAULT_MAP_VERSION });
  finishServer.startRace(finisher.transport, joinedFinisher.room.roomId, { runnerPositions: [{ participantId: "runner:finisher", progressMeters: 120, laneOffsetPx: 0 }] });
  const finish = createRestoredMarathonTransportEnvelope("finish_claim", { participantId: "runner:finisher", raceTimeMs: 6100 },
    { clientId: finisher.transport.clientId, roomId: joinedFinisher.room.roomId, sequence: 3, serverTimeMs: 6100 });
  const finalized = finishServer.ingestClientEnvelope(finisher.transport, finish, { receivedAtMs: 6100 });
  if (!finalized.ok || finalized.serverEnvelope?.type !== "race_finalized" || !finalized.serverEnvelope.payload.serverOwned) errors.push("server mock should own race_finalized packets");
}

function envelope(type, payload, options) {
  return createRestoredMarathonTransportEnvelope(type, payload, {
    serverTimeMs: 1000,
    ...options
  });
}

export function createDisconnectedRestoredMarathonDevServerSnapshot() {
  return createRestoredMarathonServerTransportSnapshot({ provider: "dev_mock", status: "expired", lastError: "validation_only" });
}
