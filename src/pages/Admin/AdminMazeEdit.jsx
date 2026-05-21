import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import ZoneOverlay from '../../components/ZoneOverlay'
import { useMazeStore } from '../../store/mazeStore'
import { useViewport } from '../../hooks/useViewport'
import { BUCKETS } from '../../lib/supabase'
import { Save, MapPin, Loader, Eye, EyeOff, Upload } from 'lucide-react'

// ─── AdminMazeEdit ─────────────────────────────────────────────────────────────
// Admin can:
// - Edit maze metadata
// - Click to place start/end zones on the maze
// - Drag existing zones
// - Adjust zone radius
// - Publish / unpublish

const DEFAULT_RADIUS = 30

export default function AdminMazeEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const imgRef = useRef(null)

  const { fetchOne, updateMaze, uploadFile } = useMazeStore()
  const [maze, setMaze] = useState(null)
  const [form, setForm] = useState({})
  const [zones, setZones] = useState({ start: null, end: null })
  const [placingZone, setPlacingZone] = useState(null) // 'start' | 'end' | null
  const [mazeSize, setMazeSize] = useState({ w: 800, h: 800 })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [uploadingImg, setUploadingImg] = useState(false)
  const imgInputRef = useRef(null)

  const { transform, fitToContainer, zoomIn, zoomOut, handlers } = useViewport(containerRef)

  useEffect(() => {
    fetchOne(id).then(m => {
      if (!m) return
      setMaze(m)
      setForm({
        title: m.title || '',
        description: m.description || '',
        category: m.category || '',
        difficulty: m.difficulty || 'medium',
        estimated_minutes: m.estimated_minutes || '',
        status: m.status || 'draft',
      })
      if (m.zones) setZones(m.zones)
    })
  }, [id])

  const handleImageLoad = useCallback((e) => {
    const img = e.target
    setMazeSize({ w: img.naturalWidth, h: img.naturalHeight })
    fitToContainer(img.naturalWidth, img.naturalHeight)
  }, [fitToContainer])

  // Click on maze to place zone
  const handleMazeClick = useCallback((e) => {
    if (!placingZone) return
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const px = (e.clientX - rect.left - transform.offsetX) / transform.scale
    const py = (e.clientY - rect.top - transform.offsetY) / transform.scale
    setZones(prev => ({
      ...prev,
      [placingZone]: { x: px, y: py, radius: prev[placingZone]?.radius || DEFAULT_RADIUS },
    }))
    setPlacingZone(null)
  }, [placingZone, transform])

  const handleMoveZone = (type, x, y) => {
    setZones(prev => ({
      ...prev,
      [type]: { ...prev[type], x, y },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateMaze(id, {
        ...form,
        estimated_minutes: form.estimated_minutes ? parseInt(form.estimated_minutes) : null,
        zones,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleImageReplace = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    setError(null)
    try {
      const url = await uploadFile(BUCKETS.MAZE_PROCESSED, `${Date.now()}_maze.jpg`, file)
      const updated = await updateMaze(id, { processed_url: url })
      setMaze(prev => ({ ...prev, processed_url: url }))
      setMazeSize({ w: updated?.width || 800, h: updated?.height || 800 })
    } catch (e) {
      setError(e.message)
    } finally {
      setUploadingImg(false)
      e.target.value = ''
    }
  }

  const togglePublish = async () => {
    const newStatus = form.status === 'published' ? 'draft' : 'published'
    setForm(f => ({ ...f, status: newStatus }))
    await updateMaze(id, { status: newStatus })
  }

  if (!maze) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0a0f] text-[#6b6b8a]">
        جارٍ التحميل...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="pt-20 max-w-7xl mx-auto px-4 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Left: Maze preview + zone placement ─────────────────────── */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[#e8e8f0]">معاينة المتاهة</h2>
              <div className="flex gap-2">
                <button onClick={zoomIn} className="btn-icon w-8 h-8 text-sm">+</button>
                <button onClick={() => fitToContainer(mazeSize.w, mazeSize.h)} className="btn-icon w-8 h-8 text-xs">⊡</button>
                <button onClick={zoomOut} className="btn-icon w-8 h-8 text-sm">−</button>
              </div>
            </div>

            {/* Zone action buttons */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setPlacingZone(placingZone === 'start' ? null : 'start')}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-all ${
                  placingZone === 'start'
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'border-[#2e2e4e] text-[#6b6b8a] hover:border-green-500/30'
                }`}
              >
                <MapPin size={14} />
                {placingZone === 'start' ? 'انقر لتحديد البداية' : 'تحديد البداية'}
                {zones.start && <span className="text-green-400">✓</span>}
              </button>
              <button
                onClick={() => setPlacingZone(placingZone === 'end' ? null : 'end')}
                className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-all ${
                  placingZone === 'end'
                    ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                    : 'border-[#2e2e4e] text-[#6b6b8a] hover:border-yellow-500/30'
                }`}
              >
                <MapPin size={14} />
                {placingZone === 'end' ? 'انقر لتحديد النهاية' : 'تحديد النهاية'}
                {zones.end && <span className="text-yellow-400">✓</span>}
              </button>
            </div>

            {placingZone && (
              <p className="text-xs text-[#6c63ff] mb-2 animate-pulse">
                انقر على المتاهة لتحديد نقطة {placingZone === 'start' ? 'البداية' : 'النهاية'}
              </p>
            )}

            {/* Re-upload image button */}
            <div className="flex items-center gap-2 mb-2">
              <input ref={imgInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" onChange={handleImageReplace} />
              <button
                onClick={() => imgInputRef.current?.click()}
                disabled={uploadingImg}
                className="flex items-center gap-1.5 text-xs text-[#6b6b8a] hover:text-[#e8e8f0] border border-[#1e1e2e] hover:border-[#2e2e4e] rounded-lg px-3 py-1.5 transition-all"
              >
                {uploadingImg ? <Loader size={12} className="animate-spin" /> : <Upload size={12} />}
                {uploadingImg ? 'جارٍ الرفع...' : 'رفع صورة جديدة'}
              </button>
            </div>

            {/* Maze viewport */}
            <div
              ref={containerRef}
              className="relative overflow-hidden bg-[#0a0a0f] rounded-2xl border border-[#1e1e2e]"
              style={{ height: '60vh', cursor: placingZone ? 'crosshair' : 'default' }}
              onClick={handleMazeClick}
              {...handlers}
            >
              <div
                className="absolute"
                style={{
                  transform: `translate(${transform.offsetX}px, ${transform.offsetY}px) scale(${transform.scale})`,
                  transformOrigin: '0 0',
                  width: mazeSize.w,
                  height: mazeSize.h,
                }}
              >
                {maze.processed_url ? (
                  <img
                    ref={imgRef}
                    src={maze.processed_url}
                    alt="المتاهة"
                    onLoad={handleImageLoad}
                    className="block select-none pointer-events-none"
                    style={{ width: mazeSize.w, height: mazeSize.h }}
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#6b6b8a]">
                    <Upload size={32} className="opacity-30" />
                    <p className="text-sm">لا توجد صورة — ارفع صورة جديدة</p>
                    <button
                      onClick={() => imgInputRef.current?.click()}
                      className="text-xs btn-primary px-4 py-2"
                    >
                      رفع صورة
                    </button>
                  </div>
                )}
                <ZoneOverlay
                  zones={zones}
                  transform={{ scale: 1, offsetX: 0, offsetY: 0 }}
                  adminMode
                  onMoveZone={handleMoveZone}
                />
              </div>
            </div>

            {/* Zone radius sliders */}
            {(zones.start || zones.end) && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {zones.start && (
                  <div>
                    <label className="label">حجم نقطة البداية ({zones.start.radius}px)</label>
                    <input type="range" min="10" max="150" value={zones.start.radius}
                      onChange={e => setZones(z => ({ ...z, start: { ...z.start, radius: Number(e.target.value) } }))}
                      className="w-full accent-green-400" />
                  </div>
                )}
                {zones.end && (
                  <div>
                    <label className="label">حجم نقطة النهاية ({zones.end.radius}px)</label>
                    <input type="range" min="10" max="150" value={zones.end.radius}
                      onChange={e => setZones(z => ({ ...z, end: { ...z.end, radius: Number(e.target.value) } }))}
                      className="w-full accent-yellow-400" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Metadata form ──────────────────────────────────────── */}
          <div className="w-full lg:w-80 space-y-4">
            <div className="card p-5 space-y-4">
              <h2 className="font-bold text-[#e8e8f0]">بيانات المتاهة</h2>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-3 py-2">
                  {error}
                </div>
              )}

              <div>
                <label className="label">العنوان</label>
                <input className="input-field text-sm" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">الوصف</label>
                <textarea className="input-field text-sm resize-none h-20" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">الصعوبة</label>
                <select className="input-field text-sm" value={form.difficulty}
                  onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                  {[['easy','سهل'],['medium','متوسط'],['hard','صعب']].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">الوقت التقديري (دقائق)</label>
                <input type="number" className="input-field text-sm" value={form.estimated_minutes}
                  onChange={e => setForm(f => ({ ...f, estimated_minutes: e.target.value }))} dir="ltr" />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                  {saved ? 'تم الحفظ ✓' : saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                </button>
                <button
                  onClick={togglePublish}
                  className={`w-full flex items-center justify-center gap-2 btn-ghost text-sm ${
                    form.status === 'published' ? 'text-green-400 border-green-400/30' : ''
                  }`}
                >
                  {form.status === 'published' ? <><EyeOff size={14} /> إلغاء النشر</> : <><Eye size={14} /> نشر المتاهة</>}
                </button>
              </div>
            </div>

            {/* Zone coordinates display */}
            <div className="card p-4 space-y-2">
              <h3 className="text-sm font-bold text-[#e8e8f0]">إحداثيات النقاط</h3>
              {zones.start ? (
                <p className="text-xs text-[#6b6b8a]">
                  البداية: ({Math.round(zones.start.x)}, {Math.round(zones.start.y)}) r={Math.round(zones.start.radius)}
                </p>
              ) : <p className="text-xs text-[#2e2e4e]">لم تُحدَّد نقطة البداية</p>}
              {zones.end ? (
                <p className="text-xs text-[#6b6b8a]">
                  النهاية: ({Math.round(zones.end.x)}, {Math.round(zones.end.y)}) r={Math.round(zones.end.radius)}
                </p>
              ) : <p className="text-xs text-[#2e2e4e]">لم تُحدَّد نقطة النهاية</p>}
            </div>

            <button
              onClick={() => navigate(`/admin/attempts/${id}`)}
              className="btn-ghost w-full text-sm"
            >
              عرض المحاولات
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
