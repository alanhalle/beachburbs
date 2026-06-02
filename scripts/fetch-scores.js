import { readFileSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
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
  { name: 'Atlantis Residence', address: 'Atlantis Residence, Pontal, Ilhéus, BA, Brasil' },
  { name: 'Edifício Baia Marina Residence', address: 'Edifício Baia Marina Residence, Pontal, Ilhéus, BA, Brasil' },
  { name: 'Palazzo di Monaco', address: 'Palazzo di Monaco, Pontal, Ilhéus, BA, Brasil' },
  { name: 'Vila do Aeroporto', address: 'Vila do Aeroporto, Pontal, Ilhéus, BA, Brasil' },
  { name: 'Apartamento Pé Na Areia', address: 'Apartamento Pé Na Areia, Pontal, Ilhéus, BA, Brasil' },
]

// Scoring categories: weight, max results that = full score
const CATEGORIES = [
  { key: 'beach',      label: 'Beach Access',   icon: '🏖',  type: 'natural_feature', keyword: 'praia', weight: 40, max: 2 },
  { key: 'restaurant', label: 'Restaurants',    icon: '🍽',  type: 'restaurant',       keyword: '',      weight: 25, max: 10 },
  { key: 'bar',        label: 'Bars & Nightlife', icon: '🍻', type: 'bar',             keyword: '',      weight: 15, max: 5 },
  { key: 'pharmacy',   label: 'Pharmacy',        icon: '💊', type: 'pharmacy',         keyword: '',      weight: 8,  max: 2 },
  { key: 'grocery',    label: 'Grocery',         icon: '🛒', type: 'supermarket',      keyword: '',      weight: 8,  max: 2 },
  { key: 'atm',        label: 'ATM',             icon: '🏧', type: 'atm',              keyword: '',      weight: 2,  max: 3 },
  { key: 'transit',    label: 'Bus Stop',        icon: '🚌', type: 'bus_station',      keyword: '',      weight: 2,  max: 2 },
]

const RADIUS = 800

async function geocode(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`
  const res = await fetch(url)
  const data = await res.json()
  if (data.status !== 'OK' || !data.results[0]) {
    console.warn(`  Geocode failed for: ${address} — status: ${data.status}`)
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
    console.warn(`  Places failed: type=${type} status=${data.status}`)
    return []
  }
  return data.results || []
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function scoreLocation(lat, lng) {
  const breakdown = {}
  let total = 0

  for (const cat of CATEGORIES) {
    await sleep(200) // stay under rate limit
    const results = await nearbySearch(lat, lng, cat.type, cat.keyword)
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

  return { total: Math.round(total), breakdown }
}

async function main() {
  const output = []

  for (const condo of CONDOS) {
    console.log(`\nProcessing: ${condo.name}`)
    await sleep(300)

    let location = await geocode(condo.address)
    if (!location) {
      // Fallback: use Pontal center with jitter so pins don't overlap
      const idx = CONDOS.indexOf(condo)
      location = {
        lat: -14.8089938 + (idx - 2) * 0.003,
        lng: -39.0361599 + (idx % 2 === 0 ? 0.002 : -0.002)
      }
      console.log(`  Using fallback coordinates for ${condo.name}`)
    } else {
      console.log(`  Geocoded: ${location.lat}, ${location.lng}`)
    }

    const { total, breakdown } = await scoreLocation(location.lat, location.lng)
    console.log(`  Total score: ${total}`)

    output.push({
      name: condo.name,
      lat: location.lat,
      lng: location.lng,
      score: total,
      breakdown,
    })
  }

  // Sort by score descending
  output.sort((a, b) => b.score - a.score)

  const outPath = path.join(__dirname, '..', 'src', 'data', 'condos.json')
  writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`\nWrote ${output.length} condos to src/data/condos.json`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
