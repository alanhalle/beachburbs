import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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

const CONDOS = [
  { name: 'Atlantis Residence',            address: 'Atlantis Residence, Pontal, Ilhéus, BA, Brasil' },
  { name: 'Edifício Baia Marina Residence', address: 'Edifício Baia Marina Residence, Pontal, Ilhéus, BA, Brasil' },
  { name: 'Palazzo di Monaco',             address: 'Palazzo di Monaco, Pontal, Ilhéus, BA, Brasil' },
  { name: 'Vila do Aeroporto',             address: 'Vila do Aeroporto, Pontal, Ilhéus, BA, Brasil' },
  { name: 'Apartamento Pé Na Areia',       address: 'Apartamento Pé Na Areia, Pontal, Ilhéus, BA, Brasil' },
  // Beachburbs strip — south of airport
  { name: 'Residencial Vernazza',          address: 'Residencial Vernazza, Ilhéus, BA, Brasil' },
  { name: 'Sette',                         address: 'Sette Residencial, Ilhéus, BA, Brasil' },
  { name: 'Tons de Brisa',                 address: 'Tons de Brisa, Ilhéus, BA, Brasil' },
  { name: 'Petra',                         address: 'Residencial Petra, Ilhéus, BA, Brasil' },
  { name: 'Condomínio Aldeia Atlântida',   address: 'Condomínio Aldeia Atlântida, Ilhéus, BA, Brasil' },
]

// Weights sum to 100. Airport is first — it's the whole argument.
const PLACE_CATEGORIES = [
  { key: 'beach',      label: 'Beach Access',    icon: '🏖', type: 'natural_feature', keyword: 'praia', weight: 30, max: 2 },
  { key: 'restaurant', label: 'Restaurants',     icon: '🍽', type: 'restaurant',      keyword: '',      weight: 20, max: 10 },
  { key: 'bar',        label: 'Bars & Nightlife', icon: '🍻', type: 'bar',            keyword: '',      weight: 12, max: 5 },
  { key: 'pharmacy',   label: 'Pharmacy',         icon: '💊', type: 'pharmacy',       keyword: '',      weight: 6,  max: 2 },
  { key: 'grocery',    label: 'Grocery',          icon: '🛒', type: 'supermarket',    keyword: '',      weight: 5,  max: 2 },
  { key: 'atm',        label: 'ATM',              icon: '🏧', type: 'atm',            keyword: '',      weight: 2,  max: 3 },
]
// Airport proximity: 25 pts — distance-based, not Places API
const AIRPORT_WEIGHT = 25
const AIRPORT_FULL_SCORE_KM = 0.5   // under 500m → full score
const AIRPORT_ZERO_SCORE_KM = 2.5   // over 2.5km → 0

const RADIUS = 800

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function calcAirportScore(condoLat, condoLng, airportLat, airportLng) {
  const distKm = haversineKm(condoLat, condoLng, airportLat, airportLng)
  let frac
  if (distKm <= AIRPORT_FULL_SCORE_KM) {
    frac = 1.0
  } else if (distKm >= AIRPORT_ZERO_SCORE_KM) {
    frac = 0
  } else {
    frac = (AIRPORT_ZERO_SCORE_KM - distKm) / (AIRPORT_ZERO_SCORE_KM - AIRPORT_FULL_SCORE_KM)
  }
  return { distKm: Math.round(distKm * 100) / 100, score: Math.round(frac * AIRPORT_WEIGHT * 10) / 10 }
}

async function geocode(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.status !== 'OK' || !data.results[0]) {
    console.warn(`  Geocode failed: ${address} — ${data.status}`)
    return null
  }
  return data.results[0].geometry.location
}

async function nearbySearch(lat, lng, type, keyword = '') {
  let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${RADIUS}&type=${type}&key=${API_KEY}`
  if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.warn(`  Places failed: type=${type} — ${data.status}`)
    return []
  }
  return data.results || []
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  // Geocode airport once
  console.log('Geocoding IOS airport...')
  const airport = await geocode('Aeroporto de Ilhéus IOS, Pontal, Ilhéus, BA, Brasil')
  if (!airport) {
    console.error('Could not geocode IOS airport — aborting')
    process.exit(1)
  }
  console.log(`  IOS: ${airport.lat}, ${airport.lng}`)

  const output = []

  for (const condo of CONDOS) {
    console.log(`\nProcessing: ${condo.name}`)
    await sleep(300)

    let location = await geocode(condo.address)
    if (!location) {
      const idx = CONDOS.indexOf(condo)
      location = {
        lat: -14.8089938 + (idx - 2) * 0.003,
        lng: -39.0361599 + (idx % 2 === 0 ? 0.002 : -0.002),
      }
      console.log(`  Using fallback coordinates`)
    } else {
      console.log(`  Geocoded: ${location.lat}, ${location.lng}`)
    }

    const breakdown = {}
    let total = 0

    // Airport score (distance-based — first and most prominent)
    const { distKm, score: airportScore } = calcAirportScore(location.lat, location.lng, airport.lat, airport.lng)
    breakdown.airport = {
      count: null,
      distKm,
      score: airportScore,
      maxScore: AIRPORT_WEIGHT,
      label: 'Airport Access',
      icon: '✈️',
    }
    total += airportScore
    console.log(`    Airport Access: ${distKm}km → ${airportScore}/${AIRPORT_WEIGHT}`)

    // Places-based categories
    for (const cat of PLACE_CATEGORIES) {
      await sleep(200)
      const results = await nearbySearch(location.lat, location.lng, cat.type, cat.keyword)
      const count = results.length
      const catScore = Math.min(count / cat.max, 1.0) * cat.weight
      breakdown[cat.key] = {
        count,
        score: Math.round(catScore * 10) / 10,
        maxScore: cat.weight,
        label: cat.label,
        icon: cat.icon,
      }
      total += catScore
      console.log(`    ${cat.label}: ${count} results → ${catScore.toFixed(1)}/${cat.weight}`)
    }

    const finalScore = Math.round(total)
    console.log(`  Total score: ${finalScore}`)

    output.push({
      name: condo.name,
      lat: location.lat,
      lng: location.lng,
      score: finalScore,
      breakdown,
    })
  }

  output.sort((a, b) => b.score - a.score)

  const outPath = path.join(__dirname, '..', 'src', 'data', 'condos.json')
  writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`\nWrote ${output.length} condos to src/data/condos.json`)
}

main().catch(err => { console.error(err); process.exit(1) })
