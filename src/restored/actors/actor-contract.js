import { RESTORED_CITY_IDS } from "../data/city-catalog.js";

export const RESTORED_ACTOR_CONTRACT_VERSION = "restored-actor-001";

export const RESTORED_ACTOR_DOMAINS = Object.freeze([
  "partner",
  "casino_staff",
  "shop_staff",
  "street_npc",
  "system"
]);

export const RESTORED_ACTOR_LOCATION_TYPES = Object.freeze([
  "city",
  "district",
  "venue",
  "phone",
  "offscreen"
]);

export const RESTORED_ACTOR_EVENT_TYPES = Object.freeze([
  "actor_moved",
  "conversation_seen",
  "gift_received",
  "casino_win_seen",
  "casino_loss_seen",
  "phone_message_seen"
]);

const RESTORED_CITY_ID_SET = new Set(Object.values(RESTORED_CITY_IDS));

export function createRestoredActorId(domain, slug) {
  return `actor:${domain}:${slug}`;
}

export function createRestoredActorLocation({
  cityId = RESTORED_CITY_IDS.BAEGEUM,
  placeId = null,
  locationType = "city"
} = {}) {
  return Object.freeze({
    cityId,
    placeId,
    locationType
  });
}

export function validateRestoredActorLocation(location) {
  const errors = [];

  if (!location || typeof location !== "object") {
    return Object.freeze({ ok: false, errors: ["actor location is required"] });
  }

  if (!RESTORED_CITY_ID_SET.has(location.cityId)) {
    errors.push(`unknown actor cityId: ${location.cityId}`);
  }
  if (!RESTORED_ACTOR_LOCATION_TYPES.includes(location.locationType)) {
    errors.push(`unknown actor locationType: ${location.locationType}`);
  }
  if (location.placeId !== null && typeof location.placeId !== "string") {
    errors.push("actor placeId must be a string or null");
  }

  return Object.freeze({ ok: errors.length === 0, errors });
}

export function validateRestoredActor(actor) {
  const errors = [];

  if (!actor || typeof actor !== "object") {
    return Object.freeze({ ok: false, errors: ["actor is required"] });
  }

  if (!actor.id || !actor.id.startsWith("actor:")) {
    errors.push("actor id must start with actor:");
  }
  if (!RESTORED_ACTOR_DOMAINS.includes(actor.domain)) {
    errors.push(`unknown actor domain: ${actor.domain}`);
  }
  if (!actor.displayName) {
    errors.push(`${actor.id || "actor"} displayName is required`);
  }

  const location = validateRestoredActorLocation(actor.currentLocation);
  errors.push(...location.errors);

  if (actor.scheduleId !== null && typeof actor.scheduleId !== "string") {
    errors.push(`${actor.id || "actor"} scheduleId must be a string or null`);
  }
  if (!Array.isArray(actor.memoryEventIds)) {
    errors.push(`${actor.id || "actor"} memoryEventIds must be an array`);
  }

  return Object.freeze({ ok: errors.length === 0, errors });
}

export function createRestoredActorFixture(overrides = {}) {
  return Object.freeze({
    id: createRestoredActorId("partner", "college-student"),
    domain: "partner",
    displayName: "대학생",
    currentLocation: createRestoredActorLocation({
      cityId: RESTORED_CITY_IDS.BAEGEUM,
      placeId: "baegeum:street",
      locationType: "district"
    }),
    scheduleId: "schedule:partner:default",
    relationshipId: "partner:college-student",
    memoryEventIds: Object.freeze([]),
    ...overrides
  });
}
