import { RESTORED_COMPANY_LEVELS, getRestoredCompanyLevel } from "./study-career-contract.js";

export const RESTORED_STUDY_CAREER_SUMMARY_VIEW_VERSION = "restored-study-career-summary-view-001";

export function getRestoredStudyCareerSummaryView(state = {}) {
  const education = state.education || {};
  const career = state.career || {};
  const intelligence = Number(state.profile?.stats?.intelligence?.value || 0);
  const currentLevel = getRestoredCompanyLevel(career.currentLevelId);
  const gateLevel = currentLevel || RESTORED_COMPANY_LEVELS[0];
  const promotionThreshold = Number(gateLevel?.promotionThreshold || 0);
  const promotionPoints = Number(career.promotionPoints || 0);
  const qualificationPercent = getQualificationPercent(education, intelligence, gateLevel);
  const promotionPercent = promotionThreshold > 0 ? Math.min(100, Math.round((promotionPoints / promotionThreshold) * 100)) : 100;
  const missing = getMissingRequirements(education, intelligence, gateLevel);
  const nextLevel = gateLevel?.nextLevelId ? getRestoredCompanyLevel(gateLevel.nextLevelId) : null;
  return Object.freeze({
    credits: Math.max(0, Number(education.credits || 0)),
    studyHours: Math.max(0, Number(education.studyHours || 0)),
    intelligence,
    careerTitle: currentLevel?.title || "입사 준비",
    nextTitle: nextLevel?.title || (currentLevel ? "최종 직급" : "회사 지원"),
    promotionPoints,
    promotionThreshold,
    progressLabel: currentLevel ? "승급 진행" : "지원 준비",
    progressPercent: currentLevel ? promotionPercent : qualificationPercent,
    canApply: missing.length === 0,
    missing: Object.freeze(missing)
  });
}

export function renderRestoredStudyCareerSummaryHtml(state = {}) {
  const view = getRestoredStudyCareerSummaryView(state);
  const status = view.canApply ? "조건 충족" : view.missing.join(" / ");
  return `
    <div class="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-black text-slate-900">${escapeHtml(view.careerTitle)}</div>
          <div class="mt-1 text-xs font-bold text-slate-500">${escapeHtml(view.nextTitle)} · ${escapeHtml(status)}</div>
        </div>
        <span class="shrink-0 rounded-full border border-blue-100 bg-white px-2.5 py-1 text-[10px] font-black text-blue-600">${view.credits}학점</span>
      </div>
      <div class="mt-4 grid grid-cols-3 gap-2 text-center">
        ${metric("공부", `${view.studyHours}시간`)}
        ${metric("지능", `${view.intelligence}`)}
        ${metric("승급", view.promotionThreshold ? `${view.promotionPoints}/${view.promotionThreshold}` : "-")}
      </div>
      <div class="mt-4">
        <div class="flex justify-between text-[10px] font-bold text-slate-500"><span>${escapeHtml(view.progressLabel)}</span><span>${view.progressPercent}%</span></div>
        <div class="mt-1.5 h-2 rounded-full bg-white overflow-hidden"><div class="h-full bg-blue-500 transition-all" style="width:${view.progressPercent}%"></div></div>
      </div>
    </div>
  `;
}

export function validateRestoredStudyCareerSummaryView() {
  const blocked = getRestoredStudyCareerSummaryView({ education: { credits: 0 }, profile: { stats: { intelligence: { value: 45 } } } });
  const ready = getRestoredStudyCareerSummaryView({ education: { credits: 10, studyHours: 4 }, profile: { stats: { intelligence: { value: 50 } } }, career: {} });
  const promoted = getRestoredStudyCareerSummaryView({ education: { credits: 30, studyHours: 12 }, profile: { stats: { intelligence: { value: 60 } } }, career: { currentLevelId: "office_staff", promotionPoints: 14 } });
  const html = renderRestoredStudyCareerSummaryHtml({ education: { credits: 10, studyHours: 4 }, profile: { stats: { intelligence: { value: 50 } } }, career: {} });
  const errors = [];
  if (blocked.canApply || !blocked.missing.length) errors.push("unqualified summary must show missing requirements");
  if (!ready.canApply || ready.progressPercent < 100) errors.push("qualified entry summary must be ready");
  if (promoted.progressLabel !== "승급 진행" || promoted.progressPercent <= 0) errors.push("active career summary must show promotion progress");
  if (!html.includes("입사 준비") || !html.includes("10학점")) errors.push("summary html must show career and education values");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function getQualificationPercent(education, intelligence, level) {
  const creditsPart = Math.min(1, Number(education.credits || 0) / Math.max(1, Number(level?.requiredCredits || 1)));
  const intelligencePart = Math.min(1, intelligence / Math.max(1, Number(level?.requiredIntelligence || 1)));
  return Math.round(((creditsPart + intelligencePart) / 2) * 100);
}

function getMissingRequirements(education, intelligence, level) {
  const missing = [];
  const requiredCredits = Number(level?.requiredCredits || 0);
  const requiredIntelligence = Number(level?.requiredIntelligence || 0);
  if (Number(education.credits || 0) < requiredCredits) missing.push(`학점 ${requiredCredits}`);
  if (intelligence < requiredIntelligence) missing.push(`지능 ${requiredIntelligence}`);
  return missing;
}

function metric(label, value) {
  return `<div class="rounded-xl bg-white px-2 py-3"><div class="text-[10px] font-black text-slate-400">${escapeHtml(label)}</div><div class="mt-1 text-sm font-black text-slate-800">${escapeHtml(value)}</div></div>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
