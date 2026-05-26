export const RESTORED_PLACE_SURFACE_COPY = Object.freeze({
  fast_food: Object.freeze({
    meta: "Home Front",
    title: "패스트푸드점",
    copy: "따뜻한 불빛과 튀김 냄새가 새어 나오는 동네 매장입니다.",
    actions: Object.freeze([
      Object.freeze({ label: "햄버거 세트", tone: "emerald" }),
      Object.freeze({ label: "아르바이트 문의", tone: "slate" })
    ])
  }),
  labor_office: Object.freeze({
    meta: "Work",
    title: "인력소",
    copy: "새벽부터 일감 쪽지가 붙는 작은 사무실입니다.",
    actions: Object.freeze([
      Object.freeze({ label: "단기 알바", tone: "indigo" }),
      Object.freeze({ label: "직업 게시판", tone: "slate" })
    ])
  }),
  convenience_store: Object.freeze({
    meta: "Shop",
    title: "편의점",
    copy: "생활용품과 중고 휴대폰을 살 수 있는 집앞 상점입니다.",
    actions: Object.freeze([Object.freeze({ label: "상점 보기", tone: "indigo", tab: "shop" })])
  }),
  job_places: Object.freeze({
    meta: "Baegeum City",
    title: "배금도시 일자리",
    copy: "정장 차림 사람들과 구직 전단이 뒤섞인 고용 거리입니다.",
    actions: Object.freeze([Object.freeze({ label: "구인 게시판", tone: "indigo" })])
  }),
  relationships: Object.freeze({
    meta: "Baegeum City",
    title: "인연의 거리",
    copy: "약속을 잡은 사람들과 우연한 시선이 오가는 거리입니다.",
    actions: Object.freeze([
      Object.freeze({ label: "산책하기", tone: "pink", action: "walk" }),
      Object.freeze({ label: "휴대폰 연락처", tone: "slate", tab: "phone" })
    ])
  }),
  casino_street: Object.freeze({
    meta: "Dice City",
    title: "카지노거리",
    copy: "슬롯, 블랙잭, 룰렛 업장이 각자 불빛을 켠 다이스시티 메인 거리입니다.",
    actions: Object.freeze([
      Object.freeze({ label: "슬롯카지노", tone: "amber", message: "슬롯카지노는 DiceLand식 독립 게임 패널로 분리 예정입니다." }),
      Object.freeze({ label: "블랙잭카지노", tone: "indigo", tab: "casino" }),
      Object.freeze({ label: "룰렛카지노", tone: "pink", message: "룰렛카지노는 배당표와 0 규칙을 분리해 붙일 예정입니다." })
    ])
  }),
  exchange: Object.freeze({
    meta: "Dice City",
    title: "환전소",
    copy: "조용한 유리창 너머로 칩과 현금이 오가는 곳입니다.",
    actions: Object.freeze([Object.freeze({ label: "칩 확인", tone: "amber" })])
  }),
  pawnshop: Object.freeze({
    meta: "Dice City",
    title: "전당포",
    copy: "명품과 보유품을 담보로 현금을 마련하는 어두운 유리창의 가게입니다.",
    actions: Object.freeze([Object.freeze({ label: "담보 목록", tone: "amber" })])
  }),
  loan_office: Object.freeze({
    meta: "Dice City",
    title: "사채업소",
    copy: "빠른 돈과 큰 위험이 같은 봉투에 담겨 나오는 사무실입니다.",
    actions: Object.freeze([Object.freeze({ label: "대출 상담", tone: "slate" })])
  }),
  hotel: Object.freeze({
    meta: "Dice City",
    title: "호텔",
    copy: "두꺼운 카펫과 낮은 조명이 이어지는 다이스시티의 숙소입니다.",
    actions: Object.freeze([Object.freeze({ label: "방 잡기", tone: "indigo" })])
  }),
  nightlife: Object.freeze({
    meta: "Dice City",
    title: "밤거리",
    copy: "간판 불빛과 소문이 늦은 밤까지 꺼지지 않는 거리입니다.",
    actions: Object.freeze([Object.freeze({ label: "거리 둘러보기", tone: "slate" })])
  }),
  port: Object.freeze({
    meta: "Seosan City",
    title: "항구",
    copy: "짠 바람과 화물차 소리가 하루 종일 이어지는 항구입니다.",
    actions: Object.freeze([Object.freeze({ label: "부두 작업", tone: "indigo" })])
  }),
  factory: Object.freeze({
    meta: "Seosan City",
    title: "공장",
    copy: "교대 근무 표와 기계음이 벽 안쪽에서 돌아가는 공장입니다.",
    actions: Object.freeze([Object.freeze({ label: "교대 근무", tone: "slate" })])
  }),
  market: Object.freeze({
    meta: "Seosan City",
    title: "시장",
    copy: "상인들의 목소리와 물건 흥정이 빠르게 오가는 시장입니다.",
    actions: Object.freeze([Object.freeze({ label: "시장 둘러보기", tone: "emerald" })])
  })
});

export const RESTORED_PLACE_BUTTON_TONES = Object.freeze({
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  indigo: "border-indigo-100 bg-indigo-50 text-indigo-700",
  pink: "border-pink-100 bg-pink-50 text-pink-700",
  slate: "border-slate-100 bg-slate-50 text-slate-700"
});
