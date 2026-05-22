import { create } from 'zustand'
import { IS_DEMO } from '../lib/supabase'

const SESSION_KEY = 'imaze_admin_session'
const ADMIN_PIN = '1997'

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,
  pendingEmail: null,

  init: async () => {
    const saved = sessionStorage.getItem(SESSION_KEY)
    set({ user: saved ? JSON.parse(saved) : null, loading: false })
  },

  login: async (email, password) => {
    set({ error: null, loading: true })
    await new Promise(r => setTimeout(r, 400))

    if (IS_DEMO) {
      set({ loading: false, pendingEmail: email })
      return 'pin'
    }

    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
    const adminPass  = import.meta.env.VITE_ADMIN_PASS

    if (!adminEmail || !adminPass) {
      set({ error: 'بيانات الدخول غير مُكوَّنة على الخادم', loading: false })
      return false
    }

    if (email.trim() !== adminEmail.trim() || password !== adminPass) {
      set({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', loading: false })
      return false
    }

    set({ loading: false, pendingEmail: email })
    return 'pin'
  },

  verifyPin: (pin) => {
    if (pin !== ADMIN_PIN) {
      set({ error: 'رمز التحقق غير صحيح' })
      return false
    }
    const email = get().pendingEmail
    const user = { email, id: 'admin' }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user))
    set({ user, pendingEmail: null, error: null })
    return true
  },

  logout: () => {
    sessionStorage.removeItem(SESSION_KEY)
    set({ user: null, pendingEmail: null })
  },

  clearError: () => set({ error: null }),
  isAdmin: () => !!get().user,
}))
