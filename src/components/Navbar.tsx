'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, FileText, Key, PlusCircle } from 'lucide-react';
import ApiSettingsModal from './ApiSettingsModal';

export default function Navbar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs no-print">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* 로고 & 앱 타이틀 */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg text-slate-900 tracking-tight whitespace-nowrap">
                  AI 음성 회의록
                </span>
                <span className="hidden md:inline-flex text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/60 whitespace-nowrap">
                  Whisper AI
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden lg:block truncate">스마트폰 음성 녹음 → 전문 회의록 자동 작성</p>
            </div>
          </Link>

          {/* 상단 네비게이션 액션 */}
          <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="API Key 설정"
            >
              <Key className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">API 설정</span>
            </button>

            <Link
              href="/"
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                pathname === '/' ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="회의 목록"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">회의 목록</span>
            </Link>

            <Link
              href="/record"
              className={`px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap shrink-0 ${
                pathname === '/record'
                  ? 'bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title="새 회의 녹음"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">새 회의 녹음</span>
              <span className="inline sm:hidden">녹음</span>
            </Link>
          </nav>
        </div>
      </header>

      <ApiSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
