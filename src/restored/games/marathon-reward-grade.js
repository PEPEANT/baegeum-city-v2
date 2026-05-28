export const RESTORED_MARATHON_PLACEHOLDER_SKIN_GRADES = Object.freeze(["D", "C", "B", "A", "S"]);
export const RESTORED_MARATHON_REWARD_GRADES = RESTORED_MARATHON_PLACEHOLDER_SKIN_GRADES;
export const RESTORED_MARATHON_DEFAULT_REWARD_STAGE_COUNT = 3;

export function createRestoredMarathonPlaceholderSkinReward(options = {}) {
  const checkpointIndex = Math.max(1, Number(options.checkpointIndex || 1));
  const seed = String(options.seed || `${options.participantId || "runner"}:${checkpointIndex}:placeholder-skin`);
  const grade = pickRestoredMarathonCheckpointRewardGrade(seed, { checkpointIndex, stageCount: options.stageCount });
  return Object.freeze({
    skinId: `placeholder-skin:${grade.toLowerCase()}`,
    label: `${grade}급 임시 스킨`,
    grade,
    assetStatus: "placeholder",
    swatch: placeholderSkinSwatch(grade),
    note: "실제 스킨 이미지가 들어오기 전까지 체크포인트 보상으로 표시하는 임시 등급 스킨입니다."
  });
}

export function createRestoredMarathonRewardGradeWeights(checkpointIndex, stageCount = RESTORED_MARATHON_DEFAULT_REWARD_STAGE_COUNT) {
  const count = normalizeRestoredMarathonRewardStageCount(stageCount);
  const stage = Math.max(1, Math.min(count, Math.round(Number(checkpointIndex) || 1)));
  const ratio = stage / count;
  if (ratio >= 1) return gradeWeights({ D: 20, C: 30, B: 30, A: 16, S: 4 });
  if (ratio >= 2 / 3) return gradeWeights({ D: 35, C: 35, B: 22, A: 8, S: 0 });
  return gradeWeights({ D: 60, C: 30, B: 10, A: 0, S: 0 });
}

export function normalizeRestoredMarathonRewardGrade(grade) {
  const value = String(grade || "D").toUpperCase();
  return RESTORED_MARATHON_REWARD_GRADES.includes(value) ? value : "D";
}

export function normalizeRestoredMarathonRewardStageCount(value = RESTORED_MARATHON_DEFAULT_REWARD_STAGE_COUNT) {
  const number = Math.round(Number(value || RESTORED_MARATHON_DEFAULT_REWARD_STAGE_COUNT));
  return Math.max(1, Math.min(64, Number.isFinite(number) ? number : RESTORED_MARATHON_DEFAULT_REWARD_STAGE_COUNT));
}

function pickRestoredMarathonCheckpointRewardGrade(seed, options = {}) {
  const weights = createRestoredMarathonRewardGradeWeights(options.checkpointIndex, options.stageCount);
  const total = weights.reduce((sum, item) => sum + item.weight, 0);
  let roll = hashText(seed) % total;
  for (const item of weights) {
    if (roll < item.weight) return item.grade;
    roll -= item.weight;
  }
  return "D";
}

function gradeWeights(weights) {
  return Object.freeze(RESTORED_MARATHON_REWARD_GRADES.map((grade) => Object.freeze({ grade, weight: Math.max(0, Number(weights[grade] || 0)) })));
}

function placeholderSkinSwatch(grade) {
  return Object.freeze({ D: "#8b98a8", C: "#4fbf7a", B: "#4fa7ff", A: "#b774ff", S: "#ffd25f" })[grade] || "#8b98a8";
}

function hashText(text) {
  let hash = 2166136261;
  for (const char of String(text)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
