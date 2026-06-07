import ScoreBadge from './ScoreBadge.jsx'

const CATEGORY_ORDER = ['airport', 'beach', 'restaurant', 'bar', 'pharmacy', 'grocery', 'atm']

export default function CondoCard({ condo, rank, isActive, onClick }) {
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
          <span className="location">Pontal, Ilhéus, BA</span>
        </div>
        <ScoreBadge score={condo.score} size="lg" />
      </div>

      {isActive && condo.listings && condo.listings.length > 0 && (
        <div className="card-listings">
          {condo.listings.map((l, i) => (
            <div className="listing-row" key={i}>
              <span className="listing-label">{l.size}{l.bedrooms ? ` · ${l.bedrooms}Q` : ''}</span>
              <span className="listing-price">{l.price}</span>
            </div>
          ))}
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
                <span className="cat-label">{cat.label}</span>
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
