import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, loading, error, user } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => { if (user) navigate('/admin') }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await login(username, password)
    if (ok) navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <input
          type="text"
          className="input-field text-center tracking-widest"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          dir="ltr"
        />
        <input
          type="password"
          className="input-field text-center tracking-widest"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          dir="ltr"
        />
        {error && (
          <p className="text-center text-red-400 text-lg">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? '...' : '→'}
        </button>
      </form>
    </div>
  )
}
