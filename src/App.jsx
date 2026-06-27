import { useState } from 'react'
import condos from './data/condos.json'
import CondoCard from './components/CondoCard.jsx'
import MapView from './components/MapView.jsx'
import { strings } from './i18n.js'

export default function App() {
  const [activeCondo, setActiveCondo] = useState(null)
  const [lang, setLang] = useState('pt')
  const s = strings[lang]

  const handleSelect = condo => {
    setActiveCondo(prev => prev?.name === condo.name ? null : condo)
  }

  // Rank by score so #1 is the highest-scoring building.
  const ranked = [...condos].sort((a, b) => b.score - a.score)

  return (
    <div className="layout">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-name">beachburbs</span>
            <span className="brand-dot">.com</span>
          </div>
          <div className="header-tagline">{s.tagline}</div>
          <div className="lang-toggle">
            <button className={lang === 'pt' ? 'active' : ''} onClick={() => setLang('pt')}>PT</button>
            <span className="lang-sep">/</span>
            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
          </div>
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
                <h2>{s.scoreTitle} <span className="beta-badge">{s.badge}</span></h2>
                <p>{s.p1}</p>
                <p>{s.p2}</p>
                <p>{s.p3}</p>
                <div className="score-legend">
                  <span className="legend-item green">{s.legendGreen}</span>
                  <span className="legend-item yellow">{s.legendYellow}</span>
                  <span className="legend-item red">{s.legendRed}</span>
                </div>
                <p className="price-asof">{s.priceAsOf}</p>
              </div>

              <div className="section-label">{s.sectionLabel(condos.length)}</div>

              {ranked.map((condo, i) => (
                <CondoCard
                  key={condo.name}
                  condo={condo}
                  rank={i + 1}
                  isActive={activeCondo?.name === condo.name}
                  onClick={() => handleSelect(condo)}
                  strings={s}
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
            strings={s}
          />
        </section>
      </main>
    </div>
  )
}
