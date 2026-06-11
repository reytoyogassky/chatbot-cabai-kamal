-- ============================================================
-- SUPABASE SQL SCHEMA — Chatbot Cabai Rawit Merah
-- Jalankan ini di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Tabel: sesi percakapan
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT 'Sesi Baru',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel: pesan-pesan dalam sesi
CREATE TABLE IF NOT EXISTS messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON chat_sessions(updated_at DESC);

-- Fungsi: update timestamp sesi otomatis saat ada pesan baru
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET updated_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_update_session_timestamp
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_session_timestamp();

-- Row Level Security (RLS) — aktifkan untuk keamanan
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages       ENABLE ROW LEVEL SECURITY;

-- Policy: izinkan semua akses dari anon key (untuk development)
-- Ganti dengan policy yang lebih ketat jika sudah production
CREATE POLICY "allow_all_sessions" ON chat_sessions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_messages" ON messages       FOR ALL TO anon USING (true) WITH CHECK (true);
