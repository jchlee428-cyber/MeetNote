'use client';

import React, { useState, useEffect } from 'react';
import { Key, X, Check, Trash2, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiSettingsModal({ isOpen, onClose }: ApiSettingsModalProps) {
  const [openaiKey, setOpenaiKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOpenaiKey(localStorage.getItem('meetnote_openai_key') || '');
      setGeminiKey(localStorage.getItem('meetnote_gemini_key') || '');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      if (openaiKey.trim()) {
        localStorage.setItem('meetnote_openai_key', openaiKey.trim());
      } else {
        localStorage.removeItem('meetnote_openai_key');
      }

      if (geminiKey.trim()) {
        localStorage.setItem('meetnote_gemini_key', geminiKey.trim());
      } else {
        localStorage.removeItem('meetnote_gemini_key');
      }
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    if (confirm('저장된 API 키를 삭제하시겠습니까?')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('meetnote_openai_key');
        localStorage.removeItem('meetnote_gemini_key');
      }
      setOpenaiKey('');
      setGeminiKey('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs no-print">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">AI API Key 설정</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          배포 환경(Vercel)에 환경변수가 등록되어 있으면 비워두셔도 자동 동작합니다. 직접 개인 키를 사용하여 Whisper 음성 인식 및 회의록 작성을 이용하시려면 아래에 입력해주세요.
        </p>

        <div className="mt-5 space-y-4">
          {/* OpenAI API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">OpenAI API Key (Whisper & GPT-4o)</label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
              >
                발급받기 <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 text-sm font-mono"
            />
          </div>

          {/* Gemini API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Google Gemini API Key (대체용)</label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5"
              >
                발급받기 <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 text-sm font-mono"
            />
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-2.5 text-blue-900 text-xs">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-snug">
            입력하신 키는 사용자의 브라우저 로컬 저장소(localStorage)에만 안전하게 보관되며 다른 사용자나 서버에 저장되지 않습니다.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          {(openaiKey || geminiKey) && (
            <button
              onClick={handleClear}
              className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 p-2"
            >
              <Trash2 className="w-3.5 h-3.5" /> 삭제
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl transition"
            >
              닫기
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              {saved ? <Check className="w-3.5 h-3.5 text-white" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              <span>{saved ? '저장 완료!' : '설정 저장'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
