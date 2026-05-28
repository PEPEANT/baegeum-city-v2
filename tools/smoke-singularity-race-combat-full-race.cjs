"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const checkpoints = Object.freeze([28, 58, 88]);
const finishProgress = 100;

async function main() {
  const skills = await import(pathToFileURL(path.join(root, "src/restored/games/marathon-character-skill-contract.js")));
  const combat = await import(pathToFileURL(path.join(root, "src/restored/games/marathon-combat-contract.js")));

  assertCharacterGradePlan(skills);
  assertBasicAttackStaging(combat);

  const runners = Array.from({ length: 30 }, (_, index) => ({
    id: `runner:${index + 1}`,
    progress: 4 + index * 0.015,
    laneOffsetPx: ((index % 6) - 2.5) * 18,
    hp: 100,
    maxHp: 100,
    lastSafeCheckpointIndex: 0,
    nextCheckpointIndex: 0,
    finished: false,
    skillChargesRemaining: 0
  }));

  const seenGrades = new Set();
  const seenPlaceholderSkinGrades = new Set();
  let attackHits = 0;
  let downs = 0;
  let respawns = 0;
  let skillUses = 0;

  for (let tick = 0; tick < 420 && runners.some((runner) => !runner.finished); tick += 1) {
    for (const runner of runners) {
      if (runner.finished) continue;
      runner.progress = Math.min(finishProgress, runner.progress + 0.34 + (runner.id === "runner:1" ? 0.04 : 0));
      claimCheckpoints(runner, skills, seenGrades, seenPlaceholderSkinGrades);
      if (runner.skillId && runner.skillChargesRemaining > 0 && runner.nextCheckpointIndex % 2 === 0) {
        const use = skills.createRestoredMarathonSkillUse({
          participantId: runner.id,
          characterId: runner.characterId,
          skillId: runner.skillId,
          grade: runner.rewardGrade,
          chargesRemaining: runner.skillChargesRemaining
        });
        if (use.allowed) {
          skillUses += 1;
          if (use.consumesCharge) runner.skillChargesRemaining -= 1;
          if (use.skillId === "skill:checkpoint-hop") runner.progress = Math.min(finishProgress, runner.progress + 2.4);
        }
      }
      if (runner.progress >= finishProgress) runner.finished = true;
    }

    if ([26, 36, 46].includes(tick)) {
      const attacker = runners[0];
      const target = runners[1];
      target.progress = Math.max(target.progress, attacker.progress + 1.1);
      const action = combat.createRestoredMarathonAttackAction({
        attackerId: attacker.id,
        origin: { x: attacker.progress, y: 0 },
        aim: { x: 1, y: 0 }
      });
      const hit = combat.resolveRestoredMarathonAttackHit(action, {
        runnerId: target.id,
        position: { x: target.progress, y: 0 },
        hp: target.hp,
        maxHp: target.maxHp
      });
      if (hit.hit) {
        attackHits += 1;
        const damaged = combat.applyRestoredMarathonRunnerDamage({
          runnerId: target.id,
          hp: target.hp,
          maxHp: target.maxHp,
          lastSafeCheckpointIndex: target.lastSafeCheckpointIndex
        }, hit);
        target.hp = damaged.hp;
        if (damaged.down) {
          downs += 1;
          const respawn = combat.createRestoredMarathonCheckpointRespawn(damaged, { checkpointMeters: [0, ...checkpoints] });
          target.progress = respawn.progressMeters;
          target.hp = respawn.hp;
          target.lastSafeCheckpointIndex = respawn.checkpointIndex;
          target.nextCheckpointIndex = Math.max(target.nextCheckpointIndex, respawn.checkpointIndex);
          respawns += 1;
        }
      }
    }
  }

  assert.equal(runners.length, 30, "full-race smoke should keep 30 runners");
  assert(runners.every((runner) => runner.finished), "all 30 runners should finish after attacks and respawns");
  assert(attackHits >= 3, "mouse attack flow should hit during the full race");
  assert(downs >= 1 && respawns >= 1, "combat should down and checkpoint-respawn a runner");
  assert(skillUses > 0, "checkpoint character skills should be usable during the race");
  assert(seenGrades.has("D") && seenGrades.size >= 2, "race should observe checkpoint character grade changes");
  assert(seenPlaceholderSkinGrades.size >= 2, "race should show placeholder skin grade changes before final assets exist");

  console.log("Singularity Race combat full-race smoke passed.");
  console.log(JSON.stringify({ finished: runners.length, attackHits, downs, respawns, skillUses, grades: [...seenGrades].sort(), placeholderSkinGrades: [...seenPlaceholderSkinGrades].sort() }, null, 2));
}

function assertCharacterGradePlan(skills) {
  const rewardPlan = skills.createRestoredMarathonCheckpointRewardPlan(3);
  assert.equal(rewardPlan.length, 3, "three-stage reward loop should support the current race");
  assert.deepEqual([...skills.RESTORED_MARATHON_CHARACTER_GRADES], ["D", "C", "B", "A", "S"]);
  for (const grade of skills.RESTORED_MARATHON_CHARACTER_GRADES) {
    assert(skills.RESTORED_MARATHON_MEME_CHARACTER_CATALOG.some((item) => item.grade === grade), `${grade} grade must exist`);
  }
  assert(skills.listRestoredMarathonCharacterGradePool(1, { stageCount: 3 }).every((item) => ["D", "C"].includes(item.grade)), "stage 1 should start low grade");
  assert(skills.listRestoredMarathonCharacterGradePool(2, { stageCount: 3 }).some((item) => item.grade === "A"), "middle stage should unlock A grade");
  assert(skills.listRestoredMarathonCharacterGradePool(3, { stageCount: 3 }).some((item) => item.grade === "S"), "final stage should unlock S grade");
  assert.deepEqual([...skills.RESTORED_MARATHON_PLACEHOLDER_SKIN_GRADES], ["D", "C", "B", "A", "S"]);
  const baseSkillUse = skills.createRestoredMarathonSkillUse({ participantId: "runner:base" });
  assert.equal(baseSkillUse.reason, "no_reward", "base skin should not unlock E skill before a checkpoint reward");
  const rolled = Array.from({ length: 512 }, (_, index) => skills.createRestoredMarathonPlaceholderSkinReward({
    participantId: "runner:placeholder",
    checkpointIndex: (index % checkpoints.length) + 1,
    seed: `placeholder-smoke:${index}`
  }).grade);
  for (const grade of skills.RESTORED_MARATHON_PLACEHOLDER_SKIN_GRADES) {
    assert(rolled.includes(grade), `${grade} placeholder skin grade should be rollable`);
  }
}

function assertBasicAttackStaging(combat) {
  const stagedAttack = combat.createRestoredMarathonAttackAction({ attackerId: "runner:1", damage: 0 });
  const stagedHit = combat.resolveRestoredMarathonAttackHit(stagedAttack, { runnerId: "runner:2", position: { x: 1, y: 0 }, hp: 100 });
  const stagedDamage = combat.applyRestoredMarathonRunnerDamage({ runnerId: "runner:2", hp: 100 }, { ...stagedHit, nowMs: 1000 });
  assert(stagedAttack.cooldownMs > 0 && stagedHit.stunMs > 0, "basic attack should carry cooldown and stun");
  assert.equal(stagedDamage.hp, 100, "pre-start attack rehearsal should stun without damage");
  assert(stagedDamage.stunnedUntilMs > 1000, "pre-start attack rehearsal should pause the target");
}

function claimCheckpoints(runner, skills, seenGrades, seenPlaceholderSkinGrades) {
  while (runner.nextCheckpointIndex < checkpoints.length && runner.progress >= checkpoints[runner.nextCheckpointIndex]) {
    runner.lastSafeCheckpointIndex = runner.nextCheckpointIndex + 1;
    const reward = skills.assignRestoredMarathonCheckpointCharacter({
      participantId: runner.id,
      checkpointIndex: runner.nextCheckpointIndex + 1,
      stageCount: checkpoints.length,
      seed: `${runner.id}:${runner.nextCheckpointIndex}`
    });
    runner.characterId = reward.character.characterId;
    runner.skillId = reward.skill.skillId;
    runner.rewardGrade = reward.placeholderSkin.grade;
    runner.skillChargesRemaining = reward.skill.maxCharges;
    assert.equal(reward.skill.grade, reward.placeholderSkin.grade, "reward skill grade should follow the placeholder skin grade");
    seenGrades.add(reward.character.grade);
    seenPlaceholderSkinGrades.add(reward.placeholderSkin.grade);
    runner.nextCheckpointIndex += 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
