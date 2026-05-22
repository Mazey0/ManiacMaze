import { create } from 'zustand'
import { IS_DEMO } from '../lib/supabase'

const SESSION_KEY = 'imaze_admin_session'

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,

  init: async () => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    set({ user: saved ? JSON.parse(saved) : null, loading: false })
  },

  login: async (username, password) => {
    set({ error: null, loading: true })
    await new Promise(r => setTimeout(r, 350))

    if (IS_DEMO) {
      // وضع تجريبي — أي كلمة مرور تنجح
      const user = { id: 'admin', username }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
      set({ user, loading: false })
      return true
    }

    const key = import.meta.env.VITE_ADMIN_KEY
    if (!key || password !== key) {
      set({ error: '✕', loading: false })
      return false
    }

    const user = { id: 'admin', username }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    set({ user, loading: false })
    return true
  },

  logout: () => {
    sessionStorage.removeItem(SESSION_KEY)
    set({ user: null })
  },

  clearError: () => set({ error: null }),
  isAdmin: () => !!get().user,
}))
