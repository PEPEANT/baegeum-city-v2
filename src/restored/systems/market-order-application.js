import {
  RESTORED_BAEGEUM_ELECTRONICS_ASSET,
  createInitialRestoredMarketState,
  createRestoredBaegeumElectronicsSnapshot,
  createRestoredMarketOrderPreview,
  formatRestoredDp,
  roundRestoredDp
} from "./market-contract.js";

export const RESTORED_MARKET_ORDER_APPLICATION_VERSION = "restored-market-order-application-001";

export function applyRestoredMarketOrderToState(state, input = {}) {
  if (!state) return rejected("invalid_state", "주문 상태를 확인할 수 없습니다.");
  const marketState = ensureRestoredMarketState(state);
  const snapshot = input.snapshot || createRestoredBaegeumElectronicsSnapshot(input.snapshotOptions || {});
  const side = input.side === "sell" ? "sell" : "buy";
  const qty = Math.max(1, Math.floor(Number(input.qty || 1)));
  const holding = getBaegeumElectronicsHolding(marketState);
  const preview = createRestoredMarketOrderPreview({
    side,
    qty,
    price: snapshot.summary.currentPrice,
    cash: state.cash,
    holdingQty: holding.qty
  });
  if (!preview.ok) return rejected(preview.reason, getRejectedMessage(preview.reason), preview);

  state.cash = roundRestoredDp(Number(state.cash || 0) + preview.cashDelta);
  applyHoldingDelta(marketState, holding, preview);
  const order = appendOrder(marketState, preview);
  return Object.freeze({
    ok: true,
    side,
    qty,
    order,
    preview,
    snapshot,
    cash: state.cash,
    message: `배금전자 ${qty}주 ${side === "buy" ? "매수" : "매도"} 완료 (${formatRestoredDp(preview.gross)})`
  });
}

export function validateRestoredMarketOrderApplication() {
  const errors = [];
  const buyState = { cash: 200000 };
  const buy = applyRestoredMarketOrderToState(buyState, { side: "buy", qty: 1 });
  const holding = buyState.markets?.portfolio?.holdings?.[RESTORED_BAEGEUM_ELECTRONICS_ASSET.id];
  if (!buy.ok || buyState.cash >= 200000) errors.push("buy must reduce cash");
  if (!holding || holding.qty !== 1 || holding.avgPrice <= 0) errors.push("buy must add one Baegeum Electronics share");
  if (!buyState.markets.portfolio.orders.length) errors.push("buy must append an order record");

  const sell = applyRestoredMarketOrderToState(buyState, { side: "sell", qty: 1 });
  if (!sell.ok || buyState.markets.portfolio.holdings[RESTORED_BAEGEUM_ELECTRONICS_ASSET.id].qty !== 0) {
    errors.push("sell must remove one Baegeum Electronics share");
  }
  if (!Number.isFinite(Number(buyState.markets.portfolio.realizedPnl))) errors.push("sell must keep realized P/L numeric");

  const poor = applyRestoredMarketOrderToState({ cash: 1 }, { side: "buy", qty: 1 });
  if (poor.ok || poor.reason !== "insufficient_dp") errors.push("insufficient DP must reject buy");

  const oversell = applyRestoredMarketOrderToState({ cash: 100000 }, { side: "sell", qty: 1 });
  if (oversell.ok || oversell.reason !== "insufficient_quantity") errors.push("oversell must reject sell");

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

export function ensureRestoredMarketState(state) {
  if (!state.markets || typeof state.markets !== "object") state.markets = createInitialRestoredMarketState();
  if (!state.markets.portfolio || typeof state.markets.portfolio !== "object") {
    state.markets.portfolio = createInitialRestoredMarketState().portfolio;
  }
  if (!state.markets.portfolio.holdings || typeof state.markets.portfolio.holdings !== "object") {
    state.markets.portfolio.holdings = {};
  }
  if (!Array.isArray(state.markets.portfolio.orders)) state.markets.portfolio.orders = [];
  if (!Number.isFinite(Number(state.markets.portfolio.realizedPnl))) state.markets.portfolio.realizedPnl = 0;
  return state.markets;
}

function getBaegeumElectronicsHolding(marketState) {
  const id = RESTORED_BAEGEUM_ELECTRONICS_ASSET.id;
  if (!marketState.portfolio.holdings[id]) {
    marketState.portfolio.holdings[id] = { qty: 0, avgPrice: 0, lastPrice: 0 };
  }
  return marketState.portfolio.holdings[id];
}

function applyHoldingDelta(marketState, holding, preview) {
  const previousQty = Math.max(0, Math.floor(Number(holding.qty || 0)));
  const previousAvg = roundRestoredDp(holding.avgPrice || 0);
  const nextQty = Math.max(0, previousQty + preview.quantityDelta);
  if (preview.side === "buy") {
    holding.avgPrice = roundRestoredDp(((previousQty * previousAvg) + preview.gross) / Math.max(1, nextQty));
  }
  if (preview.side === "sell") {
    marketState.portfolio.realizedPnl = Math.round(Number(marketState.portfolio.realizedPnl || 0) + ((preview.price - previousAvg) * preview.qty));
    if (nextQty === 0) holding.avgPrice = 0;
  }
  holding.qty = nextQty;
  holding.lastPrice = preview.price;
}

function appendOrder(marketState, preview) {
  const order = Object.freeze({
    id: `market-order:local:${marketState.portfolio.orders.length + 1}`,
    type: "market_order_filled",
    assetId: preview.assetId,
    side: preview.side,
    qty: preview.qty,
    price: preview.price,
    gross: preview.gross,
    cashDelta: preview.cashDelta,
    quantityDelta: preview.quantityDelta,
    priceUnit: "DP"
  });
  marketState.portfolio.orders = [...marketState.portfolio.orders, order].slice(-20);
  return order;
}

function rejected(reason, message, preview = null) {
  return Object.freeze({ ok: false, reason, message, preview });
}

function getRejectedMessage(reason) {
  if (reason === "insufficient_dp") return "DP가 부족합니다.";
  if (reason === "insufficient_quantity") return "보유 수량이 부족합니다.";
  if (reason === "invalid_quantity") return "주문 수량을 확인하세요.";
  if (reason === "invalid_price") return "시세를 확인할 수 없습니다.";
  return "주문이 거절되었습니다.";
}
