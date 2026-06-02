import {
  RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID,
  RESTORED_MARATHON_TRAIL_MAP_IDS
} from "./marathon-trail-map-catalog.js";

export const SINGULARITY_RACE_MAP_DRAFT_CONTRACT_VERSION = "singularity-race-map-draft-contract-001";
export const SINGULARITY_RACE_MAP_DRAFT_SCHEMA_VERSION = "singularity-race-map-draft-001";
export const SINGULARITY_RACE_MAP_DRAFT_VERSION = 1;
export const SINGULARITY_RACE_MAP_DRAFT_SOURCE = "singularity-race-map-editor";
export const SINGULARITY_RACE_MAP_DRAFT_BASE_VERSION = "singularity-race-map-data-001";
export const SINGULARITY_RACE_MAP_DRAFT_STORAGE_PREFIX = "singularity-race-map-draft:v1";

const SPECTATOR_SIDES = Object.freeze(["left", "right", "back"]);
const SPECTATOR_ROW_LAYERS = Object.freeze(["back", "front"]);
const OBSTACLE_KINDS = Object.freeze(["cone", "barrier", "crate"]);

export function createSingularityRaceMapDraft(map = {}, options = {}) {
  const mapId = normalizeSingularityRaceDraftMapId(options.mapId || map.mapId);
  const draft = {
    schemaVersion: SINGULARITY_RACE_MAP_DRAFT_SCHEMA_VERSION,
    draftVersion: SINGULARITY_RACE_MAP_DRAFT_VERSION,
    contractVersion: SINGULARITY_RACE_MAP_DRAFT_CONTRACT_VERSION,
    source: SINGULARITY_RACE_MAP_DRAFT_SOURCE,
    mapId,
    baseMapVersion: cleanText(options.baseMapVersion || map.baseMapVersion, 96) || SINGULARITY_RACE_MAP_DRAFT_BASE_VERSION,
    editorRevision: nonNegativeInteger(options.editorRevision ?? map.editorRevision, 0),
    obstacles: normalizeDraftObstacles(map.obstacles),
    spectators: normalizeDraftSpectators(map.spectators)
  };
  if (options.includeSavedAt !== false) draft.savedAt = cleanText(options.savedAt, 96);
  return freezeDraft(draft);
}

export function createSingularityRaceMapDraftKey(mapId = RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID) {
  return `${SINGULARITY_RACE_MAP_DRAFT_STORAGE_PREFIX}:${normalizeSingularityRaceDraftMapId(mapId)}`;
}

export function normalizeSingularityRaceMapDraft(rawDraft, fallbackMapId = RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID) {
  const input = parseDraftInput(rawDraft);
  if (!input) return null;
  if (input.schemaVersion && input.schemaVersion !== SINGULARITY_RACE_MAP_DRAFT_SCHEMA_VERSION) return null;
  if (Number(input.draftVersion || 1) > SINGULARITY_RACE_MAP_DRAFT_VERSION) return null;
  const hasObstacles = Array.isArray(input.obstacles);
  const hasSpectators = Array.isArray(input.spectators);
  const draft = {
    schemaVersion: input.schemaVersion || SINGULARITY_RACE_MAP_DRAFT_SCHEMA_VERSION,
    draftVersion: nonNegativeInteger(input.draftVersion, SINGULARITY_RACE_MAP_DRAFT_VERSION),
    contractVersion: cleanText(input.contractVersion, 96) || SINGULARITY_RACE_MAP_DRAFT_CONTRACT_VERSION,
    source: cleanText(input.source, 64) || SINGULARITY_RACE_MAP_DRAFT_SOURCE,
    mapId: normalizeSingularityRaceDraftMapId(input.mapId || fallbackMapId),
    baseMapVersion: cleanText(input.baseMapVersion, 96) || SINGULARITY_RACE_MAP_DRAFT_BASE_VERSION,
    editorRevision: nonNegativeInteger(input.editorRevision, 0),
    obstacles: hasObstacles ? normalizeDraftObstacles(input.obstacles) : null,
    spectators: hasSpectators ? normalizeDraftSpectators(input.spectators) : null
  };
  if (input.savedAt !== undefined) draft.savedAt = cleanText(input.savedAt, 96);
  return freezeDraft(draft);
}

export function mergeSingularityRaceMapDraft(baseMapData = {}, draftInput = null) {
  const mapId = normalizeSingularityRaceDraftMapId(baseMapData.mapId);
  const draft = normalizeSingularityRaceMapDraft(draftInput, mapId);
  if (!draft || draft.mapId !== mapId) return freezeMapData(baseMapData, mapId);
  return freezeMapData({
    mapId,
    obstacles: Array.isArray(draft.obstacles) ? draft.obstacles : baseMapData.obstacles,
    spectators: Array.isArray(draft.spectators) ? draft.spectators : baseMapData.spectators
  }, mapId);
}

export function validateSingularityRaceMapDraftContract() {
  const errors = [];
  const draft = createSingularityRaceMapDraft({
    mapId: RESTORED_MARATHON_TRAIL_MAP_IDS.BASIC,
    obstacles: [{ id: "basic:cone-01", kind: "cone", progress: 13.2, laneOffsetPx: -88 }],
    spectators: [{ id: "basic:start-left-crowd", progress: 2, laneOffsetPx: -318, side: "left", rows: [{ layer: "front", members: [{ id: "front:1", variant: 2, sign: "AGI 2027" }] }] }]
  }, { includeSavedAt: false, editorRevision: 2 });
  if (draft.schemaVersion !== SINGULARITY_RACE_MAP_DRAFT_SCHEMA_VERSION) errors.push("draft schema should be explicit");
  if (draft.obstacles[0].progress !== 13.2 || draft.spectators[0].rows[0].members[0].sign !== "AGI 2027") errors.push("draft should preserve race map layers");
  if (createSingularityRaceMapDraftKey(RESTORED_MARATHON_TRAIL_MAP_IDS.MAZE) === createSingularityRaceMapDraftKey(RESTORED_MARATHON_TRAIL_MAP_IDS.BASIC)) errors.push("draft keys must be map-specific");
  const merged = mergeSingularityRaceMapDraft({
    mapId: RESTORED_MARATHON_TRAIL_MAP_IDS.BASIC,
    obstacles: [{ id: "base:barrier", kind: "barrier", progress: 10, laneOffsetPx: 0 }],
    spectators: [{ id: "base:crowd", progress: 2, laneOffsetPx: -200, rows: [] }]
  }, { mapId: RESTORED_MARATHON_TRAIL_MAP_IDS.BASIC, spectators: [{ id: "draft:crowd", progress: 7, laneOffsetPx: 260, rows: [] }] });
  if (merged.obstacles[0].id !== "base:barrier") errors.push("partial spectator drafts should not erase base obstacles");
  if (merged.spectators[0].progress !== 7 || merged.spectators[0].laneOffsetPx !== 260) errors.push("spectator drafts should override spectator layer");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function parseDraftInput(rawDraft) {
  if (!rawDraft) return null;
  if (typeof rawDraft === "string") {
    try {
      const parsed = JSON.parse(rawDraft);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return typeof rawDraft === "object" && !Array.isArray(rawDraft) ? rawDraft : null;
}

function normalizeDraftObstacles(items = []) {
  if (!Array.isArray(items)) return Object.freeze([]);
  return Object.freeze(items.map(normalizeDraftObstacle).filter(Boolean));
}

function normalizeDraftObstacle(item, index) {
  if (!item || typeof item !== "object") return null;
  const kind = OBSTACLE_KINDS.includes(item.kind) ? item.kind : "barrier";
  return Object.freeze({
    id: cleanText(item.id, 80) || `draft-obstacle:${pad3(index + 1)}`,
    kind,
    progress: round2(clampNumber(item.progress, 0, 100, 0)),
    laneOffsetPx: roundNumber(clampNumber(item.laneOffsetPx, -760, 760, 0)),
    label: cleanText(item.label, 40) || kind,
    severity: round2(clampNumber(item.severity, 0.1, 4, 1)),
    progressRadius: round2(clampNumber(item.progressRadius, 0.05, 4, 0.46)),
    laneRadiusPx: roundNumber(clampNumber(item.laneRadiusPx, 4, 220, 58)),
    progressBounce: round2(clampNumber(item.progressBounce, 0, 2, 0.22)),
    laneBouncePx: roundNumber(clampNumber(item.laneBouncePx, 0, 220, 34)),
    slowMs: roundNumber(clampNumber(item.slowMs, 0, 3000, 260)),
    pushLaneDirection: Number(item.pushLaneDirection) < 0 ? -1 : 1
  });
}

function normalizeDraftSpectators(items = []) {
  if (!Array.isArray(items)) return Object.freeze([]);
  return Object.freeze(items.map(normalizeDraftSpectator).filter(Boolean));
}

function normalizeDraftSpectator(item, index) {
  if (!item || typeof item !== "object") return null;
  const rows = normalizeSpectatorRows(item.rows);
  const memberCount = rows.reduce((sum, row) => sum + row.members.length, 0);
  return Object.freeze({
    id: cleanText(item.id, 80) || `draft-spectator:${pad3(index + 1)}`,
    progress: round2(clampNumber(item.progress, 0, 100, 0)),
    laneOffsetPx: roundNumber(clampNumber(item.laneOffsetPx, -760, 760, 0)),
    side: SPECTATOR_SIDES.includes(item.side) ? item.side : "left",
    density: memberCount || nonNegativeInteger(item.density, 0),
    widthPercent: round2(clampNumber(item.widthPercent, 2, 60, 19)),
    heightPercent: round2(clampNumber(item.heightPercent, 1, 24, 3.8)),
    anchorX: round2(clampNumber(item.anchorX, 0, 1, 0.36)),
    anchorY: round2(clampNumber(item.anchorY, 0, 1, 0.12)),
    rotationDeg: round2(clampNumber(item.rotationDeg, -45, 45, 0)),
    rows
  });
}

function normalizeSpectatorRows(rows = []) {
  if (!Array.isArray(rows)) return Object.freeze([]);
  return Object.freeze(rows.map((row, index) => {
    const layer = SPECTATOR_ROW_LAYERS.includes(row?.layer) ? row.layer : (index === 0 ? "back" : "front");
    const members = Array.isArray(row?.members) ? row.members.map(normalizeSpectatorMember).filter(Boolean) : [];
    return Object.freeze({ layer, members: Object.freeze(members) });
  }));
}

function normalizeSpectatorMember(member, index) {
  if (!member || typeof member !== "object") return null;
  return Object.freeze({
    id: cleanText(member.id, 40) || `member:${pad3(index + 1)}`,
    variant: roundNumber(clampNumber(member.variant, 0, 9, 0)),
    hopDelayMs: roundNumber(clampNumber(member.hopDelayMs, -2400, 2400, 0)),
    sign: cleanText(member.sign, 40),
    signTiltDeg: round2(clampNumber(member.signTiltDeg, -30, 30, -3))
  });
}

function freezeMapData(mapData, mapId) {
  return Object.freeze({
    mapId,
    obstacles: Object.freeze([...(Array.isArray(mapData.obstacles) ? mapData.obstacles : [])]),
    spectators: Object.freeze([...(Array.isArray(mapData.spectators) ? mapData.spectators : [])])
  });
}

function freezeDraft(draft) {
  return Object.freeze(draft);
}

export function normalizeSingularityRaceDraftMapId(mapId) {
  const value = cleanText(mapId, 80);
  return Object.values(RESTORED_MARATHON_TRAIL_MAP_IDS).includes(value)
    ? value
    : RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID;
}

function cleanText(value, limit) {
  return String(value ?? "").trim().slice(0, limit);
}

function nonNegativeInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : fallback;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Math.max(min, Math.min(max, Number.isFinite(number) ? number : fallback));
}

function roundNumber(value) {
  return Math.round(value);
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function pad3(value) {
  return String(value).padStart(3, "0");
}
