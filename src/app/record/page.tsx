'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AudioRecorder from '@/components/AudioRecorder';
import TranscriptionProgress from '@/components/TranscriptionProgress';
import TranscriptViewer from '@/components/TranscriptViewer';
import MinutesViewer from '@/components/MinutesViewer';
import MinutesEditor from '@/components/MinutesEditor';
import ExportMenu from '@/components/ExportMenu';
import ApiSettingsModal from '@/components/ApiSettingsModal';
import { ProcessingStep, MeetingMinutes, MeetingRecord } from '@/types/meeting';
import { ArrowLeft, Save, Edit3, CheckCircle, Eye, Key } from 'lucide-react';
import Link from 'next/link';

import { transcribeAudioClient, generateMinutesClient } from '@/lib/ai/clientAi';

export default function RecordPage() {
  const router = useRouter();

  const [step, setStep] = useState<ProcessingStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lastAudioFile, setLastAudioFile] = useState<File | null>(null);

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
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 1. 녹음 완료 후 음성 전사 시작 핸들러
  const handleRecordingComplete = async (
    file: File,
    meta: { title: string; location: string; participants: string }
  ) => {
    setLastAudioFile(file);
    setBasicMeta(meta);
    setErrorMessage(null);

    try {
      // 1단계: 업로드 / 준비 진행
      setStep('uploading');
      await new Promise((r) => setTimeout(r, 400));

      // 2단계: 분석 진행
      setStep('analyzing');
      await new Promise((r) => setTimeout(r, 400));

      // 3단계: 한국어 전사 호출
      setStep('transcribing');
      const openaiKey = typeof window !== 'undefined' ? localStorage.getItem('meetnote_openai_key') || undefined : undefined;
      const geminiKey = typeof window !== 'undefined' ? localStorage.getItem('meetnote_gemini_key') || undefined : undefined;
      const preferredEngine = typeof window !== 'undefined' ? (localStorage.getItem('meetnote_preferred_engine') as any) || 'auto' : 'auto';

      const result = await transcribeAudioClient(file, meta, { openaiKey, geminiKey, preferredEngine });
      const transcribedText = result.transcript || '';
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
      const openaiKey = typeof window !== 'undefined' ? localStorage.getItem('meetnote_openai_key') || undefined : undefined;
      const geminiKey = typeof window !== 'undefined' ? localStorage.getItem('meetnote_gemini_key') || undefined : undefined;
      const preferredEngine = typeof window !== 'undefined' ? (localStorage.getItem('meetnote_preferred_engine') as any) || 'auto' : 'auto';

      const result = await generateMinutesClient(
        sourceText,
        {
          title: targetMeta.title,
          location: targetMeta.location,
          attendees: targetMeta.participants,
        },
        { openaiKey, geminiKey, preferredEngine }
      );

      setMinutes(result.minutes);

      // 자동 저장 (서버 DB에 회의 레코드 생성)
      const saveRes = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: targetMeta.title || result.minutes.basicInfo?.title || '정기 회의록',
          meeting_date: new Date().toISOString(),
          location: targetMeta.location || result.minutes.basicInfo?.location || '',
          participants: targetMeta.participants || result.minutes.basicInfo?.attendees || '',
          transcript: sourceText,
          minutes: result.minutes,
        }),
      });

      if (saveRes.ok) {
        const savedData = await saveRes.json();
        if (savedData.meeting) {
          setSavedMeetingId(savedData.meeting.id);
          if (typeof window !== 'undefined') {
            try {
              const existing = JSON.parse(localStorage.getItem('meetnote_cached_meetings') || '[]');
              const filtered = existing.filter((m: any) => m.id !== savedData.meeting.id);
              filtered.unshift(savedData.meeting);
              localStorage.setItem('meetnote_cached_meetings', JSON.stringify(filtered));
            } catch (cacheErr) {
              console.warn('LocalStorage cache write error:', cacheErr);
            }
          }
        }
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

        if (typeof window !== 'undefined') {
          try {
            const existing = JSON.parse(localStorage.getItem('meetnote_cached_meetings') || '[]');
            const idx = existing.findIndex((m: any) => m.id === savedMeetingId);
            if (idx !== -1) {
              existing[idx].title = updatedMinutes.basicInfo?.title || existing[idx].title;
              existing[idx].location = updatedMinutes.basicInfo?.location || existing[idx].location;
              existing[idx].participants = updatedMinutes.basicInfo?.attendees || existing[idx].participants;
              existing[idx].minutes = updatedMinutes;
              localStorage.setItem('meetnote_cached_meetings', JSON.stringify(existing));
            }
          } catch (cErr) {}
        }
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

  if (!mounted) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">회의 녹음 환경을 준비하고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 상단 네비게이션 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition shrink-0"
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
        <div className="py-2 sm:py-4">
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        </div>
      )}

      {/* 진행 중 상태 (5단계 스테퍼) */}
      {step !== 'idle' && step !== 'completed' && (
        <TranscriptionProgress
          step={step}
          errorMessage={errorMessage || undefined}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onRetry={() => {
            if (lastAudioFile) {
              handleRecordingComplete(lastAudioFile, basicMeta);
            } else if (transcript) {
              triggerGenerateMinutes(transcript);
            } else {
              setStep('idle');
            }
          }}
        />
      )}

      {/* 완료 상태: 원문 및 AI 회의록 열람/편집 */}
      {step === 'completed' && (
        <div className="space-y-6 sm:space-y-8">
          {/* 완료 알림 바 */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold text-xs sm:text-sm break-keep">
                한국어 음성 전사 및 AI 회의록 작성이 완료되었습니다!
              </span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
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

      <ApiSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
