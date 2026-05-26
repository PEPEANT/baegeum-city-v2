import {
  RESTORED_BAEGEUM_ELECTRONICS_ASSET,
  RESTORED_BAEGEUM_ELECTRONICS_SNAPSHOT_OPTIONS,
  calculateRestoredHoldingQuote,
  createRestoredBaegeumElectronicsSnapshot,
  formatRestoredDp
} from "../systems/market-contract.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getRestoredHolding(state = {}) {
  const assetId = RESTORED_BAEGEUM_ELECTRONICS_ASSET.id;
  return state.markets?.portfolio?.holdings?.[assetId]
    || state.portfolio?.holdings?.[assetId]
    || state.marketHoldings?.[assetId]
    || {};
}

function getSnapshot(options = {}) {
  return createRestoredBaegeumElectronicsSnapshot({
    candles: options.marketCandles,
    count: options.candleCount || RESTORED_BAEGEUM_ELECTRONICS_SNAPSHOT_OPTIONS.count,
    timeframe: options.timeframe || RESTORED_BAEGEUM_ELECTRONICS_SNAPSHOT_OPTIONS.timeframe,
    aiHeat: options.aiHeat ?? RESTORED_BAEGEUM_ELECTRONICS_SNAPSHOT_OPTIONS.aiHeat,
    aiPhase: options.aiPhase || RESTORED_BAEGEUM_ELECTRONICS_SNAPSHOT_OPTIONS.aiPhase
  });
}

export function renderRestoredStockTickerHtml({ hasPhone = false, currentTickerMsg = "" } = {}) {
  if (!hasPhone) {
    return '<div class="w-full text-center text-gray-400 text-xs py-2 bg-gray-100 flex justify-center gap-2">🔒 <span class="blur-sm">휴대폰이 없어 정보를 볼 수 없습니다</span></div>';
  }
  const message = currentTickerMsg || "배금증권: 배금전자 가상 시세 수신 중";
  return `<div class="bg-slate-900 px-3 py-2 text-xs font-bold text-white z-10 shrink-0">배금증권</div><div class="marquee-container flex-1 py-2 text-sm text-slate-700 bg-white overflow-hidden"><div class="marquee-content" id="stock-marquee-text">${escapeHtml(message)}</div></div>`;
}

export function renderRestoredBaegeumCandleChartHtml(candles = []) {
  if (!candles.length) return '<div class="w-full text-center text-xs text-slate-400">차트 데이터 없음</div>';
  const high = Math.max(...candles.map((candle) => Number(candle.high || 0)));
  const low = Math.min(...candles.map((candle) => Number(candle.low || 0)));
  const maxVolume = Math.max(...candles.map((candle) => Number(candle.volume || 1)));
  const range = Math.max(1, high - low);
  const scale = (value) => 100 - ((Number(value || 0) - low) / range) * 100;

  const rows = candles.map((candle) => {
    const up = Number(candle.close) >= Number(candle.open);
    const color = up ? "bg-red-400" : "bg-blue-400";
    const wickColor = up ? "bg-red-300" : "bg-blue-300";
    const wickTop = scale(candle.high);
    const wickBottom = scale(candle.low);
    const bodyTop = scale(Math.max(candle.open, candle.close));
    const bodyBottom = scale(Math.min(candle.open, candle.close));
    const bodyHeight = Math.max(3, bodyBottom - bodyTop);
    const volumeHeight = Math.max(5, (Number(candle.volume || 0) / maxVolume) * 24);
    return `
      <div class="relative h-full flex-1 min-w-[4px]">
        <div class="absolute left-1/2 w-px -translate-x-1/2 ${wickColor}" style="top:${wickTop}%;height:${Math.max(2, wickBottom - wickTop)}%"></div>
        <div class="absolute left-1/2 w-[70%] -translate-x-1/2 rounded-sm ${color}" style="top:${bodyTop}%;height:${bodyHeight}%"></div>
        <div class="absolute bottom-0 left-1/2 w-[70%] -translate-x-1/2 rounded-t bg-slate-500/35" style="height:${volumeHeight}%"></div>
      </div>
    `;
  }).join("");

  return `<div class="w-full h-full rounded-xl bg-slate-950 p-3 flex items-stretch gap-1 shadow-inner">${rows}</div>`;
}

export function renderRestoredMarketTradeRowsHtml(snapshot) {
  const changeClass = snapshot.summary.change >= 0 ? "text-red-600" : "text-blue-600";
  return `
    <tr class="group hover:bg-slate-50">
      <td class="px-4 py-4">
        <div class="font-black text-slate-800">${escapeHtml(snapshot.asset.displayName)}</div>
        <div class="text-[10px] font-bold text-slate-400 mt-1">반도체 · AI칩 · 스마트폰</div>
      </td>
      <td class="px-4 py-4 text-right">
        <div class="font-mono font-black text-slate-900">${snapshot.priceText}</div>
        <div class="text-xs font-bold ${changeClass}">${snapshot.changeText} ${snapshot.changeRateText}</div>
      </td>
      <td class="px-4 py-4 text-center space-x-1">
        <button onclick="tradeRestoredBaegeumStock('buy')" class="bg-red-50 text-red-600 text-xs px-2 py-1 rounded border border-red-100 active:scale-95">매수</button>
        <button onclick="tradeRestoredBaegeumStock('sell')" class="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded border border-blue-100 active:scale-95">매도</button>
      </td>
    </tr>
  `;
}

export function renderRestoredPortfolioHtml(state = {}, snapshot = getSnapshot()) {
  const quote = calculateRestoredHoldingQuote(getRestoredHolding(state), snapshot.summary.currentPrice);
  if (quote.qty <= 0) {
    return `
      <div class="p-5 text-center">
        <div class="text-xs font-bold text-slate-400">보유 주식 없음</div>
        <div class="mt-2 text-sm font-black text-slate-800">배금전자 0주</div>
        <div class="text-xs text-slate-400">1주 단위로 거래할 수 있습니다</div>
      </div>
    `;
  }
  const pnlClass = quote.unrealizedPnl >= 0 ? "text-red-600" : "text-blue-600";
  return `
    <div class="p-4 flex justify-between items-center text-sm">
      <div>
        <div class="font-black text-slate-800">배금전자</div>
        <div class="text-xs text-slate-400 mt-0.5">${quote.qty}주 | 평단 ${formatRestoredDp(quote.avgPrice)}</div>
      </div>
      <div class="text-right">
        <div class="font-black text-slate-900">${quote.valuationText}</div>
        <div class="text-xs font-bold ${pnlClass}">${quote.unrealizedPnlText} (${(quote.unrealizedPnlRate * 100).toFixed(2)}%)</div>
      </div>
    </div>
  `;
}

export function renderRestoredStockAppView(state = {}, options = {}) {
  const snapshot = getSnapshot(options);
  const highLow = `고가 ${formatRestoredDp(snapshot.summary.high)} · 저가 ${formatRestoredDp(snapshot.summary.low)} · 거래량 ${snapshot.summary.volume.toLocaleString()}`;
  return Object.freeze({
    marketCycleLabel: "국내",
    marketCycleClass: "text-2xl font-black transition-colors duration-500 text-indigo-600",
    nasdaqPriceText: snapshot.priceText,
    tickerHtml: renderRestoredStockTickerHtml(options),
    chartHtml: renderRestoredBaegeumCandleChartHtml(snapshot.candles),
    stockRowsHtml: renderRestoredMarketTradeRowsHtml(snapshot),
    portfolioHtml: renderRestoredPortfolioHtml(state, snapshot),
    assetName: snapshot.asset.displayName,
    highLowText: highLow
  });
}
