import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import MazeCard from '../../components/MazeCard'
import { useMazeStore } from '../../store/mazeStore'
import { IS_DEMO } from '../../lib/supabase'
import { Plus, Loader, Eye, EyeOff, FlaskConical } from 'lucide-react'

const STATUS_AR = { draft: 'مسودة', testing: 'اختبار', published: 'منشور' }
const STATUS_COLOR = {
  draft: 'text-[#6b6b8a] border-[#2e2e4e]',
  testing: 'text-yellow-400 border-yellow-400/30',
  published: 'text-green-400 border-green-400/30',
}

export default function AdminDashboard() {
  const { mazes, loading, fetchAll, updateMaze } = useMazeStore()

  useEffect(() => { fetchAll() }, [])

  const togglePublish = async (maze) => {
    const newStatus = maze.status === 'published' ? 'draft' : 'published'
    await updateMaze(maze.id, { status: newStatus })
  }

  const counts = {
    all: mazes.length,
    published: mazes.filter(m => m.status === 'published').length,
    draft: mazes.filter(m => m.status === 'draft').length,
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="pt-20 max-w-6xl mx-auto px-4 pb-16">
        {/* Demo mode banner */}
        {IS_DEMO && (
          <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs rounded-xl px-4 py-3 mb-6">
            <FlaskConical size={14} className="flex-shrink-0" />
            <span>
              <strong>وضع تجريبي</strong> — البيانات تُحفظ في المتصفح فقط.
              لحفظها بشكل دائم أضف مفاتيح Supabase في ملف <code className="bg-black/30 px-1 rounded">.env</code>
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title text-3xl">لوحة التحكم</h1>
            <p className="section-sub">إدارة المتاهات والمحاولات</p>
          </div>
          <Link to="/admin/upload" className="btn-primary flex items-center gap-2">
            <Plus size={16} /> رفع متاهة
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'إجمالي', value: counts.all },
            { label: 'منشور', value: counts.published },
            { label: 'مسودة', value: counts.draft },
          ].map((s, i) => (
            <div key={i} className="card p-4 text-center">
              <div className="text-2xl font-black text-[#e8e8f0]">{s.value}</div>
              <div className="text-xs text-[#6b6b8a] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Maze list */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#6b6b8a] gap-3">
            <Loader size={20} className="animate-spin" />
            <span>جارٍ التحميل...</span>
          </div>
        ) : mazes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#2e2e4e] text-5xl mb-4">⬡</p>
            <p className="text-[#6b6b8a] mb-4">لا توجد متاهات بعد</p>
            <Link to="/admin/upload" className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} /> رفع أول متاهة
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {mazes.map(maze => (
              <div key={maze.id} className="card p-4 flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-14 h-14 bg-[#0a0a0f] rounded-xl overflow-hidden flex-shrink-0">
                  {maze.processed_url ? (
                    <img src={maze.processed_url} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#2e2e4e]">⬡</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-[#e8e8f0] truncate">{maze.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLOR[maze.status] || STATUS_COLOR.draft}`}>
                      {STATUS_AR[maze.status] || maze.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b6b8a] mt-0.5 truncate">{maze.description || 'بدون وصف'}</p>
                  <p className="text-xs text-[#2e2e4e] mt-1">{maze.difficulty} · {maze.category || '—'}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => togglePublish(maze)}
                    className={`btn-icon ${maze.status === 'published' ? 'text-green-400 border-green-400/30' : ''}`}
                    title={maze.status === 'published' ? 'إلغاء النشر' : 'نشر'}
                  >
                    {maze.status === 'published' ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <Link to={`/admin/attempts/${maze.id}`} className="btn-ghost text-xs px-3 py-2">
                    المحاولات
                  </Link>
                  <Link to={`/admin/maze/${maze.id}`} className="btn-primary text-xs px-3 py-2">
                    تعديل
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
