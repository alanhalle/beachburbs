# Ilhéus building survey — field sheet

Purpose: turn "two or three dozen buildings under construction" into an enumerated list.
Nobody else has this. Apto shows **1** development in Ilhéus (VOG Amado, Pontal). The real
number is ~24–36. That gap is the whole asset.

---

## The four new fields in `condos.json`

They sit right after `name`. All 30 existing buildings default to `unknown` — nothing was
guessed. Both `fetch-scores.js` and `update-beach-scores.js` mutate records in place, so
these survive a score re-run untouched.

### `status` — physical construction state
Observable from the road. This is the trike-ride field.

| value | meaning |
|---|---|
| `under-construction` | cranes, scaffolding, unfinished floors |
| `completed-recent` | finished, looks new — roughly last 3 years |
| `established` | older stock, clearly not new |
| `unknown` | not yet surveyed |

### `forSale` — availability
**NOT observable from the road.** This is the portal/phone field, and it is the distinction
that was collapsing into the word "new."

| value | meaning |
|---|---|
| `lancamento` | selling off-plan / pre-entrega |
| `units-available` | built, developer or agency still has unsold units |
| `resale-only` | fully sold by developer; only owner resales |
| `none` | nothing on the market |
| `unknown` | not checked |

A building can be `completed-recent` + `resale-only` — that is the case you described, and
it's the one that matters commercially: it looks new, but there's no developer left to sell
advertising to.

### `statusAsOf` — `"YYYY-MM"`
When status/forSale were last checked. Makes staleness visible. New buildings appear
constantly here, so an undated status is worth little after a year.

### `visibleFrom` — survey coverage
Tracks what you have and haven't been able to see.

| value | meaning |
|---|---|
| `ba-001` | visible from the highway — ocean-facing frontline |
| `set-back` | behind the frontline, needs a car to reach |
| `unknown` | not yet classified |

This is the field that tells you what's *missing*, which is the point — you can't count
what you can't see from the road.

---

## Pass 1 — BA-001 frontline (trike)

North to south. Fill `status` and `visibleFrom` only. Leave `forSale` alone — it's not
knowable from the saddle.

- [ ] **Farani 221** — 3.2 km N of IOS · bairro?
- [ ] **Central Park** — 2.9 km N of IOS · bairro?
- [ ] **Residencial Victoria** — 1.9 km N of IOS · bairro?
- [ ] **Atlantis Residence** — 0.9 km N of IOS · bairro?
- [ ] **Edifício Baia Marina Residence** — 0.7 km N of IOS · Pontal
- [ ] **Reserva Sapetinga** — 0.4 km N of IOS · bairro?
- [ ] **Pontal Park Residencial** — 0.4 km N of IOS · Pontal · **no price**
- [ ] **Palazzo di Monaco** — 0.3 km N of IOS · bairro?
- [ ] **Ilha Bella** — 0.8 km S of IOS · bairro?
- [ ] **Residencial Vernazza** — 0.9 km S of IOS · bairro? · **no price**
- [ ] **Vista Park** — 0.9 km S of IOS · bairro?
- [ ] **Sette** — 1.2 km S of IOS · São Francisco
- [ ] **Petra** — 2.1 km S of IOS · Jardim Atlântico
- [ ] **Antares Residence** — 2.1 km S of IOS · Jardim Atlântico
- [ ] **Ilhéus Select** — 2.6 km S of IOS · bairro?
- [ ] **Brilho do Atlântico** — 3.0 km S of IOS · Jardim Atlântico · **no price**
- [ ] **Coral Park Residence** — 3.2 km S of IOS · Jardim Atlântico · **no price**
- [ ] **Palm Park Residence** — 3.3 km S of IOS · bairro?
- [ ] **Infinity Park** — 3.4 km S of IOS · bairro?
- [ ] **San Marino** — 3.4 km S of IOS · Jardim Atlântico · **no price**
- [ ] **Residencial Ilha Di Capri** — 3.6 km S of IOS · N. Sra. da Vitória · **no price**
- [ ] **D'Ouro Park Residencial** — 3.6 km S of IOS · bairro?
- [ ] **Costa Mallorca** — 3.6 km S of IOS · bairro?
- [ ] **Isla Park Residence** — 4.1 km S of IOS · N. Sra. da Vitória · **no price**
- [ ] **Maunakai Beach Tower** — 4.2 km S of IOS · N. Sra. da Vitória
- [ ] **Tons de Brisa** — 4.2 km S of IOS · bairro?
- [ ] **Cidadelle Praia do Sul** — 4.6 km S of IOS · bairro?
- [ ] **Unique Park Residence** — 4.9 km S of IOS · bairro?
- [ ] **Condomínio Aldeia Atlântida** — 5.4 km S of IOS · bairro?
- [ ] **Alphapark Condomínio** — 8.3 km S of IOS · bairro? · southern limit

### New buildings not yet in the file
Anything not on the list above — name it, drop a Plus Code, note `under-construction` or
`completed-recent`. Name + Plus Code is enough; everything else can be filled later.

Plus Codes, not dropped pins — see [[project_ilheus_pin_placement]].

### Known but unplaced (need coords — watch for these)
From earlier passes, named but never located:

- **Verso / V3rso Residencial** — F Nogueira, Praia dos Milionários, beachfront, entrega 2027
- **Residence Blumar Park** — NSV, 36 m² 1-qto R$ 421k
- **Praia Dourada** — NSV, 30 m² 1-qto R$ 330k
- **Rua Mário Garcia Morelli 1** — Jardim Atlântico beachfront, 24 m² 1-qto R$ 380k, no building name
- **Two Yacht Club buildings** — near Iate Clube, deferred until completed
- **VOG Amado** — Pontal, R$ 394–490k, 58–70 m², *em construção* (the lone Apto listing)

Several of these showed as vacant lots on Google Maps — likely now built.

---

## Pass 2 — behind the frontline (car)

`visibleFrom: set-back`. Unsurveyed and uncounted. Do it after the frontline is complete,
so the gap between "what BA-001 shows" and "what's actually there" is measurable rather
than assumed.

---

## Pass 3 — availability (desk work)

ZAP and VivaReal share a database and obscure their data; Imovelweb was the most usable of
the three last time. Same manual method as before — search by **building name**, not by
filters, and paste results in for filing.

Expect the answer for many `completed-recent` buildings to be `resale-only`. That's a real
finding, not a failed search: it tells you which buildings have no developer left to sell
advertising to, and it shrinks the advertiser list from "~30 buildings" to something
honest.

**No scraping.** Portals block bots, it's ToS-forbidden, and the data is slop. The
paste-and-file workflow is the pipeline.

---

## Why the count matters

If the frontline plus set-back total lands near 30 under-construction or recently
completed, the advertising model works at Ilhéus scale alone — 4–6 paying placements at
R$ 500–1,500/month clears a CNPJ's overhead, with no second city and no partner needed.

If most of them turn out to be `resale-only`, the advertiser pool is much smaller and the
portfolio-piece framing stands. **Either answer is worth having, and neither is knowable
without the ride.**
