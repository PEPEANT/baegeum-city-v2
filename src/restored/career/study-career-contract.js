export const RESTORED_STUDY_CAREER_CONTRACT_VERSION = "restored-study-career-001";

export const RESTORED_STUDY_ACTIVITY_IDS = Object.freeze({
  LIBRARY_SELF_STUDY: "study:library-self-study",
  UNIVERSITY_NIGHT_CLASS: "study:university-night-class"
});

export const RESTORED_COMPANY_TRACK_IDS = Object.freeze({
  BAEGEUM_OFFICE: "career:baegeum-office"
});

export const RESTORED_COMPANY_SHIFT_PRESET_IDS = Object.freeze({
  DOCUMENTS: "career:company-shift:documents",
  OVERTIME_REPORT: "career:company-shift:overtime-report",
  TEAM_SUPPORT: "career:company-shift:team-support"
});

export const RESTORED_STUDY_CAREER_EFFECT_TYPES = Object.freeze({
  ECONOMY_LEDGER_ENTRY: "economy_ledger_entry",
  PLAYER_STATE_PATCH: "player_state_patch",
  EDUCATION_STATE_PATCH: "education_state_patch",
  CAREER_STATE_PATCH: "career_state_patch",
  UI_MESSAGE: "ui_message"
});

export const RESTORED_STUDY_ACTIVITY_CATALOG = Object.freeze([
  Object.freeze({ id: RESTORED_STUDY_ACTIVITY_IDS.LIBRARY_SELF_STUDY, placeId: "baegeum:library", label: "Library Self Study", costWon: 0, minutes: 120, creditGain: 4, statDeltas: Object.freeze({ intelligence: 4, energy: -8, mental: -2 }) }),
  Object.freeze({ id: RESTORED_STUDY_ACTIVITY_IDS.UNIVERSITY_NIGHT_CLASS, placeId: "baegeum:university", label: "University Night Class", costWon: 25000, minutes: 180, creditGain: 10, statDeltas: Object.freeze({ intelligence: 7, energy: -12, mental: -5 }) })
]);

export const RESTORED_COMPANY_LEVELS = Object.freeze([
  Object.freeze({ id: "office_trainee", title: "Company Trainee", requiredCredits: 8, requiredIntelligence: 48, baseWageWon: 65000, promotionThreshold: 12, nextLevelId: "office_staff" }),
  Object.freeze({ id: "office_staff", title: "Office Staff", requiredCredits: 20, requiredIntelligence: 56, baseWageWon: 92000, promotionThreshold: 28, nextLevelId: "assistant_manager" }),
  Object.freeze({ id: "assistant_manager", title: "Assistant Manager", requiredCredits: 42, requiredIntelligence: 68, baseWageWon: 135000, promotionThreshold: null, nextLevelId: null })
]);

export const RESTORED_COMPANY_SHIFT_PRESETS = Object.freeze([
  Object.freeze({ id: RESTORED_COMPANY_SHIFT_PRESET_IDS.DOCUMENTS, label: "서류 정리", detail: "안정 근무", performance: Object.freeze({ focus: 78, communication: 62, endurance: 68, mistakes: 0 }), conditionDeltas: Object.freeze({ energy: -12, mental: -4 }) }),
  Object.freeze({ id: RESTORED_COMPANY_SHIFT_PRESET_IDS.OVERTIME_REPORT, label: "야근 보고서", detail: "고강도 승급 노림", performance: Object.freeze({ focus: 94, communication: 70, endurance: 90, mistakes: 0 }), conditionDeltas: Object.freeze({ energy: -26, mental: -10 }) }),
  Object.freeze({ id: RESTORED_COMPANY_SHIFT_PRESET_IDS.TEAM_SUPPORT, label: "팀 지원", detail: "평판형 근무", performance: Object.freeze({ focus: 74, communication: 88, endurance: 76, mistakes: 0 }), conditionDeltas: Object.freeze({ energy: -16, mental: -5 }) })
]);

export function createInitialRestoredEducationState() {
  return { credits: 0, studyHours: 0, credentials: [] };
}

export function createInitialRestoredCareerState() {
  return { currentTrackId: null, currentLevelId: null, promotionPoints: 0, totalCompanyIncome: 0, completedCompanyShifts: 0 };
}

export function getRestoredStudyActivity(activityId) {
  return RESTORED_STUDY_ACTIVITY_CATALOG.find((activity) => activity.id === activityId) || null;
}

export function getRestoredCompanyLevel(levelId) {
  return RESTORED_COMPANY_LEVELS.find((level) => level.id === levelId) || null;
}

export function listRestoredCompanyShiftPresets() {
  return RESTORED_COMPANY_SHIFT_PRESETS;
}

export function getRestoredCompanyShiftPreset(presetId) {
  return RESTORED_COMPANY_SHIFT_PRESETS.find((preset) => preset.id === presetId) || null;
}

export function createRestoredStudyResult(activityId, state = {}, options = {}) {
  const activity = getRestoredStudyActivity(activityId);
  if (!activity) return Object.freeze({ ok: false, reason: "unknown_study_activity", message: "공부 항목을 찾을 수 없습니다." });
  const cash = Number(state.cash || 0);
  if (activity.costWon > cash) return Object.freeze({ ok: false, reason: "not_enough_cash", message: "수강료가 부족합니다." });
  const effects = [];
  if (activity.costWon > 0) effects.push(effect(RESTORED_STUDY_CAREER_EFFECT_TYPES.ECONOMY_LEDGER_ENTRY, { entryType: "study_tuition", currency: "WON", deltas: { cash: -activity.costWon }, placeId: activity.placeId }));
  effects.push(effect(RESTORED_STUDY_CAREER_EFFECT_TYPES.PLAYER_STATE_PATCH, { deltas: activity.statDeltas, placeId: activity.placeId }));
  effects.push(effect(RESTORED_STUDY_CAREER_EFFECT_TYPES.EDUCATION_STATE_PATCH, { credits: activity.creditGain, studyHours: Math.round(activity.minutes / 60), credential: activity.id === RESTORED_STUDY_ACTIVITY_IDS.UNIVERSITY_NIGHT_CLASS ? "credential:university-basic" : null }));
  effects.push(effect(RESTORED_STUDY_CAREER_EFFECT_TYPES.UI_MESSAGE, { message: `${activity.label}: +${activity.creditGain} credits` }));
  return Object.freeze({ ok: true, version: RESTORED_STUDY_CAREER_CONTRACT_VERSION, type: "study_completed", actorId: options.actorId || "player:local", activityId: activity.id, label: activity.label, effects: Object.freeze(effects), message: `${activity.label} 완료` });
}

export function createRestoredCompanyShiftResult(state = {}, performance = {}) {
  const level = resolveCurrentOrEntryLevel(state);
  if (!level.ok) return level;
  const score = scoreCompanyPerformance(performance);
  const wageWon = Math.round(level.level.baseWageWon * (score >= 85 ? 1.2 : score >= 65 ? 1 : 0.8));
  const gained = Math.max(1, Math.round(score / 12));
  const next = projectPromotion(state, level.level, gained);
  const conditionDeltas = performance.conditionDeltas || { energy: -18, mental: -6 };
  return Object.freeze({
    ok: true,
    version: RESTORED_STUDY_CAREER_CONTRACT_VERSION,
    type: "company_shift_completed",
    trackId: RESTORED_COMPANY_TRACK_IDS.BAEGEUM_OFFICE,
    shiftPresetId: performance.shiftPresetId || null,
    shiftLabel: performance.shiftLabel || "Company Shift",
    workedLevelId: level.level.id,
    workedLevelTitle: level.level.title,
    levelId: next.levelId,
    levelTitle: getRestoredCompanyLevel(next.levelId)?.title || level.level.title,
    wageWon,
    promotionPointsGained: gained,
    promoted: next.promoted,
    effects: Object.freeze([
      effect(RESTORED_STUDY_CAREER_EFFECT_TYPES.ECONOMY_LEDGER_ENTRY, { entryType: "company_wage", currency: "WON", deltas: { cash: wageWon }, placeId: "baegeum:company-district" }),
      effect(RESTORED_STUDY_CAREER_EFFECT_TYPES.PLAYER_STATE_PATCH, { deltas: conditionDeltas, jobId: RESTORED_COMPANY_TRACK_IDS.BAEGEUM_OFFICE, jobTitle: getRestoredCompanyLevel(next.levelId)?.title || level.level.title }),
      effect(RESTORED_STUDY_CAREER_EFFECT_TYPES.CAREER_STATE_PATCH, { trackId: RESTORED_COMPANY_TRACK_IDS.BAEGEUM_OFFICE, levelId: next.levelId, promotionPoints: next.promotionPoints, totalCompanyIncome: wageWon, completedCompanyShifts: 1 }),
      effect(RESTORED_STUDY_CAREER_EFFECT_TYPES.UI_MESSAGE, { message: next.promoted ? `승급: ${getRestoredCompanyLevel(next.levelId)?.title}` : `${level.level.title}: ${formatWon(wageWon)}` })
    ]),
    message: next.promoted ? `회사 승급: ${getRestoredCompanyLevel(next.levelId)?.title}` : `회사 근무 완료: ${formatWon(wageWon)}`
  });
}

export function createRestoredCompanyShiftPresetResult(presetId, state = {}) {
  const preset = getRestoredCompanyShiftPreset(presetId) || (presetId === "career:company-shift" ? RESTORED_COMPANY_SHIFT_PRESETS[0] : null);
  if (!preset) return Object.freeze({ ok: false, reason: "unknown_company_shift_preset", message: "회사 근무 방식을 찾을 수 없습니다." });
  return createRestoredCompanyShiftResult(state, {
    ...preset.performance,
    conditionDeltas: preset.conditionDeltas,
    shiftPresetId: preset.id,
    shiftLabel: preset.label
  });
}

export function validateRestoredStudyCareerContract() {
  const errors = [];
  const starter = { cash: 100000, education: { credits: 0 }, profile: { stats: { intelligence: { value: 45 } } }, career: createInitialRestoredCareerState() };
  const library = createRestoredStudyResult(RESTORED_STUDY_ACTIVITY_IDS.LIBRARY_SELF_STUDY, starter);
  const university = createRestoredStudyResult(RESTORED_STUDY_ACTIVITY_IDS.UNIVERSITY_NIGHT_CLASS, starter);
  const blocked = createRestoredCompanyShiftResult(starter);
  const ready = { ...starter, education: { credits: 50 }, profile: { stats: { intelligence: { value: 72 } } }, career: { currentLevelId: "office_staff", promotionPoints: 26 } };
  const company = createRestoredCompanyShiftResult(ready, { focus: 90, communication: 85, endurance: 90, mistakes: 0 });
  const preset = createRestoredCompanyShiftPresetResult(RESTORED_COMPANY_SHIFT_PRESET_IDS.OVERTIME_REPORT, ready);
  if (!library.ok || library.effects.some((item) => item.payload?.deltas?.cash)) errors.push("library study must not cost won");
  if (!university.ok || !university.effects.some((item) => item.payload?.deltas?.cash < 0)) errors.push("university study must cost won");
  if (blocked.ok || blocked.reason !== "not_qualified") errors.push("company work must be gated by study");
  if (!company.ok || company.wageWon <= 0 || !company.promoted) errors.push("qualified company work must pay and promote");
  if (!company.workedLevelTitle || company.workedLevelTitle === company.levelTitle) errors.push("company work must separate worked and promoted level labels");
  if (!preset.ok || preset.shiftLabel !== "야근 보고서" || preset.promotionPointsGained <= 0) errors.push("company shift presets must produce labeled differentiated results");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function resolveCurrentOrEntryLevel(state) {
  const education = state.education || {};
  const intelligence = Number(state.profile?.stats?.intelligence?.value || 0);
  const current = getRestoredCompanyLevel(state.career?.currentLevelId) || RESTORED_COMPANY_LEVELS[0];
  if (Number(education.credits || 0) < current.requiredCredits || intelligence < current.requiredIntelligence) {
    return Object.freeze({ ok: false, reason: "not_qualified", message: `회사 지원 조건 부족: 지능 ${current.requiredIntelligence}, 학점 ${current.requiredCredits}` });
  }
  return Object.freeze({ ok: true, level: current });
}

function projectPromotion(state, level, gained) {
  const points = Number(state.career?.promotionPoints || 0) + gained;
  if (!level.nextLevelId || points < level.promotionThreshold) return { levelId: level.id, promotionPoints: points, promoted: false };
  const next = getRestoredCompanyLevel(level.nextLevelId);
  return { levelId: next?.id || level.id, promotionPoints: 0, promoted: Boolean(next) };
}

function scoreCompanyPerformance(input = {}) {
  const focus = clamp(input.focus, 70);
  const communication = clamp(input.communication, 65);
  const endurance = clamp(input.endurance, 70);
  const mistakes = Math.max(0, Math.round(Number(input.mistakes || 0)));
  return Math.max(0, Math.min(100, Math.round(focus * 0.4 + communication * 0.25 + endurance * 0.35 - mistakes * 8)));
}

function clamp(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function effect(type, payload) {
  return Object.freeze({ type, payload: Object.freeze(payload) });
}

function formatWon(amount) {
  return `${Math.round(Number(amount) || 0).toLocaleString("ko-KR")}원`;
}
