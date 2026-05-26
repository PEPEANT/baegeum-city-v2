export const RESTORED_PARTNER_CATALOG_VERSION = "restored-partner-catalog-001";

export const RESTORED_PARTNER_ARCHETYPES = Object.freeze([
  Object.freeze({ id: "college-student", name: "대학생", emoji: "👩‍🎓" }),
  Object.freeze({ id: "office-worker", name: "직장인", emoji: "👩‍💼" }),
  Object.freeze({ id: "model", name: "모델", emoji: "💃" }),
  Object.freeze({ id: "nurse", name: "간호사", emoji: "👩‍⚕️" }),
  Object.freeze({ id: "athlete", name: "운동선수", emoji: "🏃‍♀️" })
]);

export function pickRestoredPartnerArchetype(random = Math.random) {
  const index = Math.floor(random() * RESTORED_PARTNER_ARCHETYPES.length);
  return RESTORED_PARTNER_ARCHETYPES[index];
}

export function createRestoredPartnerFromArchetype(archetype, overrides = {}) {
  return {
    name: archetype.name,
    emoji: archetype.emoji,
    love: 40,
    isLover: false,
    title: "지인",
    ...overrides
  };
}

export function validateRestoredPartnerCatalog(archetypes = RESTORED_PARTNER_ARCHETYPES) {
  const errors = [];
  const ids = new Set();

  for (const archetype of archetypes) {
    if (!archetype.id) errors.push("partner archetype id is required");
    if (ids.has(archetype.id)) errors.push(`duplicate partner archetype: ${archetype.id}`);
    ids.add(archetype.id);
    if (!archetype.name) errors.push(`${archetype.id || "unknown"} name is required`);
    if (!archetype.emoji) errors.push(`${archetype.id || "unknown"} emoji is required`);
  }

  return Object.freeze({ ok: errors.length === 0, errors });
}
