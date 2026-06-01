export const SINGULARITY_RACE_CLOUDFLARE_CLIENT_VERSION = "singularity-race-cloudflare-client-001";
export const SINGULARITY_RACE_CLOUDFLARE_ROOM_ID = "room:singularity-race:public-001";
export const SINGULARITY_RACE_CLOUDFLARE_INPUT_MIN_INTERVAL_MS = 100;
export const SINGULARITY_RACE_CLOUDFLARE_SNAPSHOT_HZ = 5;
export const SINGULARITY_RACE_CLOUDFLARE_SNAPSHOT_MAX_HZ = 8;

export function resolveSingularityRaceCloudflareWsUrl(rawEndpoint = "", locationLike = globalThis.location) {
  const endpoint = String(rawEndpoint || "").trim();
  if (endpoint) return normalizeWsEndpoint(endpoint, locationLike);
  const protocol = locationLike?.protocol === "https:" ? "wss:" : "ws:";
  const host = String(locationLike?.host || "");
  if (/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) return "ws://127.0.0.1:8787/ws";
  return host ? `${protocol}//${host}/ws` : "";
}

export function createSingularityRaceCloudflareRoomClient(options = {}) {
  const context = {
    endpoint: resolveSingularityRaceCloudflareWsUrl(options.endpoint, options.locationLike),
    roomId: options.roomId || SINGULARITY_RACE_CLOUDFLARE_ROOM_ID,
    clock: typeof options.clock === "function" ? options.clock : (() => Date.now()),
    onPacket: typeof options.onPacket === "function" ? options.onPacket : () => {},
    onStatus: typeof options.onStatus === "function" ? options.onStatus : () => {}
  };
  let socket = null;
  let sequence = 0;
  let lastInputAtMs = 0;
  let lastInputSignature = "";

  return Object.freeze({
    version: SINGULARITY_RACE_CLOUDFLARE_CLIENT_VERSION,
    connect: (join) => connect(context, join, (next) => { socket = next; }, () => socket),
    close: () => closeSocket(socket),
    isOpen: () => socket?.readyState === WebSocket.OPEN,
    sendEnvelope(envelope) {
      if (socket?.readyState !== WebSocket.OPEN) return false;
      const packet = normalizeClientEnvelope(envelope, context.roomId, ++sequence);
      if (!packet) return false;
      if (packet.type === "input_update" && !acceptInputPacket(packet, context.clock(), {
        get lastInputAtMs() { return lastInputAtMs; },
        set lastInputAtMs(value) { lastInputAtMs = value; },
        get lastInputSignature() { return lastInputSignature; },
        set lastInputSignature(value) { lastInputSignature = value; }
      })) return false;
      socket.send(JSON.stringify(packet));
      return true;
    },
    sendStartRequest() {
      if (socket?.readyState !== WebSocket.OPEN) return false;
      socket.send(JSON.stringify({ type: "start_request", roomId: context.roomId, sequence: ++sequence, payload: { roomId: context.roomId } }));
      return true;
    }
  });
}

function connect(context, join, setSocket, getSocket) {
  if (!context.endpoint) return Promise.reject(new Error("cloudflare_endpoint_required"));
  closeSocket(getSocket());
  return new Promise((resolve, reject) => {
    const url = createJoinUrl(context.endpoint, context.roomId, join);
    const socket = new WebSocket(url);
    let settled = false;
    const timer = setTimeout(() => fail(new Error("cloudflare_join_timeout")), 8000);
    setSocket(socket);
    socket.addEventListener("open", () => {
      context.onStatus({ status: "open", endpoint: context.endpoint });
    });
    socket.addEventListener("message", (event) => {
      const packet = parsePacket(event.data);
      if (!packet) return;
      context.onPacket(packet);
      if (!settled && packet.type === "join_result") {
        settled = true;
        clearTimeout(timer);
        resolve(packet);
      }
    });
    socket.addEventListener("close", () => {
      context.onStatus({ status: "closed" });
      if (!settled) fail(new Error("cloudflare_socket_closed"));
    });
    socket.addEventListener("error", () => fail(new Error("cloudflare_socket_error")));
    function fail(error) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      closeSocket(socket);
      reject(error);
    }
  });
}

function createJoinUrl(endpoint, roomId, join = {}) {
  const url = new URL(endpoint);
  url.searchParams.set("roomId", roomId);
  url.searchParams.set("nickname", String(join.nickname || ""));
  url.searchParams.set("skinPreset", String(join.skinPreset || ""));
  url.searchParams.set("participantType", join.participantType === "spectator" ? "spectator" : "player");
  if (join.clientId) url.searchParams.set("clientId", join.clientId);
  return url.toString();
}

function normalizeClientEnvelope(envelope = {}, roomId, sequence) {
  if (!envelope.type) return null;
  return {
    transportVersion: envelope.transportVersion || "restored-marathon-server-transport-001",
    type: envelope.type,
    clientId: envelope.clientId || "",
    roomId: envelope.roomId || roomId,
    sequence: Math.max(1, Number(envelope.sequence || sequence)),
    serverTimeMs: 0,
    payload: { roomId, ...(envelope.payload || {}) }
  };
}

function acceptInputPacket(packet, now, state) {
  const signature = inputSignature(packet.payload);
  if (signature === state.lastInputSignature && now - state.lastInputAtMs < SINGULARITY_RACE_CLOUDFLARE_INPUT_MIN_INTERVAL_MS) return false;
  state.lastInputAtMs = now;
  state.lastInputSignature = signature;
  return true;
}

function inputSignature(payload = {}) {
  const direction = payload.direction || {};
  return [
    payload.pace || "",
    payload.mode || "",
    Math.round(Number(direction.x || 0) * 10) / 10,
    Math.round(Number(direction.y || 0) * 10) / 10
  ].join(":");
}

function normalizeWsEndpoint(endpoint, locationLike) {
  if (/^wss?:\/\//i.test(endpoint)) return endpoint;
  if (/^https:\/\//i.test(endpoint)) return endpoint.replace(/^https:/i, "wss:");
  if (/^http:\/\//i.test(endpoint)) return endpoint.replace(/^http:/i, "ws:");
  const base = `${locationLike?.protocol || "http:"}//${locationLike?.host || "127.0.0.1:8787"}`;
  const url = new URL(endpoint, base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

function parsePacket(value) {
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
}

function closeSocket(socket) {
  if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) return;
  socket.close();
}
