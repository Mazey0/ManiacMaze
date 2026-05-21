import { useState, useEffect, useRef } from 'react'
import { FileText, CheckCircle, Loader } from 'lucide-react'

// ─── PDF.js dynamic import ────────────────────────────────────────────────────
// We load pdfjs-dist lazily so it doesn't block the initial page load.
let pdfjsLib = null
async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib
  pdfjsLib = await import('pdfjs-dist')
  // Use the legacy build worker for compatibility (Vite + Safari)
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href
  return pdfjsLib
}

// ─── PDFPicker ────────────────────────────────────────────────────────────────
// Shows thumbnails of all PDF pages, lets admin select the maze page,
// renders it at high resolution, and exposes the page canvas + crop data.

export default function PDFPicker({ file, onPageSelected }) {
  const [thumbnails, setThumbnails] = useState([])
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fullCanvasRef = useRef(null)
  const pdfDocRef = useRef(null)

  // ── Load PDF and render all page thumbnails ──────────────────────────────
  useEffect(() => {
    if (!file) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      setThumbnails([])
      setSelected(0)

      try {
        const lib = await getPdfJs()
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await lib.getDocument({ data: arrayBuffer }).promise
        pdfDocRef.current = pdf

        const thumbs = []
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 0.3 })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')
          await page.render({ canvasContext: ctx, viewport }).promise
          thumbs.push({ pageNum: i, dataUrl: canvas.toDataURL() })
        }
        if (!cancelled) {
          setThumbnails(thumbs)
          setLoading(false)
          // Auto-render the first page
          renderFullPage(1)
        }
      } catch (e) {
        if (!cancelled) {
          setError('تعذّر تحميل ملف PDF')
          setLoading(false)
          console.error(e)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [file])

  // ── Render selected page at high resolution + auto-crop ──────────────────
  const renderFullPage = async (pageNum) => {
    const pdf = pdfDocRef.current
    if (!pdf) return

    try {
      const page = await pdf.getPage(pageNum)
      // Render at 3× for quality (admin cropping needs detail)
      const viewport = page.getViewport({ scale: 3 })
      const canvas = fullCanvasRef.current
      if (!canvas) return
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvasContext: ctx, viewport }).promise

      // Auto-detect maze content bounds on the rendered canvas
      const cropBounds = detectContentBounds(canvas)
      onPageSelected?.({ pageNum, canvas, cropBounds })
    } catch (e) {
      console.error('Page render error:', e)
    }
  }

  const handleSelect = (pageNum) => {
    setSelected(pageNum - 1)
    renderFullPage(pageNum)
  }

  return (
    <div className="space-y-4">
      {/* Hidden high-res canvas used by parent */}
      <canvas ref={fullCanvasRef} className="hidden" />

      {loading && (
        <div className="flex items-center gap-3 text-[#6b6b8a] py-4">
          <Loader size={16} className="animate-spin" />
          <span className="text-sm">جارٍ تحليل ملف PDF...</span>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {thumbnails.length > 0 && (
        <div>
          <p className="label mb-3">اختر الصفحة التي تحتوي على المتاهة ({thumbnails.length} صفحات)</p>
          <div className="flex flex-wrap gap-3">
            {thumbnails.map((t, idx) => (
              <button
                key={t.pageNum}
                onClick={() => handleSelect(t.pageNum)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  selected === idx
                    ? 'border-[#6c63ff] shadow-lg shadow-[#6c63ff]/20'
                    : 'border-[#1e1e2e] hover:border-[#2e2e4e]'
                }`}
              >
                <img src={t.dataUrl} alt={`صفحة ${t.pageNum}`} className="block h-28 w-auto" />
                <span className="absolute bottom-1 right-1 text-xs bg-[#0a0a0f]/80 text-[#6b6b8a] px-1.5 rounded">
                  {t.pageNum}
                </span>
                {selected === idx && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#6c63ff]/10">
                    <CheckCircle size={24} className="text-[#6c63ff]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── detectContentBounds ───────────────────────────────────────────────────────
// Scans the canvas pixel data to find the bounding box of non-white content.
// Returns { x, y, w, h } in canvas pixels, plus padding.
function detectContentBounds(canvas, padding = 40) {
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  let minX = width, maxX = 0, minY = height, maxY = 0
  const threshold = 230 // pixels darker than this are "content"

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx], g = data[idx + 1], b = data[idx + 2]
      const brightness = (r + g + b) / 3
      if (brightness < threshold) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  // Fallback: full canvas if nothing found
  if (minX >= maxX || minY >= maxY) {
    return { x: 0, y: 0, w: width, h: height }
  }

  return {
    x: Math.max(0, minX - padding),
    y: Math.max(0, minY - padding),
    w: Math.min(width, maxX - minX + padding * 2),
    h: Math.min(height, maxY - minY + padding * 2),
  }
}
