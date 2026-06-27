import ScoreBadge from './ScoreBadge.jsx'

const CATEGORY_ORDER = ['airport', 'beach', 'restaurant', 'bar', 'pharmacy', 'grocery', 'atm']

export default function CondoCard({ condo, rank, isActive, onClick, strings }) {
  return (
    <div
      className={`condo-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div className="card-header">
        <div className="rank">#{rank}</div>
        <div className="card-title">
          <h3>{condo.name}</h3>
          <span className="location">{condo.neighborhood ? `${condo.neighborhood}, Ilhéus, BA` : 'Ilhéus, BA'}</span>
        </div>
        <ScoreBadge score={condo.score} size="lg" />
      </div>

      {isActive && (condo.units || condo.priceRange) && (
        <div className="card-listings">
          {condo.units && (
            <div className="listing-row">
              <span className="listing-label">{condo.units}</span>
            </div>
          )}
          {condo.priceRange && (
            <div className="listing-row">
              <span className="listing-label">{strings?.priceLabel ?? 'Preço'}</span>
              <span className="listing-price">{condo.priceRange}</span>
            </div>
          )}
          {condo.condoFee && <div className="listing-fees">Condomínio {condo.condoFee}{condo.iptu ? ` · IPTU ${condo.iptu}` : ''}</div>}
        </div>
      )}

      {isActive && condo.breakdown && (
        <div className="card-breakdown">
          {CATEGORY_ORDER.map(key => {
            const cat = condo.breakdown[key]
            if (!cat) return null
            const pct = Math.min(cat.score / cat.maxScore, 1) * 100
            return (
              <div className="breakdown-row" key={key}>
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-label">{strings?.categories[key] ?? cat.label}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="cat-score">
                  {cat.score}/{cat.maxScore}
                  {key === 'airport' && cat.distKm != null &&
                    <span className="cat-dist"> {cat.distKm}km</span>}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
