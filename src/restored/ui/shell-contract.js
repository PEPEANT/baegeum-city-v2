export const RESTORED_SHELL_CONTRACT_VERSION = "restored-shell-001";

export {
  RESTORED_PHONE_APPS,
  getRestoredPhoneAppGate,
  listRestoredPhoneAppIds
} from "../phone/phone-app-contract.js";

import {
  RESTORED_PHONE_APPS,
  getRestoredPhoneAppGate,
  validateRestoredPhoneAppContract
} from "../phone/phone-app-contract.js";
import { RESTORED_LOCATION_CONTEXT_IDS } from "../data/location-catalog.js";
import {
  listRestoredLocationNavActions,
  validateRestoredLocationNavContract
} from "./location-nav-contract.js";

export const RESTORED_BOTTOM_TABS = Object.freeze([
  Object.freeze({ id: "myinfo", domain: "identity", visibility: "location:home_inside" }),
  Object.freeze({ id: "home", domain: "home", visibility: "location:home_inside" }),
  Object.freeze({ id: "go_out", domain: "navigation", visibility: "location:home_inside" })
]);

export const RESTORED_UI_SURFACES = Object.freeze([
  "top-bar",
  "location-bottom-nav",
  "phone-dock",
  "phone-shell",
  "home-surface",
  "place-surface",
  "travel-surface",
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

export function validateRestoredShellContract() {
  const errors = [];
  const phoneValidation = validateRestoredPhoneAppContract();
  const navValidation = validateRestoredLocationNavContract();
  const tabIds = new Set();
  const appIds = new Set();

  if (!phoneValidation.ok) errors.push(...phoneValidation.errors);
  if (!navValidation.ok) errors.push(...navValidation.errors);

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

  const homeInsideActions = listRestoredLocationNavActions(RESTORED_LOCATION_CONTEXT_IDS.HOME_INSIDE).map((action) => action.id);
  for (const required of ["myinfo", "home", "go_out"]) {
    if (!tabIds.has(required)) errors.push(`missing bottom tab: ${required}`);
    if (!homeInsideActions.includes(required)) errors.push(`home_inside must expose bottom action: ${required}`);
  }
  if (tabIds.has("phone")) errors.push("phone must be opened from the phone dock, not the bottom nav");
  for (const required of ["news", "stock", "relationships", "futures"]) {
    if (!appIds.has(required)) errors.push(`missing phone app: ${required}`);
  }
  if (getRestoredPhoneAppGate("relationships") !== "phone") {
    errors.push("relationships app must require phone gate");
  }
  if (getRestoredPhoneAppGate("futures") !== "smartphone") {
    errors.push("futures app must require smartphone gate");
  }

  return Object.freeze({ ok: errors.length === 0, errors });
}
