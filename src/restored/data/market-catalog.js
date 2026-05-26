export const RESTORED_MARKET_CATALOG_VERSION = "restored-market-catalog-001";

export const RESTORED_STOCK_CATALOG = Object.freeze([
  Object.freeze({ id: "NASDAQ", name: "나스닥", price: 15000.00 }),
  Object.freeze({ id: "TSLA", name: "테슬라", price: 200.00 }),
  Object.freeze({ id: "AAPL", name: "애플", price: 180.00 }),
  Object.freeze({ id: "NVDA", name: "엔비디아", price: 450.00 })
]);

export const RESTORED_CRYPTO_CATALOG = Object.freeze([
  Object.freeze({ id: "BTC", name: "Bitcoin", price: 60000.00 }),
  Object.freeze({ id: "ETH", name: "Ethereum", price: 3000.00 })
]);

export const RESTORED_MARKET_CYCLE_ORDER = Object.freeze([
  "EXTREME_FEAR",
  "FEAR",
  "NEUTRAL",
  "GREED",
  "EXTREME_GREED"
]);

export const RESTORED_MARKET_CYCLES = Object.freeze({
  EXTREME_GREED: Object.freeze({ label: "극단적 탐욕", color: "text-red-600", bias: 0.008 }),
  GREED: Object.freeze({ label: "탐욕", color: "text-orange-500", bias: 0.003 }),
  NEUTRAL: Object.freeze({ label: "중립", color: "text-gray-500", bias: 0 }),
  FEAR: Object.freeze({ label: "공포", color: "text-blue-500", bias: -0.004 }),
  EXTREME_FEAR: Object.freeze({ label: "극단적 공포", color: "text-purple-600", bias: -0.01 })
});

export const RESTORED_MARKET_NEWS_MESSAGES = Object.freeze({
  EXTREME_GREED: Object.freeze([
    "비트코인 사상 최고치 경신… 시장은 새로운 시대를 맞이했다",
    "AI·반도체·양자 테마 폭등… 전문가 ‘이제 시작일 뿐’",
    "ETF 자금 유입 신기록… 개인·기관 모두 매수 가속",
    "글로벌 투자자, 위험자산 쏠림 현상 심화"
  ]),
  GREED: Object.freeze([
    "상승 랠리 지속… 일부 전문가 ‘과열 조짐’ 지적",
    "기술주 강세 이어져… 차익실현 움직임 나타나",
    "비트코인 20% 급등… 개인 매수세 확대",
    "버핏, 시장 상승에도 ‘여전히 신중한 태도’"
  ]),
  NEUTRAL: Object.freeze([
    "BTC·나스닥, 주요 구간에서 횡보… 시장은 방향성 탐색",
    "ETF 자금 유입 둔화… 관망세 확대",
    "경제지표 혼조… 강세·약세 의견 팽팽",
    "버크셔, 현금 보유 유지… 보수적 전략 지속"
  ]),
  FEAR: Object.freeze([
    "비트코인 10~20% 급락… 추가 하락 가능성 경고",
    "기술주 약세 전환… 위험자산 선호도 감소",
    "기관투자자, 노출 축소 움직임 확대",
    "버핏, 현금 비중 확대… 시장 경고 신호로 해석"
  ]),
  EXTREME_FEAR: Object.freeze([
    "시장 패닉… BTC·ETH·나스닥 동반 폭락",
    "암호화폐 구조적 한계 지적… 종말론 확산",
    "채굴업체·중소 기술기업 줄도산 우려",
    "워런 버핏, 현금 비중 역대 최고… ‘이런 시장 처음 본다’",
    "전문가들 ‘반등 가능성 제한적’ 비관론 우세"
  ])
});

export const RESTORED_CRASH_INTERNAL = Object.freeze([
  "속보: 트럼프 '관세 200% 부과' 선언... 시장 충격",
  "긴급: 파월 의장 '금리 인상 불가피' 매파적 발언",
  "충격: 미 연방정부 셧다운 돌입... 경제 마비 우려",
  "속보: 미국 비상 계엄령 선포 루머 확산"
]);

export const RESTORED_CRASH_EXTERNAL = Object.freeze([
  "긴급: 중동 전쟁 확전... 유가 폭등 및 증시 급락",
  "속보: 대규모 테러 발생... 글로벌 투자심리 위축",
  "충격: 전산망 대규모 해킹 사태... 금융 시스템 마비",
  "악재: 테슬라 실적 쇼크... 기술주 동반 투매",
  "속보: 최신 AI 모델 치명적 오류 발생... 관련주 폭락"
]);

function createHoldingState(catalog) {
  return Object.fromEntries(catalog.map((item) => [item.id, { name: item.name, price: item.price, qty: 0, avg: 0 }]));
}

export function createRestoredStockState() {
  return createHoldingState(RESTORED_STOCK_CATALOG);
}

export function createRestoredCryptoState() {
  return Object.fromEntries(RESTORED_CRYPTO_CATALOG.map((item) => [item.id, { name: item.name, price: item.price }]));
}

export function validateRestoredMarketCatalog() {
  const errors = [];
  const cycleKeys = new Set(Object.keys(RESTORED_MARKET_CYCLES));

  for (const cycleId of RESTORED_MARKET_CYCLE_ORDER) {
    if (!cycleKeys.has(cycleId)) errors.push(`missing market cycle: ${cycleId}`);
    if (!RESTORED_MARKET_NEWS_MESSAGES[cycleId]?.length) errors.push(`missing news messages: ${cycleId}`);
  }
  for (const item of [...RESTORED_STOCK_CATALOG, ...RESTORED_CRYPTO_CATALOG]) {
    if (!item.id) errors.push("market item id is required");
    if (!item.name) errors.push(`${item.id || "unknown"} name is required`);
    if (!Number.isFinite(Number(item.price))) errors.push(`${item.id || "unknown"} price is required`);
  }

  return Object.freeze({ ok: errors.length === 0, errors });
}
