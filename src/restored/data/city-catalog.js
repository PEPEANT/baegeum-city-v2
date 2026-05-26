export const RESTORED_CITY_IDS = Object.freeze({
  BAEGEUM: "baegeum-city",
  DICE: "dice-city"
});

export const RESTORED_CITY_CATALOG_VERSION = "restored-city-catalog-001";

export const RESTORED_CITY_CATALOG = Object.freeze([
  Object.freeze({
    id: RESTORED_CITY_IDS.BAEGEUM,
    label: "배금도시",
    role: "life_hub",
    defaultTab: "myinfo",
    tabs: Object.freeze(["myinfo", "phone", "realestate", "shop"]),
    featureDomains: Object.freeze(["identity", "phone_apps", "ownership", "relationship"]),
    description: "생활, 보유 자산, 휴대폰 앱, 연인 대화가 중심인 기본 도시."
  }),
  Object.freeze({
    id: RESTORED_CITY_IDS.DICE,
    label: "다이스시티",
    role: "gambling_hub",
    defaultTab: "casino",
    tabs: Object.freeze(["casino", "phone"]),
    featureDomains: Object.freeze(["casino", "futures", "risk_events", "relationship_reactions"]),
    description: "도박, 위험 이벤트, 도박 결과에 따른 감정 반응이 중심인 분리 도시."
  })
]);

export function getRestoredCity(cityId) {
  return RESTORED_CITY_CATALOG.find((city) => city.id === cityId) || null;
}

export function listRestoredCityIds() {
  return RESTORED_CITY_CATALOG.map((city) => city.id);
}

export function validateRestoredCityCatalog(catalog = RESTORED_CITY_CATALOG) {
  const ids = new Set();
  const errors = [];

  for (const city of catalog) {
    if (!city.id) errors.push("city id is required");
    if (ids.has(city.id)) errors.push(`duplicate city id: ${city.id}`);
    ids.add(city.id);
    if (!city.label) errors.push(`${city.id} label is required`);
    if (!city.role) errors.push(`${city.id} role is required`);
    if (!city.defaultTab) errors.push(`${city.id} defaultTab is required`);
    if (!Array.isArray(city.tabs) || city.tabs.length === 0) {
      errors.push(`${city.id} tabs must not be empty`);
    }
    if (!Array.isArray(city.featureDomains) || city.featureDomains.length === 0) {
      errors.push(`${city.id} featureDomains must not be empty`);
    }
  }

  if (!ids.has(RESTORED_CITY_IDS.BAEGEUM)) errors.push("baegeum-city is required");
  if (!ids.has(RESTORED_CITY_IDS.DICE)) errors.push("dice-city is required");

  return Object.freeze({
    ok: errors.length === 0,
    errors
  });
}

