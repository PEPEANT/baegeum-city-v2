"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const checks = Object.freeze([
  "tools/check-restored-marathon-contract.cjs",
  "tools/smoke-singularity-race-v01-lock.cjs",
  "tools/smoke-singularity-race-progression.cjs",
  "tools/smoke-singularity-race-camera.cjs",
  "tools/smoke-singularity-race-render-budget.cjs",
  "tools/smoke-singularity-race-mobile-race-ui.cjs",
  "tools/smoke-singularity-race-items.cjs",
  "tools/smoke-singularity-race-room-close.cjs",
  "tools/smoke-singularity-race-admin-observer.cjs",
  "tools/smoke-singularity-race-narration.cjs",
  "tools/smoke-singularity-race-audio.cjs",
  "tools/smoke-singularity-race-server-load.cjs"
]);

for (const check of checks) {
  const result = spawnSync(process.execPath, [check], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe"
  });
  if (result.status !== 0) {
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    console.error(`Singularity Race 0.1 readiness failed: ${check}`);
    process.exit(result.status || 1);
  }
}

console.log(`Singularity Race 0.1 readiness smoke passed (${checks.length} checks).`);
