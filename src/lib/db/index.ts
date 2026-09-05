import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { MeetingRecord } from '@/types/meeting';
import { v4 as uuidv4 } from 'uuid';

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp' : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'meetings.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'meetings.json');

let memoryCache: MeetingRecord[] | null = null;

// Supabase 클라이언트 (환경변수 존재 시에만 초기화)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'));

const supabase = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseKey!) : null;

// 삭제된 ID를 추적하여 서버리스 콜드 스타트나 시드 재주입 시 부활 방지
const serverDeletedIds = new Set<string>();

// 로컬 파일 데이터베이스 헬퍼
function ensureLocalDb(): MeetingRecord[] {
  if (memoryCache !== null) {
    return memoryCache.filter((m) => !serverDeletedIds.has(m.id));
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      // 만약 패키징된 SEED_FILE이 존재하면 이를 /tmp로 복사
      if (fs.existsSync(SEED_FILE)) {
        try {
          const seedContent = fs.readFileSync(SEED_FILE, 'utf-8');
          fs.writeFileSync(DATA_FILE, seedContent, 'utf-8');
          const parsed = JSON.parse(seedContent);
          memoryCache = Array.isArray(parsed) ? parsed.filter((m: any) => !serverDeletedIds.has(m.id)) : [];
          return memoryCache;
        } catch (seedErr) {
          console.warn('Seed file copy error:', seedErr);
        }
      }
      // 초기 샘플 데이터 세팅
      const initialData: MeetingRecord[] = [
        {
          id: 'demo-sample-meeting-1',
          title: '2026년 9월 당회 및 장로회 정기 회의',
          meeting_date: '2026-09-05T14:00:00.000Z',
          location: '교회 1층 만나홀',
          participants: '김철수 장로, 이영희 권사, 박진우 집사, 최성호 총무',
          audio_url: '',
          transcript: '가을 바자회 일정 확정 및 본당 음향 시설 교체 예산안 논의...',
          minutes: {
            basicInfo: {
              title: '2026년 9월 당회 및 장로회 정기 회의',
              dateTime: '2026.09.05 14:00',
              location: '교회 1층 만나홀',
              attendees: '김철수 장로, 이영희 권사, 박진우 집사, 최성호 총무',
              objective: '가을 바자회 일정 확정 및 음향 시설 개선 예산 검토',
            },
            agenda: [
              '1. 가을 바자회 및 이웃나눔 행사 일정/장소 확정',
              '2. 본당 음향 및 빔프로젝터 노후화 개선 예산안 검토',
              '3. 다문화 청소년 멘토링 프로그램 추진',
            ],
            discussions: [
              {
                agendaNumber: 1,
                topic: '가을 바자회 일정 및 장소',
                summary: '10월 25일 지역 축제 중복을 피해 10월 18일(토) 교회 마당 및 만나홀에서 개최키로 논의함.',
              },
              {
                agendaNumber: 2,
                topic: '본당 음향 시설 예산안',
                summary: '450만 원 견적에 대해 예비비 한도 고려하여 스피커 우선 교체 후 분할 추진 논의.',
              },
            ],
            decisions: [
              '가을 바자회는 10월 18일(토) 10:00~16:00 개최로 만장일치 가결함.',
              '다문화 멘토링 자원봉사자 모집 안내문을 주보에 게시하기로 결정함.',
            ],
            unresolved: [
              '음향 시설 교체 450만 원 건은 재정위원회와 분할 납부 협의 후 다음 임시회에서 재논의하기로 보류함.',
            ],
            opinions: [
              '음향 전면 교체(450만 원) vs 스피커 우선 교체(250만 원) 후 차기 분할 교체안 이견 존재.',
            ],
            actionItems: [
              {
                task: '가을 바자회 장소 대관 및 안전 점검',
                assignee: '홍길동 집사',
                dueDate: '9월 20일',
                status: '예정',
              },
              {
                task: '음향 시설 업체 견적 분할 납부 협의',
                assignee: '최성호 총무',
                dueDate: '9월 22일',
                status: '진행중',
              },
              {
                task: '다문화 멘토 모집 안내문 주보 게시',
                assignee: '박진우 집사',
                dueDate: '9월 25일',
                status: '예정',
              },
            ],
            nextMeeting: {
              dateTime: '2026년 10월 12일(주일) 16:00',
              location: '소예배실',
              note: '바자회 준비 최종 점검',
            },
          },
          created_at: '2026-09-05T05:00:00.000Z',
          updated_at: '2026-09-05T05:00:00.000Z',
        },
      ];
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      memoryCache = initialData;
      return initialData;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    memoryCache = JSON.parse(content || '[]');
    return memoryCache!;
  } catch (err) {
    console.error('Local DB read error:', err);
    return memoryCache || [];
  }
}

function writeLocalDb(meetings: MeetingRecord[]): void {
  memoryCache = meetings;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(meetings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Local DB write error (will use in-memory state):', err);
  }
}

// 회의 목록 조회 (검색 지원)
export async function getMeetings(query?: string): Promise<MeetingRecord[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let req = supabase.from('meetings').select('*').order('meeting_date', { ascending: false });
      if (query && query.trim()) {
        const q = query.trim();
        req = req.or(`title.ilike.%${q}%,participants.ilike.%${q}%,transcript.ilike.%${q}%`);
      }
      const { data, error } = await req;
      if (!error && data) {
        return data as MeetingRecord[];
      }
      console.warn('Supabase getMeetings error, fallback to local DB:', error);
    } catch (err) {
      console.warn('Supabase connection error:', err);
    }
  }

  // Local fallback
  const meetings = ensureLocalDb();
  if (!query || !query.trim()) {
    return meetings.sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime());
  }

  const q = query.toLowerCase().trim();
  return meetings
    .filter((m) => {
      const titleMatch = m.title?.toLowerCase().includes(q);
      const dateMatch = m.meeting_date?.toLowerCase().includes(q);
      const partsMatch = m.participants?.toLowerCase().includes(q);
      const transcriptMatch = m.transcript?.toLowerCase().includes(q);
      const minutesMatch = JSON.stringify(m.minutes || '').toLowerCase().includes(q);
      return titleMatch || dateMatch || partsMatch || transcriptMatch || minutesMatch;
    })
    .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime());
}

// 특정 회의 상세 조회
export async function getMeetingById(id: string): Promise<MeetingRecord | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('meetings').select('*').eq('id', id).single();
      if (!error && data) return data as MeetingRecord;
    } catch (err) {
      console.warn('Supabase getMeetingById error:', err);
    }
  }

  const meetings = ensureLocalDb();
  return meetings.find((m) => m.id === id) || null;
}

// 새 회의 생성
export async function createMeeting(data: Partial<MeetingRecord>): Promise<MeetingRecord> {
  const newRecord: MeetingRecord = {
    id: data.id || uuidv4(),
    title: data.title || '새 회의록',
    meeting_date: data.meeting_date || new Date().toISOString(),
    location: data.location || '',
    participants: data.participants || '',
    audio_url: data.audio_url || '',
    transcript: data.transcript || '',
    minutes: data.minutes || {
      basicInfo: {
        title: data.title || '새 회의록',
        dateTime: data.meeting_date || new Date().toISOString(),
        location: data.location || '',
        attendees: data.participants || '',
      },
      agenda: [],
      discussions: [],
      decisions: [],
      unresolved: [],
      opinions: [],
      actionItems: [],
      nextMeeting: { dateTime: '미정', location: '미정' },
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: inserted, error } = await supabase.from('meetings').insert([newRecord]).select().single();
      if (!error && inserted) return inserted as MeetingRecord;
      console.warn('Supabase insert failed, saving locally:', error);
    } catch (err) {
      console.warn('Supabase insert exception:', err);
    }
  }

  const meetings = ensureLocalDb();
  meetings.unshift(newRecord);
  writeLocalDb(meetings);
  return newRecord;
}

// 회의록 업데이트
export async function updateMeeting(id: string, data: Partial<MeetingRecord>): Promise<MeetingRecord | null> {
  const updatedAt = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: updated, error } = await supabase
        .from('meetings')
        .update({ ...data, updated_at: updatedAt })
        .eq('id', id)
        .select()
        .single();
      if (!error && updated) return updated as MeetingRecord;
    } catch (err) {
      console.warn('Supabase update exception:', err);
    }
  }

  const meetings = ensureLocalDb();
  const index = meetings.findIndex((m) => m.id === id);
  if (index === -1) return null;

  const existing = meetings[index];
  const updatedRecord: MeetingRecord = {
    ...existing,
    ...data,
    updated_at: updatedAt,
  };

  meetings[index] = updatedRecord;
  writeLocalDb(meetings);
  return updatedRecord;
}

// 회의 삭제
export async function deleteMeeting(id: string): Promise<boolean> {
  serverDeletedIds.add(id);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('meetings').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete exception:', err);
    }
  }

  const meetings = ensureLocalDb();
  const filtered = meetings.filter((m) => m.id !== id);
  writeLocalDb(filtered);
  return true;
}
