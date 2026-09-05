# 📌 다음 작업 이어하기 가이드 (Resume Guide)

이 문서는 작업을 중단한 시점의 상태와 다음에 바로 이어서 진행할 수 있는 안내를 담고 있습니다.

---

## 1. 현재 완료된 작업 요약
- **GitHub 저장소 최신화**: 모든 코드 커밋 및 푸시 완료 (`main` 브랜치)
- **버셀 배포 완료**: [https://meetnoteai-ivory.vercel.app](https://meetnoteai-ivory.vercel.app)
- **최근 회의 브라우저 간 동기화 이슈 해결**:
  - `src/lib/db/index.ts`: Vercel 서버리스 번들링에 기본 회의 데이터 포함
  - `src/components/MeetingList.tsx`: 캐시 초기화 버튼 [기본 회의록 다시 불러오기] 및 [🔄 새로고침] 버튼 추가
  - 모바일 반응형 및 멋진 원형 마이크 디자인 반영 완료

---

## 2. 다음에 이어서 진행할 작업: Supabase 클라우드 DB 연동
모든 기기(PC 크롬, 엣지, 스마트폰)에서 회의록을 실시간으로 자동 공유하기 위한 데이터베이스 연결 작업 중이었습니다.

### 📍 현재 상태
- **Supabase 프로젝트 생성 완료**: `supabase-camel-button` (ID: `ioxmjdcuoochydvzpbud`)
- **Supabase Project URL**: `https://ioxmjdcuoochydvzpbud.supabase.co`
- **열려있던 위치**: Supabase SQL Editor (`https://supabase.com/dashboard/project/ioxmjdcuoochydvzpbud/sql/...`)

---

## 3. 다음에 시작할 때 순서

### 1단계: Supabase SQL 에디터에 테이블 생성 쿼리 실행
Supabase SQL Editor에서 기존 텍스트를 지우고, 프로젝트 내 [`supabase/schema.sql`](./supabase/schema.sql) 파일의 내용을 그대로 복사하여 붙여넣은 뒤 **[Run]** 버튼을 클릭합니다.

```sql
-- 1. 회의(meetings) 테이블 생성
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

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_meetings_title ON public.meetings (title);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings (meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON public.meetings (created_at DESC);

-- 3. 트리거 설정
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

-- 4. RLS 권한 허용
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.meetings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.meetings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.meetings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.meetings FOR DELETE USING (true);
```

### 2단계: Supabase API Key 복사
- Supabase 좌측 하단 ⚙️ **Project Settings** > **API** 클릭
- `Project API keys` 항목의 **`anon` `public`** 키를 복사

### 3단계: Vercel 환경변수 등록 및 재배포
1. Vercel 프로젝트 대시보드 (`meetnoteai`) 이동
2. **Settings** > **Environment Variables**에 2가지 등록:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://ioxmjdcuoochydvzpbud.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *(복사한 anon 키)*
3. **Deployments** 탭에서 최신 배포 **[Redeploy]** 실행

이 작업이 완료되면 스마트폰, 크롬, 엣지 등 어떤 기기에서 접속하든 동일한 데이터베이스를 실시간으로 공유하게 됩니다.
