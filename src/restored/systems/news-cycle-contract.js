export const RESTORED_NEWS_CYCLE_CONTRACT_VERSION = "restored-news-cycle-001";

export const RESTORED_NEWS_CYCLE_IDS = Object.freeze([
  "extreme_fear",
  "fear",
  "neutral",
  "greed",
  "extreme_greed"
]);

const MARKET_CYCLE_MAP = Object.freeze({
  EXTREME_FEAR: "extreme_fear",
  FEAR: "fear",
  NEUTRAL: "neutral",
  GREED: "greed",
  EXTREME_GREED: "extreme_greed"
});

const CYCLE_TEMPLATES = Object.freeze({
  extreme_fear: Object.freeze([
    news("긴급", "도시 신용 스프레드 급등... 골든캐시대부 연체율 경고", "배금은행권이 야간 대출 심사를 강화하면서 저신용 시민의 현금 흐름이 빠르게 얼어붙고 있습니다.", "신용도 낮은 플레이어는 대출과 고위험 거래 압박을 더 크게 받습니다.", "risk", ["credit", "city"]),
    news("마감", "AI 테마주 동반 급락... 배금전자 장중 급락 후 낙폭 축소", "AI 서버 발주 지연설이 돌며 반도체와 클라우드 관련주가 일제히 흔들렸습니다.", "AI 슈퍼사이클 열기가 식으면 성장주 변동성이 커집니다.", "bear", ["ai", "domestic"]),
    news("다이스", "DPA 환전소 앞 긴 줄... 레버리지 청산 문자 잇따라", "다이스시티 거래소 주변에서 고위험 포지션 정리 수요가 늘고 있습니다.", "코인 레버리지와 도박 손실은 멘탈과 관계 리스크로 이어질 수 있습니다.", "danger", ["dice", "dpa"])
  ]),
  fear: Object.freeze([
    news("시황", "배금증권, 변동성 확대에 미수 거래 제한 검토", "개인 투자자의 단기 손실이 늘면서 증권 앱 내 위험 경고가 강화됐습니다.", "매수 버튼은 열려 있지만 단기 과열 종목의 반등 실패 위험이 큽니다.", "bear", ["market", "risk"]),
    news("정책", "배금시청, 야간 DPA 환전 실태 점검 예고", "다이스시티 칩 교환과 DPA 환전 흐름을 분리해야 한다는 의견이 커지고 있습니다.", "향후 카지노, 전당포, 대출소의 자금 흐름이 더 명확히 나뉠 수 있습니다.", "risk", ["dpa", "dice"]),
    news("생활", "맥버거 야간 근무 지원자 증가... 알바 수요는 여전히 높아", "시장 불안으로 단기 현금 알바를 찾는 시민이 늘었습니다.", "알바와 회사 근무는 불안정한 시장에서 가장 안정적인 원화 수입원입니다.", "neutral", ["job", "city"])
  ]),
  neutral: Object.freeze([
    news("브리핑", "배금전자 보합권... 투자자들 AI 서버 발주 확인 대기", "AI 칩 수주 뉴스는 이어지고 있지만 실적 확인 전까지 관망세가 강합니다.", "시장 방향이 약할 때는 보유 수량과 평균가 확인이 중요합니다.", "neutral", ["ai", "domestic"]),
    news("단독", "배금은행, 신용등급 낮은 청년층 상담 건수 증가", "월세와 생활비 부담이 커지면서 소액 대출 문의가 늘었습니다.", "신용도는 직업, 도박 손실, 상환 기록과 함께 후반 시스템의 핵심 축입니다.", "neutral", ["credit", "life"]),
    news("현장", "집앞 상권 유동인구 회복... 편의점과 패스트푸드점 매출 개선", "배금도시 생활권의 저녁 시간대 이용자가 늘며 단기 근무 기회가 생기고 있습니다.", "초반 루프는 집앞 알바, 휴대폰 앱, 도시 이동이 연결될 때 가장 자연스럽습니다.", "neutral", ["job", "city"])
  ]),
  greed: Object.freeze([
    news("시황", "배금반도체 4거래일 연속 상승... 단기 과열 지표는 경계권", "AI 데이터센터 투자 기대가 이어지며 반도체 관련주가 강세를 보였습니다.", "상승장은 수익 기회와 충동 매수 위험을 동시에 키웁니다.", "bull", ["ai", "market"]),
    news("기업", "맥버거푸드, 야간 매장 자동화 기대에 강세", "인력난 해소와 키오스크 교체 기대가 생활주 전반의 투자심리를 끌어올렸습니다.", "생활 종목은 알바 시스템과 도시 소비 흐름에 연결하기 좋습니다.", "bull", ["job", "domestic"]),
    news("다이스", "다이스호텔 예약률 상승... 카지노 거리 방문객 회복", "다이스시티 야간 상권이 살아나며 호텔과 전당포 주변 유동성이 늘었습니다.", "다이스시티 호황은 돈을 벌 기회이면서 잃을 유혹입니다.", "risk", ["dice", "city"])
  ]),
  extreme_greed: Object.freeze([
    news("속보", "배금전자, AI 칩 장기공급설에 신고가... 개인 매수세 확대", "검증되지 않은 수주설까지 퍼지며 AI 테마 전반에 매수 주문이 몰렸습니다.", "극단적 탐욕 구간은 수익보다 리스크 관리가 먼저입니다.", "euphoria", ["ai", "domestic"]),
    news("리서치", "배금증권 리서치센터 'AI 서버 투자 사이클 더 이어질 것'", "클라우드와 반도체 수요 전망이 상향되며 성장주 기대가 빠르게 번지고 있습니다.", "AI 슈퍼사이클은 상승 압력과 급락 위험을 같이 키웁니다.", "bull", ["ai", "market"]),
    news("경고", "DPA 거래량 급증... 다이스시티 고위험 자금 유입 주의", "레버리지 상품과 카지노 교환 수요가 동시에 늘며 단기 과열 경고가 켜졌습니다.", "DPA와 칩은 분리하되, 둘 다 다이스시티 리스크를 보여주는 지표가 됩니다.", "danger", ["dpa", "dice"])
  ])
});

const CRASH_TEMPLATES = Object.freeze({
  policy: Object.freeze([
    news("정책", "배금시청, 고위험 DPA 환전 점검 예고... 다이스시티 관련주 급락", "야간 환전과 사설 대출 광고 단속 가능성이 커지며 위험자산이 동반 조정을 받았습니다.", "단기 충격은 가격을 낮추지만 신용과 멘탈 리스크를 남깁니다.", "bear", ["policy", "dice"]),
    news("속보", "배금은행권, 미수·대출 심사 강화... 개인 매수세 위축", "신용 심사 강화 소식에 개인 투자자의 단기 자금 회전이 느려졌습니다.", "현금이 부족하면 시장 반등보다 생존 루프가 먼저입니다.", "bear", ["credit", "market"])
  ]),
  external: Object.freeze([
    news("해외", "해외 서버팜 장애 소식... AI 인프라주 동반 매도세", "글로벌 데이터센터 장애가 전해지며 AI 칩과 클라우드 테마가 급격히 흔들렸습니다.", "외부 충격은 배금전자와 AI 관련 종목의 변동성을 키웁니다.", "bear", ["ai", "external"]),
    news("긴급", "가상자산 거래소 장애 루머... DPA와 코인 현물 동반 약세", "체결 지연 소문이 퍼지며 코인 현물과 레버리지 상품에 매도 주문이 몰렸습니다.", "코인 시장은 24시간 열려 있지만, 잠을 안 자는 만큼 위험도 큽니다.", "danger", ["crypto", "dpa"])
  ])
});

const AI_FLASH_TEMPLATES = Object.freeze([
  "배금전자 AI 서버 수주설 재점화... 확인 전 매수 과열 주의",
  "배금AI 연구소 채용 공고 급증... 슈퍼사이클 기대 다시 확산",
  "클라우드 전력비 부담 부각... AI 테마주 장중 변동성 확대",
  "개인 투자자 AI 관련주 검색량 급증... 배금증권 앱 접속량 증가"
]);

function news(badge, headline, summary, impact, tone, tags) {
  return Object.freeze({ badge, headline, summary, impact, tone, tags: Object.freeze(tags) });
}

function pick(items, index = 0) {
  return items[Math.abs(Number(index) || 0) % items.length];
}

function buildItem(template, { id, cycleId, time, sourceLabel, marketBias = 0 } = {}) {
  return Object.freeze({
    id: id || `news:${cycleId || "cycle"}:${time || "pending"}`,
    time: time || "수신 대기",
    sourceLabel: sourceLabel || "BAEGEUM WIRE",
    badge: template.badge || "브리핑",
    headline: template.headline || template.message || "",
    summary: template.summary || "",
    impact: template.impact || "",
    tone: template.tone || "neutral",
    tags: Object.freeze([...(template.tags || [])]),
    cycleId: cycleId || "neutral",
    marketBias
  });
}

export function getRestoredNewsCycleForMarketCycle(marketCycle = "NEUTRAL") {
  return MARKET_CYCLE_MAP[marketCycle] || "neutral";
}

export function createRestoredNewsCycleItem({ marketCycle = "NEUTRAL", cycleId, index = 0, time, sourceLabel } = {}) {
  const resolvedCycle = cycleId || getRestoredNewsCycleForMarketCycle(marketCycle);
  const template = pick(CYCLE_TEMPLATES[resolvedCycle] || CYCLE_TEMPLATES.neutral, index);
  return buildItem(template, {
    id: `news:${resolvedCycle}:${index}`,
    cycleId: resolvedCycle,
    time,
    sourceLabel: sourceLabel || "배금경제",
    marketBias: resolvedCycle.includes("greed") ? 1 : resolvedCycle.includes("fear") ? -1 : 0
  });
}

export function createRestoredCrashNewsItem({ type = "policy", index = 0, time, sourceLabel } = {}) {
  const template = pick(CRASH_TEMPLATES[type] || CRASH_TEMPLATES.policy, index);
  return buildItem(template, {
    id: `news:crash:${type}:${index}`,
    cycleId: "shock",
    time,
    sourceLabel: sourceLabel || "도시경제부",
    marketBias: -2
  });
}

export function createRestoredAiReporterNewsItem({ headline, index = 0, time } = {}) {
  const selected = headline || pick(AI_FLASH_TEMPLATES, index);
  return buildItem(news("AI 속보", selected, "AI 특파원이 시장, 도시, DPA 흐름을 함께 묶어 긴급 브리핑했습니다.", "실제 외부 뉴스가 아니라 배금도시 내부 가상 이벤트입니다.", "bull", ["ai", "flash"]), {
    id: `news:ai-flash:${index}`,
    cycleId: "ai_flash",
    time,
    sourceLabel: "AI 특파원",
    marketBias: 1
  });
}

export function normalizeRestoredNewsItem(item = {}, index = 0) {
  if (typeof item === "string") return normalizeRestoredNewsItem({ msg: item }, index);
  if (item.headline) {
    return buildItem(item, {
      id: item.id || `news:normalized:${index}`,
      cycleId: item.cycleId || "legacy",
      time: item.time,
      sourceLabel: item.sourceLabel,
      marketBias: Number(item.marketBias || 0)
    });
  }
  const message = item.msg || item.message || "";
  return buildItem(news(item.badge || "브리핑", message, item.summary || "", item.impact || "", item.tone || "neutral", item.tags || []), {
    id: item.id || `news:legacy:${index}`,
    cycleId: item.cycleId || "legacy",
    time: item.time,
    sourceLabel: item.sourceLabel || "배금뉴스",
    marketBias: Number(item.marketBias || 0)
  });
}

export function getRestoredNewsTickerText(item = {}) {
  return item.headline || item.msg || item.message || "";
}

export function createRestoredNewsCycleBatch({ marketCycle = "NEUTRAL", count = 5, startIndex = 0, time } = {}) {
  return Object.freeze(Array.from({ length: count }, (_, offset) => createRestoredNewsCycleItem({
    marketCycle,
    index: startIndex + offset,
    time
  })));
}

export function validateRestoredNewsCycleContract() {
  const errors = [];
  for (const id of RESTORED_NEWS_CYCLE_IDS) {
    if (!CYCLE_TEMPLATES[id]?.length) errors.push(`missing cycle templates: ${id}`);
  }
  const sample = createRestoredNewsCycleItem({ marketCycle: "EXTREME_GREED", index: 0, time: "09:30" });
  if (!sample.headline || !sample.summary || !sample.impact) errors.push("sample news item must include headline, summary, and impact.");
  if (/(AAPL|TSLA|NASDAQ|Samsung|Tesla|Samsung Electronics)/.test(sample.headline)) errors.push("sample headline must stay fictional.");
  return Object.freeze({ ok: errors.length === 0, errors });
}
