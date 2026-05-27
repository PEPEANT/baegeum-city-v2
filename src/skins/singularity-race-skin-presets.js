import { getPresetSkinDataUrl } from "./drawing-world-adapter.js";

const RACE_SKIN_SPECS = Object.freeze([
  { id: "kaguya", name: "카구야", hair: "#f8d86d", face: "#f1c49f", shirt: "#101827", pants: "#1f2937", accent: "#ef4444", accessory: "ribbon" },
  { id: "singularity-fan", name: "특붕이", hair: "#111827", face: "#f0b894", shirt: "#14b8a6", pants: "#1f2937", accent: "#ffd86c", accessory: "spark" },
  { id: "robot", name: "로봇", hair: "#64748b", face: "#bfdbfe", shirt: "#60a5fa", pants: "#334155", accent: "#facc15", accessory: "robot" },
  { id: "gpichan", name: "지피쨩", hair: "#e0f2fe", face: "#f5c6a5", shirt: "#f8fafc", pants: "#0f172a", accent: "#38bdf8", accessory: "side-ribbon" },
  { id: "doomer-runner", name: "두머", hair: "#1f2937", face: "#aeb7bd", shirt: "#374151", pants: "#111827", accent: "#94a3b8", accessory: "hood" },
  { id: "pepe-runner", name: "페페", hair: "#166534", face: "#42c879", shirt: "#2563eb", pants: "#172554", accent: "#ef4444", accessory: "wide-smile" },
  { id: "doge-runner", name: "도지 러너", hair: "#b7791f", face: "#f0c26b", shirt: "#f97316", pants: "#7c2d12", accent: "#fff7c2", accessory: "doge" },
  { id: "ant-squad", name: "개미단", hair: "#111827", face: "#1f2937", shirt: "#dc2626", pants: "#111827", accent: "#facc15", accessory: "antenna" },
  { id: "moderator-armband", name: "완장", hair: "#1e293b", face: "#f0c7a2", shirt: "#475569", pants: "#111827", accent: "#2563eb", accessory: "armband" },
  { id: "yalrkun", name: "얀르쿤", hair: "#f59e0b", face: "#f8d7a8", shirt: "#fde047", pants: "#78350f", accent: "#38bdf8", accessory: "moon" },
  { id: "lakers-wile", name: "레이커즈와일", hair: "#3b0764", face: "#f5c6a5", shirt: "#552583", pants: "#111827", accent: "#fdb927", accessory: "headband" },
  { id: "sam-altman", name: "샘 올트먼", hair: "#2f2f2f", face: "#e7b98f", shirt: "#111827", pants: "#0f172a", accent: "#cbd5e1", accessory: "sam" },
  { id: "demis-hassabis", name: "허사비스", hair: "#18181b", face: "#d69b78", shirt: "#0f766e", pants: "#0f172a", accent: "#67e8f9", accessory: "hassabis" },
  { id: "ai-believer", name: "AI 신봉자", hair: "#475569", face: "#e2e8f0", shirt: "#0ea5e9", pants: "#0f172a", accent: "#a7f3d0", accessory: "halo" },
  { id: "server-crash", name: "서버 터짐이", hair: "#1e3a8a", face: "#93c5fd", shirt: "#1d4ed8", pants: "#111827", accent: "#f97316", accessory: "spark" },
  { id: "profit-fairy", name: "익절 요정", hair: "#15803d", face: "#f0c7a2", shirt: "#22c55e", pants: "#14532d", accent: "#bbf7d0", accessory: "wings" },
  { id: "stoploss-warrior", name: "손절 전사", hair: "#7f1d1d", face: "#f0b894", shirt: "#ef4444", pants: "#1f2937", accent: "#111827", accessory: "headband" }
]);

const DRAWING_WORLD_ORIGINAL_SKIN_IDS = new Set(["kaguya", "robot", "gpichan"]);
const skinDataUrls = new Map();

export const SINGULARITY_RACE_DEFAULT_SKIN_ID = RACE_SKIN_SPECS[0].id;
export const SINGULARITY_RACE_SKIN_PRESETS = Object.freeze(RACE_SKIN_SPECS.map(({ id, name }) => Object.freeze({ id, name })));

export function getSingularityRaceSkinPresets() {
  return SINGULARITY_RACE_SKIN_PRESETS;
}

export function normalizeSingularityRaceSkinId(skinId) {
  const id = String(skinId || "").trim();
  return RACE_SKIN_SPECS.some((skin) => skin.id === id) ? id : SINGULARITY_RACE_DEFAULT_SKIN_ID;
}

export function getSingularityRaceSkinDataUrl(skinId, direction = "side") {
  const id = normalizeSingularityRaceSkinId(skinId);
  const key = `${id}:${direction}`;
  if (skinDataUrls.has(key)) return skinDataUrls.get(key);
  const spec = RACE_SKIN_SPECS.find((skin) => skin.id === id) || RACE_SKIN_SPECS[0];
  const dataUrl = getDrawingWorldOriginalRaceSkinDataUrl(spec, direction)
    || `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderRaceSkinSvg(spec))}`;
  skinDataUrls.set(key, dataUrl);
  return dataUrl;
}

export function validateSingularityRaceSkinPresetContract() {
  const ids = new Set(SINGULARITY_RACE_SKIN_PRESETS.map((skin) => skin.id));
  const errors = [];
  if (!ids.has("singularity-fan")) errors.push("race skin pack needs singularity-fan");
  ["kaguya", "robot", "gpichan", "pepe-runner", "moderator-armband", "yalrkun", "lakers-wile", "sam-altman", "demis-hassabis"].forEach((id) => {
    if (!ids.has(id)) errors.push(`race skin pack needs ${id}`);
  });
  if (ids.has("casino-dealer") || ids.has("table-gambler") || ids.has("office-worker")) errors.push("casino or general-citizen skins must not appear in race pack");
  if (SINGULARITY_RACE_SKIN_PRESETS.length < 14) errors.push("race skin pack should have at least 14 choices");
  DRAWING_WORLD_ORIGINAL_SKIN_IDS.forEach((id) => {
    if (!ids.has(id)) errors.push(`Drawing World original skin missing: ${id}`);
  });
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function getDrawingWorldOriginalRaceSkinDataUrl(spec, direction) {
  if (!DRAWING_WORLD_ORIGINAL_SKIN_IDS.has(spec.id)) return "";
  return getPresetSkinDataUrl(spec.id, direction);
}

function renderRaceSkinSvg(spec) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" shape-rendering="crispEdges">`,
    `<g>`,
    rect("#000000", 9, 29, 14, 2, 0.16),
    ...accessoryRects(spec),
    rect(spec.hair, 8, 7, 16, 5),
    rect(spec.face, 10, 11, 12, 8),
    rect(spec.shirt, 8, 18, 16, 8),
    rect(darken(spec.shirt), 6, 20, 4, 5),
    rect(darken(spec.shirt), 22, 20, 4, 5),
    rect(spec.pants, 10, 26, 5, 4),
    rect(spec.pants, 17, 26, 5, 4),
    ...faceRects(spec),
    rect(spec.accent, 14, 19, 4, 2),
    ...overlayRects(spec),
    `</g></svg>`
  ].join("");
}

function accessoryRects(spec) {
  if (spec.accessory === "antenna") return [rect("#111827", 11, 3, 2, 4), rect("#111827", 19, 3, 2, 4), rect(spec.accent, 10, 2, 3, 2), rect(spec.accent, 19, 2, 3, 2)];
  if (spec.accessory === "ribbon") return [rect(spec.accent, 19, 5, 3, 3), rect(spec.accent, 22, 6, 2, 2)];
  if (spec.accessory === "side-ribbon") return [rect(spec.accent, 20, 7, 3, 3), rect("#ffffff", 23, 8, 2, 2)];
  if (spec.accessory === "robot") return [rect("#334155", 9, 5, 14, 3), rect(spec.accent, 15, 3, 2, 2), rect("#334155", 15, 4, 1, 2)];
  if (spec.accessory === "doge") return [rect("#8a5a16", 7, 6, 4, 6), rect("#8a5a16", 21, 6, 4, 6), rect("#fff7c2", 12, 16, 8, 3)];
  if (spec.accessory === "cat") return [rect(spec.hair, 8, 5, 4, 4), rect(spec.hair, 20, 5, 4, 4), rect(spec.accent, 9, 6, 2, 2), rect(spec.accent, 21, 6, 2, 2)];
  if (spec.accessory === "halo") return [rect(spec.accent, 11, 4, 10, 1), rect(spec.accent, 10, 5, 2, 1), rect(spec.accent, 20, 5, 2, 1)];
  if (spec.accessory === "wings") return [rect(spec.accent, 4, 17, 4, 8, 0.72), rect(spec.accent, 24, 17, 4, 8, 0.72)];
  if (spec.accessory === "moon") return [rect("#fff7c2", 21, 4, 3, 6), rect("#f59e0b", 22, 4, 3, 6)];
  if (spec.accessory === "headband") return [rect(spec.accent, 8, 10, 16, 2)];
  if (spec.accessory === "hood") return [rect(spec.hair, 7, 6, 18, 13), rect(spec.face, 11, 11, 10, 7)];
  return [rect(spec.accent, 22, 5, 2, 2), rect(spec.accent, 24, 3, 2, 2), rect(spec.accent, 25, 6, 2, 2)];
}

function overlayRects(spec) {
  if (spec.accessory === "armband") return [rect("#2563eb", 22, 21, 4, 2), rect("#bfdbfe", 23, 21, 2, 1)];
  if (spec.accessory === "robot") return [rect("#0f172a", 12, 13, 8, 1), rect(spec.accent, 15, 15, 2, 2)];
  if (spec.accessory === "sam") return [rect("#94a3b8", 11, 19, 10, 1), rect("#475569", 13, 21, 6, 1)];
  if (spec.accessory === "hassabis") return [rect("#67e8f9", 9, 19, 14, 1), rect("#0f172a", 12, 16, 8, 1)];
  return [];
}

function faceRects(spec) {
  const tired = spec.accessory === "hood";
  const greenSmile = spec.accessory === "wide-smile";
  const eye = tired ? spec.accent : "#111827";
  const mouth = greenSmile ? spec.accent : "#7f1d1d";
  return [
    rect("#ffffff", 12, 13, 2, 2),
    rect("#ffffff", 18, 13, 2, 2),
    rect(eye, 13, tired ? 13 : 14, 1, 1),
    rect(eye, 19, tired ? 13 : 14, 1, 1),
    rect(mouth, greenSmile ? 13 : 15, 17, greenSmile ? 7 : 4, 1)
  ];
}

function rect(color, x, y, width, height, opacity = 1) {
  const alpha = opacity < 1 ? ` fill-opacity="${opacity}"` : "";
  return `<rect fill="${color}" x="${x}" y="${y}" width="${width}" height="${height}"${alpha}/>`;
}

function darken(color) {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return color;
  const value = Number.parseInt(match[1], 16);
  const r = Math.max(0, ((value >> 16) & 255) - 28);
  const g = Math.max(0, ((value >> 8) & 255) - 28);
  const b = Math.max(0, (value & 255) - 28);
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}
