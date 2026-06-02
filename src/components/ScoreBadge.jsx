export default function ScoreBadge({ score, size = 'md' }) {
  const color = score >= 70 ? '#16a34a' : score >= 40 ? '#ca8a04' : '#dc2626'
  const dim = size === 'lg' ? 72 : size === 'sm' ? 36 : 52
  const fontSize = size === 'lg' ? 26 : size === 'sm' ? 13 : 18

  return (
    <svg width={dim} height={dim} viewBox="0 0 72 72" style={{ flexShrink: 0 }}>
      <circle cx="36" cy="36" r="32" fill={color} opacity="0.15" />
      <circle cx="36" cy="36" r="32" fill="none" stroke={color} strokeWidth="4" />
      <text
        x="36"
        y="36"
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontWeight="700"
        fontSize={fontSize}
        fontFamily="system-ui, sans-serif"
      >
        {score}
      </text>
    </svg>
  )
}
