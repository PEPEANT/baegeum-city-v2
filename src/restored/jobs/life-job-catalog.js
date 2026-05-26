export const RESTORED_LIFE_JOB_CATALOG_VERSION = "restored-life-job-catalog-001";

export const RESTORED_LIFE_JOB_IDS = Object.freeze({
  CONVENIENCE_STORE: "job:convenience-store",
  FAST_FOOD: "job:fast-food",
  LABOR_OFFICE: "job:labor-office"
});

export const RESTORED_LIFE_JOB_CATALOG = deepFreeze([
  {
    id: RESTORED_LIFE_JOB_IDS.CONVENIENCE_STORE,
    placeId: "baegeum:convenience-store",
    displayName: "Convenience Store Shift",
    districtId: "baegeum-city",
    minutes: 180,
    baseWageDp: 32000,
    energyCost: 16,
    mentalCost: 4,
    reputationGain: 2,
    relationshipHookId: "partner_reacts_to_steady_shift",
    bonusItem: { itemId: "energy_drink", count: 1, minGrade: "A" },
    tasks: [
      { id: "scan_items", label: "Scan items without mismatches", focus: "accuracy" },
      { id: "stock_shelves", label: "Restock drinks before rush hour", focus: "stamina" },
      { id: "serve_customer", label: "Handle an impatient customer", focus: "service" },
      { id: "clean_floor", label: "Clean the entrance aisle", focus: "speed" }
    ]
  },
  {
    id: RESTORED_LIFE_JOB_IDS.FAST_FOOD,
    placeId: "baegeum:fast-food",
    displayName: "MacBurger Shift",
    districtId: "baegeum-city",
    minutes: 240,
    baseWageDp: 38000,
    energyCost: 24,
    mentalCost: 7,
    reputationGain: 3,
    relationshipHookId: "partner_reacts_to_hard_shift",
    bonusItem: { itemId: "burger_coupon", count: 1, minGrade: "B" },
    tasks: [
      { id: "cook_order", label: "Cook orders in the right sequence", focus: "accuracy" },
      { id: "pack_order", label: "Pack takeout before the timer ends", focus: "speed" },
      { id: "serve_customer", label: "Calm a waiting customer", focus: "service" },
      { id: "clean_floor", label: "Reset the dining room", focus: "stamina" }
    ]
  },
  {
    id: RESTORED_LIFE_JOB_IDS.LABOR_OFFICE,
    placeId: "baegeum:labor-office",
    displayName: "Labor Office Day Job",
    districtId: "baegeum-city",
    minutes: 300,
    baseWageDp: 52000,
    energyCost: 34,
    mentalCost: 9,
    reputationGain: 4,
    relationshipHookId: "partner_reacts_to_day_labor",
    bonusItem: { itemId: "work_gloves", count: 1, minGrade: "A" },
    tasks: [
      { id: "load_boxes", label: "Load boxes without dropping cargo", focus: "stamina" },
      { id: "sort_materials", label: "Sort materials by work order", focus: "accuracy" },
      { id: "follow_foreman", label: "Follow the foreman's timing", focus: "service" },
      { id: "finish_cleanup", label: "Clean up before the truck leaves", focus: "speed" }
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
