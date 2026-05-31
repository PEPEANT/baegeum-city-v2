const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const itemContract = await import(pathToFileURL(path.join(root, "src/restored/games/singularity-race-item-contract.js")));
  const localSim = await import(pathToFileURL(path.join(root, "src/restored/games/singularity-race-local-sim.js")));
  const html = fs.readFileSync(path.join(root, "singularity-race.html"), "utf8");
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

  const itemValidation = itemContract.validateSingularityRaceItemContract();
  assert(itemValidation.ok, `item contract failed: ${itemValidation.errors.join(", ")}`);
  const simValidation = localSim.validateSingularityRaceLocalSimContract();
  assert(simValidation.ok, `local sim contract failed: ${simValidation.errors.join(", ")}`);

  const definitions = itemContract.listSingularityRaceItemDefinitions();
  const boxes = itemContract.createSingularityRaceItemBoxes();
  assert(definitions.length === 3, "0.1 item set must stay at three items");
  assert(boxes.length === 15, "track should expose three rows of five item boxes");
  assert(definitions.some((item) => item.itemId === itemContract.SINGULARITY_RACE_ITEM_IDS.BOOSTER), "booster item missing");
  assert(definitions.some((item) => item.itemId === itemContract.SINGULARITY_RACE_ITEM_IDS.BANANA), "banana item missing");
  assert(definitions.some((item) => item.itemId === itemContract.SINGULARITY_RACE_ITEM_IDS.STUN_SHOT), "stun-shot item missing");
  assert(
    boxes.filter((box) => box.sectionIndex === 3).every((box) => box.progress === 90),
    "final item row should stay on the late straight road"
  );
  assert(itemContract.SINGULARITY_RACE_BOOSTER_SPEED_MULTIPLIER >= 1.25, "booster should be visibly faster");
  assert(itemContract.SINGULARITY_RACE_BOOSTER_SPEED_MULTIPLIER <= 1.35, "booster should stay collision-safe");
  const centerBox = boxes.find((box) => box.progress === 18 && box.laneOffsetPx === 0);
  const crossedBox = itemContract.isSingularityRaceItemBoxInPickupRange(centerBox, { progress: 20, laneOffsetPx: 0 }, {
    progressRadius: 1.45,
    laneRadiusPx: 112,
    traceMaxAgeMs: 650,
    nowMs: 1000,
    trace: itemContract.createSingularityRaceItemPickupTrace({
      fromProgress: 16.4,
      fromLaneOffsetPx: 0,
      toProgress: 20,
      toLaneOffsetPx: 0,
      createdAtMs: 1000
    })
  });
  assert(crossedBox, "fast movement trace should collect a crossed item box");
  assert(readHtmlNumberConstant(html, "ITEM_BOX_PICKUP_PROGRESS_RADIUS") >= 1.2, "item pickup progress radius should prevent box pass-through");
  assert(readHtmlNumberConstant(html, "ITEM_BOX_PICKUP_LANE_RADIUS_PX") >= 100, "item pickup lane radius should prevent lane-edge pass-through");
  assert(readHtmlNumberConstant(html, "ITEM_BOX_PICKUP_TRACE_MAX_AGE_MS") >= 500, "item pickup should keep a short movement trace for frame skips");
  assert(/\.race-item-box\s*\{[\s\S]*width:\s*50px;[\s\S]*height:\s*50px;/.test(html), "item boxes should render large enough to read and collect");

  for (const token of [
    "singularity-race-item-contract.js",
    "currentItemId",
    "itemRoulette",
    "createSingularityRaceItemBoxState",
    "updateRaceItems",
    "useRaceItem",
    "startRaceItemRoulette",
    "finalizeRaceItemRoulette",
    "renderItemRoulette",
    "getRaceItemRouletteDisplayItem",
    "useBoosterItem",
    "useBananaItem",
    "useStunShotItem",
    "createRaceItemEffectNodes",
    "race-item-box",
    "race-item-trap",
    "race-item-projectile",
    "race-item-roulette",
    "SINGULARITY_RACE_BOOSTER_SPEED_MULTIPLIER",
    "SINGULARITY_RACE_ITEM_BOX_RESPAWN_MS",
    "ITEM_ROULETTE_DURATION_MS",
    "ITEM_BOX_PICKUP_PROGRESS_RADIUS",
    "ITEM_BOX_PICKUP_LANE_RADIUS_PX",
    "ITEM_BOX_PICKUP_TRACE_MAX_AGE_MS",
    "itemPickupTrace",
    "isSingularityRaceItemBoxInPickupRange",
    "createSingularityRaceItemPickupTrace",
    "rememberItemPickupTrace",
    "itemMeta",
    "itemReady",
    "raceSkillButton.innerHTML",
    "function useActionSkill",
    "createRestoredMarathonSkillUse"
  ]) {
    assert(html.includes(token), `singularity-race.html missing item token: ${token}`);
  }

  assert(packageJson.scripts.check.includes("smoke-singularity-race-items.cjs"), "npm run check should include the item smoke");
  console.log("singularity race item smoke passed");
}

function readHtmlNumberConstant(html, name) {
  const match = html.match(new RegExp(`const ${name} = ([0-9.]+);`));
  assert(match, `singularity-race.html missing numeric constant: ${name}`);
  return Number(match[1]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
