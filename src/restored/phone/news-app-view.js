import { normalizeRestoredNewsItem } from "../systems/news-cycle-contract.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function listRestoredNewsCards(state = {}) {
  const newsHistory = Array.isArray(state.newsHistory) ? state.newsHistory : [];
  return newsHistory.map((news, index) => normalizeRestoredNewsItem(news, index));
}

export function renderRestoredNewsListHtml(state = {}) {
  const cards = listRestoredNewsCards(state);
  if (!cards.length) {
    return '<div class="news-empty-state bg-white p-6 rounded-2xl border text-center text-sm text-gray-400">아직 수신된 뉴스가 없습니다.</div>';
  }
  return cards.map(renderNewsCardHtml).join("");
}

export function renderRestoredNewsAppView(state = {}) {
  return Object.freeze({
    listHtml: renderRestoredNewsListHtml(state)
  });
}

function renderNewsCardHtml(card) {
  const toneClass = getToneClass(card.tone);
  const tags = (card.tags || [])
    .slice(0, 3)
    .map((tag) => `<span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">#${escapeHtml(tag)}</span>`)
    .join("");

  return `
    <article data-news-card="${escapeHtml(card.id)}" class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2">
        <div class="news-source text-[10px] font-black uppercase tracking-wide text-slate-400">${escapeHtml(card.sourceLabel)}</div>
        <div class="text-[10px] font-bold text-slate-400">${escapeHtml(card.time)}</div>
      </div>
      <div class="p-4 space-y-3">
        <div class="flex items-start gap-2">
          <span class="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black ${toneClass}">${escapeHtml(card.badge)}</span>
          <h3 class="text-sm font-black leading-snug text-slate-900">${escapeHtml(card.headline)}</h3>
        </div>
        ${card.summary ? `<p class="text-xs leading-relaxed text-slate-600">${escapeHtml(card.summary)}</p>` : ""}
        ${card.impact ? `<div class="rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-bold leading-relaxed text-slate-100">${escapeHtml(card.impact)}</div>` : ""}
        ${tags ? `<div class="flex flex-wrap gap-1.5">${tags}</div>` : ""}
      </div>
    </article>
  `;
}

function getToneClass(tone) {
  return {
    bull: "bg-red-50 text-red-600 border-red-100",
    bear: "bg-blue-50 text-blue-600 border-blue-100",
    danger: "bg-amber-50 text-amber-700 border-amber-100",
    euphoria: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
    risk: "bg-orange-50 text-orange-700 border-orange-100",
    neutral: "bg-slate-50 text-slate-600 border-slate-100"
  }[tone] || "bg-slate-50 text-slate-600 border-slate-100";
}
