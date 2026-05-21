import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { ChevronLeft, Zap, Lock, RefreshCw } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      {/* Hero */}
      <main className="pt-14 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6c63ff]/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto fade-in">
          {/* Logo mark */}
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#6c63ff]/10 border border-[#6c63ff]/30 flex items-center justify-center">
              <span className="text-xl font-black text-[#6c63ff]">⬡</span>
            </div>
            <span className="text-3xl font-black text-white tracking-tight">
              Maniac<span className="text-[#6c63ff]"> Maze</span>
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            تحدِّ نفسك في<br />
            <span className="text-[#6c63ff]">متاهة مهووس</span>
          </h1>

          <p className="text-[#6b6b8a] text-lg mb-10 leading-relaxed max-w-md mx-auto">
            متاهات مرسومة يدويًا بأشكال فريدة. ارسم مسارك بالقلم أو الإصبع، وسجّل أسرع وقت.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/gallery" className="btn-primary text-base px-8 py-3 flex items-center gap-2">
              تصفّح المتاهات <ChevronLeft size={16} />
            </Link>
            <Link to="/gallery" className="btn-ghost text-base px-8 py-3">
              كيف تلعب؟
            </Link>
          </div>
        </div>

        {/* Feature chips */}
        <div className="relative z-10 mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mx-auto px-4">
          {[
            { icon: <Zap size={18} />, title: 'رسم حرّ', desc: 'ارسم المسار بالقلم أو الإصبع أو الماوس' },
            { icon: <RefreshCw size={18} />, title: 'استكمل لاحقًا', desc: 'رسمك ووقتك محفوظان دائمًا' },
            { icon: <Lock size={18} />, title: 'متاهة مهووس', desc: 'أشكال هندسية فريدة من نوعها' },
          ].map((f, i) => (
            <div key={i} className="card p-5 text-right">
              <div className="text-[#6c63ff] mb-3">{f.icon}</div>
              <h3 className="font-bold text-[#e8e8f0] mb-1">{f.title}</h3>
              <p className="text-xs text-[#6b6b8a] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="relative z-10 mt-12 text-xs text-[#2e2e4e]">
          وضع التدريب — يتوقف العداد عند مغادرة الصفحة
        </p>
      </main>
    </div>
  )
}
