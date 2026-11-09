// Recompute the beach score from Alan's hand-placed beach access pins and
// painted pedestrian crossings (src/data/beach-access.json, pedxings.json).
//
// Walk = building → nearest painted crossing → beach access, when the building
// is on the land side of the road between the first and last crossing. South
// of the last crossing the road is under construction and people cross
// anywhere, so the walk is direct and flagged. Bay pins 4–5 are excluded; the
// metric is the ocean. Praia da Avenida (pins 78–88) is across the bay and the
// bridge from Pontal, so its three downtown buildings are left as they are.
//
// Run: node scripts/update-beach-access.js [--dry-run]

import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { beachScore } from '../src/lib/geo.js'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data')
const read = f => JSON.parse(readFileSync(path.join(dir, f), 'utf8'))
const DRY_RUN = process.argv.includes('--dry-run')
const SKIP = new Set(['Residencial Victoria', 'Central Park', 'Farani 221'])

const condos = read('condos.json')
const pins = read('beach-access.json').filter(p => p.n < 78 && p.n !== 4 && p.n !== 5)
const xings = read('pedxings.json').slice().sort((a, b) => b.lat - a.lat)

const RAD = Math.PI / 180, R = 6371000
const dist = (a, b) => {
  const x = (a.lng - b.lng) * Math.cos(a.lat * RAD) * RAD * R
  const y = (a.lat - b.lat) * RAD * R
  return Math.hypot(x, y)
}
const minBy = (arr, f) => arr.reduce((best, v) => (f(v) < f(best) ? v : best))
const sumScore = b => Math.round(Object.values(b).reduce((t, c) => t + (c.score || 0), 0))

function roadLng(lat) {
  for (let i = 0; i < xings.length - 1; i++) {
    const a = xings[i], b = xings[i + 1]
    if (lat <= a.lat && lat >= b.lat) return a.lng + ((lat - a.lat) / (b.lat - a.lat)) * (b.lng - a.lng)
  }
  return null
}

let changed = 0
for (const c of condos) {
  if (SKIP.has(c.name)) continue
  const cat = c.breakdown.beach
  const direct = dist(c, minBy(pins, p => dist(c, p)))
  const road = roadLng(c.lat)
  let distM = direct, note
  if (c.lat < xings[xings.length - 1].lat) {
    note = `Beach access ~${Math.round(direct)}m. No painted crossing: the road here is under construction.`
  } else if (road === null) {
    note = `Ocean beach access ~${Math.round(direct)}m, straight line.`
  } else if (c.lng > road) {
    note = `Beach access ~${Math.round(direct)}m, on the ocean side of the road.`
  } else {
    const legs = xings.map(x => ({ x, m: dist(c, x) + dist(x, minBy(pins, p => dist(x, p))) }))
    const best = minBy(legs, l => l.m)
    distM = best.m
    note = `Beach access ~${Math.round(distM)}m, using the painted crossing.`
  }
  const before = { score: cat.score, total: c.score }
  cat.score = beachScore(distM, cat.maxScore, 1)
  cat.distM = Math.round(distM)
  cat.note = note
  cat.source = 'access-pins'
  if (c.lat < xings[xings.length - 1].lat) cat.noCrossing = true
  else delete cat.noCrossing
  c.score = sumScore(c.breakdown)
  console.log(`${c.name.padEnd(30)} beach ${String(before.score).padStart(5)} → ${String(cat.score).padStart(5)}  ${String(cat.distM).padStart(5)}m  total ${before.total} → ${c.score}`)
  changed++
}

if (DRY_RUN) { console.log(`\nDry run: ${changed} buildings. Nothing written.`); process.exit(0) }
const target = path.join(dir, 'condos.json')
copyFileSync(target, target.replace(/\.json$/, `.backup-access-${new Date().toISOString().slice(0, 10)}.json`))
writeFileSync(target, JSON.stringify(condos, null, 2) + '\n')
console.log(`\nUpdated ${changed} buildings.`)
