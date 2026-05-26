"use strict";

const assert = require("assert");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");

async function load(relativePath) {
  return import(pathToFileURL(path.join(root, relativePath)).href);
}

(async () => {
  const { compactBaegeumMapLayout } = await load("src/data/baegeum-city-compact-layout.js");
  const { cityMap } = await load("src/data/city-map.js");
  const { diceCityMap } = await load("src/data/dice-city-map.js");
  const { createRuntimeMap } = await load("src/scenes/city-scene-runtime.js");
  const { createCityFeatureAudit } = await load("src/systems/city-feature-audit.js");

  const baegeumMap = createRuntimeMap(compactBaegeumMapLayout(clone(cityMap)));
  const diceMap = createRuntimeMap(clone(diceCityMap));
  const baegeumAudit = createCityFeatureAudit({ map: baegeumMap });
  const diceAudit = createCityFeatureAudit({ map: diceMap });

  assert.equal(baegeumAudit.schemaVersion, "city-feature-audit-001");
  assert.ok(baegeumAudit.buildings.total >= 10, "baegeum-city should expose city buildings to the audit");
  assert.ok(baegeumAudit.buildings.functionless > 0, "visual-only city shells should be visible as unfinished");
  assert.ok(diceAudit.buildings.enterable >= 3, "dice-city copied casinos should remain enterable");
  assert.ok(diceAudit.buildings.missingSign === 0, "dice-city copied casinos should keep signs");

  assert.ok(baegeumAudit.apps.total >= 7, "phone app catalog should be audited");
  assert.equal(baegeumAudit.apps.preview, 1, "DIS should be the only preview app for now");
  assert.equal(baegeumAudit.apps.workingButtonApps, 0, "no phone app should pretend to have working buttons yet");
  assert.equal(baegeumAudit.riskFlags.appsWithoutWorkingButtons, true);

  console.log("City feature audit smoke check passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
