import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react'

export default function AdminLogin() {
  const [step, setStep]         = useState('credentials')  // 'credentials' | 'pin'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [pin, setPin]           = useState('')
  const pinRef                  = useRef(null)

  const { login, verifyPin, loading, error, user, clearError } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => { if (user) navigate('/admin') }, [user])
  useEffect(() => { clearError() }, [step])

  // Step 1 — credentials
  const handleCredentials = async (e) => {
    e.preventDefault()
    const result = await login(email, password)
    if (result === 'pin') {
      setStep('pin')
      setTimeout(() => pinRef.current?.focus(), 100)
    }
  }

  // Step 2 — PIN
  const handlePin = (e) => {
    e.preventDefault()
    const ok = verifyPin(pin)
    if (ok) navigate('/admin')
  }

  // Auto-submit PIN when 4 digits entered
  const handlePinChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    setPin(digits)
    if (digits.length === 4) {
      const ok = verifyPin(digits)
      if (ok) navigate('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-black text-white">Maniac<span className="text-[#6c63ff]"> Maze</span></span>
          <p className="text-[#6b6b8a] text-sm mt-1">لوحة تحكم الإدارة</p>
        </div>

        {/* ── Step 1: credentials ── */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentials} className="card p-6 space-y-4">
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
              {loading ? 'جارٍ التحقق...' : 'دخول'}
            </button>
          </form>
        )}

        {/* ── Step 2: PIN ── */}
        {step === 'pin' && (
          <form onSubmit={handlePin} className="card p-6 space-y-5 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#6c63ff]/10 border border-[#6c63ff]/30 mx-auto">
              <ShieldCheck size={22} className="text-[#6c63ff]" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-[#e8e8f0]">رمز التحقق</h1>
              <p className="text-xs text-[#6b6b8a] mt-1">أدخل الرمز المكوّن من 4 أرقام</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* PIN dots display */}
            <div className="flex justify-center gap-3" dir="ltr">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-black transition-all ${
                    pin.length > i
                      ? 'border-[#6c63ff] bg-[#6c63ff]/10 text-[#6c63ff]'
                      : pin.length === i
                      ? 'border-[#6c63ff]/50 bg-[#6c63ff]/5'
                      : 'border-[#1e1e2e]'
                  }`}
                >
                  {pin.length > i ? '●' : ''}
                </div>
              ))}
            </div>

            {/* Hidden input */}
            <input
              ref={pinRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={e => handlePinChange(e.target.value)}
              className="opacity-0 absolute w-0 h-0"
              autoFocus
            />

            {/* Tap to focus */}
            <button
              type="button"
              onClick={() => pinRef.current?.focus()}
              className="text-xs text-[#6c63ff] underline underline-offset-2"
            >
              انقر هنا لفتح لوحة المفاتيح
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setStep('credentials'); setPin('') }}
                className="btn-ghost flex-1 text-sm"
              >
                رجوع
              </button>
              <button
                type="submit"
                disabled={pin.length < 4}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={14} />
                تأكيد
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-[#2e2e4e] mt-6">
          للحصول على حساب، تواصل مع مسؤول النظام
        </p>
      </div>
    </div>
  )
}
