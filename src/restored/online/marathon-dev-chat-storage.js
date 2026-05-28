import { RESTORED_MARATHON_CHAT_STORAGE_KEY } from "./marathon-channel-adapter.js";

export function createRestoredMarathonDevChatStorageKey(roomId = "") {
  const safeRoomId = String(roomId || "").trim();
  return safeRoomId
    ? `${RESTORED_MARATHON_CHAT_STORAGE_KEY}:${safeKey(safeRoomId)}`
    : RESTORED_MARATHON_CHAT_STORAGE_KEY;
}

export function inferRestoredMarathonRoomIdFromChannels(channels = []) {
  const room = channels.find((channel) => channel?.type === "room");
  return room?.channelId?.startsWith("room:") ? room.channelId : "";
}

function safeKey(value) {
  return String(value || "").trim().replace(/[^a-zA-Z0-9:_-]/g, "_");
}
