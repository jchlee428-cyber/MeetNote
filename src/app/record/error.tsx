'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home, Settings } from 'lucide-react';
import Link from 'next/link';

export default function RecordError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('녹음 페이지 런타임 오류:', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-xl shadow-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">회의 녹음 화면 로딩 오류</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          {error.message || '브라우저 음성 장치 또는 설정 초기화 중 일시적 오류가 발생했습니다.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>새로고침</span>
          </button>
          <Link
            href="/"
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            <span>홈으로 이동</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
