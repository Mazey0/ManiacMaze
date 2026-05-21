import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { supabase, TABLES } from '../../lib/supabase'
import { useMazeStore } from '../../store/mazeStore'
import { StaticTimer } from '../../components/Timer'
import { Play, Smartphone, Monitor, Tablet, CheckCircle, Clock } from 'lucide-react'

function DeviceIcon({ type }) {
  if (type === 'mobile') return <Smartphone size={14} />
  if (type === 'tablet') return <Tablet size={14} />
  return <Monitor size={14} />
}

export default function AdminAttempts() {
  const { id } = useParams()
  const { fetchOne, currentMaze } = useMazeStore()
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOne(id)
    loadAttempts()
  }, [id])

  const loadAttempts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from(TABLES.ATTEMPTS)
      .select('*')
      .eq('maze_id', id)
      .order('submitted_at', { ascending: false })
    if (!error) setAttempts(data || [])
    setLoading(false)
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('ar-SA', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="pt-20 max-w-5xl mx-auto px-4 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title">المحاولات</h1>
            {currentMaze && <p className="section-sub">{currentMaze.title}</p>}
          </div>
          <Link to={`/admin/maze/${id}`} className="btn-ghost text-sm">رجوع للمتاهة</Link>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card p-4 text-center">
              <div className="text-2xl font-black text-[#e8e8f0]">{attempts.length}</div>
              <div className="text-xs text-[#6b6b8a]">إجمالي المحاولات</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-black text-green-400">
                {attempts.filter(a => a.solved).length}
              </div>
              <div className="text-xs text-[#6b6b8a]">تم الحل</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-black text-[#6c63ff]">
                {attempts.filter(a => a.interrupted).length}
              </div>
              <div className="text-xs text-[#6b6b8a]">متقطّعة</div>
            </div>
          </div>
        )}

        {/* Attempts table */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#6b6b8a]">
            جارٍ التحميل...
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-20 text-[#6b6b8a]">
            لا توجد محاولات بعد
          </div>
        ) : (
          <div className="space-y-2">
            {attempts.map(attempt => (
              <div key={attempt.id} className="card p-4 flex items-center gap-4">
                {/* Solved indicator */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  attempt.solved ? 'bg-green-500/10 text-green-400' : 'bg-[#1e1e2e] text-[#6b6b8a]'
                }`}>
                  {attempt.solved ? <CheckCircle size={16} /> : <Clock size={16} />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <StaticTimer elapsedMs={attempt.elapsed_ms} label="الوقت:" />
                    <span className="text-xs text-[#6b6b8a] flex items-center gap-1">
                      <DeviceIcon type={attempt.device_type} />
                      {attempt.device_type || '—'}
                    </span>
                    {attempt.interrupted && (
                      <span className="text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                        متقطّعة
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#2e2e4e] mt-1">{formatDate(attempt.submitted_at)}</p>
                </div>

                {/* Actions */}
                <Link
                  to={`/admin/replay/${attempt.id}`}
                  className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5 flex-shrink-0"
                >
                  <Play size={12} /> إعادة تشغيل الحل
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
