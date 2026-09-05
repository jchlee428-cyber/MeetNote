'use client';

import React, { useState } from 'react';
import { Copy, Check, Sparkles, Edit3, ArrowRight } from 'lucide-react';

interface TranscriptViewerProps {
  transcript: string;
  onUpdateTranscript?: (newTranscript: string) => void;
  onGenerateMinutes?: () => void;
  isGenerating?: boolean;
}

export default function TranscriptViewer({
  transcript,
  onUpdateTranscript,
  onGenerateMinutes,
  isGenerating = false,
}: TranscriptViewerProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(transcript);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  const handleSelectAll = () => {
    const textarea = document.getElementById('transcript-textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
      textarea.select();
    }
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    if (onUpdateTranscript) {
      onUpdateTranscript(text);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-sm max-w-3xl mx-auto my-6">
      {/* 헤더 영역 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-xl font-bold text-slate-900">한국어 음성 전사 내용</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Whisper AI로 변환된 원문입니다. 필요 시 직접 수정 후 회의록을 생성할 수 있습니다.
          </p>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            전체 선택
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '복사됨' : '복사'}</span>
          </button>
          <button
            onClick={() => {
              if (isEditing) {
                handleSaveEdit();
              } else {
                setIsEditing(true);
              }
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
              isEditing ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? '수정 완료' : '텍스트 수정'}</span>
          </button>
        </div>
      </div>

      {/* 텍스트 내용 박스 */}
      <div className="mt-4">
        {isEditing ? (
          <div>
            <textarea
              id="transcript-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              className="w-full p-4 rounded-xl border-2 border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 text-slate-800 leading-relaxed text-base resize-y bg-blue-50/20"
              placeholder="음성 전사 내용이 이곳에 표시됩니다."
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition"
              >
                저장하기
              </button>
            </div>
          </div>
        ) : (
          <div
            id="transcript-box"
            className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 text-base leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto selection:bg-blue-200"
          >
            {text || '전사된 내용이 없습니다.'}
          </div>
        )}

        <div className="mt-2 text-right">
          <span className="text-xs text-slate-400">
            글자 수: {text.length.toLocaleString()}자 | 공백 제외: {text.replace(/\s/g, '').length.toLocaleString()}자
          </span>
        </div>
      </div>

      {/* AI 회의록 생성 CTA 버튼 */}
      {onGenerateMinutes && (
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            💡 확인된 원문 내용을 바탕으로 8단계 전문 회의록을 자동 작성합니다.
          </p>
          <button
            onClick={onGenerateMinutes}
            disabled={isGenerating || !text.trim()}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>{isGenerating ? 'AI 회의록 작성 중...' : 'AI 회의록 자동 생성'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
