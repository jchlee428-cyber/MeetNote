'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit3, Eye, Trash2, FileText, Calendar, MapPin, Users } from 'lucide-react';
import MinutesViewer from '@/components/MinutesViewer';
import MinutesEditor from '@/components/MinutesEditor';
import TranscriptViewer from '@/components/TranscriptViewer';
import ExportMenu from '@/components/ExportMenu';
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

  const handleDelete = async () => {
    if (!confirm('정말로 이 회의록을 삭제하시겠습니까?\n모든 전사 내용과 회의록이 영구 삭제됩니다.')) {
      return;
    }
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
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
            onClick={handleDelete}
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
          AI 전문 회의록
        </button>
        <button
          onClick={() => {
            setActiveTab('transcript');
            setIsEditing(false);
          }}
          className={`pb-3 px-4 font-bold text-sm sm:text-base border-b-2 transition-all ${
            activeTab === 'transcript'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          한국어 음성 전사 원문
        </button>
      </div>

      {/* 탭 내용 */}
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
    </div>
  );
}
