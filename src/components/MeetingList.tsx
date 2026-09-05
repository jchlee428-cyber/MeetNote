'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MeetingRecord } from '@/types/meeting';
import { Search, Calendar, MapPin, Users, ChevronRight, Trash2, FileText, Sparkles } from 'lucide-react';

interface MeetingListProps {
  initialMeetings?: MeetingRecord[];
}

export default function MeetingList({ initialMeetings = [] }: MeetingListProps) {
  const [meetings, setMeetings] = useState<MeetingRecord[]>(initialMeetings);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchMeetings = async (q: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/meetings?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      }
    } catch (err) {
      console.error('회의 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMeetings(searchQuery);
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('정말로 이 회의록을 삭제하시겠습니까?\n삭제된 내용은 복구할 수 없습니다.')) {
      return;
    }

    try {
      const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMeetings((prev) => prev.filter((m) => m.id !== id));
      } else {
        alert('회의 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('회의 삭제 에러:', err);
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <div className="w-full">
      {/* 검색창 */}
      <div className="relative mb-6">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="회의 제목, 날짜, 참석자, 안건, 전사 내용으로 검색..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-100 text-slate-800 text-base shadow-xs placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
          >
            초기화
          </button>
        )}
      </div>

      {/* 목록 리스트 */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">검색 중...</div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">저장된 회의록이 없습니다</h3>
          <p className="text-xs text-slate-400 mt-1">상단의 &apos;새 회의 녹음&apos; 버튼을 눌러 첫 번째 회의를 기록해보세요.</p>
          <Link
            href="/record"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            회의 녹음 시작하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {meetings.map((meeting) => {
            const dateStr = meeting.meeting_date
              ? new Date(meeting.meeting_date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  weekday: 'short',
                })
              : '일시 미정';

            const decisionsCount = meeting.minutes?.decisions?.length || 0;
            const actionItemsCount = meeting.minutes?.actionItems?.length || 0;

            return (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="group block bg-white hover:bg-blue-50/40 p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all shadow-xs hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/50">
                        {dateStr}
                      </span>
                      {meeting.location && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {meeting.location}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                      {meeting.title || '제목 없는 회의'}
                    </h3>

                    {meeting.participants && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>참석: {meeting.participants}</span>
                      </p>
                    )}

                    {/* 안건 및 결정사항 뱃지 */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap text-xs">
                      {meeting.minutes?.agenda && meeting.minutes.agenda.length > 0 && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          안건 {meeting.minutes.agenda.length}건
                        </span>
                      )}
                      {decisionsCount > 0 && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-md font-medium">
                          결정사항 {decisionsCount}건
                        </span>
                      )}
                      {actionItemsCount > 0 && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded-md font-medium">
                          실행과제 {actionItemsCount}건
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-center">
                    <button
                      onClick={(e) => handleDelete(meeting.id, e)}
                      className="p-2 text-slate-300 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="회의 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
