"use strict";

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");
const contractPath = path.join(root, "src", "restored", "systems", "news-cycle-contract.js");
const viewPath = path.join(root, "src", "restored", "phone", "news-app-view.js");
const htmlPath = path.join(root, "baegeum-city-v2-dice.html");
const phonePlanPath = path.join(root, "docs", "plans", "restored-phone-app-ecosystem.md");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertPureSource(filePath, label) {
  const source = read(filePath);
  for (const blocked of ["document.", "window.", "localStorage", "sessionStorage", "setInterval", "setTimeout", "Math.random", "Date.now"]) {
    assert(!source.includes(blocked), `${label} must not use ${blocked}`);
  }
}

(async () => {
  assert(fs.existsSync(contractPath), "restored news cycle contract file is required.");
  assert(fs.existsSync(viewPath), "restored news phone view file is required.");
  assertPureSource(contractPath, "news cycle contract");

  const contract = await import(pathToFileURL(contractPath).href);
  const view = await import(pathToFileURL(viewPath).href);
  assert(contract.RESTORED_NEWS_CYCLE_CONTRACT_VERSION === "restored-news-cycle-001", "news cycle version must stay stable.");
  assert(contract.validateRestoredNewsCycleContract().ok, "news cycle contract must validate.");
  assert(contract.RESTORED_NEWS_CYCLE_IDS.join(",") === "extreme_fear,fear,neutral,greed,extreme_greed", "news cycles must keep the market-cycle order.");

  for (const marketCycle of ["EXTREME_FEAR", "FEAR", "NEUTRAL", "GREED", "EXTREME_GREED"]) {
    const item = contract.createRestoredNewsCycleItem({ marketCycle, index: 1, time: "09:30" });
    assert(item.headline && item.summary && item.impact, `${marketCycle} news must have headline, summary, and impact.`);
    assert(item.time === "09:30", `${marketCycle} news must preserve supplied time.`);
    assert(item.sourceLabel, `${marketCycle} news must expose a source label.`);
    assert(item.tags.length > 0, `${marketCycle} news must expose tags.`);
  }

  const crash = contract.createRestoredCrashNewsItem({ type: "external", index: 0, time: "10:05" });
  assert(crash.marketBias < 0, "crash news must carry negative market bias.");
  assert(contract.getRestoredNewsTickerText(crash) === crash.headline, "ticker text must use headline.");

  const aiFlash = contract.createRestoredAiReporterNewsItem({ headline: "Baegeum AI flash", time: "11:20" });
  assert(aiFlash.sourceLabel === "AI 특파원", "AI flash must be source-labeled.");
  assert(aiFlash.headline === "Baegeum AI flash", "AI flash must preserve supplied headline.");

  const legacy = contract.normalizeRestoredNewsItem({ time: "12:00", msg: "legacy headline" }, 0);
  assert(legacy.headline === "legacy headline", "news normalizer must preserve legacy msg items.");

  const emptyHtml = view.renderRestoredNewsListHtml({ newsHistory: [] });
  const cardHtml = view.renderRestoredNewsListHtml({ newsHistory: [aiFlash, legacy] });
  assert(emptyHtml.includes("news-empty-state"), "news view must expose an empty-state marker.");
  assert(cardHtml.includes("data-news-card"), "news view must render article cards.");
  assert(cardHtml.includes("Baegeum AI flash"), "news view must render modern news headlines.");
  assert(cardHtml.includes("legacy headline"), "news view must render legacy news messages.");

  const combinedNews = [
    contract.createRestoredNewsCycleItem({ marketCycle: "EXTREME_GREED", index: 0 }),
    contract.createRestoredNewsCycleItem({ marketCycle: "FEAR", index: 0 }),
    crash,
    aiFlash
  ].map((item) => `${item.headline} ${item.summary} ${item.impact}`).join("\n");
  assert(!/(Samsung|Tesla|Apple|NASDAQ|AAPL|TSLA|NVDA|KRW|USD)/.test(combinedNews), "news copy must stay fictional and avoid live market ticker branding.");
  assert(!/(알바|회사 근무)[^\n]*(DP|DPA|디피)|DP 공급원/.test(combinedNews), "ordinary work news must describe won/cash income, not DP/DPA income.");

  const html = read(htmlPath);
  assert(html.includes("./src/restored/systems/news-cycle-contract.js"), "restored HTML must import the news cycle contract.");
  assert(html.includes("createRestoredNewsCycleItem({ marketCycle"), "restored HTML must create cycle news through the contract.");
  assert(html.includes("createRestoredCrashNewsItem({ type: \"policy\""), "restored HTML must create crash news through the contract.");
  assert(html.includes("getRestoredNewsTickerText(item)"), "restored HTML ticker must read normalized news headlines.");
  assert(!html.includes("NEWS_MESSAGES[marketCycle]"), "restored HTML must not read legacy flat market-news arrays.");

  const phonePlan = read(phonePlanPath);
  assert(phonePlan.includes("news-cycle-contract.js"), "phone ecosystem plan must mention the news cycle contract.");

  console.log("Restored news cycle contract check passed.");
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
