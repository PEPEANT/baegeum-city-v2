import {
  RESTORED_STUDY_ACTIVITY_IDS,
  createRestoredCompanyShiftPresetResult,
  createRestoredStudyResult,
  listRestoredCompanyShiftPresets
} from "./study-career-contract.js";

export const RESTORED_STUDY_CAREER_PLACE_VIEW_VERSION = "restored-study-career-place-view-001";

const SUPPORTED_ACTIONS = Object.freeze(["job_places"]);

export function renderRestoredStudyCareerPlaceHtml(actionId, state = {}) {
  if (!SUPPORTED_ACTIONS.includes(actionId)) return "";
  const library = createRestoredStudyResult(RESTORED_STUDY_ACTIVITY_IDS.LIBRARY_SELF_STUDY, state);
  const university = createRestoredStudyResult(RESTORED_STUDY_ACTIVITY_IDS.UNIVERSITY_NIGHT_CLASS, state);
  const companyButtons = listRestoredCompanyShiftPresets().map((preset) => {
    const result = createRestoredCompanyShiftPresetResult(preset.id, state);
    const detail = result.ok
      ? `${preset.detail} · ${result.workedLevelTitle || result.levelTitle} · ${result.wageDp.toLocaleString("en-US")} DP${result.promoted ? " · 승급 예정" : ""}`
      : result.message;
    return button(preset.label, detail, `completeStudyCareerAction('${preset.id}')`, "slate", result.ok, result.message);
  }).join("");

  return `
    <section id="study-career-panel" class="col-span-1 sm:col-span-2 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-[10px] font-black uppercase tracking-wide text-blue-400">Study / Career</div>
          <h3 class="mt-1 text-lg font-black text-slate-900">도서관 · 대학 · 회사</h3>
          <p class="mt-1 text-xs font-bold text-slate-500">공부로 지능과 학점을 올리고, 회사 근무 방식에 따라 DP와 승급 포인트를 얻습니다.</p>
        </div>
        <div class="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black text-blue-600">취업 루프</div>
      </div>
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        ${button("도서관 공부", "지능 +4 · 학점 +4", "completeStudyCareerAction('study:library-self-study')", "emerald", library.ok)}
        ${button("대학 야간강의", "25,000 DP · 학점 +10", "completeStudyCareerAction('study:university-night-class')", "indigo", university.ok, university.message)}
      </div>
      <div class="mt-4 border-t border-slate-100 pt-4">
        <div class="mb-2 flex items-center justify-between"><h4 class="text-xs font-black text-slate-700">회사 근무 선택</h4><span class="text-[10px] font-bold text-slate-400">근무 방식별 보상 차이</span></div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">${companyButtons}</div>
      </div>
    </section>`;
}

export function validateRestoredStudyCareerPlaceView() {
  const errors = [];
  const readyState = { cash: 100000, education: { credits: 50 }, profile: { stats: { intelligence: { value: 80 } } }, career: {} };
  const html = renderRestoredStudyCareerPlaceHtml("job_places", readyState);
  if (!html.includes("completeStudyCareerAction")) errors.push("study/career view must expose the action hook");
  for (const text of ["도서관 공부", "대학 야간강의", "회사 근무 선택", "서류 정리", "야근 보고서", "팀 지원"]) {
    if (!html.includes(text)) errors.push(`study/career view must show ${text}`);
  }
  if (renderRestoredStudyCareerPlaceHtml("casino_street")) errors.push("study/career view must only render for supported place actions");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function button(label, detail, onclick, tone, enabled, disabledMessage = "") {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
    indigo: "border-indigo-100 bg-indigo-50 text-indigo-700",
    slate: "border-slate-100 bg-slate-50 text-slate-700"
  };
  const cls = tones[tone] || tones.slate;
  const click = enabled ? onclick : `showToast(${JSON.stringify(disabledMessage || "조건이 부족합니다.")})`;
  return `<button onclick="${click}" class="rounded-xl border ${cls} p-3 text-left active:scale-95 transition"><div class="text-sm font-black">${escapeHtml(label)}</div><div class="mt-1 text-[10px] font-bold opacity-70">${escapeHtml(detail)}</div></button>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
