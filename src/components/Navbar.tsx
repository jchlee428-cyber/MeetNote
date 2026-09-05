'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mic, FileText, Sparkles, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* 로고 & 앱 타이틀 */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-slate-900 tracking-tight">AI 음성 회의록</span>
              <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/60">
                Whisper AI
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">스마트폰 음성 녹음 → 전문 회의록 자동 작성</p>
          </div>
        </Link>

        {/* 상단 네비게이션 액션 */}
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              pathname === '/' ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">회의 목록</span>
          </Link>

          <Link
            href="/record"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center gap-2 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>새 회의 녹음</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
