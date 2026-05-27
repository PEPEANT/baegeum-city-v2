import {
  RESTORED_LIFE_JOB_EFFECT_TYPES,
  RESTORED_LIFE_JOB_IDS,
  createRestoredLifeJobResult,
  formatRestoredWon,
  getRestoredLifeJob,
  scoreRestoredLifeJob
} from "./life-job-contract.js";

export const RESTORED_LIFE_JOB_PLACE_VIEW_VERSION = "restored-life-job-place-view-001";

const ACTION_TO_JOB = Object.freeze({
  convenience_store: RESTORED_LIFE_JOB_IDS.CONVENIENCE_STORE,
  fast_food: RESTORED_LIFE_JOB_IDS.FAST_FOOD,
  labor_office: RESTORED_LIFE_JOB_IDS.LABOR_OFFICE,
  pc_room: RESTORED_LIFE_JOB_IDS.PC_ROOM,
  flyer: RESTORED_LIFE_JOB_IDS.FLYER,
  delivery: RESTORED_LIFE_JOB_IDS.DELIVERY,
  parking_lot: RESTORED_LIFE_JOB_IDS.PARKING,
  car_wash: RESTORED_LIFE_JOB_IDS.CAR_WASH,
  cleaning: RESTORED_LIFE_JOB_IDS.CLEANING,
  factory: RESTORED_LIFE_JOB_IDS.FACTORY,
  port: RESTORED_LIFE_JOB_IDS.PORT,
  market: RESTORED_LIFE_JOB_IDS.MARKET
});

const PRESETS = Object.freeze({
  steady: Object.freeze({
    label: "성실 근무",
    description: "실수 없이 천천히 처리합니다.",
    tone: "emerald",
    performance: Object.freeze({ accuracy: 86, speed: 68, service: 82, stamina: 74, mistakes: 0, combo: 2 })
  }),
  rush: Object.freeze({
    label: "속도전",
    description: "빠르게 처리하지만 실수 위험이 있습니다.",
    tone: "indigo",
    performance: Object.freeze({ accuracy: 72, speed: 92, service: 66, stamina: 70, mistakes: 1, combo: 4 })
  }),
  endure: Object.freeze({
    label: "버티기",
    description: "최소한의 체력으로 하루를 넘깁니다.",
    tone: "slate",
    performance: Object.freeze({ accuracy: 55, speed: 50, service: 52, stamina: 42, mistakes: 3, combo: 0 })
  })
});

const TONES = Object.freeze({
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  indigo: "border-indigo-100 bg-indigo-50 text-indigo-700",
  slate: "border-slate-100 bg-slate-50 text-slate-700"
});

export function getRestoredLifeJobIdForPlaceAction(actionId) {
  return ACTION_TO_JOB[actionId] || null;
}

export function createRestoredLifeJobPresetPerformance(jobId, presetId) {
  const preset = PRESETS[presetId] || PRESETS.steady;
  if (jobId === RESTORED_LIFE_JOB_IDS.FAST_FOOD && presetId === "rush") {
    return Object.freeze({ ...preset.performance, stamina: 64, mistakes: 2, combo: 5 });
  }
  if (jobId === RESTORED_LIFE_JOB_IDS.LABOR_OFFICE) {
    if (presetId === "steady") return Object.freeze({ accuracy: 76, speed: 62, service: 66, stamina: 92, mistakes: 1, combo: 2 });
    if (presetId === "rush") return Object.freeze({ accuracy: 64, speed: 84, service: 58, stamina: 78, mistakes: 2, combo: 3 });
    return Object.freeze({ accuracy: 48, speed: 44, service: 48, stamina: 54, mistakes: 4, combo: 0 });
  }
  if (jobId === RESTORED_LIFE_JOB_IDS.FACTORY || jobId === RESTORED_LIFE_JOB_IDS.PORT) {
    if (presetId === "steady") return Object.freeze({ accuracy: 78, speed: 58, service: 62, stamina: 88, mistakes: 1, combo: 2 });
    if (presetId === "rush") return Object.freeze({ accuracy: 62, speed: 86, service: 54, stamina: 74, mistakes: 3, combo: 3 });
    return Object.freeze({ accuracy: 46, speed: 42, service: 44, stamina: 50, mistakes: 4, combo: 0 });
  }
  if (jobId === RESTORED_LIFE_JOB_IDS.DELIVERY) {
    if (presetId === "rush") return Object.freeze({ accuracy: 68, speed: 96, service: 64, stamina: 70, mistakes: 2, combo: 5 });
    if (presetId === "endure") return Object.freeze({ accuracy: 52, speed: 56, service: 48, stamina: 48, mistakes: 3, combo: 0 });
  }
  return preset.performance;
}

export function createRestoredLifeJobPresetResult(jobId, presetId, options = {}) {
  return createRestoredLifeJobResult(jobId, createRestoredLifeJobPresetPerformance(jobId, presetId), options);
}

export function renderRestoredLifeJobPlaceHtml(actionId) {
  const jobId = getRestoredLifeJobIdForPlaceAction(actionId);
  const job = getRestoredLifeJob(jobId);
  if (!job) return "";
  const tasks = job.tasks.map(renderTask).join("");
  const buttons = Object.keys(PRESETS).map((presetId) => renderPresetButton(job, presetId)).join("");
  return `
    <section id="life-job-panel-${escapeAttr(actionId)}" class="col-span-1 sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-[10px] font-black uppercase tracking-wide text-slate-400">Starter Labor</div>
          <h3 class="mt-1 text-lg font-black text-slate-900">${escapeHtml(job.displayName)}</h3>
          <p class="mt-1 text-xs font-bold text-slate-500">${job.minutes}분 근무 · 기본 ${formatRestoredWon(job.baseWageWon)}</p>
        </div>
        <div class="flex flex-col items-end gap-2">
          <div class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">원화 근무</div>
          <button onclick="registerFixedLifeJobContract('${escapeAttr(job.id)}')" class="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-black text-emerald-700 active:scale-95 transition">고정 알바 등록</button>
        </div>
      </div>
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">${tasks}</div>
      <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">${buttons}</div>
    </section>`;
}

export function validateRestoredLifeJobPlaceView() {
  const errors = [];
  if (getRestoredLifeJobIdForPlaceAction("convenience_store") !== RESTORED_LIFE_JOB_IDS.CONVENIENCE_STORE) errors.push("convenience action must map to convenience job");
  if (getRestoredLifeJobIdForPlaceAction("fast_food") !== RESTORED_LIFE_JOB_IDS.FAST_FOOD) errors.push("fast-food action must map to fast-food job");
  if (getRestoredLifeJobIdForPlaceAction("labor_office") !== RESTORED_LIFE_JOB_IDS.LABOR_OFFICE) errors.push("labor-office action must map to labor-office job");
  if (getRestoredLifeJobIdForPlaceAction("pc_room") !== RESTORED_LIFE_JOB_IDS.PC_ROOM) errors.push("pc-room action must map to pc-room job");
  if (getRestoredLifeJobIdForPlaceAction("delivery") !== RESTORED_LIFE_JOB_IDS.DELIVERY) errors.push("delivery action must map to delivery job");
  if (getRestoredLifeJobIdForPlaceAction("factory") !== RESTORED_LIFE_JOB_IDS.FACTORY) errors.push("factory action must map to factory job");
  if (getRestoredLifeJobIdForPlaceAction("port") !== RESTORED_LIFE_JOB_IDS.PORT) errors.push("port action must map to port job");
  const html = renderRestoredLifeJobPlaceHtml("convenience_store");
  if (!html.includes("completeLifeJobShift")) errors.push("job view must expose the shift completion button hook");
  if (!html.includes("registerFixedLifeJobContract")) errors.push("job view must expose the fixed job registration hook");
  if (!html.includes("scan_items")) errors.push("job view must render deterministic tasks");
  if (!html.includes("체력") || !html.includes("시간")) errors.push("job view must preview condition and time costs");
  if (/\bDP\b|DPA/.test(html)) errors.push("job view must not label ordinary labor as DP or DPA");
  const laborHtml = renderRestoredLifeJobPlaceHtml("labor_office");
  if (!laborHtml.includes("load_boxes")) errors.push("labor-office view must render day-labor tasks");
  const factoryHtml = renderRestoredLifeJobPlaceHtml("factory");
  if (!factoryHtml.includes("inspect_parts")) errors.push("factory view must render factory tasks");
  const result = createRestoredLifeJobPresetResult(RESTORED_LIFE_JOB_IDS.CONVENIENCE_STORE, "steady");
  if (!result.ok || result.grade !== "A") errors.push("steady convenience preset should produce an A-grade result");
  const labor = createRestoredLifeJobPresetResult(RESTORED_LIFE_JOB_IDS.LABOR_OFFICE, "steady");
  if (!labor.ok || labor.wageWon <= result.wageWon) errors.push("steady labor-office preset should pay more than convenience work");
  const rush = scoreRestoredLifeJob(RESTORED_LIFE_JOB_IDS.FAST_FOOD, createRestoredLifeJobPresetPerformance(RESTORED_LIFE_JOB_IDS.FAST_FOOD, "rush"));
  if (!rush.ok || rush.grade === "S") errors.push("fast-food rush preset should stay risky, not perfect");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function renderTask(task) {
  return `<div class="rounded-xl border border-slate-100 bg-slate-50 p-3"><div class="text-xs font-black text-slate-800">${escapeHtml(task.label)}</div><div class="mt-1 text-[10px] font-bold uppercase text-slate-400">${escapeHtml(task.id)} · ${escapeHtml(task.focus)}</div></div>`;
}

function renderPresetButton(job, presetId) {
  const preset = PRESETS[presetId] || PRESETS.steady;
  const preview = createRestoredLifeJobPresetResult(job.id, presetId);
  const deltas = getConditionPreview(preview);
  const tone = TONES[preset.tone] || TONES.slate;
  return `<button onclick="completeLifeJobShift('${escapeAttr(job.id)}','${escapeAttr(presetId)}')" class="rounded-xl border ${tone} p-3 text-left active:scale-95 transition"><div class="text-sm font-black">${escapeHtml(preset.label)}</div><div class="mt-1 text-[10px] font-bold opacity-70">${escapeHtml(preset.description)}</div><div class="mt-2 text-xs font-black">예상 ${escapeHtml(preview.grade)} · ${escapeHtml(preview.wageText)}</div><div class="mt-2 grid grid-cols-2 gap-1 text-[10px] font-bold opacity-80"><span>체력 ${formatDelta(deltas.energy)}</span><span>멘탈 ${formatDelta(deltas.mental)}</span><span>시간 ${Math.round(deltas.timeMinutes || job.minutes)}분</span><span>평판 ${formatDelta(deltas.reputation)}</span></div></button>`;
}

function getConditionPreview(result) {
  const effect = result.effects?.find((item) => item.type === RESTORED_LIFE_JOB_EFFECT_TYPES.PLAYER_STATE_PATCH);
  return effect?.payload?.deltas || {};
}

function formatDelta(value) {
  const number = Math.round(Number(value) || 0);
  return `${number > 0 ? "+" : ""}${number}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
