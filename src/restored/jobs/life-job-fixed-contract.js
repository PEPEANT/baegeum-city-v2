import { getRestoredLifeJob } from "./life-job-contract.js";

export const RESTORED_LIFE_JOB_FIXED_CONTRACT_VERSION = "restored-life-job-fixed-contract-001";

const RELIABILITY_GAIN_BY_GRADE = Object.freeze({ S: 8, A: 6, B: 4, C: 2, D: -1, F: -3 });
const ABSENCE_RELIABILITY_PENALTY = 12;

export function createInitialRestoredFixedJobContractState() {
  return {
    activeJobId: null,
    status: "none",
    displayName: "",
    attendanceCount: 0,
    missedCount: 0,
    reliability: 0,
    currentStreak: 0,
    totalWageWon: 0,
    latestGrade: ""
  };
}

export function createRestoredFixedJobContract(jobId, previous = {}) {
  const job = getRestoredLifeJob(jobId);
  if (!job) return Object.freeze({ ok: false, reason: "unknown_job" });
  const sameJob = previous?.activeJobId === job.id;
  const contract = {
    ...createInitialRestoredFixedJobContractState(),
    activeJobId: job.id,
    status: "active",
    displayName: job.displayName,
    attendanceCount: sameJob ? Number(previous.attendanceCount || 0) : 0,
    missedCount: sameJob ? Number(previous.missedCount || 0) : 0,
    reliability: sameJob ? clampReliability(previous.reliability) : 10,
    currentStreak: sameJob ? Number(previous.currentStreak || 0) : 0,
    totalWageWon: sameJob ? Number(previous.totalWageWon || 0) : 0,
    latestGrade: sameJob ? String(previous.latestGrade || "") : ""
  };
  return Object.freeze({ ok: true, contract: Object.freeze(contract) });
}

export function applyRestoredFixedJobAttendance(contract = {}, result = {}) {
  if (contract.status !== "active" || !contract.activeJobId || contract.activeJobId !== result.jobId) {
    return Object.freeze({ changed: false, contract });
  }
  const reliability = clampReliability(Number(contract.reliability || 0) + Number(RELIABILITY_GAIN_BY_GRADE[result.grade] ?? 1));
  const next = {
    ...contract,
    attendanceCount: Number(contract.attendanceCount || 0) + 1,
    currentStreak: Number(contract.currentStreak || 0) + 1,
    totalWageWon: Number(contract.totalWageWon || 0) + Number(result.wageWon || 0),
    reliability,
    latestGrade: result.grade || contract.latestGrade || "C"
  };
  return Object.freeze({ changed: true, contract: Object.freeze(next) });
}

export function applyRestoredFixedJobAbsence(contract = {}, options = {}) {
  if (contract.status !== "active" || !contract.activeJobId) {
    return Object.freeze({ changed: false, contract, reason: "no_active_contract" });
  }
  const penalty = Number(options.penalty ?? ABSENCE_RELIABILITY_PENALTY);
  const next = {
    ...contract,
    missedCount: Number(contract.missedCount || 0) + 1,
    currentStreak: 0,
    reliability: clampReliability(Number(contract.reliability || 0) - penalty),
    latestGrade: "결근"
  };
  return Object.freeze({ changed: true, contract: Object.freeze(next), event: Object.freeze({ type: "fixed_job_absence", jobId: next.activeJobId, reliabilityDelta: -penalty }) });
}

export function getRestoredFixedJobContractView(contract = {}) {
  const active = contract.status === "active" && Boolean(contract.activeJobId);
  return Object.freeze({
    active,
    title: active ? contract.displayName || "고정 알바" : "고정 알바 없음",
    reliability: clampReliability(contract.reliability),
    attendanceCount: Math.max(0, Number(contract.attendanceCount || 0)),
    missedCount: Math.max(0, Number(contract.missedCount || 0)),
    currentStreak: Math.max(0, Number(contract.currentStreak || 0)),
    totalWageWon: Math.max(0, Number(contract.totalWageWon || 0)),
    latestGrade: contract.latestGrade || "-"
  });
}

export function validateRestoredFixedJobContract() {
  const registered = createRestoredFixedJobContract("job:fast-food");
  const attended = registered.ok ? applyRestoredFixedJobAttendance(registered.contract, { jobId: "job:fast-food", grade: "A", wageWon: 45600 }) : null;
  const absent = attended ? applyRestoredFixedJobAbsence(attended.contract) : null;
  const ignored = attended ? applyRestoredFixedJobAttendance(attended.contract, { jobId: "job:pc-room", grade: "S", wageWon: 100 }) : null;
  const view = absent ? getRestoredFixedJobContractView(absent.contract) : null;
  const errors = [];
  if (!registered.ok || registered.contract.status !== "active") errors.push("fixed job registration must create an active contract");
  if (!attended?.changed || attended.contract.attendanceCount !== 1) errors.push("matching fixed job attendance must be counted");
  if (attended?.contract.reliability <= registered.contract.reliability) errors.push("good attendance must raise reliability");
  if (!absent?.changed || absent.contract.missedCount !== 1 || absent.contract.currentStreak !== 0) errors.push("fixed job absence must reset streak and count missed shifts");
  if (absent?.contract.reliability >= attended?.contract.reliability) errors.push("fixed job absence must lower reliability");
  if (ignored?.changed) errors.push("non-matching jobs must not update the fixed contract");
  if (!view?.active || view.title !== "맥버거 알바") errors.push("fixed job view must expose active contract label");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function clampReliability(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}
