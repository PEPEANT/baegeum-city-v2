"use strict";

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");
const restoredRoot = path.join(root, "src", "restored");
const htmlPath = path.join(root, "baegeum-city-v2-dice.html");
const docPath = path.join(root, "docs", "baegeum-city-v2-restored-growth-architecture.md");
const recompositionDocPath = path.join(root, "docs", "baegeum-city-v2-restored-recomposition-plan.md");
const indexPath = path.join(root, "docs", "INDEX.md");
const maxRestoredHtmlLines = 1500;
const maxRestoredJsLines = 250;

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, output);
    else output.push(full);
  }
  return output;
}

function lineCount(text) {
  return text.split(/\r?\n/).length;
}

function assertDocumentWiring() {
  const doc = read(docPath);
  const recompositionDoc = read(recompositionDocPath);
  const index = read(indexPath);
  assert(index.includes("baegeum-city-v2-restored-growth-architecture.md"), "restored growth architecture doc must be linked from docs/INDEX.md.");
  assert(index.includes("baegeum-city-v2-restored-recomposition-plan.md"), "restored recomposition plan must be linked from docs/INDEX.md.");
  assert(doc.includes("src/restored/"), "restored growth architecture doc must describe src/restored/.");
  assert(doc.includes("AI 연인"), "restored growth architecture doc must mention AI lover growth.");
  assert(doc.includes("일러스트"), "restored growth architecture doc must mention illustration rules.");
  assert(recompositionDoc.includes("Current Bottlenecks"), "restored recomposition plan must include a bottleneck audit.");
  assert(recompositionDoc.includes("AI Roaming Actor Model"), "restored recomposition plan must include AI roaming actors.");
  assert(recompositionDoc.includes("src/restored/actors/actor-contract.js"), "restored recomposition plan must point to the actor contract.");
  assert(recompositionDoc.includes("src/restored/ui/shell-contract.js"), "restored recomposition plan must point to the UI shell contract.");
  assert(recompositionDoc.includes("src/restored/data/place-catalog.js"), "restored recomposition plan must point to the place catalog.");
}

function assertRestoredHtmlShell() {
  const html = read(htmlPath);
  assert(lineCount(html) <= maxRestoredHtmlLines, `baegeum-city-v2-dice.html has grown past ${maxRestoredHtmlLines} lines; split touched features into src/restored/.`);
  assert(html.includes("<script type=\"module\">"), "restored HTML runtime script must use module imports.");
  assert(html.includes("./src/restored/state/initial-state.js"), "restored HTML must import the restored initial state module.");
  assert(html.includes("./src/restored/state/storage.js"), "restored HTML must import the restored storage module.");
  assert(html.includes("./src/restored/state/selectors.js"), "restored HTML must import the restored selectors module.");
  assert(!html.includes("const INITIAL_STATE ="), "restored HTML must not own the INITIAL_STATE literal.");
  assert(!html.includes("localStorage.setItem(STORAGE_KEY"), "restored HTML save path must use src/restored/state/storage.js.");
  assert(!html.includes("const STORAGE_KEY ="), "restored HTML must not own the storage key literal.");
  assert(!html.includes("function getMyTotalAsset("), "restored HTML must not own total-asset selector logic.");
  assert(!html.includes("function getMyRank("), "restored HTML must not own rank selector logic.");
  assert(!html.includes("function hasPhone("), "restored HTML must not own phone ownership selector logic.");
  assert(!html.includes("function hasSmartPhone("), "restored HTML must not own smartphone ownership selector logic.");
  assert(html.includes("id=\"tab-phone\""), "restored HTML must keep phone as the market app hub.");
  for (const navId of ["nav-myinfo", "nav-phone", "nav-realestate", "nav-casino", "nav-shop"]) {
    assert(html.includes(`id=\"${navId}\"`), `restored HTML must keep bottom nav id ${navId}.`);
  }
  assert(!html.includes("id=\"nav-news\""), "news must not return to bottom navigation.");
  assert(!html.includes("id=\"nav-stock\""), "stock must not return to bottom navigation.");
  assert(!html.includes("id=\"nav-futures\""), "futures must not return to bottom navigation.");
}

async function assertCityCatalog() {
  const modulePath = pathToFileURL(path.join(restoredRoot, "data", "city-catalog.js")).href;
  const mod = await import(modulePath);
  const validation = mod.validateRestoredCityCatalog();
  assert(validation.ok, `restored city catalog invalid: ${validation.errors.join("; ")}`);
  const ids = mod.listRestoredCityIds();
  assert(ids.includes("baegeum-city"), "restored city catalog must include baegeum-city.");
  assert(ids.includes("dice-city"), "restored city catalog must include dice-city.");
  const baegeum = mod.getRestoredCity("baegeum-city");
  const dice = mod.getRestoredCity("dice-city");
  assert(baegeum.role !== dice.role, "baegeum-city and dice-city must keep distinct roles.");
  assert(dice.featureDomains.includes("casino"), "dice-city must own casino features.");
}

async function assertPlaceCatalog() {
  const modulePath = pathToFileURL(path.join(restoredRoot, "data", "place-catalog.js")).href;
  const mod = await import(modulePath);
  const validation = mod.validateRestoredPlaceCatalog();
  assert(validation.ok, `restored place catalog invalid: ${validation.errors.join("; ")}`);
  const baegeumPlaces = mod.listRestoredPlacesForCity("baegeum-city");
  const dicePlaces = mod.listRestoredPlacesForCity("dice-city");
  assert(baegeumPlaces.some((place) => place.actorSlots.includes("partner_meet")), "baegeum-city places must support partner meetings.");
  assert(dicePlaces.some((place) => place.actorSlots.includes("casino_staff")), "dice-city places must support casino staff actors.");
}

async function assertActorContract() {
  const modulePath = pathToFileURL(path.join(restoredRoot, "actors", "actor-contract.js")).href;
  const mod = await import(modulePath);
  const fixture = mod.createRestoredActorFixture();
  const validation = mod.validateRestoredActor(fixture);
  assert(validation.ok, `restored actor contract invalid: ${validation.errors.join("; ")}`);
  assert(mod.RESTORED_ACTOR_LOCATION_TYPES.includes("venue"), "restored actor contract must support venue locations.");
  assert(mod.RESTORED_ACTOR_EVENT_TYPES.includes("casino_loss_seen"), "restored actor contract must support casino memory events.");
}

async function assertShellContract() {
  const modulePath = pathToFileURL(path.join(restoredRoot, "ui", "shell-contract.js")).href;
  const mod = await import(modulePath);
  const validation = mod.validateRestoredShellContract();
  assert(validation.ok, `restored shell contract invalid: ${validation.errors.join("; ")}`);
  const bottomTabs = mod.listRestoredBottomTabIds();
  const phoneApps = mod.listRestoredPhoneAppIds();
  assert(bottomTabs.includes("phone"), "restored shell contract must keep phone as a bottom tab.");
  assert(!bottomTabs.includes("news"), "news must stay inside phone apps.");
  assert(phoneApps.includes("news") && phoneApps.includes("stock") && phoneApps.includes("futures"), "phone apps must include news, stock, and futures.");
  assert(mod.getRestoredPhoneAppGate("futures") === "smartphone", "futures must require smartphone.");
}

async function assertStateStorageContract() {
  const initialPath = pathToFileURL(path.join(restoredRoot, "state", "initial-state.js")).href;
  const storagePath = pathToFileURL(path.join(restoredRoot, "state", "storage.js")).href;
  const initial = await import(initialPath);
  const storage = await import(storagePath);
  const state = initial.createInitialRestoredState();
  assert(initial.EXCHANGE_RATE === 1350, "restored initial state must export the exchange rate.");
  assert(state.cash === 10000, "restored initial state must start with 10000 cash.");
  assert(state.luxury.phone.count === 0, "restored initial state must start without a phone.");
  assert(storage.RESTORED_STORAGE_KEY === "baegeum_city_v2_dice_restore", "restored storage key must stay isolated.");
  const encoded = storage.encodeRestoredSaveCode({ cash: 1234 });
  const decoded = storage.restoreCashOnlyFromSaveCode(encoded);
  assert(decoded.ok && decoded.cash === 1234, "restored storage must roundtrip cash-only save codes.");
}

async function assertSelectorsContract() {
  const selectorsPath = pathToFileURL(path.join(restoredRoot, "state", "selectors.js")).href;
  const initialPath = pathToFileURL(path.join(restoredRoot, "state", "initial-state.js")).href;
  const selectors = await import(selectorsPath);
  const initial = await import(initialPath);
  const state = initial.createInitialRestoredState();
  const ranks = [
    { limit: 100, title: "low" },
    { limit: 200, title: "mid" },
    { limit: 1000, title: "high" }
  ];

  state.cash = 100;
  state.stocks.NASDAQ.price = 10;
  state.stocks.NASDAQ.qty = 2;
  state.luxury.phone.price = 5;
  state.luxury.phone.count = 1;
  state.realEstate.oneroom.price = 1000;
  state.realEstate.oneroom.count = 1;

  assert(selectors.getRestoredStockValue(state) === 20, "restored selectors must calculate stock value.");
  assert(selectors.getRestoredOwnershipValue(state) === 1005, "restored selectors must calculate ownership value.");
  assert(selectors.getRestoredTotalAsset(state) === 125, "restored selectors must preserve current total asset behavior.");
  assert(selectors.getRestoredRank(state, ranks).title === "mid", "restored selectors must resolve rank from total asset.");
  assert(selectors.getRestoredRankIndex(state, ranks) === 1, "restored selectors must expose rank index.");
  assert(selectors.hasRestoredPhone(state), "restored selectors must detect phone ownership.");
  assert(!selectors.hasRestoredSmartPhone(state), "restored selectors must keep smartphone gate separate from phone gate.");
  state.luxury.smartphone.count = 1;
  assert(selectors.hasRestoredSmartPhone(state), "restored selectors must detect smartphone ownership.");
}

function assertRestoredFileBudgets() {
  const files = walk(restoredRoot).filter((file) => file.endsWith(".js"));
  assert(files.length > 0, "src/restored must contain guardable JavaScript modules.");
  for (const file of files) {
    const count = lineCount(read(file));
    assert(count <= maxRestoredJsLines, `${path.relative(root, file)} has ${count} lines; split before ${maxRestoredJsLines}.`);
  }
}

(async () => {
  assert(fs.existsSync(restoredRoot), "src/restored directory is required.");
  assertDocumentWiring();
  assertRestoredHtmlShell();
  assertRestoredFileBudgets();
  await assertCityCatalog();
  await assertPlaceCatalog();
  await assertActorContract();
  await assertShellContract();
  await assertStateStorageContract();
  await assertSelectorsContract();
  console.log("Restored growth architecture check passed.");
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
