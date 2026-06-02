export function createSingularityPlayerFocusRingNode(point, cueType) {
  const focus = document.createElement("div");
  focus.className = `player-focus-ring${cueType === "checkpoint" ? " is-checkpoint" : ""}${cueType === "respawn" ? " is-respawn" : ""}`;
  applyPercentPosition(focus, point);
  return focus;
}

export function createSingularityStartGateNode(point, options = {}) {
  const openProgress = clampUnit(options.openProgress);
  const node = document.createElement("div");
  node.className = `start-gate${openProgress > 0 ? " is-opening" : ""}${openProgress >= 1 ? " is-open" : ""}`;
  node.style.setProperty("--gate-open-y", `${Math.round(openProgress * 84)}px`);
  node.style.setProperty("--gate-open-scale", String(Math.max(0.08, 1 - (openProgress * 0.92))));
  node.style.setProperty("--gate-open-opacity", String(Math.max(0.12, 1 - (openProgress * 0.82))));
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
  node.className = `track-cue is-${cue.type}${cue.rewardGrade ? ` is-grade-${String(cue.rewardGrade).toLowerCase()} has-reward` : ""}`;
  applyPercentPosition(node, point);
  if (cue.rewardGrade || cue.rewardLabel || cue.rewardDetail) {
    node.dataset.grade = cue.rewardGrade || "";
    const grade = document.createElement("b");
    grade.textContent = cue.rewardGrade ? `${cue.rewardGrade}급` : cue.label;
    const label = document.createElement("strong");
    label.textContent = cue.rewardLabel || cue.label;
    const detail = document.createElement("span");
    detail.textContent = cue.rewardDetail || "";
    node.append(grade, label, detail);
    return node;
  }
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
    checkpoints: [28],
    checkpointIndex: 0,
    countdownActive: false,
    raceStarted: false
  });
  const racing = getSingularityTrackProgressDetail({
    checkpoints: [28],
    checkpointIndex: 0,
    countdownActive: false,
    raceStarted: true
  });
  if (waiting !== "출발 대기") errors.push("waiting label must stay Korean");
  if (racing !== "다음 세이브 1 / 28%") errors.push("next save label must stay Korean");
  if (typeof document !== "undefined") {
    const rewardNode = createSingularityTrackCueNode({
      type: "checkpoint",
      label: "S급 임시 스킨",
      rewardGrade: "S",
      rewardLabel: "S급 임시 스킨",
      rewardDetail: "보상 표시"
    }, { x: 50, y: 50 });
    if (!rewardNode.className.includes("has-reward") || rewardNode.dataset.grade !== "S") errors.push("checkpoint reward cue should expose the placeholder grade");
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function applyPercentPosition(node, point) {
  node.style.left = `${point.x}%`;
  node.style.top = `${point.y}%`;
}

function clampUnit(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}
