import { create } from 'zustand'
import { supabase, IS_DEMO, TABLES, BUCKETS } from '../lib/supabase'

// ─── localStorage helpers for demo mode ──────────────────────────────────────
const LS_KEY = 'imaze_demo_mazes'
const loadLocal = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] } }
const saveLocal = (mazes) => localStorage.setItem(LS_KEY, JSON.stringify(mazes))
const genId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)

// ─── isAscii helper ───────────────────────────────────────────────────────────
const isAscii = (str) => typeof str === 'string' && /^[\x00-\x7F]*$/.test(str)

// ─── safeUploadToStorage ──────────────────────────────────────────────────────
// Single entry point for ALL Supabase Storage uploads.
// Rules:
//   • bucket, path, contentType must be ASCII-only strings
//   • file/blob content is read as ArrayBuffer then wrapped in a nameless Blob
//     so NO filename ever reaches the HTTP headers (avoids ISO-8859-1 error)
//   • options contain ONLY { contentType, upsert: true } — no metadata, no
//     cacheControl, no contentDisposition
//   • Arabic text (title, description, category) is NEVER passed here;
//     it lives only in the database
//
async function safeUploadToStorage(bucket, path, file, contentType) {
  const safeContentType = (isAscii(contentType) && contentType)
    ? contentType
    : 'application/octet-stream'

  // ── ASCII validation (defensive) ────────────────────────────────────────
  if (!isAscii(bucket)) {
    const err = new Error(`[safeUpload] bucket contains non-ASCII: "${bucket}"`)
    console.error('[safeUpload] INVALID BUCKET', { bucket, path, safeContentType }, err)
    throw err
  }
  if (!isAscii(path)) {
    const err = new Error(`[safeUpload] path contains non-ASCII: "${path}"`)
    console.error('[safeUpload] INVALID PATH', { bucket, path, safeContentType }, err)
    throw err
  }

  console.log(`[safeUpload] → bucket="${bucket}"  path="${path}"  type="${safeContentType}"`)

  try {
    // Read raw bytes — strips any filename / metadata from the File object
    const buffer     = await file.arrayBuffer()
    // Wrap in a plain Blob with no name property
    // (Supabase will use FormData internally, but Content-Disposition will
    //  have no filename since plain Blob has no .name)
    const uploadBlob = new Blob([buffer], { type: safeContentType })

    const { error } = await supabase.storage.from(bucket).upload(path, uploadBlob, {
      contentType: safeContentType,
      upsert:      true,
    })

    if (error) throw error

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    console.log(`[safeUpload] ✓ uploaded → ${data.publicUrl}`)
    return data.publicUrl

  } catch (err) {
    console.error(
      `[safeUpload] FAILED  bucket="${bucket}"  path="${path}"  type="${safeContentType}"`,
      err
    )
    throw err
  }
}

// ─── Zustand store ────────────────────────────────────────────────────────────
export const useMazeStore = create((set, get) => ({
  mazes: [],
  currentMaze: null,
  loading: false,
  error: null,

  fetchPublished: async () => {
    set({ loading: true })
    if (IS_DEMO) {
      const all = loadLocal()
      set({ mazes: all.filter(m => m.status === 'published'), loading: false })
      return
    }
    const { data, error } = await supabase
      .from(TABLES.MAZES).select('*').eq('status', 'published')
      .order('created_at', { ascending: false })
    if (error) { set({ error: error.message, loading: false }); return }
    set({ mazes: data, loading: false })
  },

  fetchAll: async () => {
    set({ loading: true })
    if (IS_DEMO) {
      set({ mazes: loadLocal(), loading: false })
      return
    }
    const { data, error } = await supabase
      .from(TABLES.MAZES).select('*').order('created_at', { ascending: false })
    if (error) { set({ error: error.message, loading: false }); return }
    set({ mazes: data, loading: false })
  },

  fetchOne: async (id) => {
    set({ loading: true })
    if (IS_DEMO) {
      const maze = loadLocal().find(m => m.id === id) || null
      set({ currentMaze: maze, loading: false })
      return maze
    }
    const { data, error } = await supabase
      .from(TABLES.MAZES).select('*').eq('id', id).single()
    if (error) { set({ error: error.message, loading: false }); return null }
    set({ currentMaze: data, loading: false })
    return data
  },

  createMaze: async (mazeData) => {
    if (IS_DEMO) {
      const maze = { ...mazeData, id: genId(), created_at: new Date().toISOString() }
      const all = [maze, ...loadLocal()]
      saveLocal(all)
      set({ mazes: all })
      return maze
    }
    const { data, error } = await supabase
      .from(TABLES.MAZES).insert([mazeData]).select().single()
    if (error) throw error
    return data
  },

  updateMaze: async (id, updates) => {
    if (IS_DEMO) {
      const all = loadLocal().map(m => m.id === id ? { ...m, ...updates } : m)
      saveLocal(all)
      const updated = all.find(m => m.id === id)
      set({ mazes: all, currentMaze: updated })
      return updated
    }
    const { data, error } = await supabase
      .from(TABLES.MAZES).update(updates).eq('id', id).select().single()
    if (error) throw error
    const mazes = get().mazes.map(m => m.id === id ? data : m)
    set({ mazes, currentMaze: data })
    return data
  },

  deleteMaze: async (id) => {
    if (IS_DEMO) {
      const all = loadLocal().filter(m => m.id !== id)
      saveLocal(all)
      set({ mazes: all })
      return
    }
    const { error } = await supabase.from(TABLES.MAZES).delete().eq('id', id)
    if (error) throw error
    set({ mazes: get().mazes.filter(m => m.id !== id) })
  },

  // uploadFile — public interface used by components.
  // path MUST be ASCII-only (use generateSafeFileName in the caller).
  // Arabic title/description must NEVER be passed here.
  uploadFile: async (bucket, path, file) => {
    // ── Demo mode: no Supabase, store locally ──────────────────────────────
    if (IS_DEMO) {
      if (file.type === 'application/pdf') return null   // can't display PDFs as data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => {
          const img = new Image()
          img.onload = () => {
            const MAX = 1400
            const scale = Math.min(1, MAX / Math.max(img.width, img.height))
            const canvas = document.createElement('canvas')
            canvas.width  = Math.round(img.width  * scale)
            canvas.height = Math.round(img.height * scale)
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
            resolve(canvas.toDataURL('image/jpeg', 0.90))
          }
          img.onerror = reject
          img.src = e.target.result
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }

    // ── Supabase Storage: route through safeUploadToStorage ───────────────
    const mimeType = (file instanceof Blob && file.type) || 'application/octet-stream'
    return safeUploadToStorage(bucket, path, file, mimeType)
  },

  setCurrentMaze: (maze) => set({ currentMaze: maze }),
  clearError: () => set({ error: null }),
}))
