export const PHONE_APP_SCHEMA_VERSION = "phone-app-catalog-001";

export const PHONE_APP_STATUSES = Object.freeze({
  IMPLEMENTED: "implemented",
  PREVIEW: "preview",
  LOCKED: "locked"
});

export const phoneApps = Object.freeze([
  app("bank", "배금은행", "🏦", PHONE_APP_STATUSES.LOCKED, ["view_balance", "loan_request"]),
  app("dis", "디시인사이드", "🧵", PHONE_APP_STATUSES.PREVIEW, ["read_dis_feed"]),
  app("news", "뉴스", "📰", PHONE_APP_STATUSES.LOCKED, ["read_news"]),
  app("playstore", "앱스토어", "🛒", PHONE_APP_STATUSES.LOCKED, ["install_apps"]),
  app("call", "전화", "☎", PHONE_APP_STATUSES.LOCKED, ["npc_contact"]),
  app("gallery", "갤러리", "🖼", PHONE_APP_STATUSES.LOCKED, ["view_photos"]),
  app("stocks", "배금증권", "📈", PHONE_APP_STATUSES.LOCKED, ["view_stocks", "buy_stock", "sell_stock"])
]);

export function findPhoneApp(id) {
  return phoneApps.find((app) => app.id === id) || null;
}

export function summarizePhoneApps(apps = phoneApps) {
  const list = Array.isArray(apps) ? apps : [];
  return {
    schemaVersion: PHONE_APP_SCHEMA_VERSION,
    total: list.length,
    openable: list.filter((app) => app.openable).length,
    implemented: list.filter((app) => app.status === PHONE_APP_STATUSES.IMPLEMENTED).length,
    preview: list.filter((app) => app.status === PHONE_APP_STATUSES.PREVIEW).length,
    locked: list.filter((app) => app.status === PHONE_APP_STATUSES.LOCKED).length,
    workingButtonApps: list.filter((app) => app.hasWorkingButtons).length,
    saveLinked: list.filter((app) => app.persists).length
  };
}

export function phoneAppStatusLabel(status) {
  if (status === PHONE_APP_STATUSES.IMPLEMENTED) return "작동";
  if (status === PHONE_APP_STATUSES.PREVIEW) return "미리보기";
  return "잠김";
}

function app(id, label, icon, status, functions) {
  return Object.freeze({
    id,
    label,
    icon,
    status,
    functions: Object.freeze(functions),
    openable: true,
    hasStateView: status !== PHONE_APP_STATUSES.LOCKED,
    hasWorkingButtons: status === PHONE_APP_STATUSES.IMPLEMENTED,
    persists: status === PHONE_APP_STATUSES.IMPLEMENTED
  });
}
