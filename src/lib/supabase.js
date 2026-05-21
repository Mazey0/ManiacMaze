import { createClient } from '@supabase/supabase-js'

// ─── Supabase Configuration ───────────────────────────────────────────────────
// 1. انتقل إلى https://supabase.com → New Project
// 2. Settings → API → انسخ "Project URL" و "anon public"
// 3. أنشئ ملف .env وأضف:
//    VITE_SUPABASE_URL=https://xxxx.supabase.co
//    VITE_SUPABASE_ANON_KEY=eyJhbGci...

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// الوضع التجريبي: يعمل عندما لا توجد مفاتيح Supabase حقيقية
export const IS_DEMO = !supabaseUrl || supabaseUrl.includes('YOUR_PROJECT')

export const supabase = IS_DEMO
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })

export const BUCKETS = {
  MAZE_ORIGINALS: 'maze-originals',
  MAZE_PROCESSED: 'maze-processed',
  ATTEMPT_IMAGES: 'attempt-images',
}

export const TABLES = {
  MAZES: 'mazes',
  ATTEMPTS: 'attempts',
  STROKES: 'attempt_strokes',
}
