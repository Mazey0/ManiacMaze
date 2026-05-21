import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import MazeCard from '../components/MazeCard'
import { useMazeStore } from '../store/mazeStore'
import { Loader, Search } from 'lucide-react'

const DIFFICULTIES = ['الكل', 'easy', 'medium', 'hard']
const DIFF_AR = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' }

export default function GalleryPage() {
  const { mazes, loading, fetchPublished } = useMazeStore()
  const [search, setSearch] = useState('')
  const [diff, setDiff] = useState('الكل')

  useEffect(() => { fetchPublished() }, [])

  const filtered = mazes.filter(m => {
    const matchSearch = !search || m.title?.includes(search) || m.description?.includes(search)
    const matchDiff = diff === 'الكل' || m.difficulty === diff
    return matchSearch && matchDiff
  })

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="pt-20 max-w-6xl mx-auto px-4 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="section-title text-3xl">المتاهات</h1>
          <p className="section-sub">اختر متاهة وابدأ الحل</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-[#6b6b8a]" />
            <input
              className="input-field pr-9 text-sm"
              placeholder="ابحث عن متاهة..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Difficulty chips */}
          <div className="flex gap-2 flex-wrap">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setDiff(d)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                  diff === d
                    ? 'bg-[#6c63ff] border-[#6c63ff] text-white'
                    : 'border-[#1e1e2e] text-[#6b6b8a] hover:border-[#6c63ff]'
                }`}
              >
                {d === 'الكل' ? d : DIFF_AR[d]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#6b6b8a] gap-3">
            <Loader size={20} className="animate-spin" />
            <span>جارٍ التحميل...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#2e2e4e] text-5xl mb-4">⬡</p>
            <p className="text-[#6b6b8a]">لا توجد متاهات منشورة حتى الآن</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(maze => (
              <MazeCard key={maze.id} maze={maze} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
