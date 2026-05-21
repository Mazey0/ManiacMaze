import { create } from 'zustand'
import { supabase, IS_DEMO, TABLES } from '../lib/supabase'

const genId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
const ATTEMPTS_KEY = 'imaze_demo_attempts'

// Draft key prefix for localStorage (temporary in-progress saves)
const DRAFT_KEY = (mazeId) => `imaze_draft_${mazeId}`

// Solver store — manages active solving session, timer, strokes
export const useSolverStore = create((set, get) => ({
  mazeId: null,
  strokes: [],           // Array of stroke objects: { points: [{x,y,t,p}], color, width }
  currentStroke: null,   // Stroke being drawn right now
  elapsedMs: 0,          // Total elapsed milliseconds
  timerRunning: false,
  solved: false,
  submitted: false,
  startedAt: null,       // ISO timestamp of first draw
  timerRef: null,        // setInterval reference

  // ─── Timer controls ──────────────────────────────────────────────────────
  startTimer: () => {
    if (get().timerRunning) return
    const last = Date.now()
    const ref = setInterval(() => {
      set(s => ({ elapsedMs: s.elapsedMs + (Date.now() - last) }))
      // Drift correction: update last each tick via closure
    }, 100)
    // Use a more accurate approach with Date.now()
    let lastTick = Date.now()
    clearInterval(ref)
    const accurateRef = setInterval(() => {
      const now = Date.now()
      set(s => ({ elapsedMs: s.elapsedMs + (now - lastTick) }))
      lastTick = now
    }, 100)

    set({ timerRunning: true, timerRef: accurateRef, startedAt: get().startedAt || new Date().toISOString() })
  },

  // Practice Mode: pauses timer on page hide / tab switch
  // Future Challenge Mode: remove this pause and let timer run server-side
  pauseTimer: () => {
    const { timerRef } = get()
    if (timerRef) clearInterval(timerRef)
    set({ timerRunning: false, timerRef: null })
    get().saveDraft()
  },

  stopTimer: () => {
    const { timerRef } = get()
    if (timerRef) clearInterval(timerRef)
    set({ timerRunning: false, timerRef: null })
  },

  // ─── Session init ─────────────────────────────────────────────────────────
  loadOrInit: (mazeId) => {
    const draft = localStorage.getItem(DRAFT_KEY(mazeId))
    if (draft) {
      try {
        const saved = JSON.parse(draft)
        set({
          mazeId,
          strokes: saved.strokes || [],
          elapsedMs: saved.elapsedMs || 0,
          solved: saved.solved || false,
          submitted: saved.submitted || false,
          startedAt: saved.startedAt || null,
          currentStroke: null,
          timerRunning: false,
        })
        return
      } catch { /* corrupted draft — start fresh */ }
    }
    set({
      mazeId,
      strokes: [],
      elapsedMs: 0,
      timerRunning: false,
      solved: false,
      submitted: false,
      startedAt: null,
      currentStroke: null,
    })
  },

  // ─── Drawing ──────────────────────────────────────────────────────────────
  beginStroke: (point, color = '#6c63ff', width = 3) => {
    if (!get().timerRunning && !get().solved) get().startTimer()
    set({ currentStroke: { points: [point], color, width } })
  },

  addPoint: (point) => {
    const cs = get().currentStroke
    if (!cs) return
    set({ currentStroke: { ...cs, points: [...cs.points, point] } })
  },

  endStroke: () => {
    const cs = get().currentStroke
    if (!cs || cs.points.length < 2) { set({ currentStroke: null }); return }
    set(s => ({ strokes: [...s.strokes, cs], currentStroke: null }))
    get().saveDraft()
  },

  undo: () => {
    set(s => ({ strokes: s.strokes.slice(0, -1) }))
    get().saveDraft()
  },

  clearStrokes: () => {
    set({ strokes: [], currentStroke: null })
    get().saveDraft()
  },

  restart: () => {
    get().stopTimer()
    set({ strokes: [], currentStroke: null, elapsedMs: 0, solved: false, submitted: false, startedAt: null })
    localStorage.removeItem(DRAFT_KEY(get().mazeId))
  },

  setSolved: () => {
    get().stopTimer()
    set({ solved: true })
    get().saveDraft()
  },

  // ─── Persistence ─────────────────────────────────────────────────────────
  saveDraft: () => {
    const { mazeId, strokes, elapsedMs, solved, submitted, startedAt } = get()
    if (!mazeId) return
    localStorage.setItem(DRAFT_KEY(mazeId), JSON.stringify({ strokes, elapsedMs, solved, submitted, startedAt }))
  },

  // Submit completed attempt
  submitAttempt: async (mazeId, deviceInfo) => {
    const { strokes, elapsedMs, startedAt, solved } = get()

    if (IS_DEMO) {
      const attempt = {
        id: genId(),
        maze_id: mazeId,
        elapsed_ms: elapsedMs,
        started_at: startedAt,
        submitted_at: new Date().toISOString(),
        solved,
        device_type: deviceInfo?.type || 'unknown',
      }
      try {
        const all = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '[]')
        localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([attempt, ...all]))
      } catch { /* quota — skip saving attempt */ }
      set({ submitted: true })
      localStorage.removeItem(DRAFT_KEY(mazeId))
      return attempt
    }

    const attemptPayload = {
      maze_id: mazeId,
      elapsed_ms: elapsedMs,
      started_at: startedAt,
      submitted_at: new Date().toISOString(),
      solved,
      interrupted: false,
      device_type: deviceInfo?.type || 'unknown',
      device_info: deviceInfo || {},
    }
    const { data: attempt, error: aErr } = await supabase
      .from(TABLES.ATTEMPTS)
      .insert([attemptPayload])
      .select()
      .single()
    if (aErr) throw aErr

    if (strokes.length > 0) {
      const strokeRows = strokes.map((s, idx) => ({
        attempt_id: attempt.id,
        stroke_index: idx,
        points: s.points,
        color: s.color,
        width: s.width,
      }))
      const { error: sErr } = await supabase.from(TABLES.STROKES).insert(strokeRows)
      if (sErr) console.warn('Strokes save error:', sErr.message)
    }

    set({ submitted: true })
    localStorage.removeItem(DRAFT_KEY(mazeId))
    return attempt
  },

  cleanup: () => {
    get().pauseTimer()
    set({ currentStroke: null })
  },
}))
