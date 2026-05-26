export const RESTORED_ONLINE_ADAPTER_VERSION = "restored-online-adapter-001";

export const RESTORED_ONLINE_STATUSES = Object.freeze([
  "unavailable",
  "connecting",
  "connected",
  "disconnected",
  "error"
]);

export const RESTORED_ONLINE_ADAPTER_TYPES = Object.freeze([
  "unavailable",
  "dev_mock",
  "remote"
]);

export function createInitialRestoredOnlineState() {
  return {
    status: "unavailable",
    provider: "none",
    clientId: "",
    serverTimeMs: 0,
    lastError: "",
    lobbyEnabled: false
  };
}

export function createRestoredUnavailableOnlineAdapter(reason = "not_configured") {
  return {
    adapterVersion: RESTORED_ONLINE_ADAPTER_VERSION,
    adapterType: "unavailable",
    provider: "none",
    canConnect: false,
    canOpenLobby: false,
    reason,
    state: createInitialRestoredOnlineState()
  };
}

export function createRestoredOnlineAdapterSnapshot(options = {}) {
  const state = {
    ...createInitialRestoredOnlineState(),
    ...options.state
  };
  return {
    adapterVersion: RESTORED_ONLINE_ADAPTER_VERSION,
    adapterType: options.adapterType || "unavailable",
    provider: options.provider || state.provider || "none",
    canConnect: Boolean(options.canConnect),
    canOpenLobby: Boolean(options.canOpenLobby),
    reason: options.reason || "",
    state
  };
}

export function canUseRestoredOnlineLobby(adapter) {
  return Boolean(
    adapter
      && adapter.canOpenLobby
      && adapter.state
      && adapter.state.status === "connected"
      && adapter.state.lobbyEnabled === true
  );
}

export function validateRestoredOnlineState(online) {
  const errors = [];
  if (!online || typeof online !== "object") {
    return Object.freeze({ ok: false, errors: ["online must be an object"] });
  }
  if (!RESTORED_ONLINE_STATUSES.includes(online.status)) {
    errors.push(`unknown online status: ${online.status}`);
  }
  if (online.lobbyEnabled && online.status !== "connected") {
    errors.push("online lobby can only be enabled while connected");
  }
  return Object.freeze({ ok: errors.length === 0, errors });
}

export function validateRestoredOnlineAdapter(adapter) {
  const errors = [];
  if (!adapter || typeof adapter !== "object") {
    return Object.freeze({ ok: false, errors: ["adapter must be an object"] });
  }
  if (adapter.adapterVersion !== RESTORED_ONLINE_ADAPTER_VERSION) {
    errors.push(`unknown adapter version: ${adapter.adapterVersion}`);
  }
  if (!RESTORED_ONLINE_ADAPTER_TYPES.includes(adapter.adapterType)) {
    errors.push(`unknown adapter type: ${adapter.adapterType}`);
  }

  const stateValidation = validateRestoredOnlineState(adapter.state);
  errors.push(...stateValidation.errors);

  if (adapter.adapterType === "unavailable") {
    if (adapter.state?.status !== "unavailable") errors.push("unavailable adapter must expose unavailable state");
    if (adapter.canConnect) errors.push("unavailable adapter must not connect");
    if (adapter.canOpenLobby) errors.push("unavailable adapter must not open lobby");
  }

  if (canUseRestoredOnlineLobby(adapter) && adapter.adapterType === "unavailable") {
    errors.push("unavailable adapter cannot enable lobby");
  }

  return Object.freeze({ ok: errors.length === 0, errors });
}
