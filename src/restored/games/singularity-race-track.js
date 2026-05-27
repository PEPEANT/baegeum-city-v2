export function createSingularityPlayerFocusRingNode(point, cueType) {
  const focus = document.createElement("div");
  focus.className = `player-focus-ring${cueType === "checkpoint" ? " is-checkpoint" : ""}${cueType === "respawn" ? " is-respawn" : ""}`;
  applyPercentPosition(focus, point);
  return focus;
}

export function createSingularityStartGateNode(point) {
  const node = document.createElement("div");
  node.className = "start-gate";
  applyPercentPosition(node, point);
  return node;
}

export function createSingularityTrackCountdownNode(label) {
  if (!label) return null;
  const node = document.createElement("div");
  node.className = "track-countdown";
  node.textContent = label;
  return node;
}

export function createSingularityTrackProgressPillNode(options) {
  const pill = document.createElement("div");
  pill.className = "track-progress-pill";
  const title = document.createElement("b");
  title.textContent = `${options.nickname} ${Math.round(options.progress)}%`;
  const detail = document.createElement("span");
  detail.textContent = getSingularityTrackProgressDetail(options);
  pill.append(title, detail);
  return pill;
}

export function createSingularityTrackCueNode(cue, point) {
  const node = document.createElement("div");
  node.className = `track-cue is-${cue.type}`;
  applyPercentPosition(node, point);
  node.textContent = cue.label;
  return node;
}

export function getSingularityTrackProgressDetail(options) {
  const nextSave = options.checkpoints[options.checkpointIndex] || 100;
  if (!options.raceStarted) return options.countdownActive ? "출발 카운트다운" : "출발 대기";
  return nextSave >= 100 ? "결승선" : `다음 세이브 ${options.checkpointIndex + 1} / ${nextSave}%`;
}

export function validateSingularityRaceTrackContract() {
  const errors = [];
  const waiting = getSingularityTrackProgressDetail({
    checkpoints: [18],
    checkpointIndex: 0,
    countdownActive: false,
    raceStarted: false
  });
  const racing = getSingularityTrackProgressDetail({
    checkpoints: [18],
    checkpointIndex: 0,
    countdownActive: false,
    raceStarted: true
  });
  if (waiting !== "출발 대기") errors.push("waiting label must stay Korean");
  if (racing !== "다음 세이브 1 / 18%") errors.push("next save label must stay Korean");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function applyPercentPosition(node, point) {
  node.style.left = `${point.x}%`;
  node.style.top = `${point.y}%`;
}
