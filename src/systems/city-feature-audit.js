import { phoneApps, summarizePhoneApps } from "../devices/phone/phone-app-catalog.js";

export const CITY_FEATURE_AUDIT_SCHEMA_VERSION = "city-feature-audit-001";

export function createCityFeatureAudit({ map = null, apps = phoneApps } = {}) {
  const buildings = Array.isArray(map?.buildings) ? map.buildings : [];
  const buildingSummary = summarizeBuildings(buildings);
  const appSummary = summarizePhoneApps(apps);
  return {
    schemaVersion: CITY_FEATURE_AUDIT_SCHEMA_VERSION,
    mapId: map?.mapId || "unknown-map",
    buildings: buildingSummary,
    apps: appSummary,
    riskFlags: createRiskFlags(buildingSummary, appSummary)
  };
}

function summarizeBuildings(buildings) {
  const entries = buildings.map((building) => buildingState(building));
  return {
    total: entries.length,
    enterable: entries.filter((item) => item.hasEntrance).length,
    visualOnly: entries.filter((item) => item.visualOnly).length,
    missingSign: entries.filter((item) => !item.hasSign).length,
    missingEntrance: entries.filter((item) => !item.hasEntrance).length,
    functionless: entries.filter((item) => !item.hasFunction).length,
    locked: entries.filter((item) => item.status === "locked").length,
    entries
  };
}

function buildingState(building) {
  const hasEntrance = Array.isArray(building?.doors) && building.doors.length > 0;
  const hasSign = Boolean(String(building?.sign || building?.name || "").trim());
  const hasFunction = hasEntrance || hasInteraction(building) || hasVenueFunction(building);
  return {
    id: building?.id || building?.rect?.id || "unknown-building",
    label: building?.sign || building?.name || building?.label || "unnamed",
    hasSign,
    hasEntrance,
    hasFunction,
    visualOnly: Boolean(building?.infrastructure || building?.rect?.objectKind === "building_shell") && !hasFunction,
    status: building?.status || (hasFunction ? "active" : "visual_only")
  };
}

function hasInteraction(building) {
  return Array.isArray(building?.interactions) && building.interactions.some((item) => item?.enabled !== false);
}

function hasVenueFunction(building) {
  return Boolean(building?.gameType || building?.onlineRoomId || building?.channels?.venue);
}

function createRiskFlags(buildings, apps) {
  return {
    signsWithoutFunction: Math.max(0, buildings.total - buildings.functionless) < buildings.total && buildings.functionless > 0,
    appsWithoutWorkingButtons: apps.total > 0 && apps.workingButtonApps === 0,
    lockedAppsVisible: apps.locked > 0,
    missingBuildingEntrances: buildings.missingEntrance > 0
  };
}
