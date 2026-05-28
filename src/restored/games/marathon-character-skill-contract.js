import {
  RESTORED_MARATHON_DEFAULT_REWARD_STAGE_COUNT,
  RESTORED_MARATHON_PLACEHOLDER_SKIN_GRADES,
  RESTORED_MARATHON_REWARD_GRADES,
  createRestoredMarathonPlaceholderSkinReward,
  createRestoredMarathonRewardGradeWeights,
  normalizeRestoredMarathonRewardGrade,
  normalizeRestoredMarathonRewardStageCount
} from "./marathon-reward-grade.js";

export {
  RESTORED_MARATHON_DEFAULT_REWARD_STAGE_COUNT,
  RESTORED_MARATHON_PLACEHOLDER_SKIN_GRADES,
  RESTORED_MARATHON_REWARD_GRADES,
  createRestoredMarathonPlaceholderSkinReward
};

export const RESTORED_MARATHON_CHARACTER_SKILL_CONTRACT_VERSION = "restored-marathon-character-skill-001";
export const RESTORED_MARATHON_CHARACTER_SKILL_VERSION = RESTORED_MARATHON_CHARACTER_SKILL_CONTRACT_VERSION;
export const RESTORED_MARATHON_CHARACTER_RARITIES = Object.freeze(["common", "rare", "chaos", "legend"]);
export const RESTORED_MARATHON_CHARACTER_GRADES = Object.freeze(["D", "C", "B", "A", "S"]);
export const RESTORED_MARATHON_SKILL_TARGETS = Object.freeze(["self", "nearby", "cone", "trail", "global"]);

const SKILLS = Object.freeze([
  skill("skill:steady-boost", "Steady Boost", "self", 8, 0, 0, 0, "Small D-grade speed bump."),
  skill("skill:slip-trail", "Slip Trail", "trail", 14, 1, 3.2, 0, "Drops a short slowing trail."),
  skill("skill:side-bump", "Side Bump", "nearby", 10, 0, 2.4, 260, "Pushes nearby runners sideways."),
  skill("skill:input-scramble", "Input Scramble", "cone", 18, 1, 2.8, 420, "Briefly scrambles steering."),
  skill("skill:checkpoint-hop", "Checkpoint Hop", "self", 0, 1, 0, 0, "One-use hop forward."),
  skill("skill:stamina-sip", "Stamina Sip", "nearby", 16, 1, 2.2, 240, "Steals a little stamina."),
  skill("skill:noise-burst", "Noise Burst", "global", 28, 1, 1.2, 0, "S-grade field disruption."),
  skill("skill:guard-roll", "Guard Roll", "self", 18, 1, 0, 0, "Brief protection with awkward steering.")
]);

const REWARD_SKILL_POOLS = Object.freeze({
  D: Object.freeze(["skill:steady-boost"]),
  C: Object.freeze(["skill:steady-boost", "skill:slip-trail"]),
  B: Object.freeze(["skill:side-bump", "skill:stamina-sip", "skill:guard-roll"]),
  A: Object.freeze(["skill:checkpoint-hop", "skill:input-scramble", "skill:guard-roll"]),
  S: Object.freeze(["skill:noise-burst", "skill:checkpoint-hop"])
});

export const RESTORED_MARATHON_MEME_CHARACTER_CATALOG = Object.freeze([
  character("runner:dororong", "도로롱 주자", "common", "skill:steady-boost", 102, "작고 빠른 기본 러너."),
  character("runner:comment-berserker", "분노의 댓글러", "common", "skill:side-bump", 94, "근접 방해형 하위권 변수."),
  character("runner:recommend-fairy", "추천요정", "rare", "skill:checkpoint-hop", 88, "한 번 치고 나가는 체크포인트 보조."),
  character("runner:night-regular", "야간반 고인물", "rare", "skill:guard-roll", 96, "후반 안정성이 좋은 생존형."),
  character("runner:gallery-warden", "갤러리 완장", "chaos", "skill:input-scramble", 90, "파란 완장 콘셉트의 방해형."),
  character("runner:keyboard-warrior", "키보드 워리어", "common", "skill:slip-trail", 92, "뒤에 미끄러운 흔적을 남김."),
  character("runner:dopamine-sprinter", "도파민 질주러", "rare", "skill:stamina-sip", 104, "중위권에서 체력 변수를 만듦."),
  character("runner:meme-summoner", "밈 소환사", "legend", "skill:noise-burst", 84, "희귀한 전체 방해 한 방.")
]);

export function getRestoredMarathonSkill(skillId) {
  return SKILLS.find((item) => item.skillId === skillId) || SKILLS[0];
}

export function getRestoredMarathonCharacter(characterId) {
  return RESTORED_MARATHON_MEME_CHARACTER_CATALOG.find((item) => item.characterId === characterId)
    || RESTORED_MARATHON_MEME_CHARACTER_CATALOG[0];
}

export function assignRestoredMarathonCheckpointCharacter(options = {}) {
  const checkpointIndex = Math.max(1, Number(options.checkpointIndex || 1));
  const participantId = options.participantId || "runner";
  const seed = String(options.seed || `${participantId}:${checkpointIndex}`);
  const stageCount = normalizeRestoredMarathonRewardStageCount(options.stageCount);
  const character = weightedPick(characterPoolForCheckpoint(checkpointIndex, stageCount), seed);
  const placeholderSkin = createRestoredMarathonPlaceholderSkinReward({ participantId, checkpointIndex, stageCount, seed: `${seed}:placeholder-skin` });
  const skill = createRestoredMarathonRewardSkill({ grade: placeholderSkin.grade, seed: `${seed}:reward-skill` });
  return Object.freeze({
    version: RESTORED_MARATHON_CHARACTER_SKILL_VERSION,
    participantId: options.participantId || "",
    checkpointIndex,
    character,
    skill,
    placeholderSkin,
    serverSeedHash: hashText(seed),
    authority: options.authority || "server_required"
  });
}

export function createRestoredMarathonRewardSkill(options = {}) {
  const grade = normalizeRestoredMarathonRewardGrade(options.grade || "D");
  const pool = REWARD_SKILL_POOLS[grade] || REWARD_SKILL_POOLS.D;
  const seed = String(options.seed || `${grade}:reward-skill`);
  const skillId = pool[hashText(seed) % pool.length] || pool[0];
  return Object.freeze({ ...getRestoredMarathonSkill(skillId), grade });
}

export function isRestoredMarathonRewardSkillAllowedForGrade(skillId, grade = "D") {
  const normalizedGrade = normalizeRestoredMarathonRewardGrade(grade);
  const pool = REWARD_SKILL_POOLS[normalizedGrade] || REWARD_SKILL_POOLS.D;
  return Boolean(skillId) && pool.includes(skillId);
}

export function createRestoredMarathonCheckpointRewardPlan(stageCount = RESTORED_MARATHON_DEFAULT_REWARD_STAGE_COUNT) {
  const count = normalizeRestoredMarathonRewardStageCount(stageCount);
  return Object.freeze(Array.from({ length: count }, (_, index) => Object.freeze({
    checkpointIndex: index + 1,
    unlocksCharacter: true,
    maxGrade: maxGradeForCheckpoint(index + 1, count),
    gradeWeights: createRestoredMarathonRewardGradeWeights(index + 1, count),
    legendEligible: maxGradeForCheckpoint(index + 1, count) === "S",
    authority: "server_required"
  })));
}

export function listRestoredMarathonCharacterGradePool(checkpointIndex = 1, options = {}) {
  const maxRank = gradeRank(maxGradeForCheckpoint(checkpointIndex, options.stageCount));
  return Object.freeze(RESTORED_MARATHON_MEME_CHARACTER_CATALOG.filter((item) => gradeRank(item.grade) <= maxRank));
}

export function createRestoredMarathonSkillUse(options = {}) {
  if (!options.skillId) return blockedSkillUse("no_reward", options.participantId);
  if (options.grade && !isRestoredMarathonRewardSkillAllowedForGrade(options.skillId, options.grade)) return blockedSkillUse("skill_grade_mismatch", options.participantId);
  const character = options.characterId ? getRestoredMarathonCharacter(options.characterId) : null;
  const skill = getRestoredMarathonSkill(options.skillId);
  const chargesRemaining = Math.max(0, Number(options.chargesRemaining ?? skill.maxCharges));
  const cooldownRemainingMs = Math.max(0, Number(options.cooldownRemainingMs || 0));
  const hasCharge = skill.maxCharges === 0 || chargesRemaining > 0;
  const allowed = hasCharge && cooldownRemainingMs === 0;
  return Object.freeze({
    version: RESTORED_MARATHON_CHARACTER_SKILL_VERSION,
    participantId: options.participantId || "",
    characterId: character?.characterId || "",
    grade: options.grade || skill.grade || "",
    skillId: skill.skillId,
    allowed,
    reason: allowed ? "" : !hasCharge ? "no_charges" : "cooldown",
    consumesCharge: skill.maxCharges > 0,
    movementStallMs: skill.target === "self" ? 120 : 420,
    payload: Object.freeze({ target: skill.target, radiusMeters: skill.radiusMeters, rangeMeters: skill.rangeMeters, durationSeconds: skill.durationSeconds })
  });
}

export function validateRestoredMarathonCharacterSkillContract() {
  const errors = [];
  const reward = assignRestoredMarathonCheckpointCharacter({ participantId: "runner:test", checkpointIndex: 3, stageCount: 3, seed: "fixed" });
  const plan = createRestoredMarathonCheckpointRewardPlan(3), longPlan = createRestoredMarathonCheckpointRewardPlan(12);
  if (plan.length !== 3 || !plan[2].legendEligible) errors.push("three-stage reward loop should reach S eligibility at stage 3");
  if (plan[0].maxGrade !== "C" || plan[1].maxGrade !== "A" || plan[2].maxGrade !== "S") errors.push("three-stage rewards should stretch D/C, A, then S pools");
  if (plan[0].gradeWeights.some((item) => (item.grade === "A" || item.grade === "S") && item.weight > 0)) errors.push("stage 1 reward roll should not expose A/S");
  if (!plan[2].gradeWeights.some((item) => item.grade === "S" && item.weight > 0)) errors.push("stage 3 reward roll should expose a low S chance");
  if (longPlan.length !== 12 || !longPlan[11].legendEligible) errors.push("N-stage reward plan should still scale");
  if (!reward.character.characterId || !reward.skill.skillId) errors.push("checkpoint reward must assign a character and skill");
  if (!reward.placeholderSkin || reward.placeholderSkin.assetStatus !== "placeholder") errors.push("checkpoint reward should include a placeholder skin until final assets exist");
  if (reward.placeholderSkin.grade !== reward.skill.grade) errors.push("placeholder skin grade should drive the current reward skill grade");
  for (const grade of RESTORED_MARATHON_CHARACTER_GRADES) {
    if (!RESTORED_MARATHON_MEME_CHARACTER_CATALOG.some((item) => item.grade === grade)) errors.push(`${grade} grade needs a character`);
    if (createRestoredMarathonRewardSkill({ grade, seed: `skill:${grade}` }).grade !== grade) errors.push(`${grade} reward skill should keep its grade`);
  }
  const placeholderGrades = new Set(Array.from({ length: 512 }, (_, index) => createRestoredMarathonPlaceholderSkinReward({ participantId: "runner:test", checkpointIndex: (index % 3) + 1, seed: `placeholder:${index}` }).grade));
  for (const grade of RESTORED_MARATHON_PLACEHOLDER_SKIN_GRADES) if (!placeholderGrades.has(grade)) errors.push(`${grade} placeholder skin grade should be rollable`);
  if (listRestoredMarathonCharacterGradePool(1, { stageCount: 3 }).some((item) => gradeRank(item.grade) > gradeRank("C"))) errors.push("stage 1 should stay in the low D/C pool");
  if (!listRestoredMarathonCharacterGradePool(3, { stageCount: 3 }).some((item) => item.grade === "S")) errors.push("stage 3 should unlock S grade");
  const rare = RESTORED_MARATHON_MEME_CHARACTER_CATALOG.find((item) => item.rarity === "rare");
  const baseUse = createRestoredMarathonSkillUse({ participantId: "runner:test" });
  if (baseUse.allowed || baseUse.reason !== "no_reward") errors.push("base profile should not have an E skill before checkpoint reward");
  const characterOnlyUse = createRestoredMarathonSkillUse({ participantId: "runner:test", characterId: rare.characterId });
  if (characterOnlyUse.allowed || characterOnlyUse.reason !== "no_reward") errors.push("character identity alone should not unlock E without a checkpoint reward skill");
  const use = createRestoredMarathonSkillUse({ participantId: "runner:test", characterId: rare.characterId, skillId: "skill:checkpoint-hop", grade: "A", chargesRemaining: 1 });
  if (!use.allowed || !use.consumesCharge) errors.push("rare skill should be one-use capable");
  const empty = createRestoredMarathonSkillUse({ participantId: "runner:test", characterId: rare.characterId, skillId: "skill:checkpoint-hop", grade: "A", chargesRemaining: 0 });
  if (empty.allowed || empty.reason !== "no_charges") errors.push("empty one-use skill must be blocked");
  const mismatch = createRestoredMarathonSkillUse({ participantId: "runner:test", skillId: "skill:noise-burst", grade: "D", chargesRemaining: 1 });
  if (mismatch.allowed || mismatch.reason !== "skill_grade_mismatch") errors.push("reward skill must belong to its current grade pool");
  if (RESTORED_MARATHON_MEME_CHARACTER_CATALOG.length < 8) errors.push("catalog should have enough meme-style runners");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function skill(skillId, label, target, cooldownSeconds, maxCharges, durationSeconds, radiusMeters, description) {
  return Object.freeze({ skillId, label, target, cooldownSeconds, maxCharges, durationSeconds, radiusMeters, rangeMeters: radiusMeters, description });
}

function character(characterId, label, rarity, skillId, speedRating, note) {
  return Object.freeze({ characterId, label, rarity, grade: gradeForCharacter(characterId, rarity), skillId, speedRating, note });
}

function characterPoolForCheckpoint(checkpointIndex, stageCount) {
  return listRestoredMarathonCharacterGradePool(checkpointIndex, { stageCount });
}

function weightedPick(pool, seed) {
  const total = pool.reduce((sum, item) => sum + weightForGrade(item.grade), 0);
  let roll = hashText(seed) % total;
  for (const item of pool) {
    roll -= weightForGrade(item.grade);
    if (roll < 0) return item;
  }
  return pool[0];
}

function gradeForCharacter(characterId, rarity) {
  if (characterId === "runner:meme-summoner") return "S";
  if (characterId === "runner:gallery-warden" || characterId === "runner:dopamine-sprinter") return "A";
  if (rarity === "rare") return "B";
  if (characterId === "runner:keyboard-warrior") return "C";
  return "D";
}

function maxGradeForCheckpoint(checkpointIndex, stageCount = RESTORED_MARATHON_DEFAULT_REWARD_STAGE_COUNT) {
  const count = normalizeRestoredMarathonRewardStageCount(stageCount);
  const stage = Math.max(1, Math.min(count, Math.round(Number(checkpointIndex) || 1)));
  const ratio = stage / count;
  if (ratio >= 1) return "S";
  if (ratio >= 2 / 3) return "A";
  if (ratio >= 1 / 3) return "C";
  return "D";
}

function gradeRank(grade) {
  const index = RESTORED_MARATHON_CHARACTER_GRADES.indexOf(String(grade || "D").toUpperCase());
  return index < 0 ? 0 : index;
}

function weightForGrade(grade) {
  if (grade === "S") return 1;
  if (grade === "A") return 4;
  if (grade === "B") return 8;
  if (grade === "C") return 12;
  return 16;
}

function blockedSkillUse(reason, participantId = "") {
  return Object.freeze({
    version: RESTORED_MARATHON_CHARACTER_SKILL_VERSION, participantId: participantId || "", characterId: "", grade: "", skillId: "",
    allowed: false, reason, consumesCharge: false, movementStallMs: 0,
    payload: Object.freeze({ target: "self", radiusMeters: 0, rangeMeters: 0, durationSeconds: 0 })
  });
}

function hashText(text) {
  let hash = 2166136261;
  for (const char of String(text)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
