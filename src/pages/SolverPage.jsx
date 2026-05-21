import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { RotateCcw, Undo2, Trash2, Send, ZoomIn, ZoomOut, CheckCircle, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import DrawingCanvas from '../components/DrawingCanvas'
import ZoneOverlay from '../components/ZoneOverlay'
import Timer from '../components/Timer'
import { useMazeStore } from '../store/mazeStore'
import { useSolverStore } from '../store/solverStore'
import { useViewport } from '../hooks/useViewport'

// ─── Solution detection ────────────────────────────────────────────────────────
// NOTE: MVP checks if drawing touches both zones (start + end).
// Full wall-collision validation is NOT implemented in MVP.
// Before using competitive leaderboards, add wall-collision detection here.

function pointInZone(px, py, zone) {
  if (!zone) return false
  const dx = px - zone.x
  const dy = py - zone.y
  return Math.sqrt(dx * dx + dy * dy) <= zone.radius
}

// Detect device type for attempt metadata
function getDeviceInfo() {
  const ua = navigator.userAgent
  const hasTouchscreen = navigator.maxTouchPoints > 0
  let type = 'desktop'
  if (/Mobi|Android/i.test(ua)) type = 'mobile'
  else if (/iPad|Tablet/i.test(ua) || (hasTouchscreen && !/Mobi/i.test(ua))) type = 'tablet'
  return { type, ua, hasTouchscreen }
}

export default function SolverPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [mazeSize, setMazeSize] = useState({ w: 800, h: 800 })
  const [zoneHit, setZoneHit] = useState({ start: false, end: false })
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showRestartModal, setShowRestartModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const imgRef = useRef(null)

  const { currentMaze, fetchOne } = useMazeStore()
  const solver = useSolverStore()
  const { transform, fitToContainer, zoomIn, zoomOut, handlers } = useViewport(containerRef)

  // ── Load maze + restore draft ─────────────────────────────────────────────
  useEffect(() => {
    fetchOne(id).then(maze => {
      if (maze) solver.loadOrInit(id)
    })
  }, [id])

  // ── Practice Mode: pause on visibility change ─────────────────────────────
  // Future Challenge Mode: remove this handler — let timer run server-side
  useEffect(() => {
    const onHide = () => { if (document.hidden) solver.pauseTimer() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('beforeunload', () => solver.pauseTimer())
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      solver.pauseTimer()
    }
  }, [])

  // ── Fit maze to container once image loads ─────────────────────────────────
  const handleImageLoad = useCallback((e) => {
    const img = e.target
    const w = img.naturalWidth
    const h = img.naturalHeight
    setMazeSize({ w, h })
    fitToContainer(w, h)
  }, [fitToContainer])

  // ── Zone hit detection on every draw point ────────────────────────────────
  const handleZoneCheck = useCallback((x, y) => {
    if (!currentMaze?.zones || solver.solved) return
    const { start, end } = currentMaze.zones

    setZoneHit(prev => {
      const hitStart = prev.start || pointInZone(x, y, start)
      const hitEnd = prev.end || pointInZone(x, y, end)

      // Both zones touched → solved!
      if (hitStart && hitEnd && !solver.solved) {
        solver.setSolved()
      }
      return { start: hitStart, end: hitEnd }
    })
  }, [currentMaze, solver])

  // ── Submit attempt ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await solver.submitAttempt(id, getDeviceInfo())
      setShowSubmitModal(false)
      navigate('/gallery')
    } catch (e) {
      setSubmitError('حدث خطأ أثناء الإرسال. تحقق من الاتصال وحاول مجددًا.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRestart = () => {
    solver.restart()
    setZoneHit({ start: false, end: false })
    setShowRestartModal(false)
  }

  if (!currentMaze) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f] text-[#6b6b8a]">
        جارٍ التحميل...
      </div>
    )
  }

  const hasMazeImage = !!currentMaze.processed_url
  const isSolved = solver.solved

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] overflow-hidden">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-14 glass border-b border-[#1e1e2e] flex-shrink-0 z-20">
        {/* Back + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => { solver.pauseTimer(); navigate('/gallery') }} className="btn-icon flex-shrink-0">
            <X size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-[#e8e8f0] truncate">{currentMaze.title}</h1>
            {currentMaze.difficulty && (
              <p className="text-xs text-[#6b6b8a]">{currentMaze.difficulty}</p>
            )}
          </div>
        </div>

        {/* Timer */}
        <Timer className="flex-shrink-0" />

        {/* Solved badge */}
        {isSolved && (
          <div className="flex items-center gap-1.5 text-green-400 text-sm font-semibold">
            <CheckCircle size={16} />
            <span className="hidden sm:inline">تم الحل!</span>
          </div>
        )}
      </div>

      {/* ── Maze viewport ────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        {...handlers}
      >
        {/* Maze image + drawing canvas */}
        <div
          className="absolute"
          style={{
            transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            width: mazeSize.w,
            height: mazeSize.h,
          }}
        >
          {/* Original maze — read-only, never modified */}
          {hasMazeImage ? (
            <img
              ref={imgRef}
              src={currentMaze.processed_url}
              alt={currentMaze.title}
              onLoad={handleImageLoad}
              className="block select-none pointer-events-none"
              style={{ width: mazeSize.w, height: mazeSize.h }}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-white flex items-center justify-center text-gray-300">
              لا توجد صورة
            </div>
          )}

          {/* Drawing layer — transparent canvas overlay */}
          <div className="absolute inset-0">
            <DrawingCanvas
              width={mazeSize.w}
              height={mazeSize.h}
              transform={{ scale: 1, offsetX: 0, offsetY: 0 }}
              color={isSolved ? '#22c55e' : '#6c63ff'}
              brushWidth={3}
              onZoneCheck={handleZoneCheck}
              disabled={solver.submitted}
            />
          </div>

          {/* Zone indicators */}
          <ZoneOverlay
            zones={currentMaze.zones}
            transform={{ scale: 1, offsetX: 0, offsetY: 0 }}
            hit={zoneHit}
          />
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
          <button onClick={zoomIn} className="btn-icon w-9 h-9 text-sm">+</button>
          <button
            onClick={() => fitToContainer(mazeSize.w, mazeSize.h)}
            className="btn-icon w-9 h-9 text-xs"
            title="ملاءمة"
          >⊡</button>
          <button onClick={zoomOut} className="btn-icon w-9 h-9 text-sm">−</button>
        </div>

        {/* Zone hit status (visual feedback) */}
        {currentMaze.zones && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all duration-300 ${
              zoneHit.start
                ? 'bg-green-500/20 border-green-500/40 text-green-400'
                : 'bg-[#12121a]/80 border-[#1e1e2e] text-[#6b6b8a]'
            }`}>
              البداية {zoneHit.start ? '✓' : '○'}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all duration-300 ${
              zoneHit.end
                ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                : 'bg-[#12121a]/80 border-[#1e1e2e] text-[#6b6b8a]'
            }`}>
              النهاية {zoneHit.end ? '✓' : '○'}
            </span>
          </div>
        )}
      </div>

      {/* ── Bottom toolbar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 glass border-t border-[#1e1e2e] flex-shrink-0 z-20">
        {/* Drawing tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={solver.undo}
            disabled={solver.strokes.length === 0}
            className="btn-icon"
            title="تراجع"
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={solver.clearStrokes}
            disabled={solver.strokes.length === 0}
            className="btn-icon"
            title="مسح"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => setShowRestartModal(true)}
            className="btn-icon"
            title="إعادة المحاولة"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Stroke count */}
        <span className="text-xs text-[#2e2e4e] tabular-nums hidden sm:block">
          {solver.strokes.length} ضربة
        </span>

        {/* Submit */}
        <button
          onClick={() => setShowSubmitModal(true)}
          disabled={solver.submitted}
          className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
            isSolved
              ? 'btn-success'
              : 'btn-ghost'
          }`}
        >
          <Send size={14} />
          {solver.submitted ? 'تم الإرسال' : isSolved ? 'إرسال الحل' : 'إرسال المحاولة'}
        </button>
      </div>

      {/* ── Submit modal ──────────────────────────────────────────────────── */}
      {showSubmitModal && (
        <Modal onClose={() => setShowSubmitModal(false)}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isSolved ? 'bg-green-500/10 text-green-400' : 'bg-[#6c63ff]/10 text-[#6c63ff]'
            }`}>
              {isSolved ? <CheckCircle size={20} /> : <Send size={20} />}
            </div>
            <div>
              <h2 className="font-bold text-[#e8e8f0]">
                {isSolved ? 'تهانيك! تم الحل ✓' : 'إرسال المحاولة'}
              </h2>
              <p className="text-xs text-[#6b6b8a]">
                {isSolved
                  ? 'وصل مسارك بين نقطة البداية والنهاية'
                  : 'لم يكتمل المسار بعد — يمكنك الإرسال كمحاولة'}
              </p>
            </div>
          </div>

          <Timer className="mb-4 justify-center" />

          <p className="text-xs text-[#6b6b8a] mb-5 bg-[#0a0a0f] rounded-lg p-3 border border-[#1e1e2e]">
            ملاحظة: الحل المُرسل هو &quot;حل مُرسل&quot; وليس &quot;حلًا صحيحًا موثّقًا&quot;.
            التحقق من عدم اختراق الجدران سيُضاف في الإصدارات القادمة.
          </p>

          {submitError && <p className="text-red-400 text-sm mb-3">{submitError}</p>}

          <div className="flex gap-3">
            <button onClick={() => setShowSubmitModal(false)} className="btn-ghost flex-1">إلغاء</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'جارٍ الإرسال...' : 'إرسال الحل'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Restart modal ─────────────────────────────────────────────────── */}
      {showRestartModal && (
        <Modal onClose={() => setShowRestartModal(false)}>
          <h2 className="font-bold text-[#e8e8f0] mb-2">إعادة المحاولة؟</h2>
          <p className="text-[#6b6b8a] text-sm mb-5">
            سيتم مسح جميع الرسومات وإعادة ضبط العداد.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowRestartModal(false)} className="btn-ghost flex-1">إلغاء</button>
            <button onClick={handleRestart} className="btn-danger flex-1">إعادة التشغيل</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative card p-6 w-full max-w-sm fade-in">
        {children}
      </div>
    </div>
  )
}
