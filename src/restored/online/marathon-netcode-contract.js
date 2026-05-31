export const RESTORED_MARATHON_NETCODE_CONTRACT_VERSION = "restored-marathon-netcode-001";

export const RESTORED_MARATHON_NETWORK_LANES = Object.freeze(["smooth", "buffered", "degraded", "critical"]);
export const RESTORED_MARATHON_RATE_LIMITED_PACKET_TYPES = Object.freeze(["input_update", "skill_use", "attack_action", "checkpoint_reward", "respawn_notice"]);
const MAX_CLOCK_MS = Number.MAX_SAFE_INTEGER;

const DEFAULT_PROFILE = Object.freeze({
  maxRunners: 30, serverTickHz: 20, inputHz: 20, snapshotHz: 10, fullSnapshotHz: 1,
  inputPacketBytes: 48, runnerDeltaBytes: 24, snapshotOverheadBytes: 64,
  maxUpstreamKbpsPerPlayer: 12, maxDownstreamKbpsPerPlayer: 96, maxServerEgressKbps: 2400,
  interpolationBaseMs: 100, jitterBufferMs: 60, highPingMs: 180,
  criticalPingMs: 320, visualMaxStepPxPerSecond: 880, visualSnapDistancePx: 520, staleSnapshotMs: 700
});

const LARGE_ROOM_PROFILE = Object.freeze({
  ...DEFAULT_PROFILE,
  maxRunners: 50,
  inputHz: 16,
  snapshotHz: 5,
  runnerDeltaBytes: 18,
  interpolationBaseMs: 130,
  jitterBufferMs: 90
});

export function createRestoredMarathonNetcodeProfile(options = {}) {
  return Object.freeze({
    maxRunners: clampInteger(options.maxRunners ?? DEFAULT_PROFILE.maxRunners, 2, 50), serverTickHz: clampInteger(options.serverTickHz ?? DEFAULT_PROFILE.serverTickHz, 10, 30),
    inputHz: clampInteger(options.inputHz ?? DEFAULT_PROFILE.inputHz, 8, 30), snapshotHz: clampInteger(options.snapshotHz ?? DEFAULT_PROFILE.snapshotHz, 4, 20),
    fullSnapshotHz: clampInteger(options.fullSnapshotHz ?? DEFAULT_PROFILE.fullSnapshotHz, 1, 2), inputPacketBytes: clampInteger(options.inputPacketBytes ?? DEFAULT_PROFILE.inputPacketBytes, 24, 96),
    runnerDeltaBytes: clampInteger(options.runnerDeltaBytes ?? DEFAULT_PROFILE.runnerDeltaBytes, 12, 48), snapshotOverheadBytes: clampInteger(options.snapshotOverheadBytes ?? DEFAULT_PROFILE.snapshotOverheadBytes, 24, 160),
    maxUpstreamKbpsPerPlayer: clampNumber(options.maxUpstreamKbpsPerPlayer ?? DEFAULT_PROFILE.maxUpstreamKbpsPerPlayer, 4, 64),
    maxDownstreamKbpsPerPlayer: clampNumber(options.maxDownstreamKbpsPerPlayer ?? DEFAULT_PROFILE.maxDownstreamKbpsPerPlayer, 24, 256),
    maxServerEgressKbps: clampNumber(options.maxServerEgressKbps ?? DEFAULT_PROFILE.maxServerEgressKbps, 300, 10000),
    interpolationBaseMs: clampInteger(options.interpolationBaseMs ?? DEFAULT_PROFILE.interpolationBaseMs, 60, 220), jitterBufferMs: clampInteger(options.jitterBufferMs ?? DEFAULT_PROFILE.jitterBufferMs, 20, 180),
    highPingMs: clampInteger(options.highPingMs ?? DEFAULT_PROFILE.highPingMs, 100, 260), criticalPingMs: clampInteger(options.criticalPingMs ?? DEFAULT_PROFILE.criticalPingMs, 220, 600),
    visualMaxStepPxPerSecond: clampNumber(options.visualMaxStepPxPerSecond ?? DEFAULT_PROFILE.visualMaxStepPxPerSecond, 240, 2000), visualSnapDistancePx: clampNumber(options.visualSnapDistancePx ?? DEFAULT_PROFILE.visualSnapDistancePx, 120, 1400),
    staleSnapshotMs: clampInteger(options.staleSnapshotMs ?? DEFAULT_PROFILE.staleSnapshotMs, 250, 2000)
  });
}

export function createRestoredMarathonLargeRoomNetcodeProfile(options = {}) {
  return createRestoredMarathonNetcodeProfile({ ...LARGE_ROOM_PROFILE, ...options });
}

export function estimateRestoredMarathonNetcodeBudget(options = {}) {
  const profile = createRestoredMarathonNetcodeProfile(options.profile);
  const runners = clampInteger(options.runnerCount ?? profile.maxRunners, 1, profile.maxRunners);
  const inputBytesPerSecond = profile.inputHz * profile.inputPacketBytes;
  const snapshotBytes = profile.snapshotOverheadBytes + runners * profile.runnerDeltaBytes;
  const downstreamBytesPerSecond = profile.snapshotHz * snapshotBytes;
  const upstreamKbpsPerPlayer = bytesToKbps(inputBytesPerSecond);
  const downstreamKbpsPerPlayer = bytesToKbps(downstreamBytesPerSecond);
  const serverIngressKbps = upstreamKbpsPerPlayer * runners;
  const serverEgressKbps = downstreamKbpsPerPlayer * runners;
  return Object.freeze({
    version: RESTORED_MARATHON_NETCODE_CONTRACT_VERSION,
    runnerCount: runners,
    inputHz: profile.inputHz,
    snapshotHz: profile.snapshotHz,
    snapshotBytes,
    upstreamKbpsPerPlayer: round2(upstreamKbpsPerPlayer),
    downstreamKbpsPerPlayer: round2(downstreamKbpsPerPlayer),
    serverIngressKbps: round2(serverIngressKbps),
    serverEgressKbps: round2(serverEgressKbps),
    withinPlayerBudget: upstreamKbpsPerPlayer <= profile.maxUpstreamKbpsPerPlayer
      && downstreamKbpsPerPlayer <= profile.maxDownstreamKbpsPerPlayer,
    withinServerBudget: serverEgressKbps <= profile.maxServerEgressKbps
  });
}

export function chooseRestoredMarathonNetworkLane(metrics = {}, profileInput = {}) {
  const profile = createRestoredMarathonNetcodeProfile(profileInput);
  const pingMs = clampNumber(metrics.pingMs ?? 0, 0, 2000);
  const jitterMs = clampNumber(metrics.jitterMs ?? 0, 0, 1000);
  const packetLossPct = clampNumber(metrics.packetLossPct ?? 0, 0, 100);
  let lane = "smooth";
  if (pingMs >= profile.criticalPingMs || jitterMs >= 120 || packetLossPct >= 6) lane = "critical";
  else if (pingMs >= profile.highPingMs || jitterMs >= 70 || packetLossPct >= 3) lane = "degraded";
  else if (pingMs >= 90 || jitterMs >= 35 || packetLossPct >= 1) lane = "buffered";
  const degrade = lane === "critical" ? 0.45 : lane === "degraded" ? 0.65 : lane === "buffered" ? 0.8 : 1;
  return Object.freeze({
    lane,
    inputHz: Math.max(8, Math.round(profile.inputHz * degrade)),
    snapshotHz: Math.max(4, Math.round(profile.snapshotHz * degrade)),
    interpolationDelayMs: Math.round(profile.interpolationBaseMs + Math.min(180, jitterMs + pingMs * 0.2)),
    cosmeticEffects: lane === "smooth" || lane === "buffered",
    reason: reasonForLane(lane)
  });
}

export function resolveRestoredMarathonVisualStep(previous = {}, target = {}, timing = {}, profileInput = {}) {
  const profile = createRestoredMarathonNetcodeProfile(profileInput);
  const targetX = clampNumber(target.x, -100000, 100000);
  const targetY = clampNumber(target.y, -100000, 100000);
  if (!previous.initialized) return visualStep(targetX, targetY, true, false);
  const previousX = clampNumber(previous.x, -100000, 100000);
  const previousY = clampNumber(previous.y, -100000, 100000);
  const elapsedMs = clampNumber(timing.elapsedMs ?? 0, 0, profile.staleSnapshotMs);
  const dx = targetX - previousX, dy = targetY - previousY;
  const distance = Math.hypot(dx, dy);
  if (distance >= profile.visualSnapDistancePx || elapsedMs >= profile.staleSnapshotMs) return visualStep(targetX, targetY, true, false);
  const maxStep = Math.max(1, profile.visualMaxStepPxPerSecond * elapsedMs / 1000);
  if (distance <= maxStep) return visualStep(targetX, targetY, false, false);
  const ratio = maxStep / distance; return visualStep(previousX + dx * ratio, previousY + dy * ratio, false, true);
}

export function createRestoredMarathonPingSample(timing = {}, previousSample = {}, profileInput = {}) {
  const profile = createRestoredMarathonNetcodeProfile(profileInput);
  const clientSentAtMs = clampNumber(timing.clientSentAtMs ?? timing.sentAtMs ?? 0, 0, MAX_CLOCK_MS), serverReceivedAtMs = clampNumber(timing.serverReceivedAtMs ?? clientSentAtMs, 0, MAX_CLOCK_MS);
  const serverSentAtMs = clampNumber(timing.serverSentAtMs ?? serverReceivedAtMs, serverReceivedAtMs, MAX_CLOCK_MS), clientReceivedAtMs = clampNumber(timing.clientReceivedAtMs ?? serverSentAtMs, clientSentAtMs, MAX_CLOCK_MS);
  const rttMs = Math.max(0, clientReceivedAtMs - clientSentAtMs - Math.max(0, serverSentAtMs - serverReceivedAtMs)), pingMs = round2(rttMs / 2), previousPingMs = Number((previousSample || {}).pingMs);
  const jitterMs = round2(Number.isFinite(previousPingMs) ? Math.abs(pingMs - previousPingMs) : 0);
  const lane = chooseRestoredMarathonNetworkLane({ pingMs, jitterMs, packetLossPct: timing.packetLossPct ?? 0 }, profile);
  return Object.freeze({ serverOwned: true, rttMs: round2(rttMs), pingMs, jitterMs, clockOffsetMs: round2(((serverReceivedAtMs - clientSentAtMs) + (serverSentAtMs - clientReceivedAtMs)) / 2), interpolationDelayMs: lane.interpolationDelayMs, lane: lane.lane });
}

export function createRestoredMarathonReconciliationHint(local = {}, server = {}, timing = {}, profileInput = {}) {
  const localX = clampNumber(local.x ?? 0, -100000, 100000), localY = clampNumber(local.y ?? 0, -100000, 100000);
  const serverX = clampNumber(server.x ?? localX, -100000, 100000), serverY = clampNumber(server.y ?? localY, -100000, 100000);
  const visual = resolveRestoredMarathonVisualStep({ initialized: true, x: localX, y: localY }, { x: serverX, y: serverY }, timing, profileInput);
  const correctionPx = round2(Math.hypot(serverX - localX, serverY - localY)), action = correctionPx <= 0.5 ? "none" : visual.snapped ? "snap" : "smooth";
  return Object.freeze({ serverOwned: true, action, correctionPx, progressDelta: round2(Number(server.progress || 0) - Number(local.progress || 0)), laneDeltaPx: round2(Number(server.laneOffsetPx || 0) - Number(local.laneOffsetPx || 0)), visualX: visual.x, visualY: visual.y, snapped: visual.snapped, limited: visual.limited });
}

export function shouldSendRestoredMarathonInputFrame(previous = null, next = {}, timing = {}, profileInput = {}) {
  if (!previous) return true;
  if (next.skillPressed || next.attacking) return true;
  if (previous.mode !== next.mode || previous.pace !== next.pace) return true;
  if (!sameDirection(previous.direction, next.direction)) return true;
  const profile = createRestoredMarathonNetcodeProfile(profileInput);
  const minIntervalMs = 1000 / profile.inputHz;
  return Math.max(0, Number(timing.nowMs || 0) - Number(timing.lastSentMs || 0)) >= minIntervalMs;
}

export function coalesceRestoredMarathonInputFrames(frames = [], profileInput = {}) {
  const profile = createRestoredMarathonNetcodeProfile(profileInput);
  const sent = [];
  let previous = null;
  let lastSentMs = 0;
  for (const frame of frames) {
    const nowMs = Number(frame.clientTimeMs ?? frame.sequence * (1000 / profile.inputHz));
    if (shouldSendRestoredMarathonInputFrame(previous, frame, { nowMs, lastSentMs }, profile)) {
      sent.push(frame);
      previous = frame;
      lastSentMs = nowMs;
    }
  }
  return Object.freeze(sent);
}

export function createRestoredMarathonPacketPressureReport(packets = [], options = {}) {
  const profile = createRestoredMarathonNetcodeProfile(options.profile);
  const windowMs = clampInteger(options.windowMs ?? 1000, 250, 5000);
  const nowMs = resolvePressureNowMs(options.nowMs, packets);
  const maxPacketsPerClient = clampInteger(options.maxPacketsPerClient ?? Math.ceil(profile.inputHz * windowMs / 1000) + 4, 4, 120);
  const clients = new Map();
  let totalPackets = 0;
  for (const packet of packets) {
    if (!packet || !isInPressureWindow(packet, nowMs, windowMs)) continue;
    totalPackets += 1;
    const clientId = packetClientId(packet);
    const row = clients.get(clientId) || { clientId, packetCount: 0, inputCount: 0, actionCount: 0, guardedCount: 0 };
    row.packetCount += 1;
    if (packet.type === "input_update") row.inputCount += 1;
    if (RESTORED_MARATHON_RATE_LIMITED_PACKET_TYPES.includes(packet.type)) {
      row.guardedCount += 1;
      if (packet.type !== "input_update") row.actionCount += 1;
    }
    clients.set(clientId, row);
  }
  const rows = Array.from(clients.values()).map((row) => Object.freeze({
    ...row, allowed: row.guardedCount <= maxPacketsPerClient, overflow: Math.max(0, row.guardedCount - maxPacketsPerClient)
  })).sort((left, right) => right.guardedCount - left.guardedCount || left.clientId.localeCompare(right.clientId));
  const droppedCandidates = rows.reduce((sum, row) => sum + row.overflow, 0);
  return Object.freeze({ version: RESTORED_MARATHON_NETCODE_CONTRACT_VERSION, windowMs, maxPacketsPerClient, totalPackets,
    droppedCandidates, overloaded: droppedCandidates > 0, clients: Object.freeze(rows) });
}

export function shouldAcceptRestoredMarathonRelayPacket(packets = [], envelope = {}, options = {}) {
  if (!RESTORED_MARATHON_RATE_LIMITED_PACKET_TYPES.includes(envelope.type)) {
    return Object.freeze({ ok: true, reason: "", pressure: createRestoredMarathonPacketPressureReport(packets, options) });
  }
  const nowMs = resolvePressureNowMs(options.nowMs, [envelope, ...packets]);
  const pressure = createRestoredMarathonPacketPressureReport([
    ...packets,
    { ...envelope, receivedAtMs: nowMs, sourceClientId: envelope.clientId || envelope.sourceClientId || "" }
  ], { ...options, nowMs });
  const client = pressure.clients.find((row) => row.clientId === packetClientId(envelope));
  if (client?.overflow > 0) return Object.freeze({ ok: false, reason: "rate_limited", pressure });
  return Object.freeze({ ok: true, reason: "", pressure });
}

export function validateRestoredMarathonNetcodeContract() {
  const errors = [];
  const budget = estimateRestoredMarathonNetcodeBudget({ runnerCount: 30 });
  if (!budget.withinPlayerBudget) errors.push("30-runner player bandwidth budget should fit");
  if (!budget.withinServerBudget) errors.push("30-runner server egress budget should fit");
  if (budget.snapshotBytes > 900) errors.push("30-runner delta snapshot should stay compact");
  const largeProfile = createRestoredMarathonLargeRoomNetcodeProfile();
  const largeBudget = estimateRestoredMarathonNetcodeBudget({ runnerCount: 50, profile: largeProfile });
  if (largeProfile.maxRunners !== 50) errors.push("large-room profile should allow 50 runners");
  if (largeProfile.snapshotHz > 6) errors.push("large-room profile should lower snapshot cadence for 50 runners");
  if (!largeBudget.withinPlayerBudget || !largeBudget.withinServerBudget) errors.push("50-runner large-room bandwidth budget should fit");
  if (largeBudget.serverEgressKbps > 2200) errors.push("50-runner large-room server egress needs headroom");
  const badLane = chooseRestoredMarathonNetworkLane({ pingMs: 240, jitterMs: 80, packetLossPct: 3 });
  if (badLane.lane !== "degraded" || badLane.snapshotHz >= 10) errors.push("bad ping should reduce snapshot cadence");
  const smoothed = resolveRestoredMarathonVisualStep({ initialized: true, x: 0, y: 0 }, { x: 240, y: 0 }, { elapsedMs: 50 });
  const snapped = resolveRestoredMarathonVisualStep({ initialized: true, x: 0, y: 0 }, { x: 900, y: 0 }, { elapsedMs: 50 });
  if (smoothed.x >= 240 || !smoothed.limited || !snapped.snapped || snapped.x !== 900) errors.push("visual smoothing should limit small jumps and snap huge corrections");
  const ping = createRestoredMarathonPingSample({ clientSentAtMs: 1000, serverReceivedAtMs: 1040, serverSentAtMs: 1044, clientReceivedAtMs: 1084 });
  if (ping.rttMs !== 80 || ping.pingMs !== 40 || !ping.serverOwned) errors.push("ping sample should measure server-owned round trip time");
  const modernPing = createRestoredMarathonPingSample({ clientSentAtMs: 1779930000000, serverReceivedAtMs: 1779930000040, serverSentAtMs: 1779930000044, clientReceivedAtMs: 1779930000084 });
  if (modernPing.pingMs !== 40) errors.push("ping sample must not clamp modern epoch timestamps");
  const reconcile = createRestoredMarathonReconciliationHint({ x: 0, y: 0, progress: 2 }, { x: 120, y: 0, progress: 3 }, { elapsedMs: 50 });
  if (reconcile.action !== "smooth" || reconcile.correctionPx !== 120 || reconcile.progressDelta !== 1) errors.push("reconciliation hint should classify server correction");
  const frames = coalesceRestoredMarathonInputFrames([
    timedFrame(1, 0, "run", "push", 0, -1),
    timedFrame(2, 10, "run", "push", 0, -1),
    timedFrame(3, 20, "run", "push", 0, -1),
    timedFrame(4, 30, "sprint", "sprint", 0, -1),
    { ...timedFrame(5, 40, "skill", "recover", 0, 0), skillPressed: true }
  ]);
  if (frames.length >= 5 || frames.at(-1)?.mode !== "skill") errors.push("input coalescing should keep changes and skill requests");
  const spam = Array.from({ length: 30 }, (_, index) => packet("client:spam", "input_update", index + 1, 100));
  const pressure = createRestoredMarathonPacketPressureReport(spam, { nowMs: 100 });
  if (!pressure.overloaded || pressure.droppedCandidates < 1) errors.push("packet pressure should flag input spam");
  const guarded = shouldAcceptRestoredMarathonRelayPacket(spam.slice(0, 24), spam[24], { nowMs: 100 });
  if (guarded.ok || guarded.reason !== "rate_limited") errors.push("relay guard should block spam above input budget");
  const join = shouldAcceptRestoredMarathonRelayPacket(spam, packet("client:spam", "join_result", 31, 100), { nowMs: 100 });
  if (!join.ok) errors.push("non-action room packets should not be rate-limited");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function frame(sequence, mode, pace, x, y) { return Object.freeze({ sequence, mode, pace, direction: Object.freeze({ x, y }), skillPressed: false, attacking: false }); }
function timedFrame(sequence, clientTimeMs, mode, pace, x, y) { return Object.freeze({ ...frame(sequence, mode, pace, x, y), clientTimeMs }); }
function packet(clientId, type, sequence, receivedAtMs) { return Object.freeze({ clientId, sourceClientId: clientId, type, sequence, receivedAtMs, roomId: "room:test" }); }

function visualStep(x, y, snapped, limited) { return Object.freeze({ initialized: true, x: round2(x), y: round2(y), snapped, limited }); }

function sameDirection(left = {}, right = {}) { return Number(left.x || 0) === Number(right.x || 0) && Number(left.y || 0) === Number(right.y || 0); }
function packetClientId(packet = {}) { return packet.sourceClientId || packet.clientId || packet.payload?.clientId || "client:unknown"; }
function packetReceivedAtMs(packet = {}) { return Number(packet.receivedAtMs ?? packet.serverTimeMs ?? packet.payload?.raceTimeMs ?? packet.payload?.serverTimeMs ?? 0); }
function isInPressureWindow(packet, nowMs, windowMs) { const receivedAtMs = packetReceivedAtMs(packet); return Number.isFinite(receivedAtMs) && receivedAtMs <= nowMs && receivedAtMs > nowMs - windowMs; }
function resolvePressureNowMs(value, packets = []) { const direct = Number(value); return Number.isFinite(direct) ? Math.max(0, direct) : Math.max(0, ...packets.map(packetReceivedAtMs).filter(Number.isFinite)); }
function reasonForLane(lane) { return ({ critical: "protect race authority, reduce snapshots, prefer interpolation", degraded: "high ping or jitter, reduce send rate and visual effects", buffered: "moderate jitter, add interpolation buffer" })[lane] || "normal or large-room race budget"; }
function bytesToKbps(bytesPerSecond) { return bytesPerSecond * 8 / 1000; }
function clampInteger(value, min, max) { return Math.round(clampNumber(value, min, max)); }
function clampNumber(value, min, max) { const number = Number(value); return Math.max(min, Math.min(max, Number.isFinite(number) ? number : min)); }
function round2(value) { return Math.round(value * 100) / 100; }
