export const RESTORED_MARATHON_TRAIL_SMOOTHING_VERSION = "restored-marathon-trail-smoothing-002";

export function sampleSmoothTrailPoints(points = [], stepsPerSegment = 12) {
  if (points.length <= 2) return points.map((value) => Object.freeze({ x: round4(value.x), y: round4(value.y) }));
  const sampled = [points[0]];
  for (let index = 0; index < points.length - 1; index += 1) {
    if (index > 0) pushRoundedCorner(sampled, points[index - 1], points[index], points[index + 1], stepsPerSegment);
  }
  sampled.push(points.at(-1));
  return sampled.map((value) => Object.freeze({ x: round4(value.x), y: round4(value.y) }));
}

export function validateRestoredMarathonTrailSmoothingContract() {
  const route = sampleSmoothTrailPoints([{ x: 0, y: 0 }, { x: 50, y: 20 }, { x: 100, y: 0 }], 8);
  const errors = [];
  if (route.length <= 3) errors.push("smooth trail should add in-between route points");
  if (route[0].x !== 0 || route.at(-1).x !== 100) errors.push("smooth trail should preserve endpoints");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

function pushRoundedCorner(output, previous, corner, next, steps) {
  const incoming = { x: corner.x - previous.x, y: corner.y - previous.y };
  const outgoing = { x: next.x - corner.x, y: next.y - corner.y };
  const incomingLength = Math.hypot(incoming.x, incoming.y) || 1;
  const outgoingLength = Math.hypot(outgoing.x, outgoing.y) || 1;
  const trim = Math.min(4.5, incomingLength * 0.42, outgoingLength * 0.42);
  const before = { x: corner.x - incoming.x / incomingLength * trim, y: corner.y - incoming.y / incomingLength * trim };
  const after = { x: corner.x + outgoing.x / outgoingLength * trim, y: corner.y + outgoing.y / outgoingLength * trim };
  output.push(before);
  for (let step = 1; step <= steps; step += 1) {
    output.push(roundedCornerPoint(before, corner, after, step / (steps + 1)));
  }
  output.push(after);
}

function roundedCornerPoint(before, corner, after, t) {
  const inverse = 1 - t;
  return Object.freeze({
    x: (inverse * inverse * before.x) + (2 * inverse * t * corner.x) + (t * t * after.x),
    y: (inverse * inverse * before.y) + (2 * inverse * t * corner.y) + (t * t * after.y)
  });
}

function round4(value) {
  return Math.round(value * 10000) / 10000;
}
