import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const isAdmin = !!user

  const active = (path) =>
    location.pathname === path ? 'text-[#6c63ff]' : 'text-[#6b6b8a] hover:text-[#e8e8f0]'

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 glass border-b border-[#1e1e2e]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 select-none">
          <span className="text-lg font-black text-white tracking-tight">Maniac<span className="text-[#6c63ff]"> Maze</span></span>
          <span className="hidden sm:block text-xs text-[#6b6b8a] border border-[#2e2e4e] rounded px-1.5 py-0.5">متاهة مهووس</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className={`transition-colors duration-200 ${active('/')}`}>الرئيسية</Link>
          <Link to="/gallery" className={`transition-colors duration-200 ${active('/gallery')}`}>المتاهات</Link>
          {isAdmin && (
            <>
              <Link to="/admin" className={`transition-colors duration-200 ${active('/admin')}`}>لوحة التحكم</Link>
              <button onClick={logout} className="text-[#6b6b8a] hover:text-red-400 transition-colors duration-200">
                خروج
              </button>
            </>
          )}
          {!isAdmin && (
            <Link to="/admin/login" className="text-[#6b6b8a] hover:text-[#e8e8f0] transition-colors duration-200">
              المهووس
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
