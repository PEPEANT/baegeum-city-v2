import { RESTORED_LIFE_JOB_EFFECT_TYPES, getRestoredLifeJob } from "./life-job-contract.js";

export const RESTORED_LIFE_JOB_RESULT_APPLICATION_VERSION = "restored-life-job-result-application-001";

export function applyRestoredLifeJobResultToState(state, result, options = {}) {
  if (!state || !result?.ok) return Object.freeze({ ok: false, reason: "invalid_result" });
  const summary = { cashDelta: 0, itemGrants: [], relationshipApplied: false };
  result.effects.forEach((effect) => {
    if (effect.type === RESTORED_LIFE_JOB_EFFECT_TYPES.ECONOMY_LEDGER_ENTRY) summary.cashDelta += applyWage(state, effect);
    if (effect.type === RESTORED_LIFE_JOB_EFFECT_TYPES.PLAYER_STATE_PATCH) applyCondition(state, effect, result);
    if (effect.type === RESTORED_LIFE_JOB_EFFECT_TYPES.INVENTORY_ITEM_GRANT) summary.itemGrants.push(applyInventory(state, effect));
    if (effect.type === RESTORED_LIFE_JOB_EFFECT_TYPES.RELATIONSHIP_EVENT_HOOK) {
      summary.relationshipApplied = Boolean(options.applyRelationshipHook?.(effect, result)) || summary.relationshipApplied;
    }
  });
  return Object.freeze({ ok: true, ...summary });
}

export function validateRestoredLifeJobResultApplication() {
  const state = {
    cash: 10,
    profile: {
      stats: { energy: { value: 50, max: 100 }, mental: { value: 50, max: 100 } },
      jobReputation: 0
    },
    luxury: { energy_drink: { count: 0 } }
  };
  const result = {
    ok: true,
    jobId: "job:convenience-store",
    grade: "A",
    placeId: "baegeum:convenience-store",
    effects: [
      { type: RESTORED_LIFE_JOB_EFFECT_TYPES.ECONOMY_LEDGER_ENTRY, payload: { deltas: { cash: 100 } } },
      { type: RESTORED_LIFE_JOB_EFFECT_TYPES.PLAYER_STATE_PATCH, payload: { deltas: { energy: -5, mental: 1, reputation: 2 } } },
      { type: RESTORED_LIFE_JOB_EFFECT_TYPES.INVENTORY_ITEM_GRANT, payload: { itemId: "energy_drink", count: 1 } },
      { type: RESTORED_LIFE_JOB_EFFECT_TYPES.RELATIONSHIP_EVENT_HOOK, payload: { deltas: { trust: 1 } } }
    ]
  };
  const applied = applyRestoredLifeJobResultToState(state, result, { applyRelationshipHook: () => true });
  const errors = [];
  if (!applied.ok || applied.cashDelta !== 100 || state.cash !== 110) errors.push("wage effect must apply to cash");
  if (state.profile.stats.energy.value !== 45 || state.profile.stats.mental.value !== 51) errors.push("condition effect must patch profile stats");
  if (state.profile.jobTitle !== "Convenience Store Shift" || state.profile.jobReputation !== 2) errors.push("condition effect must update job profile fields");
  if (state.luxury.energy_drink.count !== 1) errors.push("inventory grant must increment known inventory");
  if (!applied.relationshipApplied) errors.push("relationship hook callback must be reported");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function applyWage(state, effect) {
  const delta = Number(effect.payload?.deltas?.cash || 0);
  state.cash = Number(state.cash || 0) + delta;
  return delta;
}

function applyCondition(state, effect, result) {
  const deltas = effect.payload?.deltas || {};
  patchProfileStat(state, "energy", deltas.energy);
  patchProfileStat(state, "mental", deltas.mental);
  state.profile.jobId = result.jobId;
  state.profile.jobTitle = getRestoredLifeJob(result.jobId)?.displayName || result.displayName || "Life Job Shift";
  state.profile.conditionLabel = result.grade === "S" || result.grade === "A" ? "Good shift" : "Tired";
  state.profile.jobReputation = Number(state.profile.jobReputation || 0) + Number(deltas.reputation || 0);
}

function patchProfileStat(state, statId, delta) {
  if (!Number.isFinite(Number(delta))) return;
  const stat = state.profile?.stats?.[statId];
  if (!stat) return;
  const max = Math.max(1, Number(stat.max || 100));
  stat.value = Math.max(0, Math.min(max, Math.round(Number(stat.value || 0) + Number(delta || 0))));
}

function applyInventory(state, effect) {
  const itemId = effect.payload?.itemId;
  if (!itemId || !state.luxury?.[itemId]) return null;
  const count = Number(effect.payload?.count || 0);
  state.luxury[itemId].count = Math.max(0, Number(state.luxury[itemId].count || 0) + count);
  return Object.freeze({ itemId, count });
}
