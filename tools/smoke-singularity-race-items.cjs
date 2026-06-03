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
  assert(definitions.length === 7, "item set should expose booster, banana, stun-shot, ink-cloud, red-pill, turbo-car, sword");
  assert(boxes.length === 15, "track should expose three rows of five item boxes");
  assert(definitions.some((item) => item.itemId === itemContract.SINGULARITY_RACE_ITEM_IDS.BOOSTER), "booster item missing");
  assert(definitions.some((item) => item.itemId === itemContract.SINGULARITY_RACE_ITEM_IDS.BANANA), "banana item missing");
  assert(definitions.some((item) => item.itemId === itemContract.SINGULARITY_RACE_ITEM_IDS.STUN_SHOT), "stun-shot item missing");
  assert(definitions.some((item) => item.itemId === itemContract.SINGULARITY_RACE_ITEM_IDS.INK_CLOUD), "ink-cloud item missing");
  assert(definitions.some((item) => item.itemId === itemContract.SINGULARITY_RACE_ITEM_IDS.RED_PILL), "red-pill item missing");
  assert(definitions.some((item) => item.itemId === itemContract.SINGULARITY_RACE_ITEM_IDS.TURBO_CAR), "turbo-car item missing");
  assert(definitions.some((item) => item.itemId === itemContract.SINGULARITY_RACE_ITEM_IDS.SWORD), "sword item missing");
  assert(
    boxes.filter((box) => box.sectionIndex === 3).every((box) => box.progress === 90),
    "final item row should stay on the late straight road"
  );
  assert(itemContract.SINGULARITY_RACE_BOOSTER_SPEED_MULTIPLIER >= 1.25, "booster should be visibly faster");
  assert(itemContract.SINGULARITY_RACE_BOOSTER_SPEED_MULTIPLIER <= 1.35, "booster should stay collision-safe");
  assert(itemContract.SINGULARITY_RACE_RED_PILL_SIZE_SCALE >= 1.65, "red pill should read as a visible giant-state item");
  assert(itemContract.SINGULARITY_RACE_RED_PILL_SIZE_SCALE <= 1.8, "red pill should stay readable inside the race lane");
  const centerBox = boxes.find((box) => box.progress === 18 && box.laneOffsetPx === 0);
  const crossedBox = itemContract.isSingularityRaceItemBoxInPickupRange(centerBox, { progress: 20, laneOffsetPx: 0 }, {
    progressRadius: itemContract.SINGULARITY_RACE_ITEM_PICKUP_PROGRESS_RADIUS,
    laneRadiusPx: itemContract.SINGULARITY_RACE_ITEM_PICKUP_LANE_RADIUS_PX,
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
  const nearLaneMiss = itemContract.isSingularityRaceItemBoxInPickupRange(centerBox, { progress: 18, laneOffsetPx: 86 }, {
    progressRadius: itemContract.SINGULARITY_RACE_ITEM_PICKUP_PROGRESS_RADIUS,
    laneRadiusPx: itemContract.SINGULARITY_RACE_ITEM_PICKUP_LANE_RADIUS_PX,
    traceMaxAgeMs: 650,
    nowMs: 1000
  });
  const nearProgressMiss = itemContract.isSingularityRaceItemBoxInPickupRange(centerBox, { progress: 19.05, laneOffsetPx: 0 }, {
    progressRadius: itemContract.SINGULARITY_RACE_ITEM_PICKUP_PROGRESS_RADIUS,
    laneRadiusPx: itemContract.SINGULARITY_RACE_ITEM_PICKUP_LANE_RADIUS_PX,
    traceMaxAgeMs: 650,
    nowMs: 1000
  });
  assert(!nearLaneMiss, "near lane misses should not collect item boxes");
  assert(!nearProgressMiss, "near progress misses should not collect item boxes");
  assert(itemContract.SINGULARITY_RACE_ITEM_PICKUP_PROGRESS_RADIUS <= 0.9, "item pickup progress radius should stay near the visible box");
  assert(itemContract.SINGULARITY_RACE_ITEM_PICKUP_PROGRESS_RADIUS >= 0.55, "item pickup progress radius should still catch visible contact");
  assert(itemContract.SINGULARITY_RACE_ITEM_PICKUP_LANE_RADIUS_PX <= 68, "item pickup lane radius should not collect distant near-misses");
  assert(itemContract.SINGULARITY_RACE_ITEM_PICKUP_LANE_RADIUS_PX >= 44, "item pickup lane radius should still catch visible contact");
  assert(readHtmlNumberConstant(html, "ITEM_BOX_PICKUP_TRACE_MAX_AGE_MS") >= 500, "item pickup should keep a short movement trace for frame skips");
  assert(/\.race-item-box\s*\{[\s\S]*width:\s*50px;[\s\S]*height:\s*50px;/.test(html), "item boxes should render large enough to read and collect");

  for (const token of [
    "singularity-race-item-contract.js",
    "currentItemId",
    "currentItemIds",
    "RACE_ITEM_SLOT_LIMIT",
    "raceItemSlots",
    "addRaceItemSlot",
    "consumeRaceItemId",
    "currentItemCount",
    "itemSlotLimit",
    "itemRoulette",
    "createSingularityRaceItemBoxState",
    "updateRaceItems",
    "useRaceItem",
    "useRaceItemOrRewardSkill",
    "hasHeldRaceItem",
    "itemAim",
    "ITEM_AIM_LOCK_MS",
    "isProjectileRaceItem",
    "startRaceItemAim",
    "fireAimedRaceItem",
    "retargetRaceItemAimFromPointer",
    "findManualRaceItemTarget",
    "estimateLaneOffsetFromTrackPoint",
    "startRaceItemRoulette",
    "finalizeRaceItemRoulette",
    "renderItemRoulette",
    "getRaceItemRouletteDisplayItem",
    "useBoosterItem",
    "useBananaItem",
    "useStunShotItem",
    "useInkCloudItem",
    "useSwordItem",
    "SWORD_PICKUP_POINTS",
    "SWORD_PICKUP_RESPAWN_MS",
    "SWORD_ATTACK_RANGE_PROGRESS",
    "SWORD_ATTACK_LANE_RANGE_PX",
    "createRaceSwordPickupState",
    "collectRaceSwordPickup",
    "createRaceSwordPickupEntry",
    "swordPickups",
    "race-sword-pickup",
    "is-sword",
    "is-sword-attacking",
    "runner-sword-slash",
    "runner-sword-lunge",
    "findInkCloudTarget",
    "applyRaceItemBlind",
    "createRaceItemIconNode",
    "getRaceItemIconKind",
    "getRaceItemIconParts",
    "renderRaceSkillItemButton",
    "createRaceItemSlotStripNode",
    "race-item-slot-strip",
    "race-vision-mask",
    "renderRaceVisionMask",
    "visionBlockedUntilMs",
    "race-item-icon",
    "is-box",
    "is-booster",
    "is-banana",
    "is-stun-shot",
    "race-item-ink",
    "race-item-aim",
    "race-item-aim-lock",
    "is-ink",
    "is-boosted",
    "is-blinded",
    "createRaceItemEffectEntries",
    "race-item-box",
    "race-item-trap",
    "race-item-projectile",
    "race-item-roulette",
    "SINGULARITY_RACE_BOOSTER_SPEED_MULTIPLIER",
    "SINGULARITY_RACE_INK_CLOUD_DURATION_MS",
    "SINGULARITY_RACE_INK_BLIND_MS",
    "SINGULARITY_RACE_INK_SLOW_MS",
    "SINGULARITY_RACE_ITEM_BOX_RESPAWN_MS",
    "SINGULARITY_RACE_ITEM_PICKUP_PROGRESS_RADIUS",
    "SINGULARITY_RACE_ITEM_PICKUP_LANE_RADIUS_PX",
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
