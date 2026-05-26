export const RESTORED_SHELL_CONTRACT_VERSION = "restored-shell-001";

export const RESTORED_BOTTOM_TABS = Object.freeze([
  Object.freeze({ id: "myinfo", domain: "identity", visibility: "always" }),
  Object.freeze({ id: "phone", domain: "phone_shell", visibility: "always" }),
  Object.freeze({ id: "realestate", domain: "ownership", visibility: "always" }),
  Object.freeze({ id: "casino", domain: "gambling", visibility: "always" }),
  Object.freeze({ id: "shop", domain: "ownership", visibility: "always" })
]);

export const RESTORED_PHONE_APPS = Object.freeze([
  Object.freeze({ id: "news", gate: "phone", domain: "news" }),
  Object.freeze({ id: "stock", gate: "phone", domain: "market" }),
  Object.freeze({ id: "futures", gate: "smartphone", domain: "futures" })
]);

export const RESTORED_UI_SURFACES = Object.freeze([
  "top-bar",
  "bottom-nav",
  "phone-shell",
  "relationship-panel",
  "dialogue-modal",
  "illustration-stage",
  "casino-surface",
  "city-surface",
  "toast"
]);

export function listRestoredBottomTabIds() {
  return RESTORED_BOTTOM_TABS.map((tab) => tab.id);
}

export function listRestoredPhoneAppIds() {
  return RESTORED_PHONE_APPS.map((app) => app.id);
}

export function getRestoredPhoneAppGate(appId) {
  const app = RESTORED_PHONE_APPS.find((candidate) => candidate.id === appId);
  return app ? app.gate : null;
}

export function validateRestoredShellContract() {
  const errors = [];
  const tabIds = new Set();
  const appIds = new Set();

  for (const tab of RESTORED_BOTTOM_TABS) {
    if (tabIds.has(tab.id)) errors.push(`duplicate bottom tab: ${tab.id}`);
    tabIds.add(tab.id);
  }

  for (const app of RESTORED_PHONE_APPS) {
    if (appIds.has(app.id)) errors.push(`duplicate phone app: ${app.id}`);
    appIds.add(app.id);
    if (tabIds.has(app.id)) {
      errors.push(`phone app must not be a bottom tab: ${app.id}`);
    }
  }

  for (const required of ["myinfo", "phone", "realestate", "casino", "shop"]) {
    if (!tabIds.has(required)) errors.push(`missing bottom tab: ${required}`);
  }
  for (const required of ["news", "stock", "futures"]) {
    if (!appIds.has(required)) errors.push(`missing phone app: ${required}`);
  }
  if (getRestoredPhoneAppGate("futures") !== "smartphone") {
    errors.push("futures app must require smartphone gate");
  }

  return Object.freeze({ ok: errors.length === 0, errors });
}
