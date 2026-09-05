'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MeetingRecord } from '@/types/meeting';
import { Search, Calendar, MapPin, Users, ChevronRight, Trash2, FileText, Sparkles, RotateCcw } from 'lucide-react';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

interface MeetingListProps {
  initialMeetings?: MeetingRecord[];
}

export default function MeetingList({ initialMeetings = [] }: MeetingListProps) {
  const [meetings, setMeetings] = useState<MeetingRecord[]>(initialMeetings);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMeetings = async (q: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/meetings?q=${encodeURIComponent(q)}`);
      let list: MeetingRecord[] = [];
      if (res.ok) {
        const data = await res.json();
        list = data.meetings || [];
      }

      // 삭제된 tombstone ID 확인
      let deletedSet = new Set<string>();
      if (typeof window !== 'undefined') {
        try {
          const deleted: string[] = JSON.parse(localStorage.getItem('meetnote_deleted_ids') || '[]');
          deletedSet = new Set(deleted);
        } catch (e) {}
      }

      // 서버 목록에서 삭제된 ID는 즉시 제외
      list = list.filter((m) => !deletedSet.has(m.id));

      // 클라이언트 로컬 저장소와 병합하되, 삭제된 ID는 캐시에서도 필터링
      if (typeof window !== 'undefined') {
        try {
          const cached: MeetingRecord[] = JSON.parse(localStorage.getItem('meetnote_cached_meetings') || '[]');
          const validCached = cached.filter((m) => !deletedSet.has(m.id));
          const map = new Map<string, MeetingRecord>();
          list.forEach((m) => map.set(m.id, m));
          validCached.forEach((m) => {
            if (!map.has(m.id)) {
              map.set(m.id, m);
            }
          });
          list = Array.from(map.values()).sort(
            (a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
          );
          localStorage.setItem('meetnote_cached_meetings', JSON.stringify(list));
        } catch (cErr) {}
      }

      if (q.trim()) {
        const lower = q.toLowerCase().trim();
        list = list.filter((m) => {
          return (
            m.title?.toLowerCase().includes(lower) ||
            m.participants?.toLowerCase().includes(lower) ||
            m.location?.toLowerCase().includes(lower) ||
            m.transcript?.toLowerCase().includes(lower) ||
            JSON.stringify(m.minutes || '').toLowerCase().includes(lower)
          );
        });
      }

      setMeetings(list);
    } catch (err) {
      console.error('회의 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefaults = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('meetnote_deleted_ids');
        localStorage.removeItem('meetnote_cached_meetings');
      }
      await fetchMeetings('');
    } catch (e) {
      console.error('Reset error:', e);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMeetings(searchQuery);
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleClickDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    try {
      setIsDeleting(true);

      // 1. deleted tombstone에 등록
      if (typeof window !== 'undefined') {
        try {
          const deleted: string[] = JSON.parse(localStorage.getItem('meetnote_deleted_ids') || '[]');
          if (!deleted.includes(id)) {
            deleted.push(id);
            localStorage.setItem('meetnote_deleted_ids', JSON.stringify(deleted));
          }
          const cached: MeetingRecord[] = JSON.parse(localStorage.getItem('meetnote_cached_meetings') || '[]');
          const filtered = cached.filter((m) => m.id !== id);
          localStorage.setItem('meetnote_cached_meetings', JSON.stringify(filtered));
        } catch (storageErr) {
          console.warn('Storage delete error:', storageErr);
        }
      }

      // 2. 로컬 state 즉시 반영
      setMeetings((prev) => prev.filter((m) => m.id !== id));

      // 3. 서버에 비동기 DELETE 전송
      await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('회의 삭제 에러:', err);
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="w-full">
      {/* 검색창 & 새로고침 버튼 */}
      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1">
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
        <button
          type="button"
          onClick={() => fetchMeetings(searchQuery)}
          title="회의 목록 새로고침"
          disabled={loading}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 shadow-xs transition shrink-0 active:scale-95 disabled:opacity-50"
        >
          <RotateCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 목록 리스트 */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">검색 중...</div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">저장된 회의록이 없습니다</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            상단의 &apos;새 회의 녹음&apos; 버튼으로 새로운 회의를 기록하거나, 이전 삭제 내역을 초기화하여 기본 회의록을 다시 불러올 수 있습니다.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/record"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              회의 녹음 시작하기
            </Link>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition border border-slate-200 shadow-2xs active:scale-95"
              title="브라우저에 저장된 삭제 기록을 초기화하고 기본 회의록을 다시 불러옵니다"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              기본 회의록 다시 불러오기
            </button>
          </div>
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
                      type="button"
                      onClick={(e) => handleClickDelete(meeting.id, e)}
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

      {/* 회의록 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="회의록 영구 삭제"
        description="정말로 이 회의록을 삭제하시겠습니까? 전사 내용과 작성된 회의록이 영구 삭제되며 복구할 수 없습니다."
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
