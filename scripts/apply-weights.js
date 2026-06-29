// ---------------------------------------------------------------------------
// Deterministic reweight — recomputes every building's score from values
// ALREADY in condos.json, using the weights in scoring-weights.js. No network,
// no API key, fully reproducible. Run this after changing a weight or curve.
//
//   • airport : recomputed from the stored distKm with the current curve/weight
//   • beach   : rescaled from the stored fraction (score / maxScore) to the new
//               BEACH_WEIGHT — geometry is preserved, only the slot size changes
//   • places  : recomputed from the stored count with the current weight/max
//
// Idempotent: running twice produces the same numbers. Writes a dated backup.
// Use --dry-run to preview the before/after table without writing.
//
//   node scripts/apply-weights.js [--dry-run]
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import {
  AIRPORT_WEIGHT,
  AIRPORT_FULL_SCORE_KM,
  AIRPORT_ZERO_SCORE_KM,
  BEACH_WEIGHT,
  PLACE_CATEGORIES,
} from './scoring-weights.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DRY_RUN = process.argv.includes('--dry-run')
const DATA_PATH = path.join(__dirname, '..', 'src', 'data', 'condos.json')

const round1 = n => Math.round(n * 10) / 10
const sumScore = b => Math.round(Object.values(b).reduce((t, c) => t + (c.score || 0), 0))

function airportScore(distKm) {
  let frac
  if (distKm <= AIRPORT_FULL_SCORE_KM) frac = 1
  else if (distKm >= AIRPORT_ZERO_SCORE_KM) frac = 0
  else frac = (AIRPORT_ZERO_SCORE_KM - distKm) / (AIRPORT_ZERO_SCORE_KM - AIRPORT_FULL_SCORE_KM)
  return round1(frac * AIRPORT_WEIGHT)
}

const condos = JSON.parse(readFileSync(DATA_PATH, 'utf8'))
const rows = []

for (const condo of condos) {
  const b = condo.breakdown
  if (!b) continue
  const before = condo.score

  // Airport — recompute from stored distance.
  if (b.airport && typeof b.airport.distKm === 'number') {
    b.airport.score = airportScore(b.airport.distKm)
    b.airport.maxScore = AIRPORT_WEIGHT
  }

  // Beach — preserve the geometric fraction, rescale to the new slot size.
  if (b.beach && b.beach.maxScore) {
    const frac = b.beach.score / b.beach.maxScore
    b.beach.score = round1(frac * BEACH_WEIGHT)
    b.beach.maxScore = BEACH_WEIGHT
  }

  // Walkable services — recompute from stored count.
  for (const [key, meta] of Object.entries(PLACE_CATEGORIES)) {
    const cat = b[key]
    if (!cat || typeof cat.count !== 'number') continue
    cat.score = round1(Math.min(cat.count / meta.max, 1) * meta.weight)
    cat.maxScore = meta.weight
  }

  condo.score = sumScore(b)
  rows.push({ name: condo.name, before, after: condo.score, d: condo.score - before })
}

// Report — sorted by new score, with the delta.
rows.sort((a, b) => b.after - a.after)
const f = (v, w) => String(v).padStart(w)
console.log('building'.padEnd(30), 'old'.padStart(4), 'new'.padStart(4), 'Δ'.padStart(5))
for (const r of rows) {
  const d = r.d > 0 ? `+${r.d}` : `${r.d}`
  console.log(r.name.padEnd(30), f(r.before, 4), f(r.after, 4), f(d, 5))
}

if (DRY_RUN) {
  console.log(`\nDry run — ${rows.length} buildings recomputed. Nothing written.`)
  process.exit(0)
}

const backup = DATA_PATH.replace(/\.json$/, `.backup-reweight-${new Date().toISOString().slice(0, 10)}.json`)
copyFileSync(DATA_PATH, backup)
writeFileSync(DATA_PATH, JSON.stringify(condos, null, 2) + '\n')
console.log(`\nBackup: ${path.basename(backup)}`)
console.log(`Updated ${rows.length} buildings in src/data/condos.json`)
