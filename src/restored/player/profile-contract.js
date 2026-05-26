export const RESTORED_PROFILE_CONTRACT_VERSION = "restored-profile-001";

export const RESTORED_PROFILE_STAT_DEFS = Object.freeze([
  Object.freeze({ id: "energy", label: "에너지", initial: 72, max: 100 }),
  Object.freeze({ id: "health", label: "체력", initial: 68, max: 100 }),
  Object.freeze({ id: "intelligence", label: "지능", initial: 45, max: 100 }),
  Object.freeze({ id: "appearance", label: "외모", initial: 42, max: 100 }),
  Object.freeze({ id: "charm", label: "매력", initial: 46, max: 100 }),
  Object.freeze({ id: "mental", label: "멘탈", initial: 55, max: 100 }),
  Object.freeze({ id: "luck", label: "운", initial: 50, max: 100 })
]);

export const RESTORED_PROFILE_JOBS = Object.freeze({
  unemployed: Object.freeze({
    id: "unemployed",
    title: "무직",
    rankingBoardId: "jobRank"
  })
});

function clampStat(value, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(max, Math.round(numeric)));
}

export function createInitialRestoredProfileStats() {
  return RESTORED_PROFILE_STAT_DEFS.reduce((stats, stat) => {
    stats[stat.id] = { value: stat.initial, max: stat.max };
    return stats;
  }, {});
}

export function createInitialRestoredProfileState() {
  return {
    profileVersion: RESTORED_PROFILE_CONTRACT_VERSION,
    jobId: RESTORED_PROFILE_JOBS.unemployed.id,
    jobTitle: RESTORED_PROFILE_JOBS.unemployed.title,
    residenceId: "home:starter",
    residenceLabel: "우리집",
    conditionLabel: "보통",
    stats: createInitialRestoredProfileStats()
  };
}

export function listRestoredProfileStats(profile = createInitialRestoredProfileState()) {
  const savedStats = profile?.stats || {};
  return RESTORED_PROFILE_STAT_DEFS.map((stat) => {
    const saved = savedStats[stat.id] || {};
    const max = Math.max(1, Number(saved.max || stat.max));
    return {
      ...stat,
      value: clampStat(saved.value ?? stat.initial, max),
      max
    };
  });
}

export function mergeRestoredProfileState(baseProfile, savedProfile) {
  const base = baseProfile || createInitialRestoredProfileState();
  if (!savedProfile || typeof savedProfile !== "object") return base;

  const merged = {
    ...base,
    ...savedProfile,
    stats: { ...base.stats }
  };

  for (const stat of RESTORED_PROFILE_STAT_DEFS) {
    merged.stats[stat.id] = {
      ...base.stats[stat.id],
      ...(savedProfile.stats?.[stat.id] || {})
    };
  }

  return merged;
}

export function validateRestoredProfileState(profile) {
  const errors = [];
  if (!profile || typeof profile !== "object") {
    return Object.freeze({ ok: false, errors: ["profile must be an object"] });
  }
  if (!profile.jobId) errors.push("profile.jobId is required");
  if (!profile.jobTitle) errors.push("profile.jobTitle is required");
  if (!profile.residenceId) errors.push("profile.residenceId is required");
  if (!profile.residenceLabel) errors.push("profile.residenceLabel is required");
  if (!profile.stats || typeof profile.stats !== "object") {
    errors.push("profile.stats is required");
  } else {
    for (const stat of RESTORED_PROFILE_STAT_DEFS) {
      const saved = profile.stats[stat.id];
      if (!saved) errors.push(`profile.stats.${stat.id} is required`);
      else if (!Number.isFinite(Number(saved.value))) {
        errors.push(`profile.stats.${stat.id}.value must be numeric`);
      }
    }
  }
  return Object.freeze({ ok: errors.length === 0, errors });
}
