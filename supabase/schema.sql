-- ==========================================
-- AI 음성 회의록 (AI Voice Meeting Minutes)
-- Supabase Schema DDL
-- ==========================================

-- 회의(meetings) 테이블 생성
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    meeting_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    location VARCHAR(255) DEFAULT '',
    participants TEXT DEFAULT '',
    audio_url TEXT DEFAULT '',
    transcript TEXT DEFAULT '',
    minutes JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 검색 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_meetings_title ON public.meetings (title);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings (meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON public.meetings (created_at DESC);

-- 자동 updated_at 갱신 트리거
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_meetings_updated_at ON public.meetings;
CREATE TRIGGER set_meetings_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- RLS (Row Level Security) 활성화
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- 익명/인증 사용자 읽기/쓰기 허용 정책 (초기 MVP 개발용)
CREATE POLICY "Allow public read access" ON public.meetings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.meetings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.meetings FOR DELETE USING (true);
