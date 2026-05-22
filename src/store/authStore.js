import { create } from 'zustand'

const SESSION_KEY = 'imaze_admin_session'
const PASS_HASH = '399b378b8a1bbab8ec9d0e72cd859c57a13414c26bf537199dc8c05b3f8c0a63'

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,

  init: async () => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    set({ user: saved ? JSON.parse(saved) : null, loading: false })
  },

  login: async (password) => {
    set({ error: null, loading: true })
    await new Promise(r => setTimeout(r, 350))
    const hash = await sha256(password.trim())
    if (hash !== PASS_HASH) {
      set({ error: '✕', loading: false })
      return false
    }
    const user = { id: 'admin' }
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
