import { formatRestoredWon } from "./life-job-contract.js";
import { getRestoredFixedJobContractView } from "./life-job-fixed-contract.js";

export const RESTORED_LIFE_JOB_HISTORY_VIEW_VERSION = "restored-life-job-history-view-001";

export function getRestoredLifeJobHistoryView(state = {}) {
  const history = Array.isArray(state.jobHistory) ? state.jobHistory : [];
  const stats = state.jobStats && typeof state.jobStats === "object" ? state.jobStats : {};
  const totalShifts = Object.values(stats).reduce((sum, item) => sum + Number(item.totalShifts || 0), 0);
  const totalWageWon = Object.values(stats).reduce((sum, item) => sum + Number(item.totalWageWon || 0), 0);
  const latest = history[0] || null;
  const fixed = getRestoredFixedJobContractView(state.fixedJobContract || {});
  return Object.freeze({
    totalShifts,
    totalWageWon,
    latestLabel: latest ? `${latest.displayName} ${latest.grade}` : "근무 기록 없음",
    streakLabel: latest?.currentStreak > 1 ? `${latest.currentStreak}연속 ${latest.displayName}` : "연속 근무 없음",
    fixed,
    recent: Object.freeze(history.slice(0, 4).map((record) => Object.freeze({ ...record })))
  });
}

export function renderRestoredLifeJobHistoryHtml(state = {}) {
  const view = getRestoredLifeJobHistoryView(state);
  const recent = view.recent.length
    ? view.recent.map(renderHistoryRow).join("")
    : `<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-400">아직 근무 기록이 없습니다.</div>`;
  return `
    <div class="grid grid-cols-2 gap-2">
      <div class="rounded-xl bg-slate-50 p-3">
        <div class="text-[10px] font-black uppercase text-slate-400">Total Shifts</div>
        <div class="mt-1 text-lg font-black text-slate-900">${view.totalShifts}회</div>
      </div>
      <div class="rounded-xl bg-slate-50 p-3 text-right">
        <div class="text-[10px] font-black uppercase text-slate-400">Work Income</div>
        <div class="mt-1 text-lg font-black text-emerald-700">${formatRestoredWon(view.totalWageWon)}</div>
      </div>
    </div>
    <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
      <div class="rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs font-bold text-indigo-700">${escapeHtml(view.latestLabel)}</div>
      <div class="rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs font-bold text-amber-700">${escapeHtml(view.streakLabel)}</div>
    </div>
    ${renderFixedContract(view.fixed)}
    <div class="mt-2 grid grid-cols-1 gap-2">${recent}</div>`;
}

export function validateRestoredLifeJobHistoryView() {
  const state = {
    jobHistory: [
      { jobId: "job:fast-food", displayName: "맥버거 알바", grade: "A", wageWon: 45000, currentStreak: 2, totalShifts: 2 },
      { jobId: "job:fast-food", displayName: "맥버거 알바", grade: "B", wageWon: 39000, currentStreak: 1, totalShifts: 1 }
    ],
    jobStats: { "job:fast-food": { totalShifts: 2, totalWageWon: 84000 } },
    fixedJobContract: { status: "active", activeJobId: "job:fast-food", displayName: "맥버거 알바", attendanceCount: 2, missedCount: 1, currentStreak: 0, reliability: 10, totalWageWon: 84000, latestGrade: "결근" }
  };
  const view = getRestoredLifeJobHistoryView(state);
  const html = renderRestoredLifeJobHistoryHtml(state);
  const errors = [];
  if (view.totalShifts !== 2 || view.totalWageWon !== 84000) errors.push("job history summary must aggregate stats");
  if (!view.streakLabel.includes("2연속")) errors.push("job history summary must expose current streak");
  if (!view.fixed.active || view.fixed.reliability !== 10 || view.fixed.missedCount !== 1) errors.push("job history summary must expose fixed job contract");
  if (!html.includes("84,000원") || !html.includes("맥버거 알바")) errors.push("job history html must render income and recent jobs");
  if (!html.includes("성실도 10") || !html.includes("결근 1회") || !html.includes("결근 처리")) errors.push("job history html must render fixed job absence controls");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function renderFixedContract(fixed) {
  if (!fixed.active) {
    return `<div class="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-400">고정 알바를 등록하면 성실도와 출근 기록이 쌓입니다.</div>`;
  }
  return `<div class="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
    <div class="flex items-center justify-between gap-2 text-xs font-bold text-emerald-800"><span>고정 알바: ${escapeHtml(fixed.title)}</span><span>성실도 ${fixed.reliability}</span></div>
    <div class="mt-2 grid grid-cols-4 gap-2 text-[10px] font-black text-emerald-700"><span>출근 ${fixed.attendanceCount}회</span><span>결근 ${fixed.missedCount}회</span><span>연속 ${fixed.currentStreak}회</span><span>${formatRestoredWon(fixed.totalWageWon)}</span></div>
    <button onclick="markFixedLifeJobAbsence()" class="mt-2 rounded-lg border border-rose-100 bg-white/70 px-3 py-1.5 text-[10px] font-black text-rose-600 active:scale-95 transition">결근 처리</button>
  </div>`;
}

function renderHistoryRow(record) {
  return `<div class="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs"><span class="font-bold text-slate-700">${escapeHtml(record.displayName)}</span><span class="font-black text-slate-900">${escapeHtml(record.grade)} / ${formatRestoredWon(record.wageWon)}</span></div>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}
