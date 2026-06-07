import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'

// Custom score pin icon
function makeScoreIcon(score, isActive) {
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#ca8a04' : '#dc2626'
  const border = isActive ? '#fff' : color
  const shadow = isActive ? '0 0 0 3px ' + color : 'none'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
      <path d="M22 2C12.06 2 4 10.06 4 20c0 13 18 30 18 30s18-17 18-30C40 10.06 31.94 2 22 2z"
        fill="${color}" stroke="${border}" stroke-width="2"/>
      <circle cx="22" cy="20" r="12" fill="white" opacity="0.9"/>
      <text x="22" y="24" text-anchor="middle" fill="${color}" font-weight="700"
        font-size="12" font-family="system-ui,sans-serif">${score}</text>
    </svg>`
  return L.divIcon({
    html: svg,
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
    className: '',
  })
}

function FlyTo({ condo }) {
  const map = useMap()
  useEffect(() => {
    if (condo) map.flyTo([condo.lat, condo.lng], 16, { duration: 0.8 })
  }, [condo, map])
  return null
}

const TILES = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
  },
}

export default function MapView({ condos, activeCondo, onSelectCondo, strings }) {
  const [tileMode, setTileMode] = useState('satellite')
  const tile = TILES[tileMode]
  const bounds = condos.length > 0
    ? L.latLngBounds(condos.map(c => [c.lat, c.lng]))
    : L.latLngBounds([[-14.86, -39.04], [-14.78, -39.03]])

  return (
    <div style={{ position: 'relative', height: '100%' }}>
    <MapContainer bounds={bounds} boundsOptions={{ padding: [50, 50] }} className="map-container" zoomControl>
      <TileLayer key={tileMode} attribution={tile.attribution} url={tile.url} />
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 1000,
        display: 'flex', gap: 4,
      }}>
        {['street', 'satellite'].map(mode => (
          <button
            key={mode}
            onClick={() => setTileMode(mode)}
            style={{
              padding: '5px 10px',
              fontSize: 12,
              fontWeight: tileMode === mode ? 700 : 400,
              background: tileMode === mode ? '#1e293b' : 'white',
              color: tileMode === mode ? 'white' : '#1e293b',
              border: '1px solid #1e293b',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {mode === 'street' ? (strings?.mapStreet ?? 'Mapa') : (strings?.mapSatellite ?? 'Satélite')}
          </button>
        ))}
      </div>
      {activeCondo && <FlyTo condo={activeCondo} />}
      {condos.map(condo => (
        <Marker
          key={condo.name}
          position={[condo.lat, condo.lng]}
          icon={makeScoreIcon(condo.score, activeCondo?.name === condo.name)}
          eventHandlers={{ click: () => onSelectCondo(condo) }}
        >
          <Popup>
            <strong>{condo.name}</strong><br />
            Beach Walk Score: <strong>{condo.score}</strong>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
    </div>
  )
}
