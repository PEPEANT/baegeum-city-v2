import { RESTORED_CITY_IDS } from "./city-catalog.js";

export const RESTORED_LOCATION_CATALOG_VERSION = "restored-location-catalog-001";

export const RESTORED_LOCATION_CONTEXT_IDS = Object.freeze({
  HOME_INSIDE: "home_inside",
  HOME_FRONT: "home_front",
  TRAVEL: "travel",
  BAEGEUM_CITY: "baegeum-city",
  DICE_CITY: "dice-city",
  SEOSAN_CITY: "seosan-city"
});

export const RESTORED_LOCATION_CONTEXTS = Object.freeze([
  Object.freeze({
    id: RESTORED_LOCATION_CONTEXT_IDS.HOME_INSIDE,
    cityId: RESTORED_CITY_IDS.BAEGEUM,
    label: "우리집 안",
    kind: "home",
    defaultPlaceId: "home:inside"
  }),
  Object.freeze({
    id: RESTORED_LOCATION_CONTEXT_IDS.HOME_FRONT,
    cityId: RESTORED_CITY_IDS.BAEGEUM,
    label: "집앞",
    kind: "neighborhood",
    defaultPlaceId: "home:front"
  }),
  Object.freeze({
    id: RESTORED_LOCATION_CONTEXT_IDS.TRAVEL,
    cityId: null,
    label: "버스 정류장",
    kind: "travel",
    defaultPlaceId: "travel:bus-stop"
  }),
  Object.freeze({
    id: RESTORED_LOCATION_CONTEXT_IDS.BAEGEUM_CITY,
    cityId: RESTORED_CITY_IDS.BAEGEUM,
    label: "배금도시",
    kind: "city",
    defaultPlaceId: "baegeum:street"
  }),
  Object.freeze({
    id: RESTORED_LOCATION_CONTEXT_IDS.DICE_CITY,
    cityId: RESTORED_CITY_IDS.DICE,
    label: "다이스시티",
    kind: "city",
    defaultPlaceId: "dice:casino-floor"
  }),
  Object.freeze({
    id: RESTORED_LOCATION_CONTEXT_IDS.SEOSAN_CITY,
    cityId: RESTORED_CITY_IDS.SEOSAN,
    label: "서산도시",
    kind: "city",
    defaultPlaceId: "seosan:labor-front"
  })
]);

export function getRestoredLocationContext(contextId) {
  return RESTORED_LOCATION_CONTEXTS.find((context) => context.id === contextId) || null;
}

export function listRestoredLocationContextIds() {
  return RESTORED_LOCATION_CONTEXTS.map((context) => context.id);
}

export function createInitialRestoredLocationState() {
  return {
    cityId: RESTORED_CITY_IDS.BAEGEUM,
    contextId: RESTORED_LOCATION_CONTEXT_IDS.HOME_INSIDE,
    placeId: "home:inside",
    previousContextId: null
  };
}

export function validateRestoredLocationCatalog(contexts = RESTORED_LOCATION_CONTEXTS) {
  const errors = [];
  const ids = new Set();

  for (const context of contexts) {
    if (!context.id) errors.push("location context id is required");
    if (ids.has(context.id)) errors.push(`duplicate location context: ${context.id}`);
    ids.add(context.id);
    if (!context.label) errors.push(`${context.id || "unknown"} label is required`);
    if (!context.kind) errors.push(`${context.id || "unknown"} kind is required`);
    if (!context.defaultPlaceId) errors.push(`${context.id || "unknown"} defaultPlaceId is required`);
  }
  for (const required of Object.values(RESTORED_LOCATION_CONTEXT_IDS)) {
    if (!ids.has(required)) errors.push(`${required} context is required`);
  }

  return Object.freeze({ ok: errors.length === 0, errors });
}
