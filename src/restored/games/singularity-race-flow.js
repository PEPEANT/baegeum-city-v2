export const SINGULARITY_RACE_SCREENS = Object.freeze({
  PROFILE: "profile",
  LOBBY: "lobby",
  QUEUE: "queue",
  MAP_PREVIEW: "mapPreview",
  RACE: "race"
});

export const SINGULARITY_RACE_FLOW_ORDER = Object.freeze([
  SINGULARITY_RACE_SCREENS.PROFILE,
  SINGULARITY_RACE_SCREENS.LOBBY,
  SINGULARITY_RACE_SCREENS.QUEUE,
  SINGULARITY_RACE_SCREENS.MAP_PREVIEW,
  SINGULARITY_RACE_SCREENS.RACE
]);

const FLOW_COPY = Object.freeze({
  [SINGULARITY_RACE_SCREENS.PROFILE]: "닉네임과 스킨을 고릅니다.",
  [SINGULARITY_RACE_SCREENS.LOBBY]: "방을 고르고 입장합니다.",
  [SINGULARITY_RACE_SCREENS.QUEUE]: "대기열에서 기다립니다.",
  [SINGULARITY_RACE_SCREENS.MAP_PREVIEW]: "코스를 확인합니다.",
  [SINGULARITY_RACE_SCREENS.RACE]: "경기장에서는 이동, 스킬, 채팅만 남깁니다."
});

export function isSingularityRaceScreen(screen) {
  return SINGULARITY_RACE_FLOW_ORDER.includes(screen);
}

export function getSingularityRacePrimaryActionLabel(screen) {
  return screen === SINGULARITY_RACE_SCREENS.LOBBY ? "입장" : "대기열";
}

export function getSingularityRacePreviewActionLabel(screen) {
  if (screen === SINGULARITY_RACE_SCREENS.LOBBY) return "입장";
  if (screen === SINGULARITY_RACE_SCREENS.MAP_PREVIEW) return "대기열로 돌아가기";
  if (screen === SINGULARITY_RACE_SCREENS.QUEUE) return "맵 미리보기";
  return "경기 보기";
}

export function getSingularityRaceRoomTitle(screen) {
  return screen === SINGULARITY_RACE_SCREENS.LOBBY ? "방 목록" : "대기열";
}

export function getSingularityRaceRoomCopy(screen) {
  return screen === SINGULARITY_RACE_SCREENS.LOBBY
    ? "입장할 방을 고르세요."
    : "방장이 시작하면 함께 출발합니다.";
}

export function getSingularityRaceRoomBadge(screen) {
  return screen === SINGULARITY_RACE_SCREENS.LOBBY ? "로비" : "방";
}

export function getSingularityRaceTrackTitle(screen) {
  if (screen === SINGULARITY_RACE_SCREENS.RACE) return "경기장";
  if (screen === SINGULARITY_RACE_SCREENS.MAP_PREVIEW) return "맵 미리보기";
  return "대기열";
}

export function getSingularityRaceTrackCopy(screen) {
  if (screen === SINGULARITY_RACE_SCREENS.RACE) return "방장 시작 후 한 레일에서 함께 달립니다.";
  if (screen === SINGULARITY_RACE_SCREENS.MAP_PREVIEW) return "코스를 확인합니다.";
  return "슬롯을 확인하고 기다립니다.";
}

export function getSingularityRaceFlowCopy(screen) {
  return FLOW_COPY[screen] || FLOW_COPY[SINGULARITY_RACE_SCREENS.RACE];
}

export function getSingularityRaceNotice(screen) {
  return screen === SINGULARITY_RACE_SCREENS.LOBBY
    ? "방을 고르면 대기열로 이동합니다."
    : "방장이 시작하면 10초 카운트다운 뒤 경기장으로 이동합니다.";
}

export function validateSingularityRaceFlowContract() {
  const errors = [];
  const expectedOrder = ["profile", "lobby", "queue", "mapPreview", "race"];
  if (SINGULARITY_RACE_FLOW_ORDER.join(">") !== expectedOrder.join(">")) {
    errors.push("player flow must stay profile > lobby > queue > mapPreview > race");
  }
  for (const screen of expectedOrder) {
    if (!isSingularityRaceScreen(screen)) errors.push(`${screen} screen is missing`);
  }
  if (getSingularityRacePreviewActionLabel(SINGULARITY_RACE_SCREENS.QUEUE) !== "맵 미리보기") {
    errors.push("queue preview action must stay map-only");
  }
  if (getSingularityRacePreviewActionLabel(SINGULARITY_RACE_SCREENS.MAP_PREVIEW) !== "대기열로 돌아가기") {
    errors.push("map preview must return to queue");
  }
  if (getSingularityRacePreviewActionLabel(SINGULARITY_RACE_SCREENS.LOBBY) !== "입장") {
    errors.push("lobby preview action must not expose race entry");
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}
