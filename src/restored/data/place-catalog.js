import { RESTORED_CITY_IDS } from "./city-catalog.js";

export const RESTORED_PLACE_CATALOG_VERSION = "restored-place-catalog-001";

export const RESTORED_PLACE_CATALOG = Object.freeze([
  Object.freeze({
    id: "baegeum:street",
    cityId: RESTORED_CITY_IDS.BAEGEUM,
    label: "배금도시 거리",
    kind: "district",
    uiSurface: "city",
    actorSlots: Object.freeze(["street_npc", "partner_meet"]),
    featureDomains: Object.freeze(["relationship", "ownership"])
  }),
  Object.freeze({
    id: "baegeum:phone-space",
    cityId: RESTORED_CITY_IDS.BAEGEUM,
    label: "휴대폰 화면",
    kind: "phone",
    uiSurface: "phone",
    actorSlots: Object.freeze(["phone_contact"]),
    featureDomains: Object.freeze(["phone_apps", "conversation"])
  }),
  Object.freeze({
    id: "dice:casino-floor",
    cityId: RESTORED_CITY_IDS.DICE,
    label: "다이스시티 카지노",
    kind: "casino",
    uiSurface: "casino",
    actorSlots: Object.freeze(["partner_follow", "casino_staff"]),
    featureDomains: Object.freeze(["casino", "relationship_reactions"])
  }),
  Object.freeze({
    id: "dice:back-alley",
    cityId: RESTORED_CITY_IDS.DICE,
    label: "다이스시티 뒷골목",
    kind: "district",
    uiSurface: "city",
    actorSlots: Object.freeze(["street_npc", "risk_contact"]),
    featureDomains: Object.freeze(["risk_events", "relationship_reactions"])
  })
]);

export function listRestoredPlacesForCity(cityId) {
  return RESTORED_PLACE_CATALOG.filter((place) => place.cityId === cityId);
}

export function getRestoredPlace(placeId) {
  return RESTORED_PLACE_CATALOG.find((place) => place.id === placeId) || null;
}

export function validateRestoredPlaceCatalog(catalog = RESTORED_PLACE_CATALOG) {
  const errors = [];
  const ids = new Set();

  for (const place of catalog) {
    if (!place.id) errors.push("place id is required");
    if (ids.has(place.id)) errors.push(`duplicate place id: ${place.id}`);
    ids.add(place.id);
    if (!place.cityId) errors.push(`${place.id} cityId is required`);
    if (!place.kind) errors.push(`${place.id} kind is required`);
    if (!place.uiSurface) errors.push(`${place.id} uiSurface is required`);
    if (!Array.isArray(place.actorSlots) || place.actorSlots.length === 0) {
      errors.push(`${place.id} actorSlots must not be empty`);
    }
    if (!Array.isArray(place.featureDomains) || place.featureDomains.length === 0) {
      errors.push(`${place.id} featureDomains must not be empty`);
    }
  }

  if (!catalog.some((place) => place.cityId === RESTORED_CITY_IDS.BAEGEUM)) {
    errors.push("baegeum-city places are required");
  }
  if (!catalog.some((place) => place.cityId === RESTORED_CITY_IDS.DICE)) {
    errors.push("dice-city places are required");
  }

  return Object.freeze({ ok: errors.length === 0, errors });
}
