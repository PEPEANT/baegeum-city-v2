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
    cards: Object.freeze([
      Object.freeze({ title: "편의점", status: "입장 가능", copy: "야간 손님, 진열, 계산을 처리하는 초반 알바 건물.", entryActionId: "convenience_store" }),
      Object.freeze({ title: "맥버거", status: "입장 가능", copy: "주문 조리와 포장 러시를 버티는 패스트푸드 알바.", entryActionId: "fast_food" }),
      Object.freeze({ title: "인력소", status: "입장 가능", copy: "상하차와 단기 일당으로 몸을 갈아 원화를 버는 곳.", entryActionId: "labor_office" }),
      Object.freeze({ title: "PC방", status: "입장 가능", copy: "야간 손님과 간식 주문을 처리하는 정신 소모형 알바.", entryActionId: "pc_room" }),
      Object.freeze({ title: "배달대행", status: "입장 가능", copy: "속도는 빠르지만 체력과 멘탈이 같이 깎이는 배달 알바.", entryActionId: "delivery" }),
      Object.freeze({ title: "주차장", status: "입장 가능", copy: "차량 안내와 출차 줄 관리를 맡는 안정형 알바.", entryActionId: "parking_lot" }),
      Object.freeze({ title: "세차장", status: "입장 가능", copy: "몸을 쓰지만 평판을 쌓기 좋은 세차장 근무.", entryActionId: "car_wash" }),
      Object.freeze({ title: "청소사무소", status: "입장 가능", copy: "건물 오픈 전 청소와 비품 정리를 맡는 단기 근무.", entryActionId: "cleaning" }),
      Object.freeze({ title: "전단지 게시판", status: "입장 가능", copy: "수입은 작지만 바로 시작할 수 있는 가장 가벼운 일.", entryActionId: "flyer" }),
      Object.freeze({ title: "도서관", status: "입장 가능", copy: "공부로 지능과 학점을 올려 회사 루프로 넘어간다.", entryActionId: "library" }),
      Object.freeze({ title: "대학 야간강의", status: "입장 가능", copy: "원화 수강료를 내고 학점을 빠르게 쌓는 교육 건물.", entryActionId: "university" }),
      Object.freeze({ title: "배금 오피스", status: "입장 가능", copy: "조건을 맞추면 회사 근무와 승급 루프가 열린다.", entryActionId: "company" })
    ]),
    title: "배금도시 일자리",
    copy: "건물에 들어가 알바, 공부, 회사 근무를 시작하는 고용 거리입니다.",
    actions: Object.freeze([Object.freeze({ label: "건물 목록 확인", tone: "indigo", message: "아래 건물 카드의 입장 버튼으로 들어가세요." })])
  }),
  pc_room: Object.freeze({
    meta: "Baegeum City",
    title: "PC방",
    copy: "키보드 소리, 컵라면 냄새, 야간 손님이 섞인 동네 PC방입니다.",
    actions: Object.freeze([Object.freeze({ label: "카운터 근무", tone: "indigo", message: "아래 근무 선택지에서 시작하세요." })])
  }),
  flyer: Object.freeze({
    meta: "Baegeum City",
    title: "전단지 게시판",
    copy: "작은 수입이라도 바로 필요한 사람들을 위한 단기 모집 게시판입니다.",
    actions: Object.freeze([Object.freeze({ label: "전단 묶음 받기", tone: "slate", message: "아래 근무 선택지에서 시작하세요." })])
  }),
  delivery: Object.freeze({
    meta: "Baegeum City",
    title: "배달대행 사무실",
    copy: "콜이 울리고 헬멧이 줄지어 놓인 빠른 돈의 입구입니다.",
    actions: Object.freeze([Object.freeze({ label: "배달 콜 확인", tone: "indigo", message: "아래 근무 선택지에서 시작하세요." })])
  }),
  parking_lot: Object.freeze({
    meta: "Baegeum City",
    title: "주차장",
    copy: "차량 흐름을 정리하고 출차 줄을 버티는 안정형 일자리입니다.",
    actions: Object.freeze([Object.freeze({ label: "정산소 들어가기", tone: "slate", message: "아래 근무 선택지에서 시작하세요." })])
  }),
  car_wash: Object.freeze({
    meta: "Baegeum City",
    title: "세차장",
    copy: "물과 거품 냄새가 가득한 곳. 몸을 쓰는 만큼 현금이 남습니다.",
    actions: Object.freeze([Object.freeze({ label: "세차 라인 입장", tone: "emerald", message: "아래 근무 선택지에서 시작하세요." })])
  }),
  cleaning: Object.freeze({
    meta: "Baegeum City",
    title: "청소사무소",
    copy: "영업 전 건물과 계단을 정리하는 조용한 단기 알바입니다.",
    actions: Object.freeze([Object.freeze({ label: "청소 도구 받기", tone: "slate", message: "아래 근무 선택지에서 시작하세요." })])
  }),
  library: Object.freeze({
    meta: "Baegeum City",
    title: "도서관",
    copy: "지능과 학점을 쌓아 더 안정적인 직업으로 넘어가는 입구입니다.",
    actions: Object.freeze([Object.freeze({ label: "공부 자리 찾기", tone: "indigo", message: "아래 공부/커리어 선택지에서 시작하세요." })])
  }),
  university: Object.freeze({
    meta: "Baegeum City",
    title: "대학 야간강의",
    copy: "원화 수강료를 내고 학점을 빠르게 쌓는 밤 강의실입니다.",
    actions: Object.freeze([Object.freeze({ label: "강의실 입장", tone: "indigo", message: "아래 공부/커리어 선택지에서 시작하세요." })])
  }),
  company: Object.freeze({
    meta: "Baegeum City",
    title: "배금 오피스",
    copy: "서류, 야근, 팀 지원으로 승급을 노리는 첫 회사 구역입니다.",
    actions: Object.freeze([Object.freeze({ label: "사무실 입장", tone: "slate", message: "아래 공부/커리어 선택지에서 시작하세요." })])
  }),
  shops: Object.freeze({
    meta: "Baegeum City",
    title: "상가와 금융 거리",
    copy: "원화 생활권은 유지하고, 다이스시티용 DPA 환전 표지와 소비 시설만 전면에 세웁니다.",
    cards: Object.freeze([
      Object.freeze({ title: "디페이 ATM", status: "DPA 환전 후보", copy: "1 DPA = 1,000원. 카지노 토큰은 원화와 분리." }),
      Object.freeze({ title: "배금증권", status: "폰 앱 연결", copy: "주식/뉴스는 거리 탭이 아니라 휴대폰 앱으로 진입." }),
      Object.freeze({ title: "배금은행", status: "대출 전 단계", copy: "계좌, 신용등급, 향후 온라인 로비 검증과 연결." }),
      Object.freeze({ title: "중고차 매장", status: "이동 확장 후보", copy: "도시 간 빠른 이동은 차량 시스템 이후에 개방." })
    ]),
    actions: Object.freeze([
      Object.freeze({ label: "상점 보기", tone: "indigo", tab: "shop" }),
      Object.freeze({ label: "DPA 환전 준비중", tone: "amber", message: "DPA 환전은 계약만 준비된 상태입니다." })
    ])
  }),
  relationships: Object.freeze({
    meta: "Baegeum City",
    title: "인연의 거리",
    copy: "약속을 잡은 사람들과 우연한 시선이 오가는 거리입니다.",
    actions: Object.freeze([
      Object.freeze({ label: "산책하기", tone: "pink", action: "walk" }),
      Object.freeze({ label: "휴대폰 연락처", tone: "slate", tab: "phone" })
    ]),
    cards: Object.freeze([
      Object.freeze({ title: "Baegeum Marathon Stadium", status: "50 runner preview", copy: "Local player plus bot runners up to the room cap; online room authority is prepared in the contract.", entryActionId: "marathon_stadium" })
    ])
  }),
  marathon_stadium: Object.freeze({
    meta: "Baegeum City",
    title: "Baegeum Marathon Stadium",
    copy: "A local 2D marathon preview with up to 50 runners. Connected rooms will open only after the online adapter is ready.",
    actions: Object.freeze([Object.freeze({ label: "Local Preview", tone: "indigo", message: "Use the pace buttons in the stadium panel." })])
  }),
  casino_street: Object.freeze({
    meta: "Dice City",
    cards: Object.freeze([
      Object.freeze({ title: "룰렛카지노", status: "계약 있음", copy: "휠/구슬 애니메이션은 별도 디자인 테스트에서 연결." }),
      Object.freeze({ title: "바카라카지노", status: "계약 있음", copy: "카드 공개 연출 전, 플레이어/뱅커 룰부터 분리." }),
      Object.freeze({ title: "경마장", status: "애니메이션 후보", copy: "말 이동은 화면 어댑터, 배당/정산은 계약으로 분리." }),
      Object.freeze({ title: "DPA 환전소", status: "1000원=1DPA", copy: "칩이라는 말 대신 다이스시티 전용 DPA로 표시." })
    ]),
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
    cards: Object.freeze([
      Object.freeze({ title: "담보 접수 창구", status: "계약 있음", copy: "아이템 보류/상환/처분 이벤트는 분리 완료." }),
      Object.freeze({ title: "감정 전광판", status: "추가 후보", copy: "가방, 금괴, 시계 같은 보유품 가치를 표시." })
    ]),
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

export function renderRestoredPlaceSurfaceHtml(copy = {}) {
  const actions = (copy.actions || []).map(renderActionButton).join("");
  const rows = (copy.cards || []).map(renderSurfaceRow).join("");
  const list = rows ? `<div class="col-span-1 sm:col-span-2 border-t border-slate-100 pt-4"><div class="divide-y divide-slate-100">${rows}</div></div>` : "";
  return actions + list || `<div class="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-400">준비 중</div>`;
}

function renderActionButton(item) {
  const tone = RESTORED_PLACE_BUTTON_TONES[item.tone] || RESTORED_PLACE_BUTTON_TONES.slate;
  const click = item.action === "walk" ? "goForWalk()" : item.tab === "phone" ? "openPhoneSurface()" : item.tab ? `switchTab(${JSON.stringify(item.tab)})` : `showToast(${JSON.stringify(item.message || "준비 중입니다.")})`;
  return `<button onclick='${click}' class="py-4 rounded-2xl border ${tone} font-bold active:scale-95 transition">${escapeHtml(item.label)}</button>`;
}

function renderSurfaceRow(item) {
  const entryButton = item.entryActionId
    ? `<button onclick="enterRestoredPlaceBuilding('${escapeAttr(item.entryActionId)}')" class="mt-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-[11px] font-black text-indigo-700 active:scale-95 transition">입장</button>`
    : "";
  return `<div class="flex items-start justify-between gap-3 py-3"><div><div class="text-sm font-black text-slate-800">${escapeHtml(item.title)}</div><div class="mt-0.5 text-xs text-slate-500">${escapeHtml(item.copy)}</div>${entryButton}</div><div class="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">${escapeHtml(item.status)}</div></div>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
