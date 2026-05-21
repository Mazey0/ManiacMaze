import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import ZoneOverlay from '../../components/ZoneOverlay'
import { StaticTimer } from '../../components/Timer'
import { supabase, TABLES } from '../../lib/supabase'
import { useViewport } from '../../hooks/useViewport'
import { Play, Pause, RotateCcw, ChevronLeft, Download } from 'lucide-react'

const SPEEDS = [0.5, 1, 2, 4]

// ─── AdminReplay ───────────────────────────────────────────────────────────────
// Replays a user's solving session stroke by stroke.
// Controls: Play / Pause / Restart / Speed multiplier.
// Shows elapsed solving time as it progresses.

export default function AdminReplay() {
  const { attemptId } = useParams()
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  const [attempt, setAttempt] = useState(null)
  const [maze, setMaze] = useState(null)
  const [strokes, setStrokes] = useState([])       // all strokes from DB
  const [mazeSize, setMazeSize] = useState({ w: 800, h: 800 })
  const [loading, setLoading] = useState(true)

  // Replay state
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [replayMs, setReplayMs] = useState(0)      // current replay time position
  const [totalMs, setTotalMs] = useState(0)

  const { transform, fitToContainer, handlers } = useViewport(containerRef)

  // ── Load attempt + strokes + maze ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      // Load attempt
      const { data: att } = await supabase.from(TABLES.ATTEMPTS).select('*').eq('id', attemptId).single()
      if (!att) { setLoading(false); return }
      setAttempt(att)

      // Load maze
      const { data: mz } = await supabase.from(TABLES.MAZES).select('*').eq('id', att.maze_id).single()
      setMaze(mz)

      // Load strokes ordered by index
      const { data: sRows } = await supabase
        .from(TABLES.STROKES)
        .select('*')
        .eq('attempt_id', attemptId)
        .order('stroke_index', { ascending: true })

      const loadedStrokes = sRows || []
      setStrokes(loadedStrokes)

      // Calculate total replay duration from point timestamps
      let tMin = Infinity, tMax = -Infinity
      loadedStrokes.forEach(s => s.points?.forEach(p => {
        if (p.t < tMin) tMin = p.t
        if (p.t > tMax) tMax = p.t
      }))
      const duration = tMax > tMin ? tMax - tMin : att.elapsed_ms
      setTotalMs(duration)
      setLoading(false)
    }
    load()
  }, [attemptId])

  // ── Fit maze when image loads ─────────────────────────────────────────────
  const handleImageLoad = useCallback((e) => {
    const img = e.target
    const w = img.naturalWidth, h = img.naturalHeight
    setMazeSize({ w, h })
    fitToContainer(w, h)
    if (canvasRef.current) {
      canvasRef.current.width = w
      canvasRef.current.height = h
    }
  }, [fitToContainer])

  // ── Replay rendering ──────────────────────────────────────────────────────
  // Renders all stroke points with timestamp <= replayMs
  const renderReplay = useCallback((timeMs) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (strokes.length === 0) return

    // Find the absolute start time
    let tStart = Infinity
    strokes.forEach(s => s.points?.forEach(p => { if (p.t < tStart) tStart = p.t }))
    const cutoffT = tStart + timeMs

    strokes.forEach(stroke => {
      if (!stroke.points || stroke.points.length < 2) return
      const visiblePoints = stroke.points.filter(p => p.t <= cutoffT)
      if (visiblePoints.length < 2) return

      ctx.beginPath()
      ctx.strokeStyle = stroke.color || '#6c63ff'
      ctx.lineWidth = stroke.width || 3
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.moveTo(visiblePoints[0].x, visiblePoints[0].y)
      for (let i = 1; i < visiblePoints.length; i++) {
        const prev = visiblePoints[i - 1]
        const curr = visiblePoints[i]
        ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) / 2, (prev.y + curr.y) / 2)
      }
      ctx.stroke()

      // Draw live cursor dot at last visible point
      if (visiblePoints.length > 0) {
        const last = visiblePoints[visiblePoints.length - 1]
        ctx.beginPath()
        ctx.arc(last.x, last.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = stroke.color || '#6c63ff'
        ctx.fill()
      }
    })
  }, [strokes])

  useEffect(() => { renderReplay(replayMs) }, [replayMs, renderReplay])

  // ── Playback animation loop ───────────────────────────────────────────────
  useEffect(() => {
    if (!playing) {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      return
    }

    let lastTime = performance.now()

    const tick = (now) => {
      const delta = (now - lastTime) * speed
      lastTime = now
      setReplayMs(prev => {
        const next = prev + delta
        if (next >= totalMs) {
          setPlaying(false)
          return totalMs
        }
        return next
      })
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [playing, speed, totalMs])

  const handleRestart = () => {
    setPlaying(false)
    setReplayMs(0)
  }

  // ── Export replay frame as image ──────────────────────────────────────────
  const handleExport = () => {
    const mazeImg = containerRef.current?.querySelector('img')
    if (!mazeImg || !canvasRef.current) return

    const out = document.createElement('canvas')
    out.width = mazeSize.w
    out.height = mazeSize.h
    const ctx = out.getContext('2d')
    ctx.drawImage(mazeImg, 0, 0, mazeSize.w, mazeSize.h)
    ctx.drawImage(canvasRef.current, 0, 0)

    const link = document.createElement('a')
    link.download = `replay_${attemptId}.png`
    link.href = out.toDataURL('image/png')
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f] text-[#6b6b8a]">
        جارٍ تحميل بيانات الحل...
      </div>
    )
  }

  if (!attempt || !maze) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f] text-[#6b6b8a]">
        لم يُعثر على المحاولة
      </div>
    )
  }

  const progressPct = totalMs > 0 ? (replayMs / totalMs) * 100 : 0

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-14 glass border-b border-[#1e1e2e] flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link to={`/admin/attempts/${maze.id}`} className="btn-icon">
            <ChevronLeft size={16} />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-[#e8e8f0]">إعادة تشغيل الحل</h1>
            <p className="text-xs text-[#6b6b8a]">{maze.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Current replay time */}
          <StaticTimer elapsedMs={replayMs} label="العرض:" />
          {/* Final submitted time */}
          <StaticTimer elapsedMs={attempt.elapsed_ms} label="الوقت المُرسَل:" className="hidden sm:flex" />

          {/* Export */}
          <button onClick={handleExport} className="btn-icon" title="تحميل الصورة">
            <Download size={15} />
          </button>
        </div>
      </div>

      {/* ── Maze + replay canvas ──────────────────────────────────────────── */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden" {...handlers}>
        <div
          className="absolute"
          style={{
            transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            width: mazeSize.w,
            height: mazeSize.h,
          }}
        >
          {/* Maze image */}
          <img
            src={maze.processed_url}
            alt={maze.title}
            onLoad={handleImageLoad}
            className="block select-none pointer-events-none"
            style={{ width: mazeSize.w, height: mazeSize.h }}
            draggable={false}
          />

          {/* Replay strokes canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: mazeSize.w, height: mazeSize.h }}
          />

          {/* Zones */}
          {maze.zones && (
            <ZoneOverlay
              zones={maze.zones}
              transform={{ scale: 1, offsetX: 0, offsetY: 0 }}
            />
          )}
        </div>
      </div>

      {/* ── Replay controls ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 glass border-t border-[#1e1e2e] p-4">
        {/* Progress bar */}
        <div
          className="w-full h-1.5 bg-[#1e1e2e] rounded-full mb-4 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = (e.clientX - rect.left) / rect.width
            setReplayMs(pct * totalMs)
          }}
        >
          <div
            className="h-full bg-[#6c63ff] rounded-full transition-all duration-100"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Transport controls */}
          <div className="flex items-center gap-3">
            <button onClick={handleRestart} className="btn-icon">
              <RotateCcw size={15} />
            </button>
            <button
              onClick={() => setPlaying(p => !p)}
              className="w-10 h-10 rounded-xl bg-[#6c63ff] hover:bg-[#7c74ff] text-white flex items-center justify-center transition-all active:scale-90"
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-[#6b6b8a] ml-2">السرعة:</span>
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  speed === s
                    ? 'bg-[#6c63ff] border-[#6c63ff] text-white'
                    : 'border-[#1e1e2e] text-[#6b6b8a] hover:border-[#6c63ff]'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Attempt info */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-[#6b6b8a]">
            <span>{attempt.solved ? '✓ تم الحل' : '○ لم يكتمل'}</span>
            <span>{attempt.device_type}</span>
            <span>{strokes.length} ضربة</span>
          </div>
        </div>
      </div>
    </div>
  )
}
