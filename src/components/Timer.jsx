import { useSolverStore } from '../store/solverStore'

// Format ms → HH:MM:SS or MM:SS
function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Timer({ className = '' }) {
  const elapsedMs = useSolverStore(s => s.elapsedMs)
  const timerRunning = useSolverStore(s => s.timerRunning)
  const solved = useSolverStore(s => s.solved)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-[#6b6b8a]">الوقت</span>
      <span
        className={`font-mono font-bold tabular-nums text-sm ${
          solved
            ? 'text-green-400'
            : timerRunning
            ? 'text-[#6c63ff] timer-running'
            : 'text-[#6b6b8a]'
        }`}
      >
        {formatTime(elapsedMs)}
      </span>
      {!timerRunning && !solved && (
        <span className="text-xs text-[#6b6b8a] opacity-60">متوقف</span>
      )}
    </div>
  )
}

// Static display (admin / replay viewer)
export function StaticTimer({ elapsedMs, label, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-xs text-[#6b6b8a]">{label}</span>}
      <span className="font-mono font-bold tabular-nums text-sm text-[#e8e8f0]">
        {formatTime(elapsedMs)}
      </span>
    </div>
  )
}
