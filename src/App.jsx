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
                <h2>Beach Walk Score <span className="beta-badge">conceito</span></h2>
                <p>
                  Antes de sair para jantar ou curtir as baladas, você precisa chegar lá.
                  A proximidade do aeroporto é o primeiro número do Beach Walk Score — e o principal
                  argumento de por que Ilhéus concorre com Santos, Ubatuba e Porto Seguro na disputa
                  pelos compradores paulistas.
                </p>
                <p>
                  Os índices tradicionais de caminhabilidade valorizam pontos de ônibus e papelarias.
                  O Beach Walk Score pondera o que realmente importa na hora de escolher um imóvel de
                  praia: aeroporto (25 pts), praia (30 pts), restaurantes (20 pts), bares (12 pts),
                  farmácia, mercado e caixa eletrônico para o dia a dia. As pontuações são calculadas
                  com dados do Google Places em um raio de 800 metros — cerca de 10 minutos a pé.
                </p>
                <p>
                  Este é um piloto cobrindo condomínios em Pontal, Ilhéus. A mesma metodologia
                  será aplicada a Porto Seguro, Praia do Forte e outros destinos à medida que
                  o índice crescer.
                </p>
                <div className="score-legend">
                  <span className="legend-item green">90–100 Paraíso para pedestres</span>
                  <span className="legend-item yellow">70–89 Muito caminhável</span>
                  <span className="legend-item red">Abaixo de 70 Depende de carro</span>
                </div>
              </div>

              <div className="section-label">Pontal, Ilhéus — {condos.length} condomínios classificados</div>

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
