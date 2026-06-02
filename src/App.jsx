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
                <h2>Beach Walk Score</h2>
                <p>
                  Standard walkability scores are built for cities. They weight transit stops and
                  office supply stores. That's not what matters when you're deciding where to park
                  a beach property.
                </p>
                <p>
                  Beach Walk Score weights what a beach town actually needs: beach access (40 pts),
                  restaurants (25 pts), bars and nightlife (15 pts), then pharmacy, grocery, and ATM
                  for the daily basics. Scores are calculated from Google Places data within an
                  800-meter walking radius — roughly 10 minutes on foot.
                </p>
                <p>
                  The scale is 0–100. A 90+ means you can walk to the beach, dinner, and a drink
                  without touching a car. A 70 means you're close but missing something. Below 50,
                  you're dependent on wheels for most of daily life.
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
                  I've lived 2 miles from these condos for 17 years. If you want an honest
                  answer about any of them — rental reality, management companies, what the
                  neighborhood is actually like — I'll talk for an hour.
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
