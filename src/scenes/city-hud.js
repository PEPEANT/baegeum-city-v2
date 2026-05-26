import { createCityFeatureAudit } from "../systems/city-feature-audit.js";

export function readCityHudLabels() {
  return {
    scene: document.getElementById("sceneLabel"),
    position: document.getElementById("positionLabel"),
    nearby: document.getElementById("nearbyLabel"),
    playerMode: document.getElementById("playerModeLabel"),
    chatChannel: document.getElementById("chatChannelLabel"),
    venue: document.getElementById("venueStateLabel"),
    onlineRoom: document.getElementById("onlineRoomLabel"),
    mapVersion: document.getElementById("mapVersionLabel"),
    buildingAudit: document.getElementById("buildingAuditLabel"),
    appAudit: document.getElementById("appAuditLabel"),
    riskAudit: document.getElementById("riskAuditLabel"),
    clockTime: document.getElementById("worldClockTime"),
    clockDay: document.getElementById("worldClockDay"),
    clockPhase: document.getElementById("worldClockPhase")
  };
}

export function updateCityHudLabels(game) {
  const labels = game.labels;
  const label = game.currentInterior?.name || game.map.name;
  labels.scene.textContent = `scene: ${label}`;
  labels.position.textContent = `x ${Math.round(game.player.x)} / y ${Math.round(game.player.y)}`;
  labels.nearby.textContent = nearbyText(game);
  if (labels.playerMode) labels.playerMode.textContent = `mode: ${game.playerState.mode}`;
  if (labels.chatChannel) labels.chatChannel.textContent = `chat: ${game.chat.channel}`;
  if (labels.venue) labels.venue.textContent = `venue: ${game.playerState.venueName || "none"}`;
  if (labels.onlineRoom) labels.onlineRoom.textContent = `room: ${game.playerState.onlineRoomId || "none"}`;
  if (labels.mapVersion) labels.mapVersion.textContent = `map: ${mapDebugLabel(game)}`;
  updateFeatureAuditLabels(labels, game);
  labels.clockTime.textContent = game.clockSnapshot.timeText;
  labels.clockDay.textContent = game.clockSnapshot.dayLabel;
  labels.clockPhase.textContent = game.clockSnapshot.phaseLabel;
}

function updateFeatureAuditLabels(labels, game) {
  if (!labels.buildingAudit && !labels.appAudit && !labels.riskAudit) return;
  const audit = createCityFeatureAudit({ map: game.map });
  if (labels.buildingAudit) labels.buildingAudit.textContent = `buildings: ${audit.buildings.enterable}/${audit.buildings.total} enterable · no-func ${audit.buildings.functionless}`;
  if (labels.appAudit) labels.appAudit.textContent = `apps: ${audit.apps.openable}/${audit.apps.total} open · working ${audit.apps.workingButtonApps} · locked ${audit.apps.locked}`;
  if (labels.riskAudit) labels.riskAudit.textContent = `audit: signs ${audit.buildings.missingSign} · entrances ${audit.buildings.missingEntrance} · preview apps ${audit.apps.preview}`;
}

function mapDebugLabel(game) {
  const mapId = game.map?.mapId || "unknown-map";
  const version = game.contract?.mapVersion || game.map?.mapVersion || "unknown-version";
  return `${mapId} / ${version}`;
}

function nearbyText(game) {
  if (game.nearbyInteraction) return `nearby: ${game.nearbyInteraction.label} (${game.nearbyInteraction.target})`;
  if (game.nearbyDoor) return `nearby: ${game.nearbyDoor.building.name} (${game.nearbyDoor.door.id})`;
  return "nearby: none";
}
