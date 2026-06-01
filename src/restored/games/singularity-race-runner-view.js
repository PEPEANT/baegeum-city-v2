const SKILL_LABELS = Object.freeze({
  "skill:steady-boost": "시간 가속",
  "skill:slip-trail": "미끄럼 길",
  "skill:side-bump": "옆 밀치기",
  "skill:input-scramble": "방향 흔들기",
  "skill:checkpoint-hop": "체크포인트 점프",
  "skill:stamina-sip": "스태미나 회복",
  "skill:noise-burst": "소음 폭발",
  "skill:guard-roll": "가드 구르기"
});

const RUN_STYLE_BY_SKIN = Object.freeze({
  kaguya: "glide",
  "singularity-fan": "quick",
  robot: "robot",
  gpichan: "bounce",
  "doomer-runner": "heavy",
  "pepe-runner": "hop",
  "doge-runner": "quick",
  "ant-squad": "quick",
  "moderator-armband": "quick",
  yalrkun: "bounce",
  "lakers-wile": "glide",
  "sam-altman": "glide",
  "demis-hassabis": "quick",
  "ai-believer": "robot",
  "server-crash": "quick",
  "profit-fairy": "bounce",
  "stoploss-warrior": "heavy",
  "grok-chan": "glide",
  "gemini-chan": "bounce",
  "claude-chan": "glide",
  "atlas-robot": "robot",
  "donald-trump": "heavy",
  "lee-jaemyung": "quick",
  "von-neumann": "glide"
});

export function createSingularityRunnerAvatarNode(runner) {
  const avatar = document.createElement("div");
  avatar.dataset.runnerId = runner.id;
  const image = document.createElement("img");
  const chatBubble = document.createElement("span");
  chatBubble.className = "runner-chat-bubble";
  chatBubble.hidden = true;
  const attackSwipe = document.createElement("span");
  attackSwipe.className = "runner-attack-swipe";
  const hitBurst = document.createElement("span");
  hitBurst.className = "runner-hit-burst";
  hitBurst.setAttribute("aria-hidden", "true");
  const rankBadge = document.createElement("span");
  rankBadge.className = "runner-rank-badge";
  rankBadge.hidden = true;
  const nameplate = document.createElement("span");
  nameplate.className = "runner-nameplate";
  avatar.append(chatBubble, rankBadge, image, attackSwipe, hitBurst, nameplate);
  return avatar;
}

export function updateSingularityRunnerAvatarNode(avatar, runner, skinSrc, options = {}) {
  const image = avatar.querySelector("img");
  const chatBubble = avatar.querySelector(".runner-chat-bubble");
  const rankBadge = avatar.querySelector(".runner-rank-badge");
  const nameplate = avatar.querySelector(".runner-nameplate");
  avatar.dataset.skinId = String(runner.skin || "");
  avatar.dataset.runStyle = String(options.runStyle || resolveSingularityRunnerRunStyle(runner.skin));
  if (image) {
    image.alt = `${runner.name} skin`;
    if (image.src !== skinSrc) image.src = skinSrc;
  }
  if (chatBubble) {
    const bubbleText = String(options.chatBubbleText || "").trim();
    chatBubble.textContent = bubbleText;
    chatBubble.title = bubbleText;
    chatBubble.hidden = !bubbleText;
    chatBubble.classList.toggle("has-text", Boolean(bubbleText));
  }
  if (rankBadge) {
    const rankLabel = String(options.rankLabel || "").trim();
    rankBadge.textContent = rankLabel;
    rankBadge.title = rankLabel;
    rankBadge.hidden = !rankLabel;
  }
  if (nameplate) {
    nameplate.textContent = runner.name;
    nameplate.title = runner.name;
  }
}

export function resolveSingularityRunnerRunStyle(skinId) {
  return RUN_STYLE_BY_SKIN[String(skinId || "").trim()] || "stride";
}

export function createSingularityRunnerSlotNode(runner, index, options = {}) {
  const slot = document.createElement("div");
  slot.className = `runner-slot${runner?.id === "you" ? " is-player" : ""}`;
  const name = document.createElement("strong");
  name.textContent = runner
    ? `${formatSlotNumber(index)} ${runner.name}`
    : `${formatSlotNumber(index)} 빈 자리`;
  const status = document.createElement("span");
  status.textContent = runner ? createRunnerSlotStatus(runner, options) : "빈 자리";
  slot.append(name, status);
  return slot;
}

export function rankSingularityRunnerEntries(runners) {
  return runners
    .map((runner, index) => ({ runner, index }))
    .sort((left, right) => right.runner.progress - left.runner.progress || left.index - right.index)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function createSingularityStandingRowNode(entry, playerRank) {
  const row = document.createElement("div");
  row.className = `standing-row${entry.runner.id === "you" ? " is-player" : ""}${entry.rank <= 3 ? " is-top-rank" : ""}`;
  row.dataset.rank = `${entry.rank}위`;
  const title = document.createElement("b");
  title.textContent = entry.runner.id === "you" ? `${entry.runner.name} · 나` : entry.runner.name;
  title.title = entry.runner.id === "you" ? `내 순위 ${playerRank}위` : `${entry.rank}위`;
  row.append(title);
  return row;
}

export function createSingularityCheckpointDotNode(checkpoint, index, cleared) {
  const dot = document.createElement("span");
  dot.className = `checkpoint-dot${cleared ? " is-cleared" : ""}`;
  dot.textContent = `세이브 ${index + 1} / ${checkpoint}%`;
  return dot;
}

export function createSingularityPacketRowNode(packet) {
  const row = document.createElement("div");
  row.className = "packet";
  const title = document.createElement("strong");
  title.textContent = packet.type;
  const body = document.createElement("span");
  body.textContent = packet.detail;
  row.append(title, body);
  return row;
}

export function getSingularitySkillDisplayName(skillId) {
  return SKILL_LABELS[skillId] || "기본 스킬";
}

export function getSingularityActionStatusLabel(status) {
  if (status.connected) return status.debug ? "서버 대기" : "온라인 대기";
  if (status.countdown) return "카운트다운";
  if (!status.raceStarted) return "출발 대기";
  if (status.stalled) return "공격 후 멈춤";
  return "달리는 중";
}

export function validateSingularityRaceRunnerViewContract() {
  const errors = [];
  for (const skillId of ["skill:checkpoint-hop", "skill:guard-roll"]) {
    if (!getSingularitySkillDisplayName(skillId)) errors.push(`${skillId} label is missing`);
  }
  if (getSingularityActionStatusLabel({ raceStarted: true }) !== "달리는 중") {
    errors.push("running action status label is missing");
  }
  if (getSingularityActionStatusLabel({ connected: true, debug: false }) !== "온라인 대기") {
    errors.push("connected player status must stay Korean");
  }
  if (resolveSingularityRunnerRunStyle("robot") !== "robot") errors.push("robot needs a mechanical run style");
  if (resolveSingularityRunnerRunStyle("atlas-robot") !== "robot") errors.push("아틀라스 needs a robot run style");
  if (resolveSingularityRunnerRunStyle("ai-believer") !== "robot") errors.push("특궁 should keep a mechanical Robocop-style run");
  if (resolveSingularityRunnerRunStyle("server-crash") !== "quick") errors.push("역류기 should keep a quick hacker run");
  if (resolveSingularityRunnerRunStyle("gpichan") !== "bounce") errors.push("gpichan needs a bouncy run style");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function formatSlotNumber(index) {
  return String(index + 1).padStart(2, "0");
}

function createRunnerSlotStatus(runner, options) {
  if (!options.debug) return "입장";
  const hpText = runner.hp === undefined ? "" : ` / 체력 ${runner.hp}`;
  const progressText = ` / ${Math.round(runner.progress)}%`;
  return `${runner.ready ? "준비" : "대기"}${progressText}${hpText}`;
}
