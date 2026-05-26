"use strict";

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");
const restoredRoot = path.join(root, "src", "restored");
const htmlPath = path.join(root, "baegeum-city-v2-dice.html");

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertPhoneAppContract() {
  const phonePath = pathToFileURL(path.join(restoredRoot, "phone", "phone-app-contract.js")).href;
  const shellPath = pathToFileURL(path.join(restoredRoot, "ui", "shell-contract.js")).href;
  const phone = await import(phonePath);
  const shell = await import(shellPath);
  const folderPhoneApps = phone.listUsableRestoredPhoneApps({ hasPhone: true, hasSmartPhone: false });
  const smartPhoneApps = phone.listUsableRestoredPhoneApps({ hasPhone: true, hasSmartPhone: true });

  assert(phone.validateRestoredPhoneAppContract().ok, "restored phone app contract must validate.");
  assert(shell.validateRestoredShellContract().ok, "restored shell contract must accept phone app contract.");
  assert(phone.getRestoredPhoneAppGate("news") === "phone", "news must require a phone.");
  assert(phone.getRestoredPhoneAppGate("stock") === "phone", "stock must require a phone.");
  assert(phone.getRestoredPhoneAppGate("relationships") === "phone", "relationships must require a phone.");
  assert(phone.getRestoredPhoneAppGate("futures") === "smartphone", "futures must require a smartphone.");
  assert(folderPhoneApps.map((app) => app.id).join(",") === "news,stock,relationships", "folder phone must unlock news, stock, and relationships only.");
  assert(smartPhoneApps.some((app) => app.id === "relationships"), "smartphone must keep relationships available.");
  assert(smartPhoneApps.some((app) => app.id === "futures"), "smartphone must unlock futures.");
}

function assertHtmlWiring() {
  const html = read(htmlPath);
  assert(html.includes("./src/restored/phone/phone-app-contract.js"), "restored HTML must import the phone app contract.");
  assert(html.includes("listUsableRestoredPhoneApps(device)"), "phone tab must derive visible apps from the phone app contract.");
  assert(html.includes('id="phone-app-relationships"'), "relationship app view must live in the phone shell.");
  assert(html.includes('id="phone-partner-list"'), "partner list must render inside the phone app.");
  assert(html.includes('id="phone-dock"'), "phone shell must be opened from the dock above location navigation.");
  assert(html.includes("renderRelationshipPhoneApp()"), "phone relationship app must have a renderer.");
  assert(!html.includes('id="partner-list"'), "my info must not own the full partner list.");
  assert(!html.includes('id="nav-phone"'), "phone must not be a fixed bottom nav tab.");
  assert(!html.includes("phone-app-futures-btn\" class="), "futures app button must not be hard-coded in HTML markup.");
  assert(!html.includes("['news', 'stock', 'futures']"), "restored HTML must not own the phone app id list.");
}

function assertDocs() {
  const recomposition = read(path.join(root, "docs", "baegeum-city-v2-restored-recomposition-plan.md"));
  const roadmap = read(path.join(root, "docs", "baegeum-city-v2-restored-ui-online-ranking-chat-roadmap.md"));
  assert(recomposition.includes("src/restored/phone/phone-app-contract.js"), "recomposition plan must mention the phone app contract.");
  assert(roadmap.includes("src/restored/phone/phone-app-contract.js"), "UI roadmap must mention the phone app contract.");
}

(async () => {
  await assertPhoneAppContract();
  assertHtmlWiring();
  assertDocs();
  console.log("Restored phone app contract check passed.");
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
