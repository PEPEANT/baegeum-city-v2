import { getPresetSkinDataUrl } from "./drawing-world-adapter.js";

const RACE_SKIN_SPECS = Object.freeze([
  { id: "singularity-fan", name: "특붕이", hair: "#111827", face: "#f0b894", shirt: "#38bdf8", pants: "#1e3a8a", accent: "#bae6fd", accessory: "spark" },
  { id: "robot", name: "로봇", hair: "#64748b", face: "#bfdbfe", shirt: "#60a5fa", pants: "#334155", accent: "#facc15", accessory: "robot" },
  { id: "gpichan", name: "지피쨩", hair: "#e0f2fe", face: "#f5c6a5", shirt: "#f8fafc", pants: "#0f172a", accent: "#38bdf8", accessory: "side-ribbon" },
  { id: "doomer-runner", name: "두머", hair: "#1f2937", face: "#aeb7bd", shirt: "#374151", pants: "#111827", accent: "#94a3b8", accessory: "hood" },
  { id: "pepe-runner", name: "페페", hair: "#166534", face: "#42c879", shirt: "#2563eb", pants: "#172554", accent: "#ef4444", accessory: "wide-smile" },
  { id: "doge-runner", name: "강성태", hair: "#111827", face: "#efc09b", shirt: "#f8fafc", pants: "#111827", accent: "#1e3a8a", accessory: "check-shirt" },
  { id: "ant-squad", name: "서학개미", hair: "#111827", face: "#1f2937", shirt: "#1d4ed8", pants: "#111827", accent: "#ef4444", accessory: "antenna" },
  { id: "moderator-armband", name: "완장", hair: "#1e293b", face: "#f0c7a2", shirt: "#475569", pants: "#111827", accent: "#2563eb", accessory: "armband" },
  { id: "yalrkun", name: "얀르쿤", hair: "#f59e0b", face: "#f8d7a8", shirt: "#fde047", pants: "#78350f", accent: "#38bdf8", accessory: "moon" },
  { id: "lakers-wile", name: "레이커즈와일", hair: "#3b0764", face: "#f5c6a5", shirt: "#552583", pants: "#111827", accent: "#fdb927", accessory: "headband" },
  { id: "sam-altman", name: "샘 올트먼", hair: "#2f2f2f", face: "#e7b98f", shirt: "#111827", pants: "#0f172a", accent: "#cbd5e1", accessory: "sam" },
  { id: "demis-hassabis", name: "허사비스", hair: "#18181b", face: "#d69b78", shirt: "#0f766e", pants: "#0f172a", accent: "#67e8f9", accessory: "hassabis" },
  { id: "ai-believer", name: "특궁", hair: "#334155", face: "#dbeafe", shirt: "#475569", pants: "#111827", accent: "#38bdf8", accessory: "robocop" },
  { id: "server-crash", name: "역류기", hair: "#020617", face: "#86efac", shirt: "#111827", pants: "#020617", accent: "#22c55e", accessory: "hacker" },
  { id: "profit-fairy", name: "일론머스크", hair: "#3f3f46", face: "#e7b98f", shirt: "#111827", pants: "#0f172a", accent: "#e5e7eb", accessory: "x-suit" },
  { id: "stoploss-warrior", name: "김대식", hair: "#f97316", face: "#f0b894", shirt: "#334155", pants: "#111827", accent: "#facc15", accessory: "glasses" },
  { id: "grok-chan", name: "그록쨩", hair: "#facc15", face: "#f2c19d", shirt: "#111827", pants: "#020617", accent: "#94a3b8", accessory: "long-blonde" },
  { id: "gemini-chan", name: "제미나이쨩", hair: "#60a5fa", face: "#f3c6a8", shirt: "#fdf2f8", pants: "#1e3a8a", accent: "#fb7185", accessory: "gemini-girl" },
  { id: "claude-chan", name: "클로드군", hair: "#c2410c", face: "#f1bf99", shirt: "#ea580c", pants: "#7c2d12", accent: "#fed7aa", accessory: "scholar" },
  { id: "atlas-robot", name: "아틀라스", hair: "#64748b", face: "#dbeafe", shirt: "#e5e7eb", pants: "#475569", accent: "#2563eb", accessory: "atlas-bot" },
  { id: "donald-trump", name: "도널드트럼프", hair: "#facc15", face: "#f1bf99", shirt: "#111827", pants: "#0f172a", accent: "#ef4444", accessory: "red-tie" },
  { id: "lee-jaemyung", name: "이재명", hair: "#111827", face: "#f0c7a2", shirt: "#1e3a8a", pants: "#0f172a", accent: "#38bdf8", accessory: "blue-tie" },
  { id: "von-neumann", name: "폰 노이만", hair: "#d1d5db", face: "#e7b98f", shirt: "#334155", pants: "#111827", accent: "#f8fafc", accessory: "neumann" },
  { id: "kaguya", name: "카구야", hair: "#f8d86d", face: "#f1c49f", shirt: "#101827", pants: "#1f2937", accent: "#ef4444", accessory: "ribbon" }
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
  if (SINGULARITY_RACE_SKIN_PRESETS[0]?.id !== "singularity-fan") errors.push("race skin picker should start with singularity-fan");
  if (SINGULARITY_RACE_SKIN_PRESETS.at(-1)?.id !== "kaguya") errors.push("race skin picker should keep kaguya last");
  if (!ids.has("singularity-fan")) errors.push("race skin pack needs singularity-fan");
  if (!hasSkinName("doge-runner", "강성태")) errors.push("doge-runner should display as 강성태");
  if (!hasSkinName("ant-squad", "서학개미")) errors.push("ant-squad should display as 서학개미");
  if (!hasSkinName("ai-believer", "특궁")) errors.push("ai-believer should display as 특궁");
  if (!hasSkinName("server-crash", "역류기")) errors.push("server-crash should display as 역류기");
  if (!hasSkinName("profit-fairy", "일론머스크")) errors.push("profit-fairy should display as 일론머스크");
  if (!hasSkinName("stoploss-warrior", "김대식")) errors.push("stoploss-warrior should display as 김대식");
  if (!hasSkinName("grok-chan", "그록쨩")) errors.push("race skin pack needs 그록쨩");
  if (!hasSkinName("gemini-chan", "제미나이쨩")) errors.push("race skin pack needs 제미나이쨩");
  if (!hasSkinName("claude-chan", "클로드군")) errors.push("race skin pack needs 클로드군");
  if (!hasSkinName("atlas-robot", "아틀라스")) errors.push("race skin pack needs 아틀라스");
  if (!hasSkinName("donald-trump", "도널드트럼프")) errors.push("race skin pack needs 도널드트럼프");
  if (!hasSkinName("lee-jaemyung", "이재명")) errors.push("race skin pack needs 이재명");
  if (!hasSkinName("von-neumann", "폰 노이만")) errors.push("race skin pack needs 폰 노이만");
  ["kaguya", "robot", "gpichan", "pepe-runner", "moderator-armband", "yalrkun", "lakers-wile", "sam-altman", "demis-hassabis", "grok-chan", "gemini-chan", "claude-chan", "atlas-robot", "donald-trump", "lee-jaemyung", "von-neumann"].forEach((id) => {
    if (!ids.has(id)) errors.push(`race skin pack needs ${id}`);
  });
  if (ids.has("casino-dealer") || ids.has("table-gambler") || ids.has("office-worker")) errors.push("casino or general-citizen skins must not appear in race pack");
  if (SINGULARITY_RACE_SKIN_PRESETS.length < 14) errors.push("race skin pack should have at least 14 choices");
  DRAWING_WORLD_ORIGINAL_SKIN_IDS.forEach((id) => {
    if (!ids.has(id)) errors.push(`Drawing World original skin missing: ${id}`);
  });
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function hasSkinName(id, name) {
  return RACE_SKIN_SPECS.some((skin) => skin.id === id && skin.name === name);
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
  if (spec.accessory === "bow") return [rect("#713f12", 5, 13, 2, 10), rect("#713f12", 25, 13, 2, 10), rect(spec.accent, 4, 12, 3, 3), rect(spec.accent, 25, 22, 3, 3)];
  if (spec.accessory === "backflow") return [rect(spec.accent, 5, 5, 3, 2), rect("#60a5fa", 4, 8, 4, 2), rect(spec.accent, 24, 5, 3, 2), rect("#60a5fa", 24, 8, 4, 2)];
  if (spec.accessory === "robocop") return [rect("#0f172a", 8, 6, 16, 4), rect("#94a3b8", 9, 5, 14, 2), rect(spec.accent, 10, 9, 12, 1)];
  if (spec.accessory === "hacker") return [rect("#020617", 7, 6, 18, 13), rect("#020617", 6, 18, 4, 8), rect("#020617", 22, 18, 4, 8), rect(spec.face, 11, 11, 10, 6)];
  if (spec.accessory === "long-blonde") return [rect(spec.hair, 7, 8, 3, 17), rect(spec.hair, 22, 8, 3, 17), rect(spec.hair, 9, 5, 14, 5), rect("#0f172a", 8, 6, 16, 2)];
  if (spec.accessory === "twin-tail") return [rect("#60a5fa", 5, 8, 5, 12), rect("#fb7185", 22, 8, 5, 12), rect("#dbeafe", 7, 7, 2, 2), rect("#fce7f3", 23, 7, 2, 2)];
  if (spec.accessory === "gemini-girl") return [rect("#60a5fa", 4, 8, 6, 13), rect("#fb7185", 22, 8, 6, 13), rect("#dbeafe", 6, 6, 3, 3), rect("#fce7f3", 23, 6, 3, 3), rect("#f9a8d4", 14, 5, 4, 2)];
  if (spec.accessory === "scholar") return [rect("#7c2d12", 9, 5, 14, 3), rect(spec.accent, 5, 20, 3, 5), rect("#92400e", 4, 19, 5, 1)];
  if (spec.accessory === "atlas-bot") return [rect("#334155", 9, 5, 14, 4), rect("#e5e7eb", 10, 6, 12, 2), rect(spec.accent, 14, 3, 4, 2)];
  if (spec.accessory === "red-tie") return [rect(spec.hair, 7, 6, 18, 4), rect(spec.hair, 9, 5, 14, 3), rect("#f59e0b", 8, 8, 16, 2)];
  if (spec.accessory === "blue-tie") return [rect("#111827", 8, 6, 16, 5), rect("#1e40af", 12, 5, 8, 1)];
  if (spec.accessory === "neumann") return [rect(spec.hair, 7, 6, 18, 5), rect("#f8fafc", 5, 20, 3, 5), rect("#d1d5db", 22, 6, 4, 8)];
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
  if (spec.accessory === "check-shirt") return [rect("#111827", 10, 18, 2, 8), rect("#111827", 16, 18, 2, 8), rect("#111827", 22, 18, 2, 8), rect(spec.accent, 8, 20, 16, 2), rect(spec.accent, 8, 24, 16, 2)];
  if (spec.accessory === "bow") return [rect("#78350f", 7, 16, 2, 8), rect("#78350f", 23, 16, 2, 8), rect(spec.accent, 13, 19, 6, 1)];
  if (spec.accessory === "backflow") return [rect("#60a5fa", 10, 19, 8, 2), rect(spec.accent, 14, 22, 8, 2), rect("#0f172a", 12, 16, 8, 1)];
  if (spec.accessory === "robocop") return [rect("#94a3b8", 8, 18, 16, 2), rect("#0f172a", 11, 21, 10, 1), rect(spec.accent, 14, 19, 4, 5)];
  if (spec.accessory === "hacker") return [rect("#052e16", 9, 18, 14, 8), rect(spec.accent, 11, 20, 2, 1), rect(spec.accent, 15, 22, 3, 1), rect(spec.accent, 20, 20, 1, 1)];
  if (spec.accessory === "x-suit") return [rect("#f8fafc", 14, 18, 4, 8), rect(spec.accent, 12, 19, 2, 2), rect(spec.accent, 18, 22, 2, 2), rect("#52525b", 11, 19, 2, 1), rect("#52525b", 19, 19, 2, 1)];
  if (spec.accessory === "glasses") return [rect("#111827", 11, 13, 4, 1), rect("#111827", 17, 13, 4, 1), rect("#111827", 15, 14, 2, 1), rect(spec.accent, 14, 21, 4, 1)];
  if (spec.accessory === "long-blonde") return [rect("#020617", 10, 18, 12, 8), rect(spec.accent, 13, 20, 6, 1), rect("#e2e8f0", 15, 19, 2, 5)];
  if (spec.accessory === "twin-tail") return [rect("#60a5fa", 8, 18, 7, 8), rect("#fb7185", 17, 18, 7, 8), rect("#ffffff", 14, 19, 4, 2)];
  if (spec.accessory === "gemini-girl") return [rect("#dbeafe", 8, 18, 8, 8), rect("#fbcfe8", 16, 18, 8, 8), rect("#ffffff", 13, 19, 6, 2), rect("#fb7185", 12, 23, 8, 2), rect("#f9a8d4", 11, 15, 2, 1), rect("#f9a8d4", 19, 15, 2, 1)];
  if (spec.accessory === "scholar") return [rect("#111827", 11, 13, 4, 1), rect("#111827", 17, 13, 4, 1), rect("#111827", 15, 14, 2, 1), rect("#fff7ed", 13, 19, 6, 2), rect("#7c2d12", 12, 22, 8, 1)];
  if (spec.accessory === "atlas-bot") return [circle("#020617", 16, 15, 4), rect("#94a3b8", 8, 18, 16, 8), rect("#1d4ed8", 12, 20, 8, 2), rect("#111827", 10, 23, 4, 1), rect("#111827", 18, 23, 4, 1)];
  if (spec.accessory === "red-tie") return [rect("#f8fafc", 13, 18, 6, 8), rect(spec.accent, 15, 19, 2, 6), rect("#ffffff", 11, 18, 2, 2), rect("#ffffff", 19, 18, 2, 2)];
  if (spec.accessory === "blue-tie") return [rect("#f8fafc", 13, 18, 6, 8), rect(spec.accent, 15, 19, 2, 6), rect("#ef4444", 10, 20, 2, 1), rect("#ffffff", 20, 20, 2, 1)];
  if (spec.accessory === "neumann") return [rect("#111827", 11, 13, 4, 1), rect("#111827", 17, 13, 4, 1), rect("#111827", 15, 14, 2, 1), rect("#f8fafc", 13, 18, 6, 8), rect("#111827", 8, 23, 3, 1), rect("#111827", 21, 23, 3, 1)];
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

function circle(color, cx, cy, radius, opacity = 1) {
  const alpha = opacity < 1 ? ` fill-opacity="${opacity}"` : "";
  return `<circle fill="${color}" cx="${cx}" cy="${cy}" r="${radius}"${alpha}/>`;
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
