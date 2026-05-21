import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { IS_DEMO } from '../../lib/supabase'
import { Eye, EyeOff, LogIn, FlaskConical } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { login, loading, error, user, clearError } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => { if (user) navigate('/admin') }, [user])
  useEffect(() => { clearError() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await login(email, password)
    if (ok) navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-black text-white">Maniac<span className="text-[#6c63ff]"> Maze</span></span>
          <p className="text-[#6b6b8a] text-sm mt-1">لوحة تحكم الإدارة</p>
        </div>

        {IS_DEMO && (
          <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs rounded-xl px-4 py-3 mb-4">
            <FlaskConical size={14} className="flex-shrink-0" />
            <span>
              <strong>وضع تجريبي محلي</strong> — Supabase غير مُفعَّل.
              أدخل أي بريد وكلمة مرور وستدخل مباشرة.
              البيانات تُحفظ في المتصفح فقط.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <h1 className="text-lg font-bold text-[#e8e8f0] mb-2">تسجيل الدخول</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="label">البريد الإلكتروني</label>
            <input
              type="email"
              className="input-field"
              placeholder="admin@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              dir="ltr"
            />
          </div>

          <div>
            <label className="label">كلمة المرور</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field pl-10"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b8a] hover:text-[#e8e8f0]"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            <LogIn size={16} />
            {loading ? 'جارٍ الدخول...' : 'دخول'}
          </button>
        </form>

        <p className="text-center text-xs text-[#2e2e4e] mt-6">
          للحصول على حساب، تواصل مع مسؤول النظام
        </p>
      </div>
    </div>
  )
}
