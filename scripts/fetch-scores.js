import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import {
  AIRPORT,
  AIRPORT_WEIGHT,
  AIRPORT_FULL_SCORE_KM,
  AIRPORT_ZERO_SCORE_KM,
  PLACE_CATEGORIES,
} from './scoring-weights.js'

// ---------------------------------------------------------------------------
// Non-destructive score refresh.
//
// This script does NOT rebuild condos.json from a hardcoded list. It reads the
// existing condos.json — which holds the hand-curated buildings, their
// field-verified coordinates, prices, notes, neighborhoods and beach scores —
// and refreshes ONLY the numbers that depend on location:
//   • airport: distance/score, recomputed from each building's own lat/lng
//   • restaurant/bar/pharmacy/grocery/atm: re-fetched from Google Places
// Everything else is preserved verbatim:
//   • beach (firsthand / "a confirmar" — Places has no beach data south of Pontal)
//   • name, lat, lng, units, priceRange, condoFee, iptu, note, neighborhood, scoreNote
//   • each category's label/icon/maxScore (only count + score are updated)
//
// A timestamped backup is written before the file is overwritten.
// Run `npm run fetch-scores -- --dry-run` to preview without writing.
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DRY_RUN = process.argv.includes('--dry-run')

// Load .env manually (dotenv ESM quirk)
const envPath = path.join(__dirname, '..', '.env')
try {
  const envFile = readFileSync(envPath, 'utf8')
  for (const line of envFile.split('\n')) {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  }
} catch {}

const API_KEY = process.env.GOOGLE_MAPS_API_KEY_PLACES
if (!API_KEY) {
  console.error('Missing GOOGLE_MAPS_API_KEY_PLACES in .env')
  process.exit(1)
}

const DATA_PATH = path.join(__dirname, '..', 'src', 'data', 'condos.json')

// Airport anchor, airport curve constants, and the Places category weights all
// live in scoring-weights.js (the single source of truth, imported above).

const RADIUS = 800

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function calcAirportScore(lat, lng) {
  const distKm = haversineKm(lat, lng, AIRPORT.lat, AIRPORT.lng)
  let frac
  if (distKm <= AIRPORT_FULL_SCORE_KM) frac = 1.0
  else if (distKm >= AIRPORT_ZERO_SCORE_KM) frac = 0
  else frac = (AIRPORT_ZERO_SCORE_KM - distKm) / (AIRPORT_ZERO_SCORE_KM - AIRPORT_FULL_SCORE_KM)
  return {
    distKm: Math.round(distKm * 100) / 100,
    score: Math.round(frac * AIRPORT_WEIGHT * 10) / 10,
  }
}

async function nearbySearch(lat, lng, type, keyword = '') {
  let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${RADIUS}&type=${type}&key=${API_KEY}`
  if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places failed (type=${type}): ${data.status}`)
  }
  return data.results || []
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function sumScore(breakdown) {
  return Math.round(Object.values(breakdown).reduce((t, c) => t + (c.score || 0), 0))
}

async function main() {
  const condos = JSON.parse(readFileSync(DATA_PATH, 'utf8'))
  console.log(`Loaded ${condos.length} buildings from condos.json${DRY_RUN ? '  (DRY RUN — nothing will be written)' : ''}\n`)

  for (const condo of condos) {
    if (typeof condo.lat !== 'number' || typeof condo.lng !== 'number') {
      console.warn(`SKIP ${condo.name}: missing lat/lng`)
      continue
    }
    if (!condo.breakdown) condo.breakdown = {}
    const before = condo.score
    console.log(`${condo.name}`)

    // Airport — recompute from the building's own coordinates (no API call).
    const { distKm, score: airportScore } = calcAirportScore(condo.lat, condo.lng)
    const air = condo.breakdown.airport ?? { maxScore: AIRPORT_WEIGHT, label: 'Aeroporto', icon: '✈️' }
    air.count = null
    air.distKm = distKm
    air.score = airportScore
    air.maxScore = AIRPORT_WEIGHT
    condo.breakdown.airport = air
    console.log(`  airport   ${distKm}km → ${airportScore}/${AIRPORT_WEIGHT}`)

    // Places categories — refresh count + score only; keep label/icon/maxScore.
    for (const [key, meta] of Object.entries(PLACE_CATEGORIES)) {
      const cat = condo.breakdown[key]
      if (!cat) continue // only refresh categories the building already tracks
      await sleep(200)
      const results = await nearbySearch(condo.lat, condo.lng, meta.type, meta.keyword)
      const count = results.length
      const score = Math.round(Math.min(count / meta.max, 1.0) * meta.weight * 10) / 10
      const was = cat.score
      cat.count = count
      cat.score = score
      console.log(`  ${key.padEnd(10)}${count} → ${score}/${meta.weight}${was !== score ? `  (was ${was})` : ''}`)
    }

    // beach is left exactly as curated — Places has no beach data here.
    condo.score = sumScore(condo.breakdown)
    console.log(`  TOTAL ${condo.score}${before !== condo.score ? `  (was ${before})` : ''}\n`)
    await sleep(150)
  }

  if (DRY_RUN) {
    console.log('Dry run complete — condos.json unchanged.')
    return
  }

  const backupPath = DATA_PATH.replace(/\.json$/, `.backup-${new Date().toISOString().slice(0, 10)}.json`)
  copyFileSync(DATA_PATH, backupPath)
  writeFileSync(DATA_PATH, JSON.stringify(condos, null, 2) + '\n')
  console.log(`Backup written: ${path.basename(backupPath)}`)
  console.log(`Updated ${condos.length} buildings in src/data/condos.json`)
}

main().catch(err => { console.error('\nABORTED — condos.json not modified:', err.message); process.exit(1) })
