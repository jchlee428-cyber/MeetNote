'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit3, Eye, Trash2, FileText, Calendar, MapPin, Users } from 'lucide-react';
import MinutesViewer from '@/components/MinutesViewer';
import MinutesEditor from '@/components/MinutesEditor';
import TranscriptViewer from '@/components/TranscriptViewer';
import ExportMenu from '@/components/ExportMenu';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { MeetingRecord, MeetingMinutes } from '@/types/meeting';

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [meeting, setMeeting] = useState<MeetingRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'minutes' | 'transcript'>('minutes');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchMeeting = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/meetings/${id}`);
        if (!res.ok) {
          throw new Error('회의 정보를 불러올 수 없습니다.');
        }
        const data = await res.json();
        setMeeting(data.meeting);
      } catch (err: any) {
        setError(err.message || '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchMeeting();
  }, [id]);

  const handleSave = async (updatedMinutes: MeetingMinutes) => {
    if (!meeting) return;
    try {
      setIsSaving(true);
      const res = await fetch(`/api/meetings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: updatedMinutes.basicInfo?.title || meeting.title,
          location: updatedMinutes.basicInfo?.location || meeting.location,
          participants: updatedMinutes.basicInfo?.attendees || meeting.participants,
          minutes: updatedMinutes,
        }),
      });

      if (!res.ok) throw new Error('수정사항 저장에 실패했습니다.');

      const data = await res.json();
      setMeeting(data.meeting);
      setIsEditing(false);
      alert('회의록이 성공적으로 저장되었습니다.');
    } catch (err: any) {
      alert(err.message || '저장 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      // 1. 클라이언트 영속성에서 즉시 제거 및 삭제된 ID(tombstone) 등록
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

      // 2. 서버에 DELETE 요청 (비동기 처리)
      await fetch(`/api/meetings/${id}`, { method: 'DELETE' });

      // 3. 홈 화면으로 즉시 완전 리프레시 이동
      window.location.href = '/';
    } catch (err) {
      console.error('회의 삭제 에러:', err);
      window.location.href = '/';
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-400">회의 정보를 불러오는 중입니다...</div>;
  }

  if (error || !meeting) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-slate-800">회의를 찾을 수 없습니다.</h2>
        <p className="text-sm text-slate-500 mt-1">{error || '삭제되었거나 존재하지 않는 회의입니다.'}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> 회의 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 상단 컨트롤 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 no-print">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>전체 회의 목록</span>
        </Link>

        {/* 내보내기 메뉴 & 삭제 버튼 */}
        <div className="flex items-center gap-2 flex-wrap">
          <ExportMenu minutes={meeting.minutes} transcript={meeting.transcript} />

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition flex items-center gap-1.5"
          >
            {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            <span>{isEditing ? '미리보기' : '수정'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs sm:text-sm font-semibold transition flex items-center gap-1.5"
            title="회의 삭제"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">삭제</span>
          </button>
        </div>
      </div>

      {/* 탭: 회의록 vs 음성 전사 원문 */}
      <div className="flex border-b border-slate-200 no-print">
        <button
          onClick={() => {
            setActiveTab('minutes');
          }}
          className={`pb-3 px-4 font-bold text-sm sm:text-base border-b-2 transition-all ${
            activeTab === 'minutes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="hidden sm:inline">AI 전문 회의록</span>
          <span className="inline sm:hidden">AI 회의록</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('transcript');
          }}
          className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-base border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'transcript'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="hidden sm:inline">음성 텍스트 원문 (Transcript)</span>
          <span className="inline sm:hidden">음성 원문</span>
        </button>
      </div>

      {/* 탭 내용 표시 */}
      {activeTab === 'minutes' ? (
        isEditing ? (
          <MinutesEditor
            initialMinutes={meeting.minutes}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            isSaving={isSaving}
          />
        ) : (
          <MinutesViewer minutes={meeting.minutes} />
        )
      ) : (
        <TranscriptViewer
          transcript={meeting.transcript}
          onUpdateTranscript={async (newText) => {
            setMeeting((prev) => (prev ? { ...prev, transcript: newText } : null));
            await fetch(`/api/meetings/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ transcript: newText }),
            });
          }}
        />
      )}

      {/* 회의록 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="회의록 영구 삭제"
        description="정말로 이 회의록을 삭제하시겠습니까? 전사 내용과 작성된 회의록이 영구 삭제되며 복구할 수 없습니다."
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
