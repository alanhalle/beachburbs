// Crow-flies distance from a point to a polyline (a traced beach line).
//
// At Ilhéus's scale (everything within ~10km) a flat-plane equirectangular
// projection centred on the query point is accurate to a few metres — no need
// for full spherical geometry on each segment. Used by both the map (to draw
// the nearest-point tie line) and the score pipeline.

const R = 6371000 // Earth radius, metres
const RAD = Math.PI / 180

// Project [lat,lng] into local metres with the origin at (lat0,lng0).
function project(lat, lng, lat0, lng0) {
  return {
    x: (lng - lng0) * Math.cos(lat0 * RAD) * RAD * R,
    y: (lat - lat0) * RAD * R,
  }
}

function unproject(x, y, lat0, lng0) {
  return [
    lat0 + y / R / RAD,
    lng0 + x / (R * Math.cos(lat0 * RAD)) / RAD,
  ]
}

// Nearest point on segment A→B to the origin (0,0), clamped to the segment.
function segNearestToOrigin(ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  let t = len2 === 0 ? 0 : -(ax * dx + ay * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return { x: ax + t * dx, y: ay + t * dy }
}

// Distance in metres from (lat,lng) to the nearest point on `line`
// (an array of [lat,lng] vertices). Returns the distance and that point.
export function distanceToLineM(lat, lng, line) {
  let best = { distM: Infinity, point: null }
  for (let i = 0; i < line.length - 1; i++) {
    const a = project(line[i][0], line[i][1], lat, lng)
    const b = project(line[i + 1][0], line[i + 1][1], lat, lng)
    const n = segNearestToOrigin(a.x, a.y, b.x, b.y)
    const d = Math.hypot(n.x, n.y)
    if (d < best.distM) {
      best = { distM: d, point: unproject(n.x, n.y, lat, lng) }
    }
  }
  return best
}

// Distance → beach score. Full score at/under FULL_M, sliding linearly to
// zero at ZERO_M, then scaled by the beach's quality factor (a degraded urban
// beach earns less than a destination beach at the same distance).
const FULL_M = 50
const ZERO_M = 1500
export function beachScore(distM, maxScore, qualityFactor = 1) {
  let frac
  if (distM <= FULL_M) frac = 1
  else if (distM >= ZERO_M) frac = 0
  else frac = (ZERO_M - distM) / (ZERO_M - FULL_M)
  return Math.round(frac * maxScore * qualityFactor * 10) / 10
}

// Nearest traced beach to a point, across all beaches.
// `beaches` is the beaches.json array. Returns the winning beach + distance.
export function nearestBeach(lat, lng, beaches) {
  let best = { distM: Infinity, beach: null, point: null }
  for (const beach of beaches) {
    const { distM, point } = distanceToLineM(lat, lng, beach.line)
    if (distM < best.distM) best = { distM, beach, point }
  }
  return best
}
