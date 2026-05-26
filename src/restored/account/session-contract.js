export const RESTORED_ACCOUNT_SESSION_VERSION = "restored-account-session-001";

export const RESTORED_ACCOUNT_MODES = Object.freeze([
  "signed_out",
  "guest",
  "local",
  "online"
]);

export {
  RESTORED_ONLINE_STATUSES,
  createInitialRestoredOnlineState,
  validateRestoredOnlineState
} from "../online/online-adapter-contract.js";

export function createInitialRestoredAccountState() {
  return {
    sessionVersion: RESTORED_ACCOUNT_SESSION_VERSION,
    mode: "signed_out",
    provider: "none",
    playerId: "",
    displayName: "",
    createdAt: "",
    lastLoginAt: "",
    legacySaveCodeVisible: false
  };
}

export function createRestoredGuestAccountState(options = {}) {
  const now = options.now || new Date().toISOString();
  const displayName = normalizeDisplayName(options.displayName || "Player");
  return {
    sessionVersion: RESTORED_ACCOUNT_SESSION_VERSION,
    mode: "guest",
    provider: "local_guest",
    playerId: options.playerId || "guest:local-player",
    displayName,
    createdAt: options.createdAt || now,
    lastLoginAt: now,
    legacySaveCodeVisible: false
  };
}

export function canEnterRestoredGame(account) {
  return Boolean(account && ["guest", "local", "online"].includes(account.mode));
}

export function shouldShowRestoredLegacySaveCodeUi(account) {
  return Boolean(account && account.legacySaveCodeVisible === true);
}

export function validateRestoredAccountState(account) {
  const errors = [];
  if (!account || typeof account !== "object") {
    return Object.freeze({ ok: false, errors: ["account must be an object"] });
  }
  if (!RESTORED_ACCOUNT_MODES.includes(account.mode)) {
    errors.push(`unknown account mode: ${account.mode}`);
  }
  if (canEnterRestoredGame(account) && !account.playerId) {
    errors.push("enterable account must have playerId");
  }
  if (canEnterRestoredGame(account) && !account.displayName) {
    errors.push("enterable account must have displayName");
  }
  return Object.freeze({ ok: errors.length === 0, errors });
}

function normalizeDisplayName(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "Player";
  return normalized.slice(0, 20);
}
