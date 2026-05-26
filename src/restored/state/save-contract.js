export const RESTORED_SAVE_VERSION = "restored-save-001";

export const RESTORED_STORAGE_KEY = "baegeum_city_v2_dice_restore";

export const RESTORED_STATE_DOMAINS = Object.freeze([
  "cash",
  "stocks",
  "crypto",
  "futures",
  "realEstate",
  "luxury",
  "profile",
  "account",
  "online",
  "location",
  "newsHistory",
  "partners",
  "recentEvents"
]);

export function createRestoredSaveEnvelope(state, savedAt = new Date().toISOString()) {
  return Object.freeze({
    saveVersion: RESTORED_SAVE_VERSION,
    storageKey: RESTORED_STORAGE_KEY,
    savedAt,
    state
  });
}

export function isRestoredSaveEnvelope(value) {
  return Boolean(
    value
      && value.saveVersion === RESTORED_SAVE_VERSION
      && value.storageKey === RESTORED_STORAGE_KEY
      && value.state
      && typeof value.state === "object"
  );
}
