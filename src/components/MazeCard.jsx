import { Link } from 'react-router-dom'
import { Clock, Layers, ChevronLeft } from 'lucide-react'

const DIFFICULTY_LABELS = { easy: 'سهل', medium: 'متوسط', hard: 'صعب', expert: 'خبير' }
const DIFFICULTY_COLORS = {
  easy: 'text-green-400 bg-green-400/10 border-green-400/20',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  hard: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  expert: 'text-red-400 bg-red-400/10 border-red-400/20',
}

export default function MazeCard({ maze, isAdmin = false }) {
  const diff = DIFFICULTY_COLORS[maze.difficulty] || DIFFICULTY_COLORS.medium

  return (
    <div className="card overflow-hidden hover:border-[#6c63ff]/40 transition-all duration-300 group cursor-pointer">
      {/* Maze thumbnail */}
      <div className="relative bg-[#0a0a0f] aspect-square overflow-hidden">
        {maze.processed_url ? (
          <img
            src={maze.processed_url}
            alt={maze.title}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-[#2e2e4e] text-4xl">⬡</span>
          </div>
        )}
        {/* Difficulty badge */}
        <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full border ${diff}`}>
          {DIFFICULTY_LABELS[maze.difficulty] || maze.difficulty}
        </span>
        {/* Category badge */}
        {maze.category && (
          <span className="absolute top-2 right-2 text-xs text-[#6b6b8a] bg-[#0a0a0f]/80 px-2 py-0.5 rounded-full border border-[#1e1e2e]">
            {maze.category}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-[#e8e8f0] mb-1 leading-snug line-clamp-1">{maze.title}</h3>
        {maze.description && (
          <p className="text-xs text-[#6b6b8a] mb-3 line-clamp-2 leading-relaxed">{maze.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-[#6b6b8a] mb-3">
          {maze.estimated_minutes && (
            <span className="flex items-center gap-1">
              <Clock size={11} /> {maze.estimated_minutes} د
            </span>
          )}
          {maze.category && (
            <span className="flex items-center gap-1">
              <Layers size={11} /> {maze.category}
            </span>
          )}
        </div>

        {isAdmin ? (
          <div className="flex gap-2">
            <Link to={`/admin/maze/${maze.id}`} className="btn-ghost text-xs px-3 py-1.5 flex-1 text-center">
              تعديل
            </Link>
            <Link to={`/admin/attempts/${maze.id}`} className="btn-ghost text-xs px-3 py-1.5 flex-1 text-center">
              المحاولات
            </Link>
          </div>
        ) : (
          <Link
            to={`/solve/${maze.id}`}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2"
          >
            ابدأ الحل <ChevronLeft size={14} />
          </Link>
        )}
      </div>
    </div>
  )
}
