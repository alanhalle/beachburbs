// Recompute the beach score for buildings served by a traced beach line.
// No API key needed — pure geometry from beaches.json + condos.json.
//
// Scope is explicit: only buildings named in a beach's `buildings[]` are
// touched. Everything else (bay-side, untraced beaches) is left exactly as
// curated. Writes a dated backup before saving. Use --dry-run to preview.
//
// Run: node scripts/update-beach-scores.js [--dry-run]

import { readFileSync, writeFileSync, copyFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { distanceToLineM, beachScore } from '../src/lib/geo.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DRY_RUN = process.argv.includes('--dry-run')
const CONDOS = path.join(__dirname, '..', 'src', 'data', 'condos.json')
const BEACHES = path.join(__dirname, '..', 'src', 'data', 'beaches.json')

const condos = JSON.parse(readFileSync(CONDOS, 'utf8'))
const beaches = JSON.parse(readFileSync(BEACHES, 'utf8'))
const byName = new Map(condos.map(c => [c.name, c]))

const sumScore = b => Math.round(Object.values(b).reduce((t, c) => t + (c.score || 0), 0))

let changed = 0
for (const beach of beaches) {
  const factor = beach.qualityFactor ?? 1
  for (const name of beach.buildings ?? []) {
    const condo = byName.get(name)
    if (!condo) { console.warn(`SKIP — no building named "${name}"`); continue }
    const cat = condo.breakdown?.beach
    if (!cat) { console.warn(`SKIP ${name} — no beach category`); continue }

    const { distM } = distanceToLineM(condo.lat, condo.lng, beach.line)
    const score = beachScore(distM, cat.maxScore, factor)
    const before = { score: cat.score, total: condo.score }

    cat.score = score
    cat.distM = Math.round(distM)
    cat.note = `${beach.name} ~${Math.round(distM)}m (crow-flies).` +
      (beach.scoreNote ? ` ${beach.scoreNote}` : '')
    condo.score = sumScore(condo.breakdown)

    console.log(`${name.padEnd(22)} beach ${before.score} → ${score}` +
      ` (${Math.round(distM)}m × ${factor})   total ${before.total} → ${condo.score}`)
    changed++
  }
}

if (DRY_RUN) { console.log(`\nDry run — ${changed} building(s) would change. Nothing written.`); process.exit(0) }
if (changed === 0) { console.log('No buildings matched any traced beach. Nothing written.'); process.exit(0) }

const backup = CONDOS.replace(/\.json$/, `.backup-beach-${new Date().toISOString().slice(0, 10)}.json`)
copyFileSync(CONDOS, backup)
writeFileSync(CONDOS, JSON.stringify(condos, null, 2) + '\n')
console.log(`\nBackup: ${path.basename(backup)}`)
console.log(`Updated ${changed} building(s) in src/data/condos.json`)
