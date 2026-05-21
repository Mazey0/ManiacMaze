import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Public pages
import HomePage from './pages/HomePage'
import GalleryPage from './pages/GalleryPage'
import SolverPage from './pages/SolverPage'

// Admin pages
import AdminLogin from './pages/Admin/AdminLogin'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminUpload from './pages/Admin/AdminUpload'
import AdminMazeEdit from './pages/Admin/AdminMazeEdit'
import AdminAttempts from './pages/Admin/AdminAttempts'
import AdminReplay from './pages/Admin/AdminReplay'

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
      <div className="text-[#6b6b8a] text-sm animate-pulse">جارٍ التحقق...</div>
    </div>
  )
  if (!user) return <Navigate to="/admin/login" replace />
  return children
}

export default function App() {
  const init = useAuthStore(s => s.init)

  useEffect(() => { init() }, [init])

  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/solve/:id" element={<SolverPage />} />

        {/* ── Admin ── */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/upload" element={<ProtectedRoute><AdminUpload /></ProtectedRoute>} />
        <Route path="/admin/maze/:id" element={<ProtectedRoute><AdminMazeEdit /></ProtectedRoute>} />
        <Route path="/admin/attempts/:id" element={<ProtectedRoute><AdminAttempts /></ProtectedRoute>} />
        <Route path="/admin/replay/:attemptId" element={<ProtectedRoute><AdminReplay /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
