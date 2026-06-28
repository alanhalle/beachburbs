// Report each building's crow-flies distance to the nearest traced beach line.
// Read-only — prints a table, writes nothing. Run: node scripts/beach-distances.js
//
// Only beaches that have actually been traced live in beaches.json. A building
// whose real beach isn't traced yet will show a large, meaningless distance —
// that's expected until more lines are drawn.

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { nearestBeach } from '../src/lib/geo.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const condos = JSON.parse(readFileSync(path.join(__dirname, '..', 'src', 'data', 'condos.json'), 'utf8'))
const beaches = JSON.parse(readFileSync(path.join(__dirname, '..', 'src', 'data', 'beaches.json'), 'utf8'))

console.log(`Traced beaches: ${beaches.map(b => b.name).join(', ')}\n`)

const rows = condos.map(c => {
  const { distM, beach } = nearestBeach(c.lat, c.lng, beaches)
  const curated = c.breakdown?.beach?.note ?? ''
  return { name: c.name, beach: beach?.name ?? '—', distM: Math.round(distM), curated }
}).sort((a, b) => a.distM - b.distM)

const pad = (s, n) => String(s).padEnd(n)
console.log(pad('building', 26) + pad('nearest traced', 18) + pad('crow-flies', 12) + 'curated note')
console.log('-'.repeat(110))
for (const r of rows) {
  const dist = r.distM < 1000 ? `${r.distM} m` : `${(r.distM / 1000).toFixed(2)} km`
  console.log(pad(r.name, 26) + pad(r.beach, 18) + pad(dist, 12) + r.curated.slice(0, 50))
}
