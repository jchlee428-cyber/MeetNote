# AI 음성 회의록 (AI Voice Meeting Minutes)

> 스마트폰 녹음 → Whisper 음성인식 → 한국어 전사 → AI 전문 회의록 자동 생성 웹앱

교회(당회, 제직회, 장로회, 위원회, 구역/목장 모임), 비영리단체, 소규모 기업, 마을/주민 회의에 최적화된 모바일 우선 AI 회의 비서 애플리케이션입니다.

---

## 🌟 주요 기능

- **모바일 최적화 원터치 녹음**: 60대 이상 사용자도 쉽게 터치할 수 있는 대형 녹음 버튼, 실시간 초단위 타이머 및 음성 파형 시각화
- **안전한 Whisper 음성인식**: OpenAI API Key를 클라이언트에 노출하지 않고 서버 사이드 라우트(`POST /api/transcribe`)를 통해서만 안전하게 호출
- **5단계 시각적 진행 상태**: 파일 업로드 → 음성 분석 → 한국어 텍스트 변환 → AI 회의록 작성 → 완료
- **한국어 원문 검토 및 수정**: 전사된 원문 확인, 텍스트 수정, 복사, 전체 선택
- **8단계 정형 AI 회의록 자동 생성**:
  1. 회의 기본정보 (회의명, 일시, 장소, 참석자, 회의 목적)
  2. 주요 안건 (번호 구분)
  3. 주요 논의 내용 (잡담 배제, 핵심 논의 요약)
  4. 결정사항 (의결/가결된 사항만 녹색 강조, 허구 생성 배제)
  5. 미결사항 (결론 미도출 안건 별도 분리)
  6. 찬반 또는 주요 의견 (중립적 양측 의견 기술)
  7. 실행사항 (Action Items 테이블: 업무, 담당자, 기한, 상태)
  8. 다음 회의 일정 (일시, 장소, 비고)
- **섹션별 인라인 편집**: 생성된 회의록의 모든 영역을 직접 수정하고 저장
- **다양한 포맷 내보내기**:
  - 클립보드 텍스트 복사
  - 인쇄 및 PDF 저장 (`@media print` 최적화)
  - 공문서 규격의 **Microsoft Word (`.docx`)** 파일 원클릭 다운로드
- **실시간 다중 필드 검색**: 회의 제목, 일시, 참석자, 회의록 본문, 전사 내용 통합 검색
- **하이브리드 데이터베이스**: Supabase 연동 지원 + 로컬 내장 JSON DB 탑재

---

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일을 생성하고 키를 입력합니다 (미입력 시에도 내장 테스트 모드로 전체 동작 가능):
```env
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase (선택 사항)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000`으로 접속합니다.

---

## 🛠 기술 스택

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend**: Next.js API Routes (Node.js runtime)
- **Speech-to-Text**: OpenAI Whisper API (`whisper-1`) / Gemini Audio
- **AI Minutes Engine**: OpenAI GPT-4o / Gemini 2.0 Flash
- **Export**: `docx` (Word .docx 생성), CSS Print Media Query (PDF)
- **Database**: Supabase PostgreSQL / Local JSON Store
