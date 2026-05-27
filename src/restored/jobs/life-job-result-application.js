import { RESTORED_LIFE_JOB_EFFECT_TYPES, getRestoredLifeJob } from "./life-job-contract.js";
import { applyRestoredFixedJobAbsence, applyRestoredFixedJobAttendance } from "./life-job-fixed-contract.js";

export const RESTORED_LIFE_JOB_RESULT_APPLICATION_VERSION = "restored-life-job-result-application-001";

const MAX_JOB_HISTORY_RECORDS = 20;
const GRADE_ORDER = Object.freeze(["F", "D", "C", "B", "A", "S"]);

export function applyRestoredLifeJobResultToState(state, result, options = {}) {
  if (!state || !result?.ok) return Object.freeze({ ok: false, reason: "invalid_result" });
  const summary = { cashDelta: 0, itemGrants: [], relationshipApplied: false, historyUpdated: false, fixedContractUpdated: false };
  result.effects.forEach((effect) => {
    if (effect.type === RESTORED_LIFE_JOB_EFFECT_TYPES.ECONOMY_LEDGER_ENTRY) summary.cashDelta += applyWage(state, effect);
    if (effect.type === RESTORED_LIFE_JOB_EFFECT_TYPES.PLAYER_STATE_PATCH) applyCondition(state, effect, result);
    if (effect.type === RESTORED_LIFE_JOB_EFFECT_TYPES.INVENTORY_ITEM_GRANT) summary.itemGrants.push(applyInventory(state, effect));
    if (effect.type === RESTORED_LIFE_JOB_EFFECT_TYPES.RELATIONSHIP_EVENT_HOOK) {
      summary.relationshipApplied = Boolean(options.applyRelationshipHook?.(effect, result)) || summary.relationshipApplied;
    }
  });
  summary.historyUpdated = recordWorkHistory(state, result);
  summary.fixedContractUpdated = applyFixedJobContract(state, result);
  return Object.freeze({ ok: true, ...summary });
}

export function markRestoredFixedJobAbsenceInState(state, options = {}) {
  if (!state) return Object.freeze({ ok: false, reason: "missing_state" });
  const applied = applyRestoredFixedJobAbsence(state.fixedJobContract || {}, options);
  if (!applied.changed) return Object.freeze({ ok: false, reason: applied.reason || "no_active_contract" });
  state.fixedJobContract = { ...applied.contract };
  return Object.freeze({ ok: true, event: applied.event, contract: state.fixedJobContract });
}

export function validateRestoredLifeJobResultApplication() {
  const state = {
    cash: 10,
    profile: {
      stats: { energy: { value: 50, max: 100 }, mental: { value: 50, max: 100 } },
      jobReputation: 0
    },
    fixedJobContract: { activeJobId: "job:convenience-store", status: "active", displayName: "?몄쓽???뚮컮", reliability: 10 },
    jobHistory: [],
    jobStats: {},
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
  const missed = markRestoredFixedJobAbsenceInState(state);
  const errors = [];
  if (!applied.ok || applied.cashDelta !== 100 || state.cash !== 110) errors.push("wage effect must apply to cash");
  if (state.profile.stats.energy.value !== 45 || state.profile.stats.mental.value !== 51) errors.push("condition effect must patch profile stats");
  if (state.profile.jobTitle !== "편의점 알바" || state.profile.jobReputation !== 2) errors.push("condition effect must update job profile fields");
  if (!applied.historyUpdated || state.jobHistory.length !== 1) errors.push("job result must append work history");
  if (state.jobStats["job:convenience-store"]?.totalShifts !== 1) errors.push("job stats must count shifts by job");
  if (!applied.fixedContractUpdated || state.fixedJobContract.attendanceCount !== 1) errors.push("matching fixed job contract must record attendance");
  if (!missed.ok || state.fixedJobContract.missedCount !== 1 || state.fixedJobContract.currentStreak !== 0) errors.push("fixed job absence must apply through the application path");
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
  state.profile.jobTitle = getRestoredLifeJob(result.jobId)?.displayName || result.displayName || "생계 알바";
  state.profile.conditionLabel = result.grade === "S" || result.grade === "A" ? "좋은 근무" : "피곤함";
  state.profile.jobReputation = Number(state.profile.jobReputation || 0) + Number(deltas.reputation || 0);
}

function recordWorkHistory(state, result) {
  state.jobHistory = Array.isArray(state.jobHistory) ? state.jobHistory : [];
  state.jobStats = state.jobStats && typeof state.jobStats === "object" ? state.jobStats : {};
  const previous = state.jobHistory[0];
  const currentStreak = previous?.jobId === result.jobId ? Number(previous.currentStreak || 1) + 1 : 1;
  const previousStats = state.jobStats[result.jobId] || {};
  const totalShifts = Number(previousStats.totalShifts || 0) + 1;
  const totalWageWon = Number(previousStats.totalWageWon || 0) + Number(result.wageWon || 0);
  const bestGrade = chooseBestGrade(previousStats.bestGrade, result.grade);
  const record = {
    jobId: result.jobId,
    placeId: result.placeId,
    displayName: result.displayName || getRestoredLifeJob(result.jobId)?.displayName || "?앷퀎 ?뚮컮",
    grade: result.grade,
    wageWon: Number(result.wageWon || 0),
    currentStreak,
    totalShifts
  };
  state.jobHistory = [record, ...state.jobHistory].slice(0, MAX_JOB_HISTORY_RECORDS);
  state.jobStats[result.jobId] = { jobId: result.jobId, displayName: record.displayName, totalShifts, totalWageWon, bestGrade, latestGrade: result.grade, currentStreak };
  return true;
}

function applyFixedJobContract(state, result) {
  const applied = applyRestoredFixedJobAttendance(state.fixedJobContract || {}, result);
  if (!applied.changed) return false;
  state.fixedJobContract = { ...applied.contract };
  return true;
}

function chooseBestGrade(previousGrade, nextGrade) {
  const previousRank = GRADE_ORDER.indexOf(previousGrade);
  const nextRank = GRADE_ORDER.indexOf(nextGrade);
  if (nextRank < 0) return previousGrade || nextGrade || "C";
  return nextRank >= previousRank ? nextGrade : previousGrade;
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
