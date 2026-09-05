'use client';

import React from 'react';
import { UploadCloud, Activity, Languages, FileText, CheckCircle2 } from 'lucide-react';
import { ProcessingStep } from '@/types/meeting';

interface TranscriptionProgressProps {
  step: ProcessingStep;
  errorMessage?: string;
  onRetry?: () => void;
  onOpenSettings?: () => void;
}

const STEPS = [
  { id: 'uploading', label: '녹음 파일 업로드', desc: '음성 데이터를 서버로 안전하게 전송 중', icon: UploadCloud },
  { id: 'analyzing', label: '음성 분석', desc: '음성 구간 및 주파수 분석', icon: Activity },
  { id: 'transcribing', label: '한국어 텍스트 변환', desc: 'Whisper / Gemini AI 한국어 받아쓰기', icon: Languages },
  { id: 'generating', label: 'AI 회의록 작성', desc: '8단계 구조 회의록 및 안건/결정사항 도출', icon: FileText },
  { id: 'completed', label: '완료', desc: '회의록 작성 완료!', icon: CheckCircle2 },
];

export default function TranscriptionProgress({
  step,
  errorMessage,
  onRetry,
  onOpenSettings,
}: TranscriptionProgressProps) {
  const getStepIndex = (s: ProcessingStep) => {
    switch (s) {
      case 'uploading':
        return 0;
      case 'analyzing':
        return 1;
      case 'transcribing':
        return 2;
      case 'generating':
        return 3;
      case 'completed':
        return 4;
      default:
        return -1;
    }
  };

  const currentIndex = getStepIndex(step);

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-xl mx-auto my-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-slate-900">
          {step === 'completed' ? '회의록 작성이 완료되었습니다' : '음성을 분석하고 있습니다...'}
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          {step === 'completed'
            ? '생성된 회의록을 확인하고 필요시 수정 및 다운로드하세요.'
            : '인공지능이 음성을 듣고 전문 회의록을 작성하고 있습니다. 잠시만 기다려주세요.'}
        </p>
      </div>

      {/* 에러 발생 시 안내 */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <p className="font-semibold mb-1">오류가 발생했습니다</p>
          <p>{errorMessage}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition"
              >
                🔑 API 설정 열기
              </button>
            )}
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-medium rounded-lg text-xs transition"
              >
                다시 시도하기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5단계 시각적 스테퍼 */}
      <div className="space-y-4">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isDone = currentIndex > idx || step === 'completed';
          const isCurrent = currentIndex === idx && step !== 'completed';

          return (
            <div
              key={s.id}
              className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-100'
                  : isDone
                  ? 'bg-slate-50/80 border-slate-200 opacity-90'
                  : 'bg-white border-slate-100 opacity-40'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-blue-600 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-base font-semibold ${
                      isCurrent ? 'text-blue-900 font-bold' : isDone ? 'text-slate-800' : 'text-slate-500'
                    }`}
                  >
                    {idx + 1}. {s.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 animate-pulse">
                      진행 중...
                    </span>
                  )}
                  {isDone && (
                    <span className="text-xs font-semibold text-emerald-600">완료</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
