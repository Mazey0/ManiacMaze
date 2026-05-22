import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const SOCIAL = [
  {
    name: 'X (Twitter)',
    handle: '@_iMaze_',
    url: 'https://x.com/_iMaze_',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.638 5.902-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    color: '#e8e8f0',
  },
  {
    name: 'Instagram',
    handle: '@iimaze_',
    url: 'https://www.instagram.com/iimaze_',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    color: '#e1306c',
  },
  {
    name: 'TikTok',
    handle: '@_imaze_',
    url: 'https://www.tiktok.com/@_imaze_',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.67a8.18 8.18 0 004.78 1.52V6.72a4.85 4.85 0 01-1.01-.03z"/>
      </svg>
    ),
    color: '#69C9D0',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

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

          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 leading-tight">
            تقدر تحل <span className="text-[#6c63ff]">متاهاتي</span>؟
          </h1>
          <p className="text-[#6c63ff] text-xl font-semibold mb-10 tracking-wide">
            Do you dare to solve my Mazes?
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/gallery" className="btn-primary text-base px-8 py-3 flex items-center gap-2">
              ابدأ التحدي ←
            </Link>
          </div>
        </div>

        {/* Social media cards */}
        <div className="relative z-10 mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full mx-auto px-4">
          {SOCIAL.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-5 flex flex-col items-center gap-3 hover:border-[#6c63ff]/40 transition-all duration-200 group"
            >
              <div style={{ color: s.color }} className="opacity-70 group-hover:opacity-100 transition-opacity">
                {s.icon}
              </div>
              <div className="text-center">
                <p className="font-bold text-[#e8e8f0] text-sm">{s.name}</p>
                <p className="text-xs text-[#6b6b8a] mt-0.5" dir="ltr">{s.handle}</p>
              </div>
            </a>
          ))}
        </div>

        <p className="relative z-10 mt-12 text-xs text-[#2e2e4e]">
          وضع التدريب — يتوقف العداد عند مغادرة الصفحة
        </p>
      </main>
    </div>
  )
}
