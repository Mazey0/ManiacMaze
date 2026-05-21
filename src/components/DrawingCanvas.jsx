import { useRef, useEffect, useCallback } from 'react'
import { useSolverStore } from '../store/solverStore'

// ─── DrawingCanvas ─────────────────────────────────────────────────────────────
// Transparent canvas overlay that sits above the maze image.
// Supports: Apple Pencil, stylus, touch, mouse, trackpad via Pointer Events API.
// Strokes are stored as coordinate arrays for replay.
// Canvas transform matches the parent's zoom/pan so drawing stays aligned.

export default function DrawingCanvas({
  width,
  height,
  transform,          // { scale, offsetX, offsetY } from parent zoom/pan
  color = '#6c63ff',
  brushWidth = 3,
  onZoneCheck,        // callback(x, y) → checks if point touches start/end zone
  disabled = false,
}) {
  const canvasRef = useRef(null)
  const isDrawing = useRef(false)

  const { beginStroke, addPoint, endStroke, strokes, currentStroke, solved } = useSolverStore()

  // ─── Render all strokes + current stroke onto canvas ─────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply the same transform as the maze viewport
    ctx.save()
    ctx.setTransform(
      transform.scale, 0, 0,
      transform.scale,
      transform.offsetX,
      transform.offsetY
    )

    const drawStroke = (stroke) => {
      if (!stroke || stroke.points.length < 2) return
      ctx.beginPath()
      ctx.strokeStyle = stroke.color || '#6c63ff'
      ctx.lineWidth = (stroke.width || 3) / transform.scale  // compensate for scale
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
      for (let i = 1; i < stroke.points.length; i++) {
        const prev = stroke.points[i - 1]
        const curr = stroke.points[i]
        // Smooth curve between points
        ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2)
      }
      ctx.stroke()
    }

    // Draw committed strokes
    strokes.forEach(drawStroke)
    // Draw live stroke
    if (currentStroke) drawStroke(currentStroke)

    ctx.restore()
  }, [strokes, currentStroke, transform])

  useEffect(() => { render() }, [render])

  // ─── Coordinate conversion: canvas pixel → maze-space ────────────────────
  const toMazeCoords = (canvas, clientX, clientY) => {
    const rect = canvas.getBoundingClientRect()
    const px = (clientX - rect.left) * (canvas.width / rect.width)
    const py = (clientY - rect.top) * (canvas.height / rect.height)
    // Invert the transform to get maze-space coordinates
    const x = (px - transform.offsetX) / transform.scale
    const y = (py - transform.offsetY) / transform.scale
    return { x, y }
  }

  // ─── Pointer event handlers ───────────────────────────────────────────────
  const handlePointerDown = useCallback((e) => {
    if (disabled || solved) return
    e.preventDefault()
    const canvas = canvasRef.current
    canvas.setPointerCapture(e.pointerId)
    isDrawing.current = true

    const { x, y } = toMazeCoords(canvas, e.clientX, e.clientY)
    const pressure = e.pressure > 0 ? e.pressure : 0.5
    beginStroke({ x, y, t: Date.now(), p: pressure }, color, brushWidth)
  }, [disabled, solved, transform, color, brushWidth, beginStroke])

  const handlePointerMove = useCallback((e) => {
    if (!isDrawing.current) return
    e.preventDefault()
    const canvas = canvasRef.current
    const { x, y } = toMazeCoords(canvas, e.clientX, e.clientY)
    const pressure = e.pressure > 0 ? e.pressure : 0.5
    addPoint({ x, y, t: Date.now(), p: pressure })

    // Check zone hit on every move point
    if (onZoneCheck) onZoneCheck(x, y)
  }, [transform, addPoint, onZoneCheck])

  const handlePointerUp = useCallback((e) => {
    if (!isDrawing.current) return
    isDrawing.current = false
    endStroke()
  }, [endStroke])

  // ─── Resize canvas to match container ────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = width
    canvas.height = height
  }, [width, height])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 canvas-area no-select"
      style={{
        width: '100%',
        height: '100%',
        cursor: disabled || solved ? 'default' : 'crosshair',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  )
}
