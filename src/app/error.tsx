'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('클라이언트 런타임 오류:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-xl shadow-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">화면을 불러오는 중 오류가 발생했습니다</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          {error.message || '일시적인 브라우저 로딩 오류입니다. 다시 시도하시거나 메인 페이지로 이동해주세요.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>다시 시도하기</span>
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
