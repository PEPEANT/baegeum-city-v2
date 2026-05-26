export const RESTORED_RANK_CATALOG_VERSION = "restored-rank-catalog-001";

export const RESTORED_RANKS = Object.freeze([
  Object.freeze({
    limit: 10000,
    title: "노숙자",
    rankEmoji: "🥣",
    houseEmoji: "📦",
    houseDesc: "비가 오면 젖습니다."
  }),
  Object.freeze({
    limit: 100000,
    title: "서민",
    rankEmoji: "🚲",
    houseEmoji: "🚪",
    houseDesc: "작지만 아늑한 단칸방."
  }),
  Object.freeze({
    limit: 500000,
    title: "중산층",
    rankEmoji: "💼",
    houseEmoji: "🏢",
    houseDesc: "엘리베이터가 있는 아파트."
  }),
  Object.freeze({
    limit: 1000000,
    title: "부자",
    rankEmoji: "💎",
    houseEmoji: "🌆",
    houseDesc: "한강이 보이는 고급 아파트."
  }),
  Object.freeze({
    limit: 10000000,
    title: "자산가",
    rankEmoji: "🚁",
    houseEmoji: "🏰",
    houseDesc: "정원사가 있는 대저택."
  }),
  Object.freeze({
    limit: 100000000,
    title: "재벌",
    rankEmoji: "👑",
    houseEmoji: "🏝️",
    houseDesc: "개인 소유 섬."
  })
]);

export function validateRestoredRankCatalog(ranks = RESTORED_RANKS) {
  const errors = [];
  let previousLimit = 0;

  for (const rank of ranks) {
    if (!Number.isFinite(Number(rank.limit))) errors.push(`${rank.title || "unknown"} limit is required`);
    if (Number(rank.limit) <= previousLimit) errors.push(`${rank.title || "unknown"} limit must increase`);
    if (!rank.title) errors.push(`${rank.limit || "unknown"} title is required`);
    if (!rank.rankEmoji) errors.push(`${rank.title || "unknown"} rankEmoji is required`);
    if (!rank.houseEmoji) errors.push(`${rank.title || "unknown"} houseEmoji is required`);
    if (!rank.houseDesc) errors.push(`${rank.title || "unknown"} houseDesc is required`);
    previousLimit = Number(rank.limit);
  }

  return Object.freeze({ ok: errors.length === 0, errors });
}
