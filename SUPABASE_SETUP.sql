-- ─────────────────────────────────────────────────────────────────────────────
-- iMaze — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── mazes ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mazes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT,
  difficulty       TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  estimated_minutes INT,
  status           TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'testing', 'published')),
  original_url     TEXT,    -- raw uploaded file (PDF/image) in maze-originals bucket
  processed_url    TEXT,    -- cropped/normalized PNG in maze-processed bucket
  width            INT,     -- processed image pixel width
  height           INT,     -- processed image pixel height
  -- zones: { start: {x, y, radius}, end: {x, y, radius} } in maze-space coords
  zones            JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── attempts ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attempts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maze_id        UUID NOT NULL REFERENCES mazes(id) ON DELETE CASCADE,
  elapsed_ms     BIGINT NOT NULL DEFAULT 0,   -- total solving time in ms
  started_at     TIMESTAMPTZ,                 -- when user first drew
  submitted_at   TIMESTAMPTZ DEFAULT NOW(),
  solved         BOOLEAN DEFAULT FALSE,       -- touched both zones
  interrupted    BOOLEAN DEFAULT FALSE,       -- Practice Mode: was session paused?
  device_type    TEXT,                        -- 'mobile' | 'tablet' | 'desktop'
  device_info    JSONB,                       -- full UA + touch info
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── attempt_strokes ───────────────────────────────────────────────────────────
-- Each row is one stroke (pen-down → pen-up) with full point data for replay.
CREATE TABLE IF NOT EXISTS attempt_strokes (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id   UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  stroke_index INT NOT NULL,   -- order of strokes within attempt
  -- points: [{x, y, t (timestamp ms), p (pressure 0-1)}]
  points       JSONB NOT NULL DEFAULT '[]',
  color        TEXT DEFAULT '#6c63ff',
  width        REAL DEFAULT 3,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mazes_status ON mazes(status);
CREATE INDEX IF NOT EXISTS idx_attempts_maze ON attempts(maze_id);
CREATE INDEX IF NOT EXISTS idx_strokes_attempt ON attempt_strokes(attempt_id, stroke_index);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Mazes: public can read 'published', only auth users can write
ALTER TABLE mazes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mazes_public_read" ON mazes
  FOR SELECT USING (status = 'published');

CREATE POLICY "mazes_admin_all" ON mazes
  FOR ALL USING (auth.role() = 'authenticated');

-- Attempts: public can insert, only auth can read all
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attempts_public_insert" ON attempts
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "attempts_admin_read" ON attempts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Strokes: public can insert, only auth can read
ALTER TABLE attempt_strokes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "strokes_public_insert" ON attempt_strokes
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "strokes_admin_read" ON attempt_strokes
  FOR SELECT USING (auth.role() = 'authenticated');

-- ── Storage Buckets ───────────────────────────────────────────────────────────
-- Create these in Supabase Dashboard → Storage → New Bucket:
--
--   maze-originals  (private)   — raw uploaded PDFs/images
--   maze-processed  (public)    — cropped display PNGs — enable "Public bucket"
--   attempt-images  (private)   — exported solved images

-- ── Admin user ────────────────────────────────────────────────────────────────
-- Create admin user in Supabase Dashboard → Authentication → Users → Invite user
-- or use: supabase auth admin createUser --email admin@example.com --password yourpassword

-- ── Sample maze data (optional) ──────────────────────────────────────────────
-- INSERT INTO mazes (title, description, category, difficulty, status, zones)
-- VALUES (
--   'متاهة دائرية',
--   'متاهة فنية على شكل دائرة كبيرة',
--   'دائري',
--   'medium',
--   'published',
--   '{"start": {"x": 100, "y": 100, "radius": 30}, "end": {"x": 700, "y": 700, "radius": 30}}'
-- );
