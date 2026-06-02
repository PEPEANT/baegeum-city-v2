import {
  RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID,
  RESTORED_MARATHON_TRAIL_MAP_IDS
} from "./marathon-trail-map-catalog.js";
import { mergeSingularityRaceMapDraft } from "./singularity-race-map-draft-contract.js";

export const SINGULARITY_RACE_SPECTATOR_CONTRACT_VERSION = "singularity-race-spectator-contract-001";

const START_CROWD_PROGRESS = 0.05;
const START_CROWD_LANE_OFFSET_PX = 0;

const SPECTATORS_BY_MAP_ID = Object.freeze({
  [RESTORED_MARATHON_TRAIL_MAP_IDS.BASIC]: startCrowdGroups("basic"),
  [RESTORED_MARATHON_TRAIL_MAP_IDS.SQUARE]: startCrowdGroups("square"),
  [RESTORED_MARATHON_TRAIL_MAP_IDS.MAZE]: startCrowdGroups("maze")
});

export function listSingularityRaceMapSpectators(mapId = RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID, mapDraft = null) {
  const normalizedMapId = normalizeSpectatorMapId(mapId);
  const spectators = SPECTATORS_BY_MAP_ID[normalizedMapId] || SPECTATORS_BY_MAP_ID[RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID];
  if (!mapDraft) return spectators;
  return mergeSingularityRaceMapDraft({
    mapId: normalizedMapId,
    obstacles: [],
    spectators
  }, mapDraft).spectators;
}

export function validateSingularityRaceSpectatorContract() {
  const errors = [];
  for (const mapId of Object.values(RESTORED_MARATHON_TRAIL_MAP_IDS)) {
    const groups = listSingularityRaceMapSpectators(mapId);
    if (!groups.length) errors.push(`${mapId} should keep at least one spectator group`);
    for (const group of groups) validateGroup(group, mapId, errors);
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function startCrowdGroups(prefix) {
  return freezeGroups([
    {
      id: `${prefix}:start-left-crowd`,
      progress: START_CROWD_PROGRESS,
      laneOffsetPx: START_CROWD_LANE_OFFSET_PX,
      side: "left",
      density: 17,
      widthPercent: 19,
      heightPercent: 3.8,
      anchorX: 0.36,
      anchorY: 0.12,
      rotationDeg: -1,
      rows: [
        row("back", [
          member(1, -180),
          member(3, -520, "AGI 2027", 4),
          member(2, -80),
          member(4, -760, "특이점갤러리 화이팅"),
          member(1, -320),
          member(3, -620),
          member(2, -240, "1등 부기줄", 5),
          member(4, -420)
        ]),
        row("front", [
          member(2, -120, "특이점은온다"),
          member(0, -360),
          member(3, -610, "달려라", 3),
          member(1, -250),
          member(4, -700, "AGI 2027", -5),
          member(2, -450),
          member(3, -30, "특갤 파이팅"),
          member(1, -560),
          member(0, -210, "가즈아", 4)
        ])
      ]
    }
  ]);
}

function row(layer, members) {
  return Object.freeze({
    layer,
    members: Object.freeze(members.map((item, index) => Object.freeze({ id: `${layer}:${index + 1}`, ...item })))
  });
}

function member(variant, hopDelayMs, sign = "", signTiltDeg = -3) {
  return { variant, hopDelayMs, sign, signTiltDeg };
}

function validateGroup(group, mapId, errors) {
  if (!group.id || !String(group.id).includes(":")) errors.push(`${mapId} spectator group id should be scoped`);
  if (!Number.isFinite(Number(group.progress)) || group.progress < 0 || group.progress > 100) errors.push(`${group.id} progress should be 0-100`);
  if (!["left", "right", "back"].includes(group.side)) errors.push(`${group.id} side should be explicit`);
  const members = group.rows.flatMap((rowItem) => rowItem.members);
  if (members.length !== group.density) errors.push(`${group.id} density should match member count`);
  if (!members.some((item) => item.sign)) errors.push(`${group.id} should keep at least one visible sign`);
}

function freezeGroups(groups) {
  return Object.freeze(groups.map((group) => Object.freeze({
    ...group,
    rows: Object.freeze(group.rows.map((rowItem) => Object.freeze(rowItem)))
  })));
}

function normalizeSpectatorMapId(mapId) {
  const value = String(mapId || "").trim();
  return Object.values(RESTORED_MARATHON_TRAIL_MAP_IDS).includes(value)
    ? value
    : RESTORED_MARATHON_DEFAULT_TRAIL_MAP_ID;
}
