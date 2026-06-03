export const SINGULARITY_RACE_FINISH_WINDOW_RATIO = 0.45;
export const SINGULARITY_RACE_FINISH_WINDOW_MIN_MS = 45000;
export const SINGULARITY_RACE_FINISH_WINDOW_MAX_MS = 90000;

export function resolveSingularityRaceFinishWindowMs(firstFinisherElapsedMs, options = {}) {
  const ratio = positiveNumber(options.ratio, SINGULARITY_RACE_FINISH_WINDOW_RATIO);
  const minMs = positiveNumber(options.minMs, SINGULARITY_RACE_FINISH_WINDOW_MIN_MS);
  const maxMs = Math.max(minMs, positiveNumber(options.maxMs, SINGULARITY_RACE_FINISH_WINDOW_MAX_MS));
  const elapsedMs = Math.max(0, Number(firstFinisherElapsedMs) || 0);
  return Math.round(clamp(elapsedMs * ratio, minMs, maxMs));
}

export function createSingularityRaceFinishWindowState(options = {}) {
  const firstFinishAtMs = Math.max(0, Number(options.firstFinishAtMs) || 0);
  const raceStartedAtMs = Math.max(0, Number(options.raceStartedAtMs) || 0);
  if (!firstFinishAtMs) {
    return Object.freeze({
      active: false,
      started: false,
      ended: false,
      startedAtMs: 0,
      endsAtMs: 0,
      durationMs: 0,
      remainingMs: 0
    });
  }
  const durationMs = resolveSingularityRaceFinishWindowMs(Math.max(0, firstFinishAtMs - raceStartedAtMs), options);
  const endsAtMs = Math.max(firstFinishAtMs, Number(options.endsAtMs) || (firstFinishAtMs + durationMs));
  const nowMs = Math.max(0, Number(options.nowMs) || firstFinishAtMs);
  const remainingMs = Math.max(0, endsAtMs - nowMs);
  return Object.freeze({
    active: remainingMs > 0,
    started: true,
    ended: remainingMs <= 0,
    startedAtMs: firstFinishAtMs,
    endsAtMs,
    durationMs: Math.max(0, endsAtMs - firstFinishAtMs),
    remainingMs
  });
}

export function formatSingularityRaceFinishWindowClock(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil((Number(remainingMs) || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function validateSingularityRaceFinishWindowContract() {
  const errors = [];
  if (resolveSingularityRaceFinishWindowMs(25000) !== 45000) errors.push("short races should still give at least 45 seconds");
  if (resolveSingularityRaceFinishWindowMs(120000) !== 54000) errors.push("medium races should scale by first finisher elapsed time");
  if (resolveSingularityRaceFinishWindowMs(300000) !== 90000) errors.push("long races should cap at 90 seconds");
  const active = createSingularityRaceFinishWindowState({ raceStartedAtMs: 1000, firstFinishAtMs: 61000, nowMs: 62000 });
  if (!active.active || active.remainingMs <= 0 || active.durationMs !== 45000) errors.push("active finish window should expose remaining time");
  const ended = createSingularityRaceFinishWindowState({ raceStartedAtMs: 1000, firstFinishAtMs: 61000, nowMs: 106000 });
  if (!ended.ended || ended.remainingMs !== 0) errors.push("expired finish window should end cleanly");
  if (formatSingularityRaceFinishWindowClock(90500) !== "01:31") errors.push("finish window clock should format mm:ss");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
