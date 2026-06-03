export function validateRestoredMarathonTrailGeometryContractWith(api) {
  const errors = [];
  const maps = api.listRestoredMarathonTrailMaps();
  if (maps.length < 3) errors.push("trail catalog should expose at least three selectable maps");
  if (new Set(maps.map((map) => map.id)).size !== maps.length) errors.push("trail map ids must be unique");
  for (const map of maps) validateTrailMap(api, map, errors);
  validateDistinctMapShapes(api, maps, errors);
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function validateTrailMap(api, map, errors) {
  const savePoints = api.listRestoredMarathonTrailSavePoints(map.id);
  const path = api.createRestoredMarathonTrailSvgPath(92, map.id);
  const wallPaths = api.createRestoredMarathonTrailWallSvgPaths(92, { mapId: map.id });
  if (savePoints.length !== 3) errors.push(`${map.id} must expose exactly three save points`);
  if (!path.startsWith("M") || !path.includes("L")) errors.push(`${map.id} path must be SVG-ready`);
  if (api.trailLength(map.id) < 430) errors.push(`${map.id} should stay long enough for a full run`);
  if (maxTrailTurnDeltaDegrees(api, map.id) > 34) errors.push(`${map.id} should not contain hard direction snaps`);
  for (let index = 1; index < savePoints.length; index += 1) {
    if (savePoints[index].progressPercent <= savePoints[index - 1].progressPercent) errors.push(`${map.id} save points must be ordered`);
  }
  const start = api.progressToRestoredMarathonTrailPoint(0, map.id);
  const finish = api.progressToRestoredMarathonTrailPoint(100, map.id);
  if (finish.x <= start.x || finish.y >= start.y) errors.push(`${map.id} must run from lower-left to upper-right`);
  if (!wallPaths.left.startsWith("M") || !wallPaths.right.startsWith("M")) errors.push(`${map.id} wall paths must be SVG-ready`);
  if (map.id === "baegeum-city" && !api.isRestoredMarathonTrailLaneBoundaryClipped(41, "right", map.id)) {
    errors.push("baegeum-city clipped bend should suppress invisible positive-lane wall feedback");
  }
  const mappedCenter = api.progressToRestoredMarathonMapPoint(58, { mapId: map.id, worldWidth: 7600, worldHeight: 2600, laneOffsetPx: 0, laneHalfWidthPx: 232, minPercent: 2, maxPercent: 98 });
  const mappedLane = api.progressToRestoredMarathonMapPoint(58, { mapId: map.id, worldWidth: 7600, worldHeight: 2600, laneOffsetPx: 232, laneHalfWidthPx: 232, minPercent: 2, maxPercent: 98 });
  if (mappedCenter.x === mappedLane.x && mappedCenter.y === mappedLane.y) errors.push(`${map.id} map point lane offset must affect marker placement`);
}

function validateDistinctMapShapes(api, maps, errors) {
  for (let leftIndex = 0; leftIndex < maps.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < maps.length; rightIndex += 1) {
      const distance = averageSampleDistance(api, maps[leftIndex].id, maps[rightIndex].id);
      if (distance < 16) errors.push(`${maps[leftIndex].id} and ${maps[rightIndex].id} should have visibly distinct route shapes`);
    }
  }
}

function averageSampleDistance(api, leftMapId, rightMapId) {
  let total = 0;
  let samples = 0;
  for (let progress = 5; progress < 100; progress += 5) {
    const left = api.progressToRestoredMarathonTrailPoint(progress, leftMapId);
    const right = api.progressToRestoredMarathonTrailPoint(progress, rightMapId);
    total += Math.hypot(left.x - right.x, left.y - right.y);
    samples += 1;
  }
  return samples ? total / samples : 0;
}

function maxTrailTurnDeltaDegrees(api, mapId) {
  let max = 0;
  let previous = trailAngleAt(api, 0, mapId);
  for (let progress = 0.1; progress <= 100; progress += 0.1) {
    const next = trailAngleAt(api, progress, mapId);
    max = Math.max(max, Math.abs(radiansToDegrees(normalizeAngle(next - previous))));
    previous = next;
  }
  return max;
}

function trailAngleAt(api, progress, mapId) {
  const point = api.progressToRestoredMarathonTrailPoint(progress, mapId);
  return Math.atan2(point.tangent.y * api.worldHeight, point.tangent.x * api.worldWidth);
}

function normalizeAngle(angle) {
  let value = angle;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}

function radiansToDegrees(radians) {
  return radians * 180 / Math.PI;
}
