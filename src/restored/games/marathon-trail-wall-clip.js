const WALL_INTERIOR_CLIP_DISTANCE_PX = 252;
const WALL_INTERIOR_CLIP_PROGRESS_GAP = 2.4;
const WALL_INTERIOR_CLIP_SAMPLE_STEP = 0.25;
const WALL_INTERIOR_CLIP_MIN_RUN = 2;
const WALL_INTERIOR_CLIP_MAX_RUN = 8;
const WALL_INTERIOR_FOLDBACK_BEFORE_POINTS = 2;
const WALL_INTERIOR_FOLDBACK_AFTER_POINTS = 2;
const WALL_INTERIOR_FOLDBACK_WINDOW_BEFORE = 3;
const WALL_INTERIOR_FOLDBACK_WINDOW_AFTER = 4;
const WALL_INTERIOR_FOLDBACK_COSINE = -0.7;
const WALL_INTERIOR_FOLDBACK_SPAN_PX = 520;
const clipSamplesByKey = new Map();

export function createVisibleMarathonTrailWallPath(points, options = {}) {
  const round = typeof options.round === "function" ? options.round : round2;
  const visiblePoints = markInteriorWallArtifactRuns(points, options);
  const commands = [];
  let drawing = false;
  for (const point of visiblePoints) {
    if (point.hidden) {
      drawing = false;
      continue;
    }
    commands.push(`${drawing ? "L" : "M"}${round(point.x)} ${round(point.y)}`);
    drawing = true;
  }
  return commands.join(" ") || `M${round(points[0]?.x || 0)} ${round(points[0]?.y || 0)}`;
}

export function createMarathonTrailWallVisibilityPoints(points, options = {}) {
  return Object.freeze(markInteriorWallArtifactRuns(points, options));
}

function markInteriorWallArtifactRuns(points, options) {
  const result = points.map((point) => ({
    ...point,
    clipCandidate: isWallPointInsideOtherRoadSurface(point, point.progress, options),
    hidden: false
  }));
  let runStart = -1;
  for (let index = 0; index <= result.length; index += 1) {
    if (result[index]?.clipCandidate) {
      if (runStart < 0) runStart = index;
      continue;
    }
    if (runStart >= 0) {
      const runLength = index - runStart;
      const shouldClip = runLength >= WALL_INTERIOR_CLIP_MIN_RUN && runLength <= WALL_INTERIOR_CLIP_MAX_RUN;
      if (shouldClip) {
        for (let clipIndex = runStart; clipIndex < index; clipIndex += 1) result[clipIndex].hidden = true;
      } else if (runLength > WALL_INTERIOR_CLIP_MAX_RUN) {
        markFoldbackInteriorArtifacts(result, runStart, index - 1, options);
      }
    }
    runStart = -1;
  }
  return result.map(({ clipCandidate, ...point }) => Object.freeze(point));
}

function markFoldbackInteriorArtifacts(points, startIndex, endIndex, options) {
  for (
    let index = startIndex + WALL_INTERIOR_FOLDBACK_WINDOW_BEFORE;
    index <= endIndex - WALL_INTERIOR_FOLDBACK_WINDOW_AFTER;
    index += 1
  ) {
    const before = points[index - WALL_INTERIOR_FOLDBACK_WINDOW_BEFORE];
    const pivot = points[index];
    const after = points[index + WALL_INTERIOR_FOLDBACK_WINDOW_AFTER];
    const cosine = cosineBetweenWorldVectors(before, pivot, after, options);
    const span = worldDistancePx(before, after, options);
    if (cosine > WALL_INTERIOR_FOLDBACK_COSINE || span > WALL_INTERIOR_FOLDBACK_SPAN_PX) continue;
    const clipStart = Math.max(startIndex, index - WALL_INTERIOR_FOLDBACK_BEFORE_POINTS);
    const clipEnd = Math.min(endIndex, index + WALL_INTERIOR_FOLDBACK_AFTER_POINTS);
    for (let clipIndex = clipStart; clipIndex <= clipEnd; clipIndex += 1) points[clipIndex].hidden = true;
  }
}

function isWallPointInsideOtherRoadSurface(point, progress, options) {
  const pixelPoint = percentToWorldPixel(point, options);
  return getWallInteriorClipSamples(options).some((sample) => {
    if (Math.abs(sample.progress - progress) < WALL_INTERIOR_CLIP_PROGRESS_GAP) return false;
    return Math.hypot(pixelPoint.x - sample.x, pixelPoint.y - sample.y) < WALL_INTERIOR_CLIP_DISTANCE_PX;
  });
}

function getWallInteriorClipSamples(options) {
  const key = String(options.mapId || "default");
  if (clipSamplesByKey.has(key)) return clipSamplesByKey.get(key);
  const samples = [];
  for (let progress = 0; progress <= 100; progress += WALL_INTERIOR_CLIP_SAMPLE_STEP) {
    samples.push(Object.freeze({
      progress,
      ...percentToWorldPixel(options.progressToPoint(progress), options)
    }));
  }
  const frozen = Object.freeze(samples);
  clipSamplesByKey.set(key, frozen);
  return frozen;
}

function percentToWorldPixel(point, options) {
  const worldWidth = Math.max(1, Number(options.worldWidth) || 100);
  const worldHeight = Math.max(1, Number(options.worldHeight) || 100);
  return Object.freeze({ x: point.x / 100 * worldWidth, y: point.y / 100 * worldHeight });
}

function cosineBetweenWorldVectors(before, pivot, after, options) {
  const beforePx = percentToWorldPixel(before, options);
  const pivotPx = percentToWorldPixel(pivot, options);
  const afterPx = percentToWorldPixel(after, options);
  const into = { x: pivotPx.x - beforePx.x, y: pivotPx.y - beforePx.y };
  const out = { x: afterPx.x - pivotPx.x, y: afterPx.y - pivotPx.y };
  const length = Math.hypot(into.x, into.y) * Math.hypot(out.x, out.y);
  return length > 0 ? ((into.x * out.x) + (into.y * out.y)) / length : 1;
}

function worldDistancePx(a, b, options) {
  const aPx = percentToWorldPixel(a, options);
  const bPx = percentToWorldPixel(b, options);
  return Math.hypot(aPx.x - bPx.x, aPx.y - bPx.y);
}

function round2(value) {
  return Math.round(value * 100) / 100;
}
