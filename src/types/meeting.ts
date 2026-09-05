// AI 음성 회의록 핵심 데이터 타입 정의

export interface MeetingBasicInfo {
  title: string;
  dateTime: string;
  location: string;
  attendees: string;
  objective?: string;
}

export interface AgendaDiscussion {
  agendaNumber: number;
  topic: string;
  summary: string;
}

export interface ActionItem {
  id?: string;
  task: string;
  assignee: string; // 미정 가능
  dueDate: string;  // 미정 가능
  status: '예정' | '진행중' | '완료' | '보류' | string;
}

export interface NextMeetingInfo {
  dateTime: string; // 미정 가능
  location: string; // 미정 가능
  note?: string;
}

export interface MeetingMinutes {
  basicInfo: MeetingBasicInfo;
  agenda: string[];
  discussions: AgendaDiscussion[];
  decisions: string[];
  unresolved: string[];
  opinions: string[];
  actionItems: ActionItem[];
  nextMeeting: NextMeetingInfo;
  rawMarkdown?: string;
}

export interface MeetingRecord {
  id: string;
  title: string;
  meeting_date: string;
  location: string;
  participants: string;
  audio_url?: string;
  transcript: string;
  minutes: MeetingMinutes;
  created_at: string;
  updated_at: string;
}

export type ProcessingStep = 
  | 'idle'
  | 'uploading'       // 1. 녹음 파일 업로드
  | 'analyzing'       // 2. 음성 분석
  | 'transcribing'    // 3. 한국어 텍스트 변환
  | 'generating'      // 4. AI 회의록 작성
  | 'completed'       // 5. 완료
  | 'error';
