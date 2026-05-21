import { useState, useRef, useCallback, useEffect } from 'react'

// ─── useViewport ───────────────────────────────────────────────────────────────
// Handles zoom + pan for the maze solving area.
// Returns transform { scale, offsetX, offsetY } and event handlers.
// Supports: pinch-zoom (touch), mouse wheel, trackpad, double-tap.

const MIN_SCALE = 0.3
const MAX_SCALE = 8
const ZOOM_SPEED = 0.001

export function useViewport(containerRef) {
  const [transform, setTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 })
  const lastDist = useRef(null)       // for pinch
  const lastPan = useRef(null)        // for single-touch pan
  const isPanning = useRef(false)
  const panStartRef = useRef(null)

  // Fit content to container size
  const fitToContainer = useCallback((contentW, contentH) => {
    const container = containerRef.current
    if (!container || !contentW || !contentH) return
    const { width, height } = container.getBoundingClientRect()
    const padding = 32
    const scaleX = (width - padding * 2) / contentW
    const scaleY = (height - padding * 2) / contentH
    const scale = Math.min(scaleX, scaleY, 1)
    const offsetX = (width - contentW * scale) / 2
    const offsetY = (height - contentH * scale) / 2
    setTransform({ scale, offsetX, offsetY })
  }, [containerRef])

  // Reset to fit
  const reset = useCallback((contentW, contentH) => {
    fitToContainer(contentW, contentH)
  }, [fitToContainer])

  // Zoom around a point (cx, cy in container coords)
  const zoomAt = useCallback((cx, cy, delta) => {
    setTransform(prev => {
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * (1 + delta)))
      const ratio = newScale / prev.scale
      return {
        scale: newScale,
        offsetX: cx - ratio * (cx - prev.offsetX),
        offsetY: cy - ratio * (cy - prev.offsetY),
      }
    })
  }, [])

  const zoomIn = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const { width, height } = container.getBoundingClientRect()
    zoomAt(width / 2, height / 2, 0.3)
  }, [containerRef, zoomAt])

  const zoomOut = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const { width, height } = container.getBoundingClientRect()
    zoomAt(width / 2, height / 2, -0.3)
  }, [containerRef, zoomAt])

  // Mouse / trackpad wheel
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top

    if (e.ctrlKey || e.metaKey) {
      // Pinch-zoom gesture on trackpad
      zoomAt(cx, cy, -e.deltaY * ZOOM_SPEED * 5)
    } else {
      // Pan
      setTransform(prev => ({
        ...prev,
        offsetX: prev.offsetX - e.deltaX,
        offsetY: prev.offsetY - e.deltaY,
      }))
    }
  }, [containerRef, zoomAt])

  // Touch: pinch-zoom + single-finger pan
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      lastDist.current = getTouchDist(e.touches)
      lastPan.current = null
    } else if (e.touches.length === 1) {
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && lastDist.current !== null) {
      e.preventDefault()
      const dist = getTouchDist(e.touches)
      const delta = (dist - lastDist.current) * 0.01
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) zoomAt(cx - rect.left, cy - rect.top, delta)
      lastDist.current = dist
    } else if (e.touches.length === 1 && lastPan.current) {
      const dx = e.touches[0].clientX - lastPan.current.x
      const dy = e.touches[0].clientY - lastPan.current.y
      setTransform(prev => ({ ...prev, offsetX: prev.offsetX + dx, offsetY: prev.offsetY + dy }))
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }, [containerRef, zoomAt])

  const handleTouchEnd = useCallback(() => {
    lastDist.current = null
  }, [])

  // Mouse pan (middle mouse button or when not drawing)
  const startMousePan = useCallback((e) => {
    if (e.button !== 1) return  // middle mouse only
    isPanning.current = true
    panStartRef.current = { x: e.clientX, y: e.clientY, ox: transform.offsetX, oy: transform.offsetY }
    e.preventDefault()
  }, [transform])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel, containerRef])

  return {
    transform,
    setTransform,
    fitToContainer,
    reset,
    zoomIn,
    zoomOut,
    zoomAt,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}

function getTouchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}
