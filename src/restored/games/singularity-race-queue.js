import { createSingularityRunnerSlotNode } from "./singularity-race-runner-view.js";

const CHANNEL_LABELS = Object.freeze({
  lobby: "로비 채팅",
  room: "레이스 룸 채팅",
  spectator: "관전자 채팅",
  system: "공지",
  admin: "방장 채팅"
});

const MESSAGE_TEXT_LABELS = Object.freeze({
  "Singularity Race lobby channel is ready.": "특이점레이스 로비 채널이 준비되었습니다.",
  "Spectator channel is ready for public viewing.": "관전자 채널이 열렸습니다.",
  "Admin channel is dev-only until real server auth exists.": "방장 채널은 실제 서버 인증 전까지 개발 전용입니다.",
  "Admin direct game launch joined DEV room.": "방장 페이지에서 개발 방으로 바로 입장했습니다.",
  "DEV connected room joined after join_result ok.": "개발 연결 방 입장을 확인했습니다.",
  "Connected room slots are server-owned in dev mode.": "개발 연결 방의 참가자 위치는 서버가 관리합니다."
});

export function createSingularityQueueSlotNode(runner, index, options = {}) {
  return createSingularityRunnerSlotNode(runner, index, options);
}

export function createSingularityChannelTabNode(channel, activeChannel, onSelect) {
  const button = document.createElement("button");
  button.className = "channel-tab";
  button.type = "button";
  button.textContent = channel.label;
  button.setAttribute("aria-pressed", String(channel.channelId === activeChannel));
  button.addEventListener("click", () => onSelect?.(channel.channelId));
  return button;
}

export function getSingularityChatChannelLabel(channel) {
  return CHANNEL_LABELS[channel?.type] || channel?.label || "채팅";
}

export function isSingularityChatMessageVisible(message, debug = false) {
  if (debug) return true;
  return !(message.senderType === "system" || message.type === "system");
}

export function filterSingularityChatMessages(messages, channel, activeChannel, options = {}) {
  const limit = Math.max(1, Number(options.limit || 8));
  const debug = Boolean(options.debug);
  return messages
    .filter((message) => message.channelId === activeChannel || (!message.channelId && channel?.type === "lobby"))
    .filter((message) => isSingularityChatMessageVisible(message, debug))
    .slice(-limit);
}

export function createSingularityEmptyChatNode() {
  const empty = document.createElement("div");
  empty.className = "message is-system";
  const author = document.createElement("b");
  author.textContent = "채팅";
  const text = document.createElement("span");
  text.textContent = "아직 메시지가 없습니다.";
  empty.append(author, text);
  return empty;
}

export function getSingularityMessageSenderName(message) {
  if (message.senderType === "system" || message.displayName === "SYSTEM" || message.author === "SYSTEM") return "시스템";
  return message.displayName || message.author || "시스템";
}

export function getSingularityMessageText(message) {
  return MESSAGE_TEXT_LABELS[message.text] || message.text;
}

export function createSingularityMessageNode(message) {
  const row = document.createElement("div");
  const mine = message.senderId === "player:you" || message.type === "me";
  const system = message.senderType === "system" || message.type === "system";
  row.className = `message${mine ? " is-me" : ""}${system ? " is-system" : ""}`;
  const author = document.createElement("b");
  author.textContent = getSingularityMessageSenderName(message);
  const text = document.createElement("span");
  text.textContent = getSingularityMessageText(message);
  row.append(author, text);
  return row;
}

export function validateSingularityRaceQueueContract() {
  const errors = [];
  if (getSingularityChatChannelLabel({ type: "lobby" }) !== "로비 채팅") errors.push("lobby channel label must stay Korean");
  if (getSingularityMessageSenderName({ senderType: "system" }) !== "시스템") errors.push("system sender label must stay Korean");
  if (getSingularityMessageText({ text: "Singularity Race lobby channel is ready." }) !== "특이점레이스 로비 채널이 준비되었습니다.") {
    errors.push("initial lobby message must be localized");
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}
