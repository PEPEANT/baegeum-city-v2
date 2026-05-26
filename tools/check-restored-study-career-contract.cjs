"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");
const contractPath = path.join(root, "src", "restored", "career", "study-career-contract.js");
const applicationPath = path.join(root, "src", "restored", "career", "study-career-application.js");
const viewPath = path.join(root, "src", "restored", "career", "study-career-place-view.js");
const summaryViewPath = path.join(root, "src", "restored", "career", "study-career-summary-view.js");
const initialStatePath = path.join(root, "src", "restored", "state", "initial-state.js");
const placeCatalogPath = path.join(root, "src", "restored", "data", "place-catalog.js");
const planPath = path.join(root, "docs", "plans", "restored-study-career-system.md");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function assertPureContractSource() {
  const source = read(contractPath);
  for (const blocked of ["document.", "window.", "localStorage", "sessionStorage", "setInterval", "setTimeout", "Math.random", "Date.now", "fetch("]) {
    assert(!source.includes(blocked), `study/career contract must not use ${blocked}`);
  }
}

(async () => {
  for (const filePath of [contractPath, applicationPath, viewPath, summaryViewPath, planPath]) {
    assert(fs.existsSync(filePath), `Missing ${path.relative(root, filePath)}`);
  }
  assertPureContractSource();
  assert(read(initialStatePath).includes("createInitialRestoredEducationState"), "initial state must seed education state.");
  assert(read(initialStatePath).includes("createInitialRestoredCareerState"), "initial state must seed career state.");
  assert(read(placeCatalogPath).includes("baegeum:library"), "place catalog must include the library.");
  assert(read(placeCatalogPath).includes("baegeum:university"), "place catalog must include the university.");
  assert(read(placeCatalogPath).includes("baegeum:company-district"), "place catalog must include the company district.");
  assert(read(planPath).includes("restored-study-career-001"), "study/career plan must mention the contract version.");

  const contract = await import(pathToFileURL(contractPath).href);
  const application = await import(pathToFileURL(applicationPath).href);
  const view = await import(pathToFileURL(viewPath).href);
  const summaryView = await import(pathToFileURL(summaryViewPath).href);
  assert(contract.validateRestoredStudyCareerContract().ok, "study/career contract validation must pass.");
  assert(application.validateRestoredStudyCareerApplication().ok, "study/career application validation must pass.");
  assert(view.validateRestoredStudyCareerPlaceView().ok, "study/career place view validation must pass.");
  assert(summaryView.validateRestoredStudyCareerSummaryView().ok, "study/career summary view validation must pass.");

  const state = {
    cash: 100000,
    education: { credits: 50, studyHours: 20, credentials: [] },
    career: { currentLevelId: "office_staff", promotionPoints: 26 },
    profile: { stats: { intelligence: { value: 72, max: 100 }, energy: { value: 80, max: 100 }, mental: { value: 80, max: 100 } } }
  };
  const result = contract.createRestoredCompanyShiftResult(state, { focus: 90, communication: 85, endurance: 90 });
  assert(result.ok && result.promoted, "qualified company grind should be able to promote.");
  application.applyRestoredStudyCareerResultToState(state, result);
  assert(state.cash > 100000, "company shift should pay DP through an effect.");
  assert(state.career.currentLevelId === "assistant_manager", "company shift should update career level.");
  assert(state.profile.jobTitle === "Assistant Manager", "company shift should update visible job title.");

  console.log("Restored study/career contract check passed.");
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
