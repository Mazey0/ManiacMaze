// ─── ZoneOverlay ──────────────────────────────────────────────────────────────
// Renders start (green) and end (red/gold) zones over the maze.
// Zones are defined in maze-space coordinates and scaled by the viewport transform.
// Admin mode: zones are draggable + resizable.

export default function ZoneOverlay({
  zones,          // { start: {x,y,radius}, end: {x,y,radius} }
  transform,      // { scale, offsetX, offsetY }
  adminMode = false,
  onMoveZone,    // (type: 'start'|'end', x, y) => void  (admin)
  onResizeZone,  // (type: 'start'|'end', radius) => void (admin)
  hit,           // { start: bool, end: bool }
}) {
  if (!zones) return null

  const toScreen = (mx, my) => ({
    sx: mx * transform.scale + transform.offsetX,
    sy: my * transform.scale + transform.offsetY,
    sr: 0,
  })

  const renderZone = (zone, type) => {
    if (!zone) return null
    const sx = zone.x * transform.scale + transform.offsetX
    const sy = zone.y * transform.scale + transform.offsetY
    const sr = zone.radius * transform.scale

    const isStart = type === 'start'
    const isHit = hit?.[type]
    const baseColor = isStart ? '#22c55e' : '#f0c040'
    const hitColor = '#6c63ff'
    const color = isHit ? hitColor : baseColor
    const label = isStart ? 'البداية' : 'النهاية'

    return (
      <g key={type}>
        {/* Outer pulse ring */}
        <circle
          cx={sx} cy={sy} r={sr + 6}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.4}
          className={!isHit ? 'zone-pulse' : ''}
          style={{ transformOrigin: `${sx}px ${sy}px` }}
        />
        {/* Main zone circle */}
        <circle
          cx={sx} cy={sy} r={sr}
          fill={color}
          fillOpacity={isHit ? 0.35 : 0.18}
          stroke={color}
          strokeWidth={2}
          style={{ cursor: adminMode ? 'move' : 'default', pointerEvents: adminMode ? 'all' : 'none' }}
          onPointerDown={adminMode ? (e) => handleDrag(e, type) : undefined}
        />
        {/* Label */}
        <text
          x={sx} y={sy - sr - 8}
          textAnchor="middle"
          fill={color}
          fontSize={Math.max(10, sr * 0.7)}
          fontFamily="Cairo, sans-serif"
          fontWeight="600"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {label}
        </text>
        {/* Hit check mark */}
        {isHit && (
          <text x={sx} y={sy + 5} textAnchor="middle" fill={hitColor} fontSize={sr * 0.9} style={{ pointerEvents: 'none' }}>
            ✓
          </text>
        )}
      </g>
    )
  }

  const handleDrag = (e, type) => {
    if (!adminMode || !onMoveZone) return
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const zone = type === 'start' ? zones.start : zones.end

    const onMove = (me) => {
      const dx = (me.clientX - startX) / transform.scale
      const dy = (me.clientY - startY) / transform.scale
      onMoveZone(type, zone.x + dx, zone.y + dy)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <svg
      className="absolute inset-0"
      style={{ width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
    >
      {renderZone(zones.start, 'start')}
      {renderZone(zones.end, 'end')}
    </svg>
  )
}
