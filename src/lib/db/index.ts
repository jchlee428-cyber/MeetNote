import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { MeetingRecord } from '@/types/meeting';
import { v4 as uuidv4 } from 'uuid';
import defaultSeedData from '../../../data/meetings.json';

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp' : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'meetings.json');

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
      const initialData: MeetingRecord[] = (defaultSeedData as unknown as MeetingRecord[]) || [];
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      } catch (writeErr) {
        console.warn('Initial data write error:', writeErr);
      }
      memoryCache = initialData.filter((m) => !serverDeletedIds.has(m.id));
      return memoryCache;
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
