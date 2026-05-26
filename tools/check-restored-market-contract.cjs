"use strict";

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");
const contractPath = path.join(root, "src", "restored", "systems", "market-contract.js");
const applicationPath = path.join(root, "src", "restored", "systems", "market-order-application.js");
const stockViewPath = path.join(root, "src", "restored", "phone", "stock-app-view.js");
const planPath = path.join(root, "docs", "plans", "restored-stock-market-system.md");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function assertPureMarketSource(filePath, label) {
  const source = read(filePath);
  for (const blocked of ["document.", "window.", "localStorage", "sessionStorage", "setInterval", "setTimeout", "Math.random", "Date.now"]) {
    assert(!source.includes(blocked), `${label} must not use ${blocked}`);
  }
}

(async () => {
  assert(fs.existsSync(contractPath), "restored market contract file is required.");
  assert(fs.existsSync(applicationPath), "restored market order application file is required.");
  assert(fs.existsSync(stockViewPath), "restored stock phone view file is required.");
  assert(read(planPath).includes("Baegeum Electronics"), "stock market plan must keep Baegeum Electronics as V0.1.");
  assertPureMarketSource(contractPath, "market contract");
  assertPureMarketSource(applicationPath, "market order application");

  const mod = await import(pathToFileURL(contractPath).href);
  const application = await import(pathToFileURL(applicationPath).href);
  const stockView = await import(pathToFileURL(stockViewPath).href);
  const validation = mod.validateRestoredMarketContract();
  assert(validation.ok, `restored market contract invalid: ${validation.errors.join("; ")}`);
  assert(application.validateRestoredMarketOrderApplication().ok, "restored market order application validation must pass.");

  const tabs = mod.listRestoredMarketTabs();
  assert(tabs.map((tab) => tab.id).join(",") === "domestic,united_states,crypto_spot,crypto_leverage", "market tabs must stay in the documented four-market order.");
  assert(tabs.find((tab) => tab.id === "domestic").leverageAllowed === false, "domestic market must not allow leverage.");
  assert(tabs.find((tab) => tab.id === "crypto_leverage").leverageAllowed === true, "crypto leverage market must allow leverage.");

  const asset = mod.RESTORED_BAEGEUM_ELECTRONICS_ASSET;
  assert(asset.id === "domestic:baegeum-electronics", "Baegeum Electronics asset id must stay stable.");
  assert(asset.priceUnit === "DP", "Baegeum Electronics must be DP-only.");
  assert(asset.leverageAllowed === false, "Baegeum Electronics must not allow leverage.");
  assert(asset.realCompanyReference === false, "Baegeum Electronics must remain fictional in V0.1.");
  assert(asset.tags.includes("ai") && asset.tags.includes("semiconductor"), "Baegeum Electronics must carry AI and semiconductor tags.");

  const candles = mod.createRestoredBaegeumElectronicsCandles({ count: 24, aiHeat: 65, aiPhase: "expansion" });
  assert(candles.length === 24, "Baegeum Electronics should generate the requested candle count.");
  assert(candles.every((candle) => candle.assetId === asset.id), "every candle must belong to Baegeum Electronics.");
  assert(candles.every((candle) => candle.high >= candle.open && candle.high >= candle.close), "candle high must cover open and close.");
  assert(candles.every((candle) => candle.low <= candle.open && candle.low <= candle.close), "candle low must cover open and close.");
  assert(candles.every((candle) => candle.volume > 0), "every candle must have positive volume.");

  const snapshot = mod.createRestoredBaegeumElectronicsSnapshot({ candles });
  assert(snapshot.version === "restored-market-contract-001", "snapshot must expose the market contract version.");
  assert(snapshot.priceText.endsWith(" DP"), "snapshot price text must render in DP.");
  assert(!/[₩원$]|KRW|USD/.test(snapshot.priceText), "snapshot price text must not look like KRW or USD.");
  assert(Number.isFinite(snapshot.summary.currentPrice) && snapshot.summary.currentPrice > 0, "snapshot current price must be positive.");
  assert(Number.isFinite(snapshot.summary.changeRate), "snapshot change rate must be finite.");

  const buy = mod.createRestoredMarketOrderPreview({ side: "buy", qty: 1, price: snapshot.summary.currentPrice, cash: 100000 });
  assert(buy.ok && buy.cashDelta < 0 && buy.quantityDelta === 1, "buy preview must reserve DP and add one share.");
  assert(buy.type === "market_order_requested", "buy preview must be an order request envelope.");

  const sell = mod.createRestoredMarketOrderPreview({ side: "sell", qty: 1, price: snapshot.summary.currentPrice, holdingQty: 1 });
  assert(sell.ok && sell.cashDelta > 0 && sell.quantityDelta === -1, "sell preview must return DP and remove one share.");

  const insufficientCash = mod.createRestoredMarketOrderPreview({ side: "buy", qty: 9, price: snapshot.summary.currentPrice, cash: 1 });
  assert(!insufficientCash.ok && insufficientCash.reason === "insufficient_dp", "buy preview must reject insufficient DP.");

  const overSell = mod.createRestoredMarketOrderPreview({ side: "sell", qty: 2, price: snapshot.summary.currentPrice, holdingQty: 1 });
  assert(!overSell.ok && overSell.reason === "insufficient_quantity", "sell preview must reject oversell.");

  const quote = mod.calculateRestoredHoldingQuote({ qty: 2, avgPrice: snapshot.summary.currentPrice - 1000 }, snapshot.summary.currentPrice);
  assert(quote.valuation > 0, "holding quote must calculate valuation.");
  assert(quote.unrealizedPnl > 0, "holding quote must calculate positive P/L when current price is above average.");
  assert(quote.valuationText.endsWith(" DP"), "holding quote must render valuation in DP.");

  const rendered = stockView.renderRestoredStockAppView({}, { hasPhone: true, candleCount: 16 });
  assert(rendered.nasdaqPriceText.endsWith(" DP"), "live stock app adapter must render price in DP.");
  assert(rendered.stockRowsHtml.includes("Baegeum Electronics"), "live stock app adapter must render Baegeum Electronics.");
  assert(!rendered.stockRowsHtml.includes("openTradeModal"), "live stock app adapter must not expose the legacy trade modal.");
  assert(rendered.stockRowsHtml.includes("tradeRestoredBaegeumStock('buy')"), "live stock app adapter must expose the restored buy entry.");
  assert(!/[₩원]|KRW|USD|NASDAQ|TSLA|AAPL|NVDA/.test(rendered.stockRowsHtml + rendered.portfolioHtml + rendered.nasdaqPriceText), "live stock app adapter must avoid legacy symbols and non-DP price text.");

  const liveState = { cash: 200000, markets: mod.createInitialRestoredMarketState() };
  const liveRendered = stockView.renderRestoredStockAppView(liveState, { hasPhone: true });
  const liveFill = application.applyRestoredMarketOrderToState(liveState, { side: "buy", qty: 1 });
  assert(liveFill.ok, "live-price buy application must fill.");
  assert(liveRendered.nasdaqPriceText === mod.formatRestoredDp(liveFill.order.price), "visible Baegeum Electronics price must match the filled local order price.");

  console.log("Restored market contract check passed.");
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
