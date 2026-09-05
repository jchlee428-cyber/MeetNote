'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from '@/components/AudioRecorder';
import TranscriptionProgress from '@/components/TranscriptionProgress';
import TranscriptViewer from '@/components/TranscriptViewer';
import MinutesViewer from '@/components/MinutesViewer';
import MinutesEditor from '@/components/MinutesEditor';
import ExportMenu from '@/components/ExportMenu';
import { ProcessingStep, MeetingMinutes, MeetingRecord } from '@/types/meeting';
import { ArrowLeft, Save, Edit3, CheckCircle, Eye } from 'lucide-react';
import Link from 'next/link';

export default function RecordPage() {
  const router = useRouter();

  const [step, setStep] = useState<ProcessingStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 저장될 회의 데이터 상태
  const [transcript, setTranscript] = useState<string>('');
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);
  const [basicMeta, setBasicMeta] = useState<{ title: string; location: string; participants: string }>({
    title: '',
    location: '',
    participants: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [savedMeetingId, setSavedMeetingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingMinutes, setIsGeneratingMinutes] = useState(false);

  // 1. 녹음 완료 후 음성 전사 시작 핸들러
  const handleRecordingComplete = async (
    file: File,
    meta: { title: string; location: string; participants: string }
  ) => {
    setBasicMeta(meta);
    setErrorMessage(null);

    try {
      // 1단계: 업로드 진행
      setStep('uploading');
      await new Promise((r) => setTimeout(r, 600));

      // 2단계: 분석 진행
      setStep('analyzing');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', meta.title);
      formData.append('location', meta.location);
      formData.append('participants', meta.participants);

      // 3단계: 한국어 전사 API 호출
      setStep('transcribing');
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '음성 전사에 실패했습니다.');
      }

      const data = await res.json();
      const transcribedText = data.transcript || '';
      setTranscript(transcribedText);

      // 전사 완료 후 4단계: 자동으로 AI 회의록 생성 호출
      await triggerGenerateMinutes(transcribedText, meta);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setErrorMessage(err.message || '음성을 텍스트로 변환하지 못했습니다. 잠시 후 다시 시도해주세요.');
      setStep('error');
    }
  };

  // 2. AI 회의록 생성 트리거
  const triggerGenerateMinutes = async (
    sourceText: string,
    meta?: { title: string; location: string; participants: string }
  ) => {
    try {
      setIsGeneratingMinutes(true);
      setStep('generating');
      setErrorMessage(null);

      const targetMeta = meta || basicMeta;
      const res = await fetch('/api/generate-minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: sourceText,
          basicInfo: {
            title: targetMeta.title,
            location: targetMeta.location,
            attendees: targetMeta.participants,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'AI 회의록 생성에 실패했습니다.');
      }

      const data = await res.json();
      setMinutes(data.minutes);

      // 자동 저장 (서버 DB에 회의 레코드 생성)
      const saveRes = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: targetMeta.title || data.minutes.basicInfo?.title || '정기 회의록',
          meeting_date: new Date().toISOString(),
          location: targetMeta.location || data.minutes.basicInfo?.location || '',
          participants: targetMeta.participants || data.minutes.basicInfo?.attendees || '',
          transcript: sourceText,
          minutes: data.minutes,
        }),
      });

      if (saveRes.ok) {
        const savedData = await saveRes.json();
        setSavedMeetingId(savedData.meeting?.id);
      }

      setStep('completed');
    } catch (err: any) {
      console.error('Generate minutes error:', err);
      // 요구사항 15번: "AI 회의록 생성 실패 시 전사된 원문은 보존하고 회의록 생성만 다시 실행할 수 있도록 한다."
      setErrorMessage(err.message || 'AI 회의록 생성에 실패했습니다. 원문 화면에서 다시 생성하실 수 있습니다.');
      setStep('completed'); // 원문 뷰어는 확인 가능하도록 전환
    } finally {
      setIsGeneratingMinutes(false);
    }
  };

  // 3. 사용자가 회의록을 직접 수정한 후 저장
  const handleSaveEditedMinutes = async (updatedMinutes: MeetingMinutes) => {
    try {
      setIsSaving(true);
      setMinutes(updatedMinutes);

      if (savedMeetingId) {
        await fetch(`/api/meetings/${savedMeetingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: updatedMinutes.basicInfo?.title,
            location: updatedMinutes.basicInfo?.location,
            participants: updatedMinutes.basicInfo?.attendees,
            minutes: updatedMinutes,
          }),
        });
      }

      setIsEditing(false);
      alert('회의록이 성공적으로 저장되었습니다.');
    } catch (err) {
      console.error('회의록 수정 저장 실패:', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 상단 네비게이션 헤더 */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>메인으로 돌아가기</span>
        </Link>

        {minutes && step === 'completed' && (
          <ExportMenu minutes={minutes} transcript={transcript} />
        )}
      </div>

      {/* 상태별 화면 렌더링 */}
      {step === 'idle' && (
        <div className="py-4">
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        </div>
      )}

      {/* 진행 중 상태 (5단계 스테퍼) */}
      {step !== 'idle' && step !== 'completed' && (
        <TranscriptionProgress
          step={step}
          errorMessage={errorMessage || undefined}
          onRetry={() => {
            if (transcript) {
              triggerGenerateMinutes(transcript);
            } else {
              setStep('idle');
            }
          }}
        />
      )}

      {/* 완료 상태: 원문 및 AI 회의록 열람/편집 */}
      {step === 'completed' && (
        <div className="space-y-8">
          {/* 완료 알림 바 */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-900">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold text-sm">
                한국어 음성 전사 및 AI 회의록 작성이 완료되었습니다!
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100/50 transition flex items-center gap-1.5"
              >
                {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                <span>{isEditing ? '미리보기 모드' : '직접 내용 수정'}</span>
              </button>
            </div>
          </div>

          {/* 1. AI 회의록 뷰어 또는 편집기 */}
          {minutes && (
            <div>
              {isEditing ? (
                <MinutesEditor
                  initialMinutes={minutes}
                  onSave={handleSaveEditedMinutes}
                  onCancel={() => setIsEditing(false)}
                  isSaving={isSaving}
                />
              ) : (
                <MinutesViewer minutes={minutes} />
              )}
            </div>
          )}

          {/* 2. 한국어 원문 화면 (Section 6 요구사항: 원문 확인, 수정, 복사, AI 회의록 재생성) */}
          <TranscriptViewer
            transcript={transcript}
            onUpdateTranscript={(newText) => setTranscript(newText)}
            onGenerateMinutes={() => triggerGenerateMinutes(transcript)}
            isGenerating={isGeneratingMinutes}
          />
        </div>
      )}
    </div>
  );
}
