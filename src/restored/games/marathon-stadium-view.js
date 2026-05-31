import {
  RESTORED_MARATHON_MAX_RUNNERS,
  advanceRestoredMarathonParticipant,
  createRestoredMarathonOnlinePacket,
  createRestoredMarathonParticipant,
  createRestoredMarathonResultEnvelope,
  createRestoredMarathonRoom,
  rankRestoredMarathonParticipants
} from "./marathon-contract.js";

export const RESTORED_MARATHON_STADIUM_VIEW_VERSION = "restored-marathon-stadium-view-001";

const TICK_MS = 60000;
const BOT_PACES = Object.freeze(["steady", "push", "steady", "recover"]);

function botPaceFor(participant, index, raceTimeMs, course) {
  if (participant.finishedAtMs !== null) return "recover";
  if (participant.stamina < 18) return "recover";
  if (course.distanceMeters - participant.progressMeters < 900) return "sprint";
  return BOT_PACES[(index + Math.floor(raceTimeMs / TICK_MS)) % BOT_PACES.length];
}

function createPreviewParticipants() {
  return Object.freeze(Array.from({ length: RESTORED_MARATHON_MAX_RUNNERS }, (_, index) => createRestoredMarathonParticipant({
    participantId: index === 0 ? "runner:local" : `runner:bot-${String(index).padStart(2, "0")}`,
    displayName: index === 0 ? "Player" : `Bot ${index}`,
    type: index === 0 ? "player" : "bot",
    lane: index + 1,
    stamina: 96 - (index % 6)
  })));
}

export function createRestoredMarathonPreviewState(options = {}) {
  const room = createRestoredMarathonRoom({
    roomId: options.roomId || "room:marathon:local-preview",
    phase: "racing",
    participants: options.participants || createPreviewParticipants()
  });
  const ranking = rankRestoredMarathonParticipants(room.participants);
  return Object.freeze({
    version: RESTORED_MARATHON_STADIUM_VIEW_VERSION,
    raceTimeMs: Math.max(0, Number(options.raceTimeMs || 0)),
    selectedPace: options.selectedPace || "steady",
    room,
    participants: room.participants,
    ranking,
    resultEnvelope: null
  });
}

export function advanceRestoredMarathonPreviewState(stateInput = null, pace = "steady") {
  const state = stateInput || createRestoredMarathonPreviewState();
  const raceTimeMs = state.raceTimeMs + TICK_MS;
  const participants = Object.freeze(state.participants.map((participant, index) => advanceRestoredMarathonParticipant(
    participant,
    {
      pace: index === 0 ? pace : botPaceFor(participant, index, raceTimeMs, state.room.course),
      raceTimeMs,
      sequence: participant.lastSequence + 1
    },
    TICK_MS,
    state.room.course
  )));
  const room = createRestoredMarathonRoom({ ...state.room, phase: participants.every((item) => item.finishedAtMs !== null) ? "finished" : "racing", participants });
  const ranking = rankRestoredMarathonParticipants(participants);
  const player = participants.find((item) => item.participantId === "runner:local");
  const resultEnvelope = player?.finishedAtMs === null ? null : createRestoredMarathonResultEnvelope({ room, participants, participantId: "runner:local" });
  return Object.freeze({ ...state, raceTimeMs, selectedPace: pace, room, participants, ranking, resultEnvelope });
}

export function renderRestoredMarathonStadiumHtml(stateInput = null) {
  const state = stateInput || createRestoredMarathonPreviewState();
  const player = state.participants.find((item) => item.participantId === "runner:local") || state.participants[0];
  const playerRank = state.ranking.find((item) => item.participantId === player.participantId)?.rank || "-";
  const distanceText = `${Math.floor(player.progressMeters).toLocaleString()}m / ${state.room.course.distanceMeters.toLocaleString()}m`;
  const finishText = player.finishedAtMs === null ? `Rank ${playerRank}` : `Finished #${playerRank} in ${formatRaceTime(player.finishedAtMs)}`;
  const nextSplit = state.room.course.checkpointMeters[player.nextCheckpointIndex] || state.room.course.distanceMeters;
  const packets = createPreviewPacketRail(state);
  return `
    <div class="col-span-1 sm:col-span-2 space-y-4">
      <div class="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
        <div class="flex items-center justify-between gap-3">
          <div><div class="text-xs font-black uppercase text-cyan-300">Local ${RESTORED_MARATHON_MAX_RUNNERS} Runner Preview</div><div class="mt-1 text-lg font-black">Baegeum Marathon Stadium</div></div>
          <div class="flex items-center gap-2"><button onclick="startRestoredMarathonPreview()" class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black active:scale-95">Reset</button><div class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black">${formatRaceTime(state.raceTimeMs)}</div></div>
        </div>
        <div class="mt-4 h-40 rounded-2xl border border-cyan-400/30 bg-[radial-gradient(circle_at_center,#164e63,#0f172a_62%)] p-4">
          <div class="relative h-full rounded-full border-[10px] border-emerald-500/80 bg-slate-900/60">${renderRunnerDots(state)}</div>
        </div>
        <div class="mt-3 grid grid-cols-2 gap-2 text-center text-xs font-black sm:grid-cols-4">
          <div class="rounded-xl bg-white/10 p-2"><div class="text-slate-400">Pace</div><div>${escapeHtml(state.selectedPace)}</div></div>
          <div class="rounded-xl bg-white/10 p-2"><div class="text-slate-400">Stamina</div><div>${Math.round(player.stamina)}%</div></div>
          <div class="rounded-xl bg-white/10 p-2"><div class="text-slate-400">Progress</div><div>${distanceText}</div></div>
          <div class="rounded-xl bg-white/10 p-2"><div class="text-slate-400">Next Split</div><div>${nextSplit.toLocaleString()}m</div></div>
        </div>
        <div class="mt-4 grid grid-cols-4 gap-2">${["recover", "steady", "push", "sprint"].map(renderPaceButton).join("")}</div>
      </div>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="rounded-2xl border border-slate-100 bg-white p-4"><div class="text-xs font-black text-slate-400">Player Result</div><div class="mt-1 text-lg font-black text-slate-900">${finishText}</div><div class="mt-1 text-xs font-bold text-slate-500">Online finish and ranking stay server-authoritative.</div></div>
        <div class="rounded-2xl border border-cyan-100 bg-cyan-50 p-4"><div class="text-xs font-black text-cyan-700">Online Packet Rail</div><div class="mt-2 flex flex-wrap gap-1">${packets.map(renderPacketPill).join("")}</div><div class="mt-2 text-xs font-bold text-cyan-800">Snapshots are prepared; lobby stays hidden while offline.</div></div>
        <div class="rounded-2xl border border-slate-100 bg-white p-4"><div class="text-xs font-black text-slate-400">Top 5</div><div class="mt-2 space-y-1">${renderStandingRows(state.ranking.slice(0, 5))}</div></div>
      </div>
    </div>`;
}

function createPreviewPacketRail(state) {
  return ["join_request", "input_update", "state_snapshot", state.room.phase === "finished" ? "race_finalized" : "checkpoint_claim"]
    .map((type, index) => createRestoredMarathonOnlinePacket(type, {
      roomId: state.room.roomId,
      participantId: "runner:local",
      sequence: state.raceTimeMs / TICK_MS + index + 1,
      participants: type === "state_snapshot" ? state.participants : undefined,
      ranking: type === "race_finalized" ? state.ranking : undefined
    }));
}

function renderRunnerDots(state) {
  return state.participants.map((participant, index) => {
    const pct = Math.min(96, Math.max(2, (participant.progressMeters / state.room.course.distanceMeters) * 94 + 2));
    const top = 12 + (index % 6) * 12;
    const player = participant.participantId === "runner:local";
    const cls = player ? "h-4 w-4 bg-cyan-300 ring-2 ring-white" : "h-2.5 w-2.5 bg-white/70";
    return `<span title="${escapeHtml(participant.displayName)}" class="absolute rounded-full ${cls}" style="left:${pct.toFixed(2)}%;top:${top}px"></span>`;
  }).join("");
}

function renderPaceButton(pace) {
  return `<button onclick="advanceRestoredMarathonPreview('${pace}')" class="rounded-xl border border-white/10 bg-white/10 px-2 py-2 text-[11px] font-black uppercase text-white active:scale-95">${pace}</button>`;
}

function renderPacketPill(packet) {
  return `<span class="rounded-full bg-white px-2 py-1 text-[10px] font-black text-cyan-700">${escapeHtml(packet.type)}</span>`;
}

function renderStandingRows(rows) {
  return rows.map((row) => `<div class="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5 text-xs font-bold"><span>#${row.rank} ${escapeHtml(row.displayName)}</span><span>${row.finishedAtMs === null ? `${Math.floor(row.progressMeters)}m` : formatRaceTime(row.finishedAtMs)}</span></div>`).join("");
}

function formatRaceTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

export function validateRestoredMarathonStadiumView() {
  const state = createRestoredMarathonPreviewState();
  const html = renderRestoredMarathonStadiumHtml(state);
  const advanced = advanceRestoredMarathonPreviewState(state, "push");
  const errors = [];
  if (state.participants.length !== RESTORED_MARATHON_MAX_RUNNERS) errors.push("local preview must seed the runner cap");
  if (advanced.raceTimeMs !== TICK_MS) errors.push("preview should advance by one deterministic tick");
  if (advanced.participants[0].progressMeters <= state.participants[0].progressMeters) errors.push("player should advance");
  if (createPreviewPacketRail(state).length !== 4) errors.push("online packet rail must expose four packet previews");
  for (const text of ["Baegeum Marathon Stadium", "advanceRestoredMarathonPreview", "Online finish and ranking", "state_snapshot"]) {
    if (!html.includes(text)) errors.push(`missing view text: ${text}`);
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}
