import { create } from 'zustand'
import { supabase, IS_DEMO } from '../lib/supabase'

const DEMO_SESSION_KEY = 'imaze_demo_admin'

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,
  isDemo: IS_DEMO,

  init: async () => {
    if (IS_DEMO) {
      // الوضع التجريبي: تحقق من جلسة محفوظة في sessionStorage
      const saved = sessionStorage.getItem(DEMO_SESSION_KEY)
      set({ user: saved ? { email: saved, id: 'demo' } : null, loading: false })
      return
    }
    const { data: { session } } = await supabase.auth.getSession()
    set({ user: session?.user ?? null, loading: false })
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null })
    })
  },

  login: async (email, password) => {
    set({ error: null, loading: true })

    if (IS_DEMO) {
      // الوضع التجريبي: أي بريد + كلمة مرور تعمل
      await new Promise(r => setTimeout(r, 600))
      const demoUser = { email, id: 'demo' }
      sessionStorage.setItem(DEMO_SESSION_KEY, email)
      set({ user: demoUser, loading: false })
      return true
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: error.message, loading: false })
      return false
    }
    set({ user: data.user, loading: false })
    return true
  },

  logout: async () => {
    if (!IS_DEMO) await supabase.auth.signOut()
    sessionStorage.removeItem(DEMO_SESSION_KEY)
    set({ user: null })
  },

  clearError: () => set({ error: null }),
  isAdmin: () => !!get().user,
}))
