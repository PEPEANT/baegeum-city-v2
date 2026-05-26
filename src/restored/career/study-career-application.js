import {
  RESTORED_STUDY_CAREER_EFFECT_TYPES,
  createInitialRestoredCareerState,
  createInitialRestoredEducationState
} from "./study-career-contract.js";

export const RESTORED_STUDY_CAREER_APPLICATION_VERSION = "restored-study-career-application-001";

export function applyRestoredStudyCareerResultToState(state, result) {
  if (!state || !result?.ok) return Object.freeze({ ok: false, reason: "invalid_result" });
  const summary = { cashDelta: 0, intelligenceDelta: 0, creditsDelta: 0, careerUpdated: false };
  for (const effect of result.effects || []) {
    if (effect.type === RESTORED_STUDY_CAREER_EFFECT_TYPES.ECONOMY_LEDGER_ENTRY) summary.cashDelta += applyCash(state, effect);
    if (effect.type === RESTORED_STUDY_CAREER_EFFECT_TYPES.PLAYER_STATE_PATCH) summary.intelligenceDelta += applyPlayerPatch(state, effect);
    if (effect.type === RESTORED_STUDY_CAREER_EFFECT_TYPES.EDUCATION_STATE_PATCH) summary.creditsDelta += applyEducationPatch(state, effect);
    if (effect.type === RESTORED_STUDY_CAREER_EFFECT_TYPES.CAREER_STATE_PATCH) summary.careerUpdated = applyCareerPatch(state, effect);
  }
  return Object.freeze({ ok: true, ...summary });
}

export function validateRestoredStudyCareerApplication() {
  const state = {
    cash: 1000,
    profile: { stats: { intelligence: { value: 45, max: 100 }, energy: { value: 50, max: 100 }, mental: { value: 50, max: 100 } } }
  };
  const result = {
    ok: true,
    effects: [
      { type: RESTORED_STUDY_CAREER_EFFECT_TYPES.ECONOMY_LEDGER_ENTRY, payload: { deltas: { cash: -100 } } },
      { type: RESTORED_STUDY_CAREER_EFFECT_TYPES.PLAYER_STATE_PATCH, payload: { deltas: { intelligence: 5, energy: -3 }, jobId: "career:test", jobTitle: "Tester" } },
      { type: RESTORED_STUDY_CAREER_EFFECT_TYPES.EDUCATION_STATE_PATCH, payload: { credits: 4, studyHours: 2, credential: "credential:test" } },
      { type: RESTORED_STUDY_CAREER_EFFECT_TYPES.CAREER_STATE_PATCH, payload: { trackId: "career:test", levelId: "level:test", promotionPoints: 3, totalCompanyIncome: 100, completedCompanyShifts: 1 } }
    ]
  };
  const applied = applyRestoredStudyCareerResultToState(state, result);
  const errors = [];
  if (!applied.ok || state.cash !== 900) errors.push("study/career cash effects must apply");
  if (state.profile.stats.intelligence.value !== 50 || state.profile.stats.energy.value !== 47) errors.push("profile stat effects must apply");
  if (state.education.credits !== 4 || state.education.credentials[0] !== "credential:test") errors.push("education state must apply");
  if (state.career.currentLevelId !== "level:test" || state.profile.jobTitle !== "Tester") errors.push("career state must apply");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function applyCash(state, effect) {
  const delta = Number(effect.payload?.deltas?.cash || 0);
  state.cash = Number(state.cash || 0) + delta;
  return delta;
}

function applyPlayerPatch(state, effect) {
  let intelligenceDelta = 0;
  for (const [statId, delta] of Object.entries(effect.payload?.deltas || {})) {
    patchStat(state, statId, delta);
    if (statId === "intelligence") intelligenceDelta += Number(delta || 0);
  }
  if (effect.payload?.jobId) state.profile.jobId = effect.payload.jobId;
  if (effect.payload?.jobTitle) state.profile.jobTitle = effect.payload.jobTitle;
  return intelligenceDelta;
}

function applyEducationPatch(state, effect) {
  state.education = state.education || createInitialRestoredEducationState();
  if (!Array.isArray(state.education.credentials)) state.education.credentials = [];
  const credits = Number(effect.payload?.credits || 0);
  state.education.credits = Math.max(0, Number(state.education.credits || 0) + credits);
  state.education.studyHours = Math.max(0, Number(state.education.studyHours || 0) + Number(effect.payload?.studyHours || 0));
  if (effect.payload?.credential && !state.education.credentials.includes(effect.payload.credential)) {
    state.education.credentials.push(effect.payload.credential);
  }
  return credits;
}

function applyCareerPatch(state, effect) {
  state.career = state.career || createInitialRestoredCareerState();
  state.career.currentTrackId = effect.payload?.trackId || state.career.currentTrackId;
  state.career.currentLevelId = effect.payload?.levelId || state.career.currentLevelId;
  state.career.promotionPoints = Math.max(0, Number(effect.payload?.promotionPoints || 0));
  state.career.totalCompanyIncome = Math.max(0, Number(state.career.totalCompanyIncome || 0) + Number(effect.payload?.totalCompanyIncome || 0));
  state.career.completedCompanyShifts = Math.max(0, Number(state.career.completedCompanyShifts || 0) + Number(effect.payload?.completedCompanyShifts || 0));
  return true;
}

function patchStat(state, statId, delta) {
  const stat = state.profile?.stats?.[statId];
  if (!stat || !Number.isFinite(Number(delta))) return;
  const max = Math.max(1, Number(stat.max || 100));
  stat.value = Math.max(0, Math.min(max, Math.round(Number(stat.value || 0) + Number(delta || 0))));
}
