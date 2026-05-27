export const RESTORED_LIFE_JOB_CATALOG_VERSION = "restored-life-job-catalog-001";

export const RESTORED_LIFE_JOB_IDS = Object.freeze({ CONVENIENCE_STORE: "job:convenience-store", FAST_FOOD: "job:fast-food", LABOR_OFFICE: "job:labor-office", PC_ROOM: "job:pc-room", FLYER: "job:flyer", DELIVERY: "job:delivery", PARKING: "job:parking", CAR_WASH: "job:car-wash", CLEANING: "job:cleaning", FACTORY: "job:factory", PORT: "job:port", MARKET: "job:market" });

export const RESTORED_LIFE_JOB_CATALOG = deepFreeze([
  {
    id: RESTORED_LIFE_JOB_IDS.CONVENIENCE_STORE,
    placeId: "baegeum:convenience-store",
    displayName: "편의점 알바",
    districtId: "baegeum-city",
    minutes: 180,
    baseWageWon: 32000,
    energyCost: 16,
    mentalCost: 4,
    reputationGain: 2,
    relationshipHookId: "partner_reacts_to_steady_shift",
    bonusItem: { itemId: "energy_drink", count: 1, minGrade: "A" },
    tasks: [
      { id: "scan_items", label: "바코드 오류 없이 계산하기", focus: "accuracy" },
      { id: "stock_shelves", label: "러시 전 음료 채우기", focus: "stamina" },
      { id: "serve_customer", label: "예민한 손님 응대하기", focus: "service" },
      { id: "clean_floor", label: "입구 매대 정리하기", focus: "speed" }
    ]
  },
  {
    id: RESTORED_LIFE_JOB_IDS.FAST_FOOD,
    placeId: "baegeum:fast-food",
    displayName: "맥버거 알바",
    districtId: "baegeum-city",
    minutes: 240,
    baseWageWon: 38000,
    energyCost: 24,
    mentalCost: 7,
    reputationGain: 3,
    relationshipHookId: "partner_reacts_to_hard_shift",
    bonusItem: { itemId: "burger_coupon", count: 1, minGrade: "B" },
    tasks: [
      { id: "cook_order", label: "주문 순서대로 조리하기", focus: "accuracy" },
      { id: "pack_order", label: "포장 마감 전에 담기", focus: "speed" },
      { id: "serve_customer", label: "대기 손님 진정시키기", focus: "service" },
      { id: "clean_floor", label: "홀 테이블 정리하기", focus: "stamina" }
    ]
  },
  {
    id: RESTORED_LIFE_JOB_IDS.LABOR_OFFICE,
    placeId: "baegeum:labor-office",
    displayName: "인력소 일당",
    districtId: "baegeum-city",
    minutes: 300,
    baseWageWon: 52000,
    energyCost: 34,
    mentalCost: 9,
    reputationGain: 4,
    relationshipHookId: "partner_reacts_to_day_labor",
    bonusItem: { itemId: "work_gloves", count: 1, minGrade: "A" },
    tasks: [
      { id: "load_boxes", label: "박스 떨어뜨리지 않고 싣기", focus: "stamina" },
      { id: "sort_materials", label: "자재 지시서대로 분류하기", focus: "accuracy" },
      { id: "follow_foreman", label: "반장 지시에 맞춰 움직이기", focus: "service" },
      { id: "finish_cleanup", label: "트럭 출발 전 정리하기", focus: "speed" }
    ]
  },
  {
    id: RESTORED_LIFE_JOB_IDS.PC_ROOM,
    placeId: "baegeum:pc-room",
    displayName: "PC방 알바",
    districtId: "baegeum-city",
    minutes: 240,
    baseWageWon: 36000,
    energyCost: 14,
    mentalCost: 10,
    reputationGain: 2,
    relationshipHookId: "partner_reacts_to_night_shift",
    bonusItem: { itemId: "energy_drink", count: 1, minGrade: "A" },
    tasks: [
      { id: "seat_customers", label: "빈 자리 빠르게 안내하기", focus: "service" },
      { id: "clean_keyboard", label: "키보드와 책상 닦기", focus: "speed" },
      { id: "serve_snacks", label: "간식 주문 처리하기", focus: "accuracy" },
      { id: "handle_noise", label: "소란 손님 조용히 설득하기", focus: "service" }
    ]
  },
  {
    id: RESTORED_LIFE_JOB_IDS.FLYER,
    placeId: "baegeum:flyer-board",
    displayName: "전단지 알바",
    districtId: "baegeum-city",
    minutes: 120,
    baseWageWon: 18000,
    energyCost: 12,
    mentalCost: 6,
    reputationGain: 1,
    relationshipHookId: "partner_reacts_to_small_shift",
    bonusItem: { itemId: "meal_ticket", count: 1, minGrade: "S" },
    tasks: [
      { id: "pick_spot", label: "사람 많은 위치 잡기", focus: "accuracy" },
      { id: "hand_flyers", label: "거절당해도 계속 건네기", focus: "stamina" },
      { id: "keep_smile", label: "표정 무너지지 않기", focus: "service" },
      { id: "finish_stack", label: "남은 전단 빠르게 소진하기", focus: "speed" }
    ]
  },
  {
    id: RESTORED_LIFE_JOB_IDS.DELIVERY,
    placeId: "baegeum:delivery-hub",
    displayName: "배달 알바",
    districtId: "baegeum-city",
    minutes: 240,
    baseWageWon: 47000,
    energyCost: 28,
    mentalCost: 12,
    reputationGain: 3,
    relationshipHookId: "partner_reacts_to_busy_shift",
    bonusItem: { itemId: "meal_ticket", count: 1, minGrade: "B" },
    tasks: [
      { id: "sort_orders", label: "배달 동선별 주문 묶기", focus: "accuracy" },
      { id: "ride_route", label: "막히는 길 피해서 이동하기", focus: "speed" },
      { id: "protect_food", label: "음식 흐트러지지 않게 지키기", focus: "stamina" },
      { id: "deliver_politely", label: "문 앞 응대 실수 줄이기", focus: "service" }
    ]
  },
  {
    id: RESTORED_LIFE_JOB_IDS.PARKING,
    placeId: "baegeum:parking-lot",
    displayName: "주차장 알바",
    districtId: "baegeum-city",
    minutes: 210,
    baseWageWon: 34000,
    energyCost: 15,
    mentalCost: 8,
    reputationGain: 2,
    relationshipHookId: "partner_reacts_to_steady_shift",
    bonusItem: { itemId: "work_gloves", count: 1, minGrade: "S" },
    tasks: [
      { id: "guide_cars", label: "차량 진입 순서 안내하기", focus: "service" },
      { id: "check_tickets", label: "주차권 금액 확인하기", focus: "accuracy" },
      { id: "walk_lot", label: "층마다 빈 자리 확인하기", focus: "stamina" },
      { id: "clear_exit", label: "출차 줄 빠르게 정리하기", focus: "speed" }
    ]
  },
  {
    id: RESTORED_LIFE_JOB_IDS.CAR_WASH,
    placeId: "baegeum:car-wash",
    displayName: "세차장 알바",
    districtId: "baegeum-city",
    minutes: 240,
    baseWageWon: 40000,
    energyCost: 26,
    mentalCost: 6,
    reputationGain: 2,
    relationshipHookId: "partner_reacts_to_hard_shift",
    bonusItem: { itemId: "work_gloves", count: 1, minGrade: "B" },
    tasks: [
      { id: "rinse_car", label: "차체 먼지 먼저 씻기", focus: "accuracy" },
      { id: "scrub_wheels", label: "휠 오염 집중 제거하기", focus: "stamina" },
      { id: "dry_glass", label: "유리 물자국 남기지 않기", focus: "service" },
      { id: "finish_line", label: "다음 차량 전까지 마감하기", focus: "speed" }
    ]
  },
  {
    id: RESTORED_LIFE_JOB_IDS.CLEANING,
    placeId: "baegeum:cleaning-office",
    displayName: "청소 알바",
    districtId: "baegeum-city",
    minutes: 180,
    baseWageWon: 30000,
    energyCost: 18,
    mentalCost: 5,
    reputationGain: 2,
    relationshipHookId: "partner_reacts_to_steady_shift",
    bonusItem: { itemId: "meal_ticket", count: 1, minGrade: "A" },
    tasks: [
      { id: "collect_trash", label: "쓰레기 분리수거하기", focus: "stamina" },
      { id: "wipe_floor", label: "바닥 얼룩 지우기", focus: "accuracy" },
      { id: "restock_supplies", label: "비품 빠짐없이 채우기", focus: "service" },
      { id: "finish_before_open", label: "영업 시작 전 마무리하기", focus: "speed" }
    ]
  },
  {
    id: RESTORED_LIFE_JOB_IDS.FACTORY,
    placeId: "seosan:factory",
    displayName: "공장 단기 알바",
    districtId: "seosan-city",
    minutes: 360,
    baseWageWon: 72000,
    energyCost: 42,
    mentalCost: 16,
    reputationGain: 5,
    relationshipHookId: "partner_reacts_to_day_labor",
    bonusItem: { itemId: "work_gloves", count: 1, minGrade: "B" },
    tasks: [
      { id: "inspect_parts", label: "부품 불량 빠르게 골라내기", focus: "accuracy" },
      { id: "keep_line", label: "컨베이어 속도 맞추기", focus: "speed" },
      { id: "lift_crates", label: "상자 옮기며 체력 버티기", focus: "stamina" },
      { id: "follow_safety", label: "안전 지시 놓치지 않기", focus: "service" }
    ]
  },
  {
    id: RESTORED_LIFE_JOB_IDS.PORT,
    placeId: "seosan:port",
    displayName: "항구 하역 알바",
    districtId: "seosan-city",
    minutes: 300,
    baseWageWon: 64000,
    energyCost: 38,
    mentalCost: 12,
    reputationGain: 4,
    relationshipHookId: "partner_reacts_to_day_labor",
    bonusItem: { itemId: "work_gloves", count: 1, minGrade: "A" },
    tasks: [
      { id: "tie_cargo", label: "화물 끈 단단히 묶기", focus: "accuracy" },
      { id: "move_pallet", label: "팔레트 밀어 옮기기", focus: "stamina" },
      { id: "match_manifest", label: "운송장 번호 맞추기", focus: "service" },
      { id: "beat_tide", label: "출항 시간 전에 끝내기", focus: "speed" }
    ]
  },
  {
    id: RESTORED_LIFE_JOB_IDS.MARKET,
    placeId: "seosan:market-street",
    displayName: "시장 보조 알바",
    districtId: "seosan-city",
    minutes: 180,
    baseWageWon: 28000,
    energyCost: 16,
    mentalCost: 6,
    reputationGain: 2,
    relationshipHookId: "partner_reacts_to_small_shift",
    bonusItem: { itemId: "meal_ticket", count: 1, minGrade: "A" },
    tasks: [
      { id: "arrange_stall", label: "가판 물건 보기 좋게 놓기", focus: "service" },
      { id: "count_change", label: "거스름돈 틀리지 않기", focus: "accuracy" },
      { id: "carry_boxes", label: "상자 들고 창고 오가기", focus: "stamina" },
      { id: "catch_customers", label: "손님 흐름 놓치지 않기", focus: "speed" }
    ]
  }
]);

function deepFreeze(value) {
  if (Array.isArray(value)) return Object.freeze(value.map((item) => deepFreeze(item)));
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) value[key] = deepFreeze(value[key]);
    return Object.freeze(value);
  }
  return value;
}
