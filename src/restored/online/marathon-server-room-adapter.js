import { createRestoredOnlineAdapterSnapshot } from "./online-adapter-contract.js";
import { createRestoredMarathonChannelSet } from "./marathon-channel-adapter.js";
import { canUseRestoredMarathonServerTransport } from "./marathon-server-transport-contract.js";
import { RESTORED_MARATHON_AUTHORITY, createRestoredMarathonRoom } from "../games/marathon-contract.js";

const ROOM_ADAPTER_VERSION = "restored-marathon-room-adapter-001";
const SERVER_ROOM_FALLBACK_ID = "room:singularity-race:server-pending";

export function createServerBackedMarathonRoomAdapter(options = {}) {
  const transport = options.transport || {};
  const connected = canUseRestoredMarathonServerTransport(transport);
  const rooms = connected ? normalizeServerRooms(options.rooms || []) : [];
  const lobbyEnabled = connected && rooms.length > 0;
  const provider = transport.provider || "none";
  return Object.freeze({
    adapterVersion: ROOM_ADAPTER_VERSION,
    adapterType: "server_transport",
    provider,
    devOnly: false,
    reason: lobbyEnabled ? "server_transport_connected" : transport.lastError || "server_room_list_unavailable",
    online: createRestoredOnlineAdapterSnapshot({
      adapterType: "remote",
      provider,
      canConnect: connected,
      canOpenLobby: lobbyEnabled,
      state: {
        status: toOnlineStatus(transport.status),
        provider,
        clientId: transport.clientId || "",
        serverTimeMs: transport.serverTimeMs || 0,
        lobbyEnabled,
        lastError: transport.lastError || ""
      }
    }),
    channels: createRestoredMarathonChannelSet({ roomId: rooms[0]?.roomId || transport.roomId || SERVER_ROOM_FALLBACK_ID }),
    rooms: Object.freeze(rooms)
  });
}

function normalizeServerRooms(roomInputs) {
  return Object.freeze(roomInputs.map((roomInput) => createRestoredMarathonRoom({
    ...roomInput,
    authority: RESTORED_MARATHON_AUTHORITY.SERVER_REQUIRED
  })));
}

function toOnlineStatus(status) {
  if (status === "connected") return "connected";
  if (status === "connecting") return "connecting";
  if (status === "unavailable") return "unavailable";
  return "disconnected";
}
