import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import PDFPicker from '../../components/PDFPicker'
import { useMazeStore } from '../../store/mazeStore'
import { BUCKETS } from '../../lib/supabase'
import { generateSafeFileName } from '../../lib/fileUtils'
import { Upload, FileText, Image, Crop, ArrowRight, Check, Loader } from 'lucide-react'

const STEPS = ['رفع الملف', 'اختيار الصفحة', 'قص المتاهة', 'البيانات', 'حفظ']

// Convert canvas crop to a Blob
async function cropCanvasToBlob(srcCanvas, crop) {
  const out = document.createElement('canvas')
  out.width = crop.w
  out.height = crop.h
  const ctx = out.getContext('2d')
  ctx.drawImage(srcCanvas, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h)
  return new Promise(res => out.toBlob(res, 'image/png', 1.0))
}

export default function AdminUpload() {
  const navigate = useNavigate()
  const { createMaze, uploadFile } = useMazeStore()
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(0)
  const [file, setFile] = useState(null)
  const [pageData, setPageData] = useState(null)      // { pageNum, canvas, cropBounds }
  const [crop, setCrop] = useState(null)               // { x, y, w, h }
  const [previewUrl, setPreviewUrl] = useState(null)
  const [form, setForm] = useState({
    title: '', description: '', category: '', difficulty: 'medium',
    estimated_minutes: '', status: 'draft',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // ── Step 0: File selection ────────────────────────────────────────────────
  const handleFileDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer?.files[0] || e.target.files?.[0]
    if (!f) return
    setFile(f)
    if (f.type === 'application/pdf') {
      setStep(1)
    } else {
      // Direct image — skip PDF page selection
      handleDirectImage(f)
    }
  }

  const handleDirectImage = (imgFile) => {
    const url = URL.createObjectURL(imgFile)
    const img = document.createElement('img')
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      setPageData({ pageNum: 1, canvas, cropBounds: { x: 0, y: 0, w: canvas.width, h: canvas.height } })
      setCrop({ x: 0, y: 0, w: canvas.width, h: canvas.height })
      setStep(2)
    }
    img.src = url
  }

  // ── Step 1: PDF page selected ─────────────────────────────────────────────
  const handlePageSelected = ({ pageNum, canvas, cropBounds }) => {
    setPageData({ pageNum, canvas, cropBounds })
    setCrop(cropBounds)
  }

  // ── Step 2: Confirm crop ──────────────────────────────────────────────────
  const handleConfirmCrop = async () => {
    if (!pageData?.canvas || !crop) return
    const blob = await cropCanvasToBlob(pageData.canvas, crop)
    const url = URL.createObjectURL(blob)
    setPreviewUrl(url)
    setStep(3)
  }

  // ── Step 4: Save to Supabase ──────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title) { setError('أضف عنوانًا للمتاهة'); return }
    setSaving(true)
    setError(null)

    try {
      const blob = await cropCanvasToBlob(pageData.canvas, crop)

      // Upload original file — ASCII-only filename, no Arabic anywhere in path or headers
      let originalUrl = null
      if (file) {
        const origName = generateSafeFileName(file.type)
        originalUrl = await uploadFile(BUCKETS.MAZE_ORIGINALS, origName, file)
      }

      // Upload processed PNG image — ASCII-only filename, high quality
      const procName = generateSafeFileName('image/png')
      const processedUrl = await uploadFile(BUCKETS.MAZE_PROCESSED, procName, blob)

      // Create DB record
      const maze = await createMaze({
        title: form.title,
        description: form.description,
        category: form.category,
        difficulty: form.difficulty,
        estimated_minutes: form.estimated_minutes ? parseInt(form.estimated_minutes) : null,
        status: form.status,
        original_url: originalUrl,
        processed_url: processedUrl,
        width: crop.w,
        height: crop.h,
        zones: null, // admin marks zones in next step (AdminMazeEdit)
      })

      navigate(`/admin/maze/${maze.id}`)
    } catch (e) {
      setError(e.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="pt-20 max-w-3xl mx-auto px-4 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title text-2xl">رفع متاهة</h1>
          <p className="section-sub">اتبع الخطوات لإضافة متاهة جديدة</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'bg-[#6c63ff] text-white'
                  : i === step ? 'bg-[#6c63ff]/20 border-2 border-[#6c63ff] text-[#6c63ff]'
                  : 'bg-[#12121a] border border-[#1e1e2e] text-[#6b6b8a]'
              }`}>
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-[#e8e8f0]' : 'text-[#6b6b8a]'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-[#1e1e2e]" />}
            </div>
          ))}
        </div>

        {/* ── Step 0: Upload ──────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="card p-8">
            <div
              className="border-2 border-dashed border-[#1e1e2e] hover:border-[#6c63ff]/50 rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 group"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleFileDrop}
              onDragOver={e => e.preventDefault()}
            >
              <div className="flex items-center justify-center gap-4 mb-4">
                <FileText size={32} className="text-[#6b6b8a] group-hover:text-[#6c63ff] transition-colors" />
                <Image size={32} className="text-[#6b6b8a] group-hover:text-[#6c63ff] transition-colors" />
              </div>
              <p className="text-[#e8e8f0] font-semibold mb-2">اسحب الملف هنا أو انقر للاختيار</p>
              <p className="text-[#6b6b8a] text-sm">يدعم: PDF, PNG, JPG, SVG</p>
              <p className="text-xs text-[#2e2e4e] mt-2">يُفضَّل رفع PDF للحصول على أعلى جودة</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.svg,.webp"
              className="hidden"
              onChange={handleFileDrop}
            />
          </div>
        )}

        {/* ── Step 1: PDF page picker ─────────────────────────────────────── */}
        {step === 1 && file && (
          <div className="card p-6 space-y-4">
            <PDFPicker file={file} onPageSelected={handlePageSelected} />
            {pageData && (
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setStep(0)} className="btn-ghost">رجوع</button>
                <button onClick={() => setStep(2)} className="btn-primary flex items-center gap-2">
                  التالي <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Crop adjustment ──────────────────────────────────────── */}
        {step === 2 && pageData && (
          <div className="card p-6 space-y-4">
            <h2 className="font-bold text-[#e8e8f0]">قص المتاهة</h2>
            <p className="text-sm text-[#6b6b8a]">
              الاقتصاص التلقائي: x={Math.round(crop?.x)}, y={Math.round(crop?.y)},
              عرض={Math.round(crop?.w)}, ارتفاع={Math.round(crop?.h)}
            </p>

            {/* Preview of the selected page */}
            {pageData.canvas && (
              <div className="relative overflow-hidden rounded-xl border border-[#1e1e2e]">
                <img
                  src={pageData.canvas.toDataURL()}
                  alt="معاينة الصفحة"
                  className="w-full max-h-80 object-contain bg-white"
                />
                {/* Crop overlay visualization */}
                {crop && (
                  <div
                    className="absolute border-2 border-[#6c63ff] pointer-events-none"
                    style={{
                      left: `${(crop.x / pageData.canvas.width) * 100}%`,
                      top: `${(crop.y / pageData.canvas.height) * 100}%`,
                      width: `${(crop.w / pageData.canvas.width) * 100}%`,
                      height: `${(crop.h / pageData.canvas.height) * 100}%`,
                    }}
                  />
                )}
              </div>
            )}

            {/* Manual crop inputs */}
            <div className="grid grid-cols-2 gap-3">
              {['x', 'y', 'w', 'h'].map(k => (
                <div key={k}>
                  <label className="label">{k === 'x' ? 'يسار' : k === 'y' ? 'أعلى' : k === 'w' ? 'عرض' : 'ارتفاع'}</label>
                  <input
                    type="number"
                    className="input-field text-sm"
                    value={Math.round(crop?.[k] || 0)}
                    onChange={e => setCrop(prev => ({ ...prev, [k]: Number(e.target.value) }))}
                    dir="ltr"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                // Reset to auto-detected crop
                if (pageData.cropBounds) setCrop(pageData.cropBounds)
              }}
              className="btn-ghost text-sm"
            >
              إعادة الاقتصاص التلقائي
            </button>

            <div className="flex justify-end gap-3">
              <button onClick={() => setStep(1)} className="btn-ghost">رجوع</button>
              <button onClick={handleConfirmCrop} className="btn-primary flex items-center gap-2">
                تأكيد القص <Crop size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Metadata form ─────────────────────────────────────────── */}
        {step === 3 && previewUrl && (
          <div className="card p-6 space-y-5">
            <h2 className="font-bold text-[#e8e8f0]">بيانات المتاهة</h2>

            {/* Preview */}
            <div className="relative bg-[#0a0a0f] rounded-xl overflow-hidden border border-[#1e1e2e] h-40">
              <img src={previewUrl} alt="معاينة" className="w-full h-full object-contain p-2" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="label">العنوان *</label>
              <input className="input-field" placeholder="مثال: متاهة الدائرة" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="label">الوصف</label>
              <textarea className="input-field resize-none h-20" placeholder="وصف قصير..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="label">الصعوبة</label>
              <select className="input-field" value={form.difficulty}
                onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                <option value="easy">سهل</option>
                <option value="medium">متوسط</option>
                <option value="hard">صعب</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">الوقت التقديري (دقائق)</label>
                <input type="number" className="input-field" placeholder="مثال: 10"
                  value={form.estimated_minutes} onChange={e => setForm(f => ({ ...f, estimated_minutes: e.target.value }))} dir="ltr" />
              </div>
              <div>
                <label className="label">الحالة</label>
                <select className="input-field" value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="draft">مسودة</option>
                  <option value="testing">اختبار</option>
                  <option value="published">نشر</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setStep(2)} className="btn-ghost">رجوع</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <><Loader size={14} className="animate-spin" /> جارٍ الحفظ...</> : <><Check size={14} /> حفظ وتحديد النقاط</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
