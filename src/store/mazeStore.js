import { create } from 'zustand'
import { supabase, IS_DEMO, TABLES, BUCKETS } from '../lib/supabase'

// ─── localStorage helpers for demo mode ──────────────────────────────────────
const LS_KEY = 'imaze_demo_mazes'
const loadLocal = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] } }
const saveLocal = (mazes) => localStorage.setItem(LS_KEY, JSON.stringify(mazes))
const genId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)

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

  // في الوضع التجريبي: نضغط الصورة ونخزّنها محلياً (max 1400px لتجنب تجاوز حد localStorage)
  uploadFile: async (bucket, path, file) => {
    if (IS_DEMO) {
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
            // JPEG بجودة 90% تعطي حجماً أصغر بكثير من PNG
            resolve(canvas.toDataURL('image/jpeg', 0.90))
          }
          img.onerror = reject
          img.src = e.target.result
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }
    // Convert File → Blob to strip any non-ASCII filename that would break fetch headers
    const safeBody = (file instanceof File)
      ? new Blob([file], { type: file.type || 'application/octet-stream' })
      : file
    // Encode path so non-ASCII characters in the URL don't cause fetch errors
    const safePath = path.split('/').map(encodeURIComponent).join('/')
    const { error } = await supabase.storage.from(bucket).upload(safePath, safeBody, {
      cacheControl: '3600', upsert: true,
      contentType: safeBody.type || 'application/octet-stream',
    })
    if (error) throw error
    const { data } = supabase.storage.from(bucket).getPublicUrl(safePath)
    return data.publicUrl
  },

  setCurrentMaze: (maze) => set({ currentMaze: maze }),
  clearError: () => set({ error: null }),
}))
