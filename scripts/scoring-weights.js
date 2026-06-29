// ---------------------------------------------------------------------------
// Single source of truth for the beachburbs scoring model.
//
// A building's score is a pure function of three inputs:
//   • its distance to the traced beach line   (geo)
//   • its distance to the airport             (geo)
//   • counts of nearby walkable services      (Google Places)
// ...combined with the weights declared here. Nothing else.
//
// RATIONALE — why these weights, and why airport is small:
//   The cost of distance is frequency × friction. The airport is the LEAST
//   frequent trip a resident makes (a few times a year). What actually erodes
//   daily life is the routine run into town — groceries, a restaurant, friends
//   — done weekly. So the beach (the reason you're here) and walkable daily
//   services carry the weight, and airport proximity is a light, city-level
//   credit that every building in a compact coastal town earns equally. A
//   10-minute Uber to the gate, for a trip you take three times a year, is
//   indistinguishable from a 10-minute walk. The old raw-distance airport curve
//   did the perverse thing of docking the true beachfront buildings — the ones
//   on the best sand, farthest from the runway — up to 25 points.
//
//   Weights sum to 100:  beach 40 + airport 10 + restaurant 22 + bar 13
//                        + pharmacy 6 + grocery 6 + atm 3 = 100
// ---------------------------------------------------------------------------

// IOS airport — fixed anchor, same one the map uses (MapView.jsx). No geocoding.
export const AIRPORT = { lat: -14.8139815, lng: -39.0315656 }

// Airport proximity — 10 pts. Generous curve: within a compact town every
// building is a short ride from the gate, so all score ~full. The curve only
// bites for a genuinely remote town (e.g. Pipa, ~100 km / 90 min from Natal).
export const AIRPORT_WEIGHT = 10
export const AIRPORT_FULL_SCORE_KM = 8    // ≤ 8 km  → full score (covers urban Ilhéus)
export const AIRPORT_ZERO_SCORE_KM = 30   // ≥ 30 km → zero

// Beach — 40 pts. The product thesis, and the dimension with the most honest
// spread between buildings (6 → 40). Distance→score curve lives in geo.js.
export const BEACH_WEIGHT = 40

// Walkable daily services — the weekly-friction signal that actually varies
// with livability. weight = max points; max = result count that earns full points.
// `beach` is intentionally absent — it is geometric, never a Places lookup.
// `max` = the count that earns full points. Set near the top of the observed
// range (Places caps a nearby search at 20) so that denser genuinely beats
// adequate — "more restaurants is better" — instead of saturating at a low bar
// where a 20-restaurant block ties a sleepy 10-restaurant one.
export const PLACE_CATEGORIES = {
  restaurant: { type: 'restaurant',  keyword: '', weight: 22, max: 20 },
  bar:        { type: 'bar',         keyword: '', weight: 13, max: 12 },
  pharmacy:   { type: 'pharmacy',    keyword: '', weight: 6,  max: 6 },
  grocery:    { type: 'supermarket', keyword: '', weight: 6,  max: 5 },
  atm:        { type: 'atm',         keyword: '', weight: 3,  max: 3 },
}
