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
              <p className="panel-intro">
                Ranked by <strong>Beach Walk Score</strong> — a weighted walkability rating for beach towns.
                Click any card to see the score breakdown.
              </p>
              {condos.map((condo, i) => (
                <CondoCard
                  key={condo.name}
                  condo={condo}
                  rank={i + 1}
                  isActive={activeCondo?.name === condo.name}
                  onClick={() => handleSelect(condo)}
                />
              ))}
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
