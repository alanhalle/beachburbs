import { useState } from 'react'
import condos from './data/condos.json'
import CondoCard from './components/CondoCard.jsx'
import MapView from './components/MapView.jsx'

export default function App() {
  const [activeCondo, setActiveCondo] = useState(condos[0] ?? null)

  const handleSelect = condo => {
    setActiveCondo(prev => prev?.name === condo.name ? null : condo)
  }

  return (
    <div className="layout">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-name">beachburbs</span>
            <span className="brand-dot">.com</span>
          </div>
          <div className="header-tagline">Beach Walk Score — Pontal, Ilhéus</div>
        </div>
      </header>

      <main className="main-split">
        <aside className="cards-panel">
          {condos.length === 0 ? (
            <div className="empty-state">
              <p>No data yet — run <code>npm run fetch-scores</code> to generate scores.</p>
            </div>
          ) : (
            <>
              <div className="about-score">
                <h2>Beach Walk Score <span className="beta-badge">concept</span></h2>
                <p>
                  Before you go out to dinner or hit the nightclubs, you have to get there.
                  Airport proximity is the first number in Beach Walk Score — and the whole
                  argument for why Ilhéus competes with Santos, Ubatuba, and Porto Seguro for
                  São Paulo buyers.
                </p>
                <p>
                  Standard walkability scores weight transit stops and office supply stores.
                  Beach Walk Score weights what actually matters when you're deciding where to buy
                  a beach property: airport access (25 pts), beach (30 pts), restaurants (20 pts),
                  bars (12 pts), pharmacy, grocery, and ATM for the daily basics. Scores are
                  calculated from Google Places data within 800 meters — roughly 10 minutes on foot.
                </p>
                <p>
                  This is a pilot covering five condominiums in Pontal, Ilhéus. The methodology
                  is the same one we'll apply to Porto Seguro, Praia do Forte, and other
                  destinations as the index grows.
                </p>
                <div className="score-legend">
                  <span className="legend-item green">90–100 Walker's paradise</span>
                  <span className="legend-item yellow">70–89 Very walkable</span>
                  <span className="legend-item red">Below 70 Car-dependent</span>
                </div>
              </div>

              <div className="section-label">Pontal, Ilhéus — {condos.length} condominiums ranked</div>

              {condos.map((condo, i) => (
                <CondoCard
                  key={condo.name}
                  condo={condo}
                  rank={i + 1}
                  isActive={activeCondo?.name === condo.name}
                  onClick={() => handleSelect(condo)}
                />
              ))}

              <div className="cta-block">
                <p className="cta-text">
                  If you want an honest answer about any of these condos — rental reality,
                  management companies, what the neighborhood is actually like — I'll talk
                  for an hour.
                </p>
                <a className="cta-link" href="mailto:alan@alanhalley.com?subject=Beachburbs%20consultation">
                  alan@alanhalley.com
                </a>
              </div>
            </>
          )}
        </aside>

        <section className="map-panel">
          <MapView
            condos={condos}
            activeCondo={activeCondo}
            onSelectCondo={handleSelect}
          />
        </section>
      </main>
    </div>
  )
}
